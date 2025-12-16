import { getDatabase } from '../database/connection.js';

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const resolveQueueId = async (db: any, queueValue?: string | null) => {
  if (queueValue === undefined) {
    return { queueId: undefined, queueName: undefined };
  }

  if (queueValue === null || queueValue === '') {
    return { queueId: null, queueName: null };
  }

  // Normalizar valores usados no frontend offline (queue-n1/queue-n2) para nomes reais
  const isUuid = typeof queueValue === 'string' && uuidRegex.test(queueValue);
  let normalizedQueueValue = queueValue;

  if (!isUuid && typeof queueValue === 'string') {
    const valueLower = queueValue.toLowerCase();
    if (valueLower.startsWith('queue-n1')) {
      normalizedQueueValue = 'Suporte N1';
    } else if (valueLower.startsWith('queue-n2')) {
      normalizedQueueValue = 'Suporte N2';
    }
  }

  // Primeiro, tentar buscar por ID somente se o formato for UUID válido
  if (isUuid) {
    const existingById = await db('queues').where({ id: queueValue }).first();
    if (existingById) {
      return { queueId: existingById.id, queueName: existingById.name };
    }
  }

  // Se não encontrou por ID (ou não era UUID), tentar buscar por nome
  const existingByName = await db('queues')
    .whereRaw('LOWER(name) = LOWER(?)', [normalizedQueueValue])
    .first();

  if (existingByName) {
    return { queueId: existingByName.id, queueName: existingByName.name };
  }

  // Se não encontrou nem por ID nem por nome, criar fila automaticamente
  const inserted = await db('queues')
    .insert(
      {
        name: normalizedQueueValue,
        description: 'Fila criada automaticamente ao transferir chamado',
      },
      ['id', 'name']
    );

  const insertedQueue = Array.isArray(inserted) ? inserted[0] : inserted;
  return {
    queueId: insertedQueue?.id || null,
    queueName: insertedQueue?.name || normalizedQueueValue,
  };
};

export interface CreateTicketData {
  title: string;
  description: string;
  priority: 'baixa' | 'media' | 'alta' | 'critica';
  category: 'tecnico' | 'suporte' | 'integracao' | 'melhoria';
  serviceType?: string;
  totalValue?: number;
  createdBy: string;
  clientId?: string;
  queueId?: string;
  assignedTo?: string | null;
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
  updatedBy?: string; // ID do usuário que está fazendo a atualização
}

