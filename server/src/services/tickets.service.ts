import { getDatabase } from '../database/connection.js';

export interface CreateTicketData {
  title: string;
  description: string;
  priority: 'baixa' | 'media' | 'alta' | 'critica';
  category: 'tecnico' | 'suporte' | 'financeiro' | 'outros';
  serviceType?: string;
  totalValue?: number;
  createdBy: string;
  clientId?: string;
  files?: Array<{
    name: string;
    size: number;
    type: string;
    dataUrl: string;
  }>;
}

export interface UpdateTicketData {
  title?: string;
  description?: string;
  status?: 'aberto' | 'em_andamento' | 'em_atendimento' | 'pendente' | 'resolvido' | 'fechado' | 'encerrado';
  priority?: 'baixa' | 'media' | 'alta' | 'critica';
  category?: 'tecnico' | 'suporte' | 'financeiro' | 'outros';
  serviceType?: string;
  totalValue?: number;
  assignedTo?: string | null;
  clientId?: string;
}

export interface TicketFilters {
  status?: string;
  priority?: string;
  category?: string;
  assignedTo?: string;
  createdBy?: string;
  search?: string;
}

export const getAllTickets = async (filters?: TicketFilters) => {
  const db = getDatabase();

  let query = db('tickets')
    .leftJoin('users as creator', 'tickets.created_by', 'creator.id')
    .leftJoin('users as assignee', 'tickets.assigned_to', 'assignee.id')
    .leftJoin('users as client', 'tickets.client_id', 'client.id')
    .select(
      'tickets.*',
      db.raw(`
        json_build_object(
          'id', creator.id,
          'name', creator.name,
          'email', creator.email,
          'role', creator.role,
          'avatar', creator.avatar
        ) as created_by_user
      `),
      db.raw(`
        CASE
          WHEN assignee.id IS NOT NULL THEN
            json_build_object(
              'id', assignee.id,
              'name', assignee.name,
              'email', assignee.email,
              'role', assignee.role,
              'avatar', assignee.avatar
            )
          ELSE NULL
        END as assigned_to_user
      `),
      db.raw(`
        CASE
          WHEN client.id IS NOT NULL THEN
            json_build_object(
              'id', client.id,
              'name', client.name,
              'email', client.email,
              'role', client.role,
              'avatar', client.avatar
            )
          ELSE NULL
        END as client_user
      `)
    );

  if (filters) {
    if (filters.status) {
      query = query.where('tickets.status', filters.status);
    }
    if (filters.priority) {
      query = query.where('tickets.priority', filters.priority);
    }
    if (filters.category) {
      query = query.where('tickets.category', filters.category);
    }
    if (filters.assignedTo) {
      query = query.where('tickets.assigned_to', filters.assignedTo);
    }
    if (filters.createdBy) {
      query = query.where('tickets.created_by', filters.createdBy);
    }
    if (filters.search) {
      query = query.where((builder) => {
        builder
          .where('tickets.title', 'ilike', `%${filters.search}%`)
          .orWhere('tickets.description', 'ilike', `%${filters.search}%`);
      });
    }
  }

  return query.orderBy('tickets.updated_at', 'desc');
};

