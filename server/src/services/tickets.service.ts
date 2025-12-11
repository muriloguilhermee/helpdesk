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
  unassignedOnly?: boolean; // Para buscar apenas tickets não atribuídos
}

export const getAllTickets = async (filters?: TicketFilters) => {
  const db = getDatabase();

  console.log('🔍 getAllTickets chamado com filtros:', filters);

  try {
    // PRIMEIRO: Buscar tickets simples SEM JOINs para garantir que sempre retornamos algo
    let ticketsQuery = db('tickets').select('*');

    // Aplicar filtros básicos primeiro
    if (filters) {
      if (filters.status) {
        ticketsQuery = ticketsQuery.where('status', filters.status);
      }
      if (filters.priority) {
        ticketsQuery = ticketsQuery.where('priority', filters.priority);
      }
      if (filters.category) {
        ticketsQuery = ticketsQuery.where('category', filters.category);
      }
      if (filters.assignedTo) {
        ticketsQuery = ticketsQuery.where('assigned_to', filters.assignedTo);
      }
      if (filters.createdBy) {
        ticketsQuery = ticketsQuery.where('created_by', filters.createdBy);
      }
      if (filters.unassignedOnly) {
        ticketsQuery = ticketsQuery.whereNull('assigned_to');
      }
      if (filters.search) {
        ticketsQuery = ticketsQuery.where((builder) => {
          builder
            .where('title', 'ilike', `%${filters.search}%`)
            .orWhere('description', 'ilike', `%${filters.search}%`);
        });
      }
    }

    const ticketsSimple = await ticketsQuery.orderBy('updated_at', 'desc');

    console.log('📦 Tickets encontrados (query simples):', ticketsSimple.length);
    console.log('📋 IDs dos tickets:', ticketsSimple.map((t: any) => t.id));

    if (ticketsSimple.length === 0) {
      console.log('⚠️ Nenhum ticket encontrado com os filtros aplicados');
      return [];
    }

    // SEGUNDO: Buscar usuários individualmente e construir resposta
    const ticketsWithUsers = await Promise.all(ticketsSimple.map(async (ticket: any) => {
      let createdByUser = null;
      let assignedToUser = null;
      let clientUser = null;

      // Buscar criador
      if (ticket.created_by) {
        try {
          const creator = await db('users').where('id', ticket.created_by).first();
          if (creator) {
            createdByUser = {
              id: creator.id,
              name: creator.name || '',
              email: creator.email || '',
              role: creator.role || 'user',
              avatar: creator.avatar
            };
          } else {
            createdByUser = {
              id: ticket.created_by,
              name: 'Usuário não encontrado',
              email: '',
              role: 'user',
              avatar: null
            };
          }
        } catch (e) {
          console.error(`Erro ao buscar criador ${ticket.created_by}:`, e);
          createdByUser = {
            id: ticket.created_by,
            name: 'Usuário não encontrado',
            email: '',
            role: 'user',
            avatar: null
          };
        }
      }

      // Buscar atribuído
      if (ticket.assigned_to) {
        try {
          const assignee = await db('users').where('id', ticket.assigned_to).first();
          if (assignee) {
            assignedToUser = {
              id: assignee.id,
              name: assignee.name || '',
              email: assignee.email || '',
              role: assignee.role || 'technician',
              avatar: assignee.avatar
            };
          }
        } catch (e) {
          console.error(`Erro ao buscar atribuído ${ticket.assigned_to}:`, e);
        }
      }

      // Buscar cliente
      if (ticket.client_id) {
        try {
          const client = await db('users').where('id', ticket.client_id).first();
          if (client) {
            clientUser = {
              id: client.id,
              name: client.name || '',
              email: client.email || '',
              role: client.role || 'user',
              avatar: client.avatar
            };
          } else {
            clientUser = {
              id: ticket.client_id,
              name: 'Cliente não encontrado',
              email: '',
              role: 'user',
              avatar: null
            };
          }
        } catch (e) {
          console.error(`Erro ao buscar cliente ${ticket.client_id}:`, e);
          clientUser = {
            id: ticket.client_id,
            name: 'Cliente não encontrado',
            email: '',
            role: 'user',
            avatar: null
          };
        }
      }

      // Buscar arquivos
      let files: any[] = [];
      try {
        files = await db('ticket_files')
          .where('ticket_id', ticket.id)
          .select('id', 'name', 'size', 'type', 'data_url', 'created_at');
      } catch (e) {
        console.error(`Erro ao buscar arquivos do ticket ${ticket.id}:`, e);
      }

      // Buscar comentários
      let comments: any[] = [];
      try {
        const commentsRaw = await db('comments')
          .leftJoin('users', 'comments.author_id', 'users.id')
          .where('comments.ticket_id', ticket.id)
          .select(
            'comments.*',
            db.raw(`
              CASE
                WHEN users.id IS NOT NULL THEN
                  json_build_object(
                    'id', users.id,
                    'name', users.name,
                    'email', users.email,
                    'role', users.role,
                    'avatar', users.avatar
                  )
                ELSE NULL
              END as author
            `)
          )
          .orderBy('comments.created_at', 'asc');

        comments = commentsRaw.map((c: any) => ({
          id: c.id,
          content: c.content,
          author: c.author,
          createdAt: c.created_at,
        }));
      } catch (e) {
        console.error(`Erro ao buscar comentários do ticket ${ticket.id}:`, e);
      }

      return {
        ...ticket,
        created_by_user: createdByUser,
        assigned_to_user: assignedToUser,
        client_user: clientUser,
        files: files.map((f: any) => ({
          id: f.id,
          name: f.name,
          size: parseInt(f.size) || 0,
          type: f.type,
          data: f.data_url,
        })),
        comments: comments,
      };
    }));

    console.log('✅ Tickets processados com sucesso:', ticketsWithUsers.length);
    console.log('📊 Estatísticas:', {
      total: ticketsWithUsers.length,
      abertos: ticketsWithUsers.filter((t: any) => t.status === 'aberto').length,
      com_usuarios: ticketsWithUsers.filter((t: any) => t.created_by_user).length,
      sem_usuarios: ticketsWithUsers.filter((t: any) => !t.created_by_user).length,
    });

    return ticketsWithUsers;
  } catch (error: any) {
    console.error('❌ Erro ao buscar tickets:', error);
    console.error('Stack:', error.stack);
    throw error;
  }

  // Query modificada para garantir que tickets sejam retornados mesmo sem usuários
  // Usar LEFT JOIN padrão mas com fallbacks no SELECT para quando usuários não existem
  let query = db('tickets')
    .leftJoin('users as creator', 'tickets.created_by', 'creator.id')
    .leftJoin('users as assignee', 'tickets.assigned_to', 'assignee.id')
    .leftJoin('users as client', 'tickets.client_id', 'client.id')
    .select(
      'tickets.*',
      db.raw(`
        CASE
          WHEN creator.id IS NOT NULL THEN
            json_build_object(
              'id', creator.id,
              'name', COALESCE(creator.name, ''),
              'email', COALESCE(creator.email, ''),
              'role', COALESCE(creator.role, 'user'),
              'avatar', creator.avatar
            )
          ELSE
            json_build_object(
              'id', tickets.created_by,
              'name', 'Usuário não encontrado',
              'email', '',
              'role', 'user',
              'avatar', NULL
            )
        END as created_by_user
      `),
      db.raw(`
        CASE
          WHEN assignee.id IS NOT NULL THEN
            json_build_object(
              'id', assignee.id,
              'name', COALESCE(assignee.name, ''),
              'email', COALESCE(assignee.email, ''),
              'role', COALESCE(assignee.role, 'technician'),
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
              'name', COALESCE(client.name, ''),
              'email', COALESCE(client.email, ''),
              'role', COALESCE(client.role, 'user'),
              'avatar', client.avatar
            )
          ELSE
            CASE
              WHEN tickets.client_id IS NOT NULL THEN
                json_build_object(
                  'id', tickets.client_id,
                  'name', 'Cliente não encontrado',
                  'email', '',
                  'role', 'user',
                  'avatar', NULL
                )
              ELSE NULL
            END
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
    if (filters.unassignedOnly) {
      query = query.whereNull('tickets.assigned_to');
    }
    if (filters.search) {
      query = query.where((builder) => {
        builder
          .where('tickets.title', 'ilike', `%${filters.search}%`)
          .orWhere('tickets.description', 'ilike', `%${filters.search}%`);
      });
    }
  }

  try {
    // Executar query e capturar resultado
    const result = await query.orderBy('tickets.updated_at', 'desc');

    console.log('✅ Query executada, resultado:', {
      total: result.length,
      ids: result.map((t: any) => ({
        id: t.id,
        status: t.status,
        created_by: t.created_by,
        created_by_user: t.created_by_user ? 'existe' : 'null',
        assigned_to: t.assigned_to,
        assigned_to_user: t.assigned_to_user ? 'existe' : 'null'
      }))
    });

    // Se a query retornou vazio mas há tickets no banco, usar fallback
    if (result.length === 0 && allTicketIds.length > 0) {
      console.error('⚠️ ATENÇÃO: Query retornou 0 tickets mas há tickets no banco!');
      console.error('📋 Tickets no banco:', allTicketIds);
      console.log('🔄 Tentando buscar tickets sem JOINs complexos...');

      // Fallback: buscar tickets sem JOINs e construir objetos manualmente
      const ticketsWithoutJoins = await db('tickets')
        .select('*')
        .orderBy('updated_at', 'desc');

      console.log('📦 Tickets sem JOINs:', ticketsWithoutJoins.length);

      // Aplicar filtros manualmente se necessário
      let filteredTickets = ticketsWithoutJoins;
      if (filters) {
        if (filters.status) {
          filteredTickets = filteredTickets.filter((t: any) => t.status === filters.status);
        }
        if (filters.priority) {
          filteredTickets = filteredTickets.filter((t: any) => t.priority === filters.priority);
        }
        if (filters.category) {
          filteredTickets = filteredTickets.filter((t: any) => t.category === filters.category);
        }
        if (filters.assignedTo) {
          filteredTickets = filteredTickets.filter((t: any) => t.assigned_to === filters.assignedTo);
        }
        if (filters.createdBy) {
          filteredTickets = filteredTickets.filter((t: any) => t.created_by === filters.createdBy);
        }
        if (filters.unassignedOnly) {
          filteredTickets = filteredTickets.filter((t: any) => !t.assigned_to);
        }
      }

      // Construir resposta com objetos de usuário padrão
      const ticketsWithFallback = await Promise.all(filteredTickets.map(async (ticket: any) => {
        // Tentar buscar usuários individualmente
        let createdByUser = null;
        let assignedToUser = null;
        let clientUser = null;

        if (ticket.created_by) {
          try {
            const creator = await db('users').where('id', ticket.created_by).first();
            if (creator) {
              createdByUser = {
                id: creator.id,
                name: creator.name || '',
                email: creator.email || '',
                role: creator.role || 'user',
                avatar: creator.avatar
              };
            } else {
              createdByUser = {
                id: ticket.created_by,
                name: 'Usuário não encontrado',
                email: '',
                role: 'user',
                avatar: null
              };
            }
          } catch (e) {
            console.error('Erro ao buscar criador:', e);
            createdByUser = {
              id: ticket.created_by,
              name: 'Usuário não encontrado',
              email: '',
              role: 'user',
              avatar: null
            };
          }
        }

        if (ticket.assigned_to) {
          try {
            const assignee = await db('users').where('id', ticket.assigned_to).first();
            if (assignee) {
              assignedToUser = {
                id: assignee.id,
                name: assignee.name || '',
                email: assignee.email || '',
                role: assignee.role || 'technician',
                avatar: assignee.avatar
              };
            }
          } catch (e) {
            console.error('Erro ao buscar atribuído:', e);
          }
        }

        if (ticket.client_id) {
          try {
            const client = await db('users').where('id', ticket.client_id).first();
            if (client) {
              clientUser = {
                id: client.id,
                name: client.name || '',
                email: client.email || '',
                role: client.role || 'user',
                avatar: client.avatar
              };
            } else {
              clientUser = {
                id: ticket.client_id,
                name: 'Cliente não encontrado',
                email: '',
                role: 'user',
                avatar: null
              };
            }
          } catch (e) {
            console.error('Erro ao buscar cliente:', e);
            clientUser = {
              id: ticket.client_id,
              name: 'Cliente não encontrado',
              email: '',
              role: 'user',
              avatar: null
            };
          }
        }

        return {
          ...ticket,
          created_by_user: createdByUser,
          assigned_to_user: assignedToUser,
          client_user: clientUser,
          files: [],
          comments: []
        };
      }));

      console.log('✅ Retornando tickets com fallback:', ticketsWithFallback.length);
      return ticketsWithFallback;
    }

    return result;
  } catch (error: any) {
    console.error('❌ Erro ao executar query getAllTickets:', error);
    console.error('Stack:', error.stack);
    console.error('Mensagem:', error.message);

    // Em caso de erro, tentar retornar tickets sem JOINs
    try {
      console.log('🔄 Tentando fallback: buscar tickets sem JOINs...');
      const ticketsSimple = await db('tickets')
        .select('*')
        .orderBy('updated_at', 'desc');

      console.log('📦 Tickets encontrados (fallback):', ticketsSimple.length);

      // Aplicar filtros básicos
      let filtered = ticketsSimple;
      if (filters?.status) {
        filtered = filtered.filter((t: any) => t.status === filters.status);
      }

      // Retornar com objetos de usuário padrão
      return filtered.map((ticket: any) => ({
        ...ticket,
        created_by_user: ticket.created_by ? {
          id: ticket.created_by,
          name: 'Usuário não encontrado',
          email: '',
          role: 'user',
          avatar: null
        } : null,
        assigned_to_user: null,
        client_user: ticket.client_id ? {
          id: ticket.client_id,
          name: 'Cliente não encontrado',
          email: '',
          role: 'user',
          avatar: null
        } : null,
        files: [],
        comments: []
      }));
    } catch (fallbackError) {
      console.error('❌ Erro no fallback também:', fallbackError);
      throw error; // Lançar o erro original
    }
  }
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

    // Generate ticket ID - buscar o maior ID numérico existente e incrementar
    // Isso evita conflitos mesmo se houver tickets deletados ou requisições simultâneas
    const allTickets = await db('tickets').select('id');

    // Filtrar apenas IDs numéricos e encontrar o maior
    let maxIdNum = 0;
    for (const ticket of allTickets) {
      const idStr = String(ticket.id || '');
      // Verificar se é um número válido
      if (/^\d+$/.test(idStr)) {
        const idNum = parseInt(idStr, 10);
        if (idNum > maxIdNum) {
          maxIdNum = idNum;
        }
      }
    }

    // Próximo ID será o maior + 1
    let nextId = String(maxIdNum + 1).padStart(5, '0');

    console.log('🆔 Próximo ID do ticket:', nextId);

    // Tentar inserir com retry em caso de conflito
    let insertResult;
    let attempts = 0;
    const maxAttempts = 5;

    while (attempts < maxAttempts) {
      try {
        console.log(`🔄 Tentativa ${attempts + 1} de inserir ticket com ID: ${nextId}`);
        insertResult = await db('tickets')
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
            queue_id: data.queueId || null,
          })
          .returning('*');
        console.log(`✅ Ticket inserido com sucesso! ID: ${nextId}`);
        break; // Sucesso, sair do loop
      } catch (insertError: any) {
        console.error(`❌ Erro ao inserir ticket (tentativa ${attempts + 1}):`, {
          code: insertError.code,
          message: insertError.message,
          detail: insertError.detail
        });
        // Se for erro de chave duplicada, tentar com próximo ID
        if (insertError.code === '23505' || insertError.message?.includes('duplicate key')) {
          attempts++;
          const currentIdNum = parseInt(nextId, 10);
          const previousId = nextId;
          nextId = String(currentIdNum + 1).padStart(5, '0');
          console.log(`⚠️ ID ${previousId} já existe, tentando próximo: ${nextId}`);
          if (attempts >= maxAttempts) {
            throw new Error('Não foi possível gerar um ID único para o ticket após várias tentativas');
          }
        } else {
          // Outro tipo de erro, propagar
          throw insertError;
        }
      }
    }

    console.log('📦 Resultado do insert:', insertResult);

    // O returning pode retornar array ou objeto dependendo do driver
    const ticket = Array.isArray(insertResult) ? insertResult[0] : insertResult;

    if (!ticket || !ticket.id) {
      throw new Error('Falha ao criar ticket: nenhum registro retornado');
    }

    console.log('✅ Ticket criado com sucesso:', {
      id: ticket.id,
      status: ticket.status,
      status_verificado: ticket.status === 'aberto' ? '✅ CORRETO' : '❌ ERRADO - DEVERIA SER "aberto"',
      assigned_to: ticket.assigned_to,
      created_by: ticket.created_by,
      title: ticket.title
    });

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
    console.log('✅ Ticket completo retornado:', {
      id: fullTicket.id,
      status: fullTicket.status,
      status_verificado: fullTicket.status === 'aberto' ? '✅ CORRETO' : `❌ ERRADO - Status atual: "${fullTicket.status}"`,
      assigned_to_user: fullTicket.assigned_to_user ? fullTicket.assigned_to_user.name : 'Não atribuído'
    });

    // Verificar se o status está correto
    if (fullTicket.status !== 'aberto') {
      console.error('⚠️ ATENÇÃO: Ticket criado mas status não é "aberto"!', {
        id: fullTicket.id,
        status_esperado: 'aberto',
        status_atual: fullTicket.status
      });
    }

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
      updateData.queue_id = data.queueId;
      console.log('🔄 Transferindo ticket para fila:', data.queueId || 'nenhuma fila');
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