export interface TicketFilters {
  status?: string;
  priority?: string;
  category?: string;
  assignedTo?: string;
  createdBy?: string;
  queue?: string;
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
    if (filters.queue) {
      // Filtrar por fila - buscar por nome da fila (case insensitive, contém)
      query = query.whereRaw('LOWER(queue.name) LIKE LOWER(?)', [`%${filters.queue}%`]);
    }
    if (filters.search) {
      query = query.where((builder) => {
        builder
          .where('tickets.title', 'ilike', `%${filters.search}%`)
          .orWhere('tickets.description', 'ilike', `%${filters.search}%`);
      });
    }
  }

  const tickets = await query.orderBy('tickets.updated_at', 'desc');
  console.log(`📋 getAllTickets - Encontrados ${tickets.length} tickets no banco`);

  const ticketIds = tickets.map((t: any) => t.id);
  console.log(`📋 IDs dos tickets encontrados:`, ticketIds);

  let commentsByTicket: Record<string, any[]> = {};
  let ticketFilesByTicket: Record<string, any[]> = {};

  if (ticketIds.length > 0) {
    // Carregar todos os comentários dos tickets
    const comments = await db('comments')
      .leftJoin('users', 'comments.author_id', 'users.id')
      .whereIn('comments.ticket_id', ticketIds)
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

    // Carregar todos os arquivos dos tickets
    const files = await db('ticket_files')
      .whereIn('ticket_id', ticketIds)
      .select('id', 'ticket_id', 'comment_id', 'name', 'size', 'type', 'data_url', 'created_at');

    const filesByComment: Record<string, any[]> = {};

    files.forEach((f: any) => {
      if (f.comment_id) {
        const commentIdStr = String(f.comment_id); // Ensure string comparison
        if (!filesByComment[commentIdStr]) filesByComment[commentIdStr] = [];
        filesByComment[commentIdStr].push({
          id: f.id,
          name: f.name,
          size: parseInt(f.size),
          type: f.type,
          data: f.data_url,
        });
      } else {
        if (!ticketFilesByTicket[f.ticket_id]) ticketFilesByTicket[f.ticket_id] = [];
        ticketFilesByTicket[f.ticket_id].push({
          id: f.id,
          name: f.name,
          size: parseInt(f.size),
          type: f.type,
          data: f.data_url,
        });
      }
    });

    commentsByTicket = comments.reduce((acc: Record<string, any[]>, c: any) => {
      const ticketId = c.ticket_id;
      if (!acc[ticketId]) acc[ticketId] = [];
      const commentIdStr = String(c.id); // Ensure string comparison
      acc[ticketId].push({
        id: c.id,
        content: c.content,
        author: c.author,
        createdAt: c.created_at,
        files: filesByComment[commentIdStr] || [],
      });
      return acc;
    }, {});
  }

  const result = tickets.map((t: any) => ({
    ...t,
    files: ticketFilesByTicket[t.id] || [],
    comments: commentsByTicket[t.id] || [],
  }));

  console.log(`✅ getAllTickets - Retornando ${result.length} tickets processados`);
  if (result.length > 0) {
    console.log(`📝 Primeiro ticket (exemplo):`, {
      id: result[0].id,
      title: result[0].title,
      status: result[0].status,
      created_by_user: result[0].created_by_user?.name,
      assigned_to_user: result[0].assigned_to_user?.name,
      queue: result[0].queue?.name,
      comments_count: result[0].comments?.length || 0,
    });
  }

  return result;
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

    // Get files (ticket-level e por comentário)
    const files = await db('ticket_files')
      .where({ ticket_id: id })
      .select('id', 'ticket_id', 'comment_id', 'name', 'size', 'type', 'data_url', 'created_at');

    console.log(`📎 Total de arquivos encontrados para ticket ${id}:`, files.length);
    files.forEach((f: any) => {
      console.log(`  - Arquivo ${f.id}: comment_id=${f.comment_id || 'null'}, name=${f.name}`);
    });

    const ticketFiles: any[] = [];
    const filesByComment: Record<string, any[]> = {};

    files.forEach((f: any) => {
      const fileData = {
        id: f.id,
        name: f.name,
        size: parseInt(f.size),
        type: f.type,
        data: f.data_url,
      };
      if (f.comment_id) {
        // Garantir que o comment_id seja string para consistência
        const commentId = String(f.comment_id);
        if (!filesByComment[commentId]) filesByComment[commentId] = [];
        filesByComment[commentId].push(fileData);
        console.log(`  ✅ Arquivo ${f.id} (${f.name}) vinculado ao comentário ${commentId}`);
      } else {
        ticketFiles.push(fileData);
        console.log(`  📄 Arquivo ${f.id} (${f.name}) vinculado ao ticket (sem comentário)`);
      }
    });

    console.log(`📊 Resumo: ${ticketFiles.length} arquivo(s) do ticket, ${Object.keys(filesByComment).length} comentário(s) com arquivos`);

    // Get comments (com arquivos vinculados)
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

    console.log(`💬 Total de comentários encontrados: ${comments.length}`);
    console.log(`📋 IDs dos comentários:`, comments.map(c => c.id));
    console.log(`📋 IDs dos comentários com arquivos:`, Object.keys(filesByComment));

    const commentsWithFiles = comments.map(c => {
      // Garantir que ambos sejam strings para comparação
      const commentId = String(c.id);
      const commentFiles = filesByComment[commentId] || filesByComment[c.id] || [];

      if (commentFiles.length > 0) {
        console.log(`  ✅ Comentário ${c.id} tem ${commentFiles.length} arquivo(s):`, commentFiles.map((f: any) => f.name));
      } else {
        // Verificar se há arquivos com comment_id mas não foram encontrados
        const filesForThisComment = files.filter((f: any) =>
          f.comment_id && (String(f.comment_id) === commentId || String(f.comment_id) === String(c.id))
        );
        if (filesForThisComment.length > 0) {
          console.log(`  ⚠️ Comentário ${c.id} deveria ter ${filesForThisComment.length} arquivo(s), mas não foram encontrados no filesByComment`);
          console.log(`     Arquivos encontrados:`, filesForThisComment.map((f: any) => ({ id: f.id, comment_id: f.comment_id, name: f.name })));
        }
      }

      return {
        id: c.id,
        content: c.content,
        author: c.author,
        createdAt: c.created_at,
        files: commentFiles,
      };
    });

    return {
      ...ticket,
      // Arquivos anexados diretamente ao ticket (não vinculados a comentário)
      files: ticketFiles,
      // Comentários com seus respectivos arquivos vinculados
      comments: commentsWithFiles,
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

    // Se não foi especificada uma fila, atribuir à "Suporte N1" por padrão
    let finalQueueId = data.queueId;
    if (!finalQueueId) {
      const suporteN1 = await db('queues').whereRaw('LOWER(name) = LOWER(?)', ['Suporte N1']).first();
      if (suporteN1) {
        finalQueueId = suporteN1.id;
        console.log('📋 Atribuindo ticket à fila padrão: Suporte N1');
      } else {
        // Se não existir, criar a fila
        const [newQueue] = await db('queues')
          .insert({
            name: 'Suporte N1',
            description: 'Fila padrão de suporte nível 1',
          })
          .returning('*');
        if (newQueue) {
          finalQueueId = newQueue.id;
          console.log('✅ Fila "Suporte N1" criada e atribuída ao ticket');
        }
      }
    }

    const { queueId } = await resolveQueueId(db, finalQueueId);

    // Gerar ID numérico incremental usando MAX(CAST(id AS INTEGER))
    // Usamos um alias explícito para evitar problemas de sintaxe com DBs diferentes
    const maxRow = await db('tickets')
      .max<{ maxId: number | null }>({ maxId: db.raw('CAST(id AS INTEGER)') })
      .first();

    const lastNumericId = maxRow && maxRow.maxId != null
      ? Number(maxRow.maxId) || 0
      : 0;

    const nextId = String(lastNumericId + 1).padStart(5, '0');

    console.log('🆔 Último ID numérico:', lastNumericId, '→ Próximo ID do ticket:', nextId);

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
        assigned_to: data.assignedTo || null,
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

    // Save files if provided (apenas nível de ticket)
    if (data.files && data.files.length > 0) {
      console.log('📎 Salvando arquivos do ticket:', data.files.length);
      await db('ticket_files').insert(
        data.files.map(file => ({
          ticket_id: ticket.id,
          comment_id: null,
          name: file.name,
          size: file.size.toString(),
          type: file.type,
          data_url: file.dataUrl,
        }))
      );
      console.log('✅ Arquivos do ticket salvos com sucesso');
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
    let previousQueueName: string | null = null;
    if (data.queueId !== undefined) {
      // Buscar fila atual antes de atualizar
      const currentTicket = await db('tickets').where({ id }).first();
      if (currentTicket?.queue_id) {
        const currentQueue = await db('queues').where({ id: currentTicket.queue_id }).first();
        previousQueueName = currentQueue?.name || null;
      }

      const { queueId, queueName } = await resolveQueueId(db, data.queueId);
      updateData.queue_id = queueId ?? null;

      // Sempre buscar o nome da fila do banco de dados para garantir que temos o nome correto
      let finalQueueName: string | null = null;
      if (queueId) {
        const queueRecord = await db('queues').where({ id: queueId }).first();
        finalQueueName = queueRecord?.name || null;
        console.log(`🔍 Fila encontrada no banco: ID=${queueId}, Nome=${finalQueueName}`);
      }

      // Usar o nome do banco se disponível, senão usar o queueName do resolveQueueId, senão usar o ID
      const displayQueueName = finalQueueName || queueName || (queueId ? String(queueId) : null);
      console.log('🔄 Transferindo ticket para fila:', displayQueueName || 'nenhuma fila');

      // Se a fila mudou, criar comentário de transferência
      if (displayQueueName && previousQueueName && displayQueueName !== previousQueueName) {
        try {
          const authorId = data.updatedBy || currentTicket.created_by;
          const author = await db('users').where({ id: authorId }).select('name').first();
          const authorName = author?.name || 'Sistema';
          await db('comments').insert({
            ticket_id: id,
            author_id: authorId,
            content: `Chamado transferido de "${previousQueueName}" para "${displayQueueName}" por ${authorName}`,
          });
          console.log(`✅ Comentário de transferência criado: "${previousQueueName}" → "${displayQueueName}"`);
        } catch (error) {
          console.error('⚠️ Erro ao criar comentário de transferência:', error);
        }
      } else if (displayQueueName && !previousQueueName) {
        // Se não havia fila e agora tem, também criar comentário
        try {
          const authorId = data.updatedBy || currentTicket.created_by;
          const author = await db('users').where({ id: authorId }).select('name').first();
          const authorName = author?.name || 'Sistema';
          await db('comments').insert({
            ticket_id: id,
            author_id: authorId,
            content: `Chamado atribuído à fila "${displayQueueName}" por ${authorName}`,
          });
          console.log(`✅ Comentário de atribuição de fila criado: "${displayQueueName}"`);
        } catch (error) {
          console.error('⚠️ Erro ao criar comentário de atribuição de fila:', error);
        }
      } else if (!displayQueueName && queueId) {
        // Se ainda não temos o nome, tentar buscar novamente
        console.warn(`⚠️ Nome da fila não encontrado para ID: ${queueId}, tentando buscar novamente...`);
        try {
          const queueRecord = await db('queues').where({ id: queueId }).first();
          if (queueRecord?.name) {
            const authorId = data.updatedBy || currentTicket.created_by;
            const author = await db('users').where({ id: authorId }).select('name').first();
            const authorName = author?.name || 'Sistema';
            const finalName = queueRecord.name;

            if (previousQueueName && previousQueueName !== finalName) {
              await db('comments').insert({
                ticket_id: id,
                author_id: authorId,
                content: `Chamado transferido de "${previousQueueName}" para "${finalName}" por ${authorName}`,
              });
              console.log(`✅ Comentário de transferência criado (fallback): "${previousQueueName}" → "${finalName}"`);
            } else if (!previousQueueName) {
              await db('comments').insert({
                ticket_id: id,
                author_id: authorId,
                content: `Chamado atribuído à fila "${finalName}" por ${authorName}`,
              });
              console.log(`✅ Comentário de atribuição de fila criado (fallback): "${finalName}"`);
            }
          } else {
            console.error(`❌ Fila com ID ${queueId} não encontrada no banco de dados`);
          }
        } catch (error) {
          console.error('⚠️ Erro ao buscar/criar comentário de fila (fallback):', error);
        }
      }
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

export interface CommentFileInput {
  name: string;
  size: number;
  type: string;
  data: string;
}

export const addComment = async (
  ticketId: string,
  authorId: string,
  content: string,
  files?: CommentFileInput[]
) => {
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

    // Salvar arquivos vinculados ao comentário (interação)
    let savedFiles: any[] = [];
    if (files && files.length > 0) {
      console.log(`📎 Salvando ${files.length} arquivo(s) do comentário ${comment.id}:`);
      files.forEach((file, idx) => {
        console.log(`  - Arquivo ${idx + 1}: ${file.name} (${file.size} bytes)`);
      });

      const insertFiles = await db('ticket_files')
        .insert(
          files.map((file) => ({
            ticket_id: ticketId,
            comment_id: comment.id,
            name: file.name,
            size: file.size.toString(),
            type: file.type,
            data_url: file.data,
          })),
          ['id', 'ticket_id', 'comment_id', 'name', 'size', 'type', 'data_url']
        );

      const insertedArray = Array.isArray(insertFiles) ? insertFiles : [insertFiles];
      savedFiles = insertedArray.map((f: any) => {
        console.log(`  ✅ Arquivo salvo: id=${f.id}, comment_id=${f.comment_id}, name=${f.name}`);
        return {
          id: f.id,
          name: f.name,
          size: parseInt(f.size),
          type: f.type,
          data: f.data_url,
        };
      });
      console.log(`✅ ${savedFiles.length} arquivo(s) do comentário salvos com sucesso`);
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
      files: savedFiles,
    };
  } catch (error: any) {
    console.error('❌ Erro ao adicionar comentário:', error);
    throw error;
  }
};

