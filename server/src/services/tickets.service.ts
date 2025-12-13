import { getDatabase } from '../database/connection.js';

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const resolveQueueId = async (db: any, queueValue?: string | null) => {
  if (queueValue === undefined) {
    return { queueId: undefined, queueName: undefined };
  }

  if (queueValue === null || queueValue === '') {
    return { queueId: null, queueName: null };
  }

  // Se já for UUID, apenas confirma a existência
  if (uuidRegex.test(queueValue)) {
    const existing = await db('queues').where({ id: queueValue }).first();
    return { queueId: queueValue, queueName: existing?.name };
  }

  // Tratar como nome de fila
  const existingByName = await db('queues')
    .whereRaw('LOWER(name) = LOWER(?)', [queueValue])
    .first();

  if (existingByName) {
    return { queueId: existingByName.id, queueName: existingByName.name };
  }

  // Criar fila automaticamente
  const inserted = await db('queues')
    .insert(
      {
        name: queueValue,
        description: 'Fila criada automaticamente ao transferir chamado',
      },
      ['id', 'name']
    );

  const insertedQueue = Array.isArray(inserted) ? inserted[0] : inserted;
  return {
    queueId: insertedQueue?.id || null,
    queueName: insertedQueue?.name || queueValue,
  };
};

export interface CreateTicketData {
  title: string;
  description: string;
  priority: 'baixa' | 'media' | 'alta' | 'critica';
  category: 'tecnico' | 'suporte' | 'financeiro' | 'outros';
  serviceType?: string;
  totalValue?: number;
  createdBy: string;
  clientId?: string;
  queueId?: string;
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
  status?: 'aberto' | 'em_andamento' | 'em_atendimento' | 'pendente' | 'resolvido' | 'fechado' | 'encerrado' | 'em_fase_de_testes' | 'homologacao' | 'aguardando_cliente';
  priority?: 'baixa' | 'media' | 'alta' | 'critica';
  category?: 'tecnico' | 'suporte' | 'financeiro' | 'outros';
  serviceType?: string;
  totalValue?: number;
  assignedTo?: string | null;
  clientId?: string;
  queueId?: string | null;
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
    .leftJoin('queues as queue', 'tickets.queue_id', 'queue.id')
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
      `),
      db.raw(`
        CASE
          WHEN queue.id IS NOT NULL THEN
            json_build_object(
              'id', queue.id,
              'name', queue.name,
              'description', queue.description
            )
          ELSE NULL
        END as queue
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
  try {
    const db = getDatabase();

    console.log('🔍 Buscando ticket por ID:', id);

    // Primeiro, verificar se o ticket existe (query simples)
    const ticketExists = await db('tickets')
      .where('id', id)
      .first();

    if (!ticketExists) {
      console.error('❌ Ticket não encontrado no banco. ID:', id);
      // Listar alguns IDs existentes para debug
      const existingTickets = await db('tickets')
        .select('id')
        .limit(5);
      console.log('📋 IDs de tickets existentes (primeiros 5):', existingTickets.map(t => t.id));
      throw new Error(`Chamado não encontrado. ID: ${id}`);
    }

    console.log('✅ Ticket encontrado, buscando detalhes completos...');

    const ticket = await db('tickets')
      .leftJoin('users as creator', 'tickets.created_by', 'creator.id')
      .leftJoin('users as assignee', 'tickets.assigned_to', 'assignee.id')
      .leftJoin('users as client', 'tickets.client_id', 'client.id')
      .leftJoin('queues as queue', 'tickets.queue_id', 'queue.id')
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
        `),
        db.raw(`
          CASE
            WHEN queue.id IS NOT NULL THEN
              json_build_object(
                'id', queue.id,
                'name', queue.name,
                'description', queue.description
              )
            ELSE NULL
          END as queue
        `)
      )
      .first();

    if (!ticket) {
      console.error('❌ Erro ao buscar detalhes do ticket');
      throw new Error(`Chamado não encontrado. ID: ${id}`);
    }

    console.log('✅ Ticket encontrado:', ticket.id, ticket.title);

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
  } catch (error: any) {
    console.error('❌ Erro em getTicketById:', error);
    throw error;
  }
};

export const createTicket = async (data: CreateTicketData) => {
  try {
    const db = getDatabase();

    console.log('📝 Criando ticket:', { title: data.title, category: data.category, priority: data.priority });

    const { queueId } = await resolveQueueId(db, data.queueId);

    // Generate ticket ID
    const ticketCount = await db('tickets').count('* as count').first();
    const count = ticketCount?.count;
    const nextId = String((parseInt(count as string) || 0) + 1).padStart(5, '0');

    console.log('🆔 Próximo ID do ticket:', nextId);

    const insertResult = await db('tickets')
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
        queue_id: queueId ?? null,
      })
      .returning('*');

    console.log('📦 Resultado do insert:', insertResult);

    // O returning pode retornar array ou objeto dependendo do driver
    const ticket = Array.isArray(insertResult) ? insertResult[0] : insertResult;

    if (!ticket || !ticket.id) {
      throw new Error('Falha ao criar ticket: nenhum registro retornado');
    }

    console.log('✅ Ticket criado com sucesso:', ticket.id);

    // Save files if provided
    if (data.files && data.files.length > 0) {
      console.log('📎 Salvando arquivos:', data.files.length);
      await db('ticket_files').insert(
        data.files.map(file => ({
          ticket_id: ticket.id,
          name: file.name,
          size: file.size.toString(),
          type: file.type,
          data_url: file.dataUrl,
        }))
      );
      console.log('✅ Arquivos salvos com sucesso');
    }

    const fullTicket = await getTicketById(ticket.id);
    console.log('✅ Ticket completo retornado');
    return fullTicket;
  } catch (error: any) {
    console.error('❌ Erro ao criar ticket:', error);
    console.error('Stack:', error.stack);
    throw error;
  }
};

export const updateTicket = async (id: string, data: UpdateTicketData) => {
  try {
    const db = getDatabase();

    console.log('📝 Atualizando ticket:', id, data);

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
    if (data.assignedTo !== undefined) {
      updateData.assigned_to = data.assignedTo;
      console.log('👤 Atribuindo ticket para:', data.assignedTo || 'ninguém');
    }
    if (data.clientId !== undefined) updateData.client_id = data.clientId;
    if (data.queueId !== undefined) {
      const { queueId, queueName } = await resolveQueueId(db, data.queueId);
      updateData.queue_id = queueId ?? null;
      console.log('🔄 Transferindo ticket para fila:', queueName || data.queueId || 'nenhuma fila');
    }

    // Atualizar updated_at manualmente
    updateData.updated_at = db.fn.now();

    const updateResult = await db('tickets')
      .where({ id })
      .update(updateData);

    console.log('📦 Resultado do update:', updateResult);

    const updatedTicket = await getTicketById(id);
    console.log('✅ Ticket atualizado com sucesso');
    return updatedTicket;
  } catch (error: any) {
    console.error('❌ Erro ao atualizar ticket:', error);
    console.error('Stack:', error.stack);
    throw error;
  }
};

export const deleteTicket = async (id: string) => {
  try {
    const db = getDatabase();

    console.log('🗑️ Excluindo ticket:', id);

    // Check if ticket exists
    const ticket = await getTicketById(id);
    console.log('✅ Ticket encontrado:', ticket.title);

    // Verificar quantos comentários e arquivos serão excluídos
    const commentsCount = await db('comments')
      .where({ ticket_id: id })
      .count('* as count')
      .first();

    const filesCount = await db('ticket_files')
      .where({ ticket_id: id })
      .count('* as count')
      .first();

    const totalComments = parseInt(commentsCount?.count as string) || 0;
    const totalFiles = parseInt(filesCount?.count as string) || 0;

    console.log(`📊 Dados relacionados: ${totalComments} comentário(s), ${totalFiles} arquivo(s)`);

    // Excluir ticket (CASCADE vai excluir comentários e arquivos automaticamente)
    await db('tickets').where({ id }).delete();

    console.log(`✅ Ticket excluído com sucesso. ${totalComments} comentário(s) e ${totalFiles} arquivo(s) foram excluídos automaticamente.`);
  } catch (error: any) {
    console.error('❌ Erro ao excluir ticket:', error);
    throw error;
  }
};

export const addComment = async (ticketId: string, authorId: string, content: string) => {
  try {
    const db = getDatabase();

    console.log('💬 Adicionando comentário ao ticket:', ticketId);

    const insertResult = await db('comments')
      .insert({
        ticket_id: ticketId,
        author_id: authorId,
        content,
      })
      .returning('*');

    const comment = Array.isArray(insertResult) ? insertResult[0] : insertResult;

    if (!comment || !comment.id) {
      throw new Error('Falha ao criar comentário: nenhum registro retornado');
    }

    const author = await db('users')
      .where({ id: authorId })
      .select('id', 'name', 'email', 'role', 'avatar')
      .first();

    console.log('✅ Comentário criado com sucesso:', comment.id);

    return {
      id: comment.id,
      content: comment.content,
      author,
      createdAt: comment.created_at,
    };
  } catch (error: any) {
    console.error('❌ Erro ao adicionar comentário:', error);
    throw error;
  }
};