export const getTicketById = async (id: string) => {
  const db = getDatabase();

  const ticket = await db('tickets')
    .leftJoin('users as creator', 'tickets.created_by', 'creator.id')
    .leftJoin('users as assignee', 'tickets.assigned_to', 'assignee.id')
    .leftJoin('users as client', 'tickets.client_id', 'client.id')
    .where('tickets.id', id)
    .select(
      'tickets.*',
      db.raw(`
        json_build_object(
          'id', creator.id,
          'name', creator.name,
          'email', creator.email,
          'role', creator.role,
          'avatar', creator.avatar
        ) as created_by_user
      `),
      db.raw(`
        CASE
          WHEN assignee.id IS NOT NULL THEN
            json_build_object(
              'id', assignee.id,
              'name', assignee.name,
              'email', assignee.email,
              'role', assignee.role,
              'avatar', assignee.avatar
            )
          ELSE NULL
        END as assigned_to_user
      `),
      db.raw(`
        CASE
          WHEN client.id IS NOT NULL THEN
            json_build_object(
              'id', client.id,
              'name', client.name,
              'email', client.email,
              'role', client.role,
              'avatar', client.avatar
            )
          ELSE NULL
        END as client_user
      `)
    )
    .first();

  if (!ticket) {
    throw new Error('Chamado não encontrado');
  }

  // Get files
  const files = await db('ticket_files')
    .where({ ticket_id: id })
    .select('id', 'name', 'size', 'type', 'data_url', 'created_at');

  // Get comments
  const comments = await db('comments')
    .leftJoin('users', 'comments.author_id', 'users.id')
    .where({ ticket_id: id })
    .select(
      'comments.*',
      db.raw(`
        json_build_object(
          'id', users.id,
          'name', users.name,
          'email', users.email,
          'role', users.role,
          'avatar', users.avatar
        ) as author
      `)
    )
    .orderBy('comments.created_at', 'asc');

  return {
    ...ticket,
    files: files.map(f => ({
      id: f.id,
      name: f.name,
      size: parseInt(f.size),
      type: f.type,
      data: f.data_url,
    })),
    comments: comments.map(c => ({
      id: c.id,
      content: c.content,
      author: c.author,
      createdAt: c.created_at,
    })),
  };
};

export const createTicket = async (data: CreateTicketData) => {
  const db = getDatabase();

  // Generate ticket ID
  const ticketCount = await db('tickets').count('* as count').first();
  const nextId = String((parseInt(ticketCount?.count as string) || 0) + 1).padStart(5, '0');

  const [ticket] = await db('tickets')
    .insert({
      id: nextId,
      title: data.title,
      description: data.description,
      status: 'aberto',
      priority: data.priority,
      category: data.category,
      service_type: data.serviceType || null,
      total_value: data.totalValue || null,
      created_by: data.createdBy,
      client_id: data.clientId || data.createdBy,
      assigned_to: null,
    })
    .returning('*');

  // Save files if provided
  if (data.files && data.files.length > 0) {
    await db('ticket_files').insert(
      data.files.map(file => ({
        ticket_id: ticket.id,
        name: file.name,
        size: file.size.toString(),
        type: file.type,
        data_url: file.dataUrl,
      }))
    );
  }

  return getTicketById(ticket.id);
};

export const updateTicket = async (id: string, data: UpdateTicketData) => {
  const db = getDatabase();

  // Check if ticket exists
  await getTicketById(id);

  const updateData: any = {};
  if (data.title) updateData.title = data.title;
  if (data.description) updateData.description = data.description;
  if (data.status) updateData.status = data.status;
  if (data.priority) updateData.priority = data.priority;
  if (data.category) updateData.category = data.category;
  if (data.serviceType !== undefined) updateData.service_type = data.serviceType;
  if (data.totalValue !== undefined) updateData.total_value = data.totalValue;
  if (data.assignedTo !== undefined) updateData.assigned_to = data.assignedTo;
  if (data.clientId !== undefined) updateData.client_id = data.clientId;

  await db('tickets')
    .where({ id })
    .update(updateData);

  return getTicketById(id);
};

export const deleteTicket = async (id: string) => {
  const db = getDatabase();

  // Check if ticket exists
  await getTicketById(id);

  await db('tickets').where({ id }).delete();
};

export const addComment = async (ticketId: string, authorId: string, content: string) => {
  const db = getDatabase();

  const [comment] = await db('comments')
    .insert({
      ticket_id: ticketId,
      author_id: authorId,
      content,
    })
    .returning('*');

  const author = await db('users')
    .where({ id: authorId })
    .select('id', 'name', 'email', 'role', 'avatar')
    .first();

  return {
    id: comment.id,
    content: comment.content,
    author,
    createdAt: comment.created_at,
  };
};

