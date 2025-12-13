/**
 * Adaptador PostgreSQL/Supabase
 * Carregado apenas quando variáveis de ambiente estão configuradas
 */

import { User, Ticket, FinancialTicket, Queue, Interaction, TicketFile } from '../types';

export class PostgresAdapter {
  private supabaseClient: any = null;
  private initialized = false;

  async init(): Promise<void> {
    if (this.initialized) return;

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase não configurado');
    }

    try {
      // Carregar Supabase dinamicamente
      const { createClient } = await import('@supabase/supabase-js');
      this.supabaseClient = createClient(supabaseUrl, supabaseKey);
      this.initialized = true;
    } catch (error) {
      console.error('Erro ao inicializar Supabase:', error);
      throw error;
    }
  }

  // ============ USUÁRIOS ============
  async getUsers(): Promise<User[]> {
    const { data, error } = await this.supabaseClient
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(this.transformUser);
  }

  async saveUser(user: User, password?: string): Promise<void> {
    const userData = this.prepareUserForDB(user, password);
    const { error } = await this.supabaseClient
      .from('users')
      .upsert(userData, { onConflict: 'id' });

    if (error) {
      console.error('Erro ao salvar usuário no Supabase:', error);
      throw error;
    }
  }

  // ============ TICKETS ============
  async getTickets(): Promise<Ticket[]> {
    const { data, error } = await this.supabaseClient
      .from('tickets')
      .select(`
        *,
        created_by:users!tickets_created_by_fkey(*),
        assigned_to:users!tickets_assigned_to_fkey(*),
        queue:queues(*)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Buscar interações e arquivos separadamente
    const tickets = (data || []).map(this.transformTicket);

    // Buscar interações para cada ticket
    for (const ticket of tickets) {
      const { data: interactions } = await this.supabaseClient
        .from('interactions')
        .select('*, author:users(*)')
        .eq('ticket_id', ticket.id)
        .order('created_at', { ascending: true });

      ticket.interactions = (interactions || []).map(this.transformInteraction);

      // Buscar arquivos
      const { data: files } = await this.supabaseClient
        .from('ticket_files')
        .select('*')
        .eq('ticket_id', ticket.id);

      ticket.files = (files || []).map(this.transformFile);
    }

    return tickets;
  }

  async getTicket(id: string): Promise<Ticket | null> {
    const { data, error } = await this.supabaseClient
      .from('tickets')
      .select(`
        *,
        created_by:users!tickets_created_by_fkey(*),
        assigned_to:users!tickets_assigned_to_fkey(*),
        queue:queues(*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    if (!data) return null;

    const ticket = this.transformTicket(data);

    // Buscar interações
    const { data: interactions } = await this.supabaseClient
      .from('interactions')
      .select('*, author:users(*)')
      .eq('ticket_id', id)
      .order('created_at', { ascending: true });

    ticket.interactions = (interactions || []).map(this.transformInteraction);

    // Buscar arquivos
    const { data: files } = await this.supabaseClient
      .from('ticket_files')
      .select('*')
      .eq('ticket_id', id);

    ticket.files = (files || []).map(this.transformFile);

    return ticket;
  }

  async saveTicket(ticket: Ticket): Promise<void> {
    const ticketData = this.prepareTicketForDB(ticket);

    const { error: ticketError } = await this.supabaseClient
      .from('tickets')
      .upsert(ticketData, { onConflict: 'id' });

    if (ticketError) throw ticketError;

    // Salvar interações
    if (ticket.interactions && ticket.interactions.length > 0) {
      const interactions = ticket.interactions.map(i => ({
        id: i.id,
        ticket_id: ticket.id,
        type: i.type,
        content: i.content,
        author_id: i.author?.id,
        metadata: i.metadata || null,
        created_at: i.createdAt?.toISOString() || new Date().toISOString(),
      }));

      const { error: intError } = await this.supabaseClient
        .from('interactions')
        .upsert(interactions, { onConflict: 'id' });

      if (intError) throw intError;
    }

    // Salvar arquivos
    if (ticket.files && ticket.files.length > 0) {
      const files = ticket.files.map(f => ({
        id: f.id,
        ticket_id: ticket.id,
        interaction_id: null,
        name: f.name,
        size: f.size,
        type: f.type,
        data_url: f.data,
        created_at: new Date().toISOString(),
      }));

      const { error: filesError } = await this.supabaseClient
        .from('ticket_files')
        .upsert(files, { onConflict: 'id' });

      if (filesError) throw filesError;
    }
  }

  async saveTickets(tickets: Ticket[]): Promise<void> {
    for (const ticket of tickets) {
      await this.saveTicket(ticket);
    }
  }

  async deleteTicket(id: string): Promise<void> {
    const { error } = await this.supabaseClient
      .from('tickets')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // ============ FILAS ============
  async getQueues(): Promise<Queue[]> {
    const { data, error } = await this.supabaseClient
      .from('queues')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;
    return (data || []).map(this.transformQueue);
  }

  async saveQueue(queue: Queue): Promise<void> {
    const queueData = this.prepareQueueForDB(queue);
    const { error } = await this.supabaseClient
      .from('queues')
      .upsert(queueData, { onConflict: 'id' });

    if (error) throw error;
  }

  // ============ INTERAÇÕES ============
  async addInteraction(ticketId: string, interaction: Interaction): Promise<void> {
    const interactionData = {
      id: interaction.id,
      ticket_id: ticketId,
      type: interaction.type,
      content: interaction.content,
      author_id: interaction.author?.id,
      metadata: interaction.metadata || null,
      created_at: interaction.createdAt?.toISOString() || new Date().toISOString(),
    };

    const { error } = await this.supabaseClient
      .from('interactions')
      .insert(interactionData);

    if (error) throw error;
  }

  // ============ TRANSFORMERS ============
  private transformUser(data: any): User {
    return {
      id: data.id,
      email: data.email,
      name: data.name,
      role: data.role,
      avatar: data.avatar_url,
    };
  }

  private prepareUserForDB(user: User, password?: string): any {
    const userData: any = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      avatar_url: user.avatar,
    };

    // Se password for fornecido, incluir (mas em produção deve ser hasheado no backend)
    // NOTA: Em produção, sempre use a API do backend para criar usuários com senha hasheada
    if (password) {
      // AVISO: Isso não é seguro! A senha deve ser hasheada no backend.
      // Este é apenas um fallback para desenvolvimento.
      // Em produção, sempre use a API REST que faz hash corretamente.
      userData.password = password;
    }

    return userData;
  }

  private transformTicket(data: any): Ticket {
    return {
      id: data.id,
      title: data.title,
      description: data.description,
      status: data.status,
      priority: data.priority,
      category: data.category,
      createdBy: data.created_by ? this.transformUser(data.created_by) : data.createdBy,
      assignedTo: data.assigned_to ? this.transformUser(data.assigned_to) : data.assignedTo,
      queue: data.queue?.name || data.queue_id || data.queue,
      serviceType: data.service_type,
      totalValue: data.total_value,
      integrationValue: data.integration_value,
      client: data.client_id ? { id: data.client_id, name: '', email: '', role: 'user' as const } : undefined,
      interactions: [],
      files: [],
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }

  private prepareTicketForDB(ticket: Ticket): any {
    return {
      id: ticket.id,
      title: ticket.title,
      description: ticket.description,
      status: ticket.status,
      priority: ticket.priority,
      category: ticket.category,
      created_by: typeof ticket.createdBy === 'object' ? ticket.createdBy.id : ticket.createdBy,
      assigned_to: typeof ticket.assignedTo === 'object' ? ticket.assignedTo?.id : ticket.assignedTo,
      queue_id: ticket.queue, // Assumindo que pode ser ID ou nome
      service_type: ticket.serviceType,
      total_value: ticket.totalValue,
      integration_value: ticket.integrationValue,
      client_id: ticket.client?.id,
      created_at: ticket.createdAt?.toISOString() || new Date().toISOString(),
      updated_at: ticket.updatedAt?.toISOString() || new Date().toISOString(),
    };
  }

  private transformInteraction(data: any): Interaction {
    return {
      id: data.id,
      type: data.type,
      content: data.content,
      author: data.author ? this.transformUser(data.author) : undefined,
      metadata: data.metadata,
      createdAt: new Date(data.created_at),
      files: [],
    };
  }

  private transformFile(data: any): TicketFile {
    return {
      id: data.id,
      name: data.name,
      size: data.size,
      type: data.type,
      data: data.data_url,
    };
  }

  private transformQueue(data: any): Queue {
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }

  private prepareQueueForDB(queue: Queue): any {
    return {
      id: queue.id,
      name: queue.name,
      description: queue.description,
      created_at: queue.createdAt?.toISOString() || new Date().toISOString(),
      updated_at: queue.updatedAt?.toISOString() || new Date().toISOString(),
    };
  }
}



