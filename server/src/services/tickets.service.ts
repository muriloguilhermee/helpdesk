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

  console.log('========================================');
  console.log('🔍 getAllTickets INICIADO');
  console.log('========================================');
  console.log('📋 Filtros recebidos:', filters);

  try {
    // TESTE: Verificar conexão e tickets no banco
    console.log('🔌 Testando conexão com banco de dados...');
    const testConnection = await db.raw('SELECT 1 as test');
    console.log('✅ Conexão com banco OK');

    // Contar tickets diretamente
    const countResult = await db('tickets').count('* as total').first();
    const totalCount = countResult ? (typeof countResult === 'object' && 'total' in countResult ? parseInt(String(countResult.total)) : 0) : 0;
    console.log('📊 Total de tickets no banco:', totalCount);

    // Listar todos os tickets (sem filtros)
    const allTicketsRaw = await db('tickets').select('id', 'status', 'created_by', 'assigned_to', 'title');
    console.log('📋 Todos os tickets (raw):', allTicketsRaw);

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

      // Buscar interações
      let interactions: any[] = [];
      try {
        const interactionsRaw = await db('interactions')
          .leftJoin('users', 'interactions.author_id', 'users.id')
          .where('interactions.ticket_id', ticket.id)
          .select(
            'interactions.*',
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
          .orderBy('interactions.created_at', 'asc');

        // Buscar arquivos de cada interação
        interactions = await Promise.all(
          interactionsRaw.map(async (i: any) => {
        // Buscar arquivos da interação
        const interactionFiles = await db('ticket_files')
          .where({ interaction_id: i.id })
          .select('id', 'name', 'size', 'type', 'data_url', 'interaction_id');

        console.log(`🔍 [getAllTickets] Buscando arquivos para interação ${i.id}:`, {
          interactionId: i.id,
          filesFound: interactionFiles.length,
          files: interactionFiles.map((f: any) => ({
            id: f.id,
            name: f.name,
            interaction_id: f.interaction_id,
            hasDataUrl: !!f.data_url,
            dataUrlLength: f.data_url?.length || 0
          }))
        });

        const files = interactionFiles.map((f: any) => {
          if (!f.data_url) {
            console.warn(`⚠️ [getAllTickets] Arquivo sem data_url para interação ${i.id}:`, {
              fileId: f.id,
              fileName: f.name
            });
          }
          return {
            id: f.id,
            name: f.name,
            size: parseInt(f.size) || 0,
            type: f.type || 'application/octet-stream',
            data: f.data_url, // IMPORTANTE: garantir que data_url seja retornado
          };
        }).filter((f: any) => f.data); // Filtrar apenas arquivos com dados

        if (files.length > 0) {
          console.log(`✅ [getAllTickets] Arquivos encontrados para interação ${i.id}:`, {
            filesCount: files.length,
            files: files.map((f: any) => ({
              id: f.id,
              name: f.name,
              hasData: !!f.data,
              dataLength: f.data?.length || 0
            }))
          });
        } else if (interactionFiles.length > 0) {
          console.warn(`⚠️ [getAllTickets] Arquivos encontrados mas sem data_url para interação ${i.id}`);
        }

        return {
          id: i.id,
          type: i.type,
          content: i.content,
          author: i.author,
          metadata: i.metadata ? JSON.parse(i.metadata) : null,
          files: files.length > 0 ? files : undefined, // Retornar undefined se não houver arquivos válidos
          createdAt: i.created_at,
        };
          })
        );
      } catch (e) {
        console.error(`Erro ao buscar interações do ticket ${ticket.id}:`, e);
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
        interactions: interactions,
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
    // Arquivos do ticket (somente os que não pertencem a interações)
    const files = await db('ticket_files')
      .where({ ticket_id: id })
      .whereNull('interaction_id')
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

    // Get interactions
    const interactionsRaw = await db('interactions')
      .leftJoin('users', 'interactions.author_id', 'users.id')
      .where({ 'interactions.ticket_id': id })
      .select(
        'interactions.*',
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
      .orderBy('interactions.created_at', 'asc');

    // Buscar arquivos de cada interação
    const interactions = await Promise.all(
      interactionsRaw.map(async (i: any) => {
        // Buscar arquivos da interação - busca simples e direta
        const interactionFiles = await db('ticket_files')
          .where({ interaction_id: i.id })
          .select('id', 'name', 'size', 'type', 'data_url', 'interaction_id', 'ticket_id');

        console.log(`🔍 Buscando arquivos para interação ${i.id}:`, {
          interactionId: i.id,
          filesFound: interactionFiles.length,
          files: interactionFiles.map((f: any) => ({
            id: f.id,
            name: f.name,
            interaction_id: f.interaction_id,
            ticket_id: f.ticket_id,
            matches: f.interaction_id === i.id
          }))
        });

        // Mapear arquivos diretamente (já filtrados pela query WHERE interaction_id = i.id)
        const files = interactionFiles.map((f: any) => {
          if (!f.data_url) {
            console.warn(`⚠️ [getTicketById] Arquivo sem data_url para interação ${i.id}:`, {
              fileId: f.id,
              fileName: f.name
            });
            return null;
          }
          return {
            id: f.id,
            name: f.name,
            size: parseInt(f.size) || 0,
            type: f.type || 'application/octet-stream',
            data: f.data_url, // IMPORTANTE: garantir que data_url seja retornado
          };
        }).filter((f: any) => f !== null && f.data); // Filtrar nulos e arquivos sem dados

        if (files.length > 0) {
          console.log(`✅ [getTicketById] Arquivos encontrados para interação ${i.id}:`, {
            interactionId: i.id,
            filesCount: files.length,
            files: files.map((f: any) => ({
              id: f.id,
              name: f.name,
              size: f.size,
              type: f.type,
              hasData: !!f.data,
              dataLength: f.data?.length || 0
            }))
          });
        } else {
          console.log(`⚠️ [getTicketById] Nenhum arquivo encontrado para interação ${i.id}`);
        }

        const result = {
          id: i.id,
          type: i.type,
          content: i.content,
          author: i.author,
          metadata: i.metadata ? JSON.parse(i.metadata) : null,
          files: files.length > 0 ? files : undefined, // Retornar undefined se não houver arquivos válidos
          createdAt: i.created_at,
        };

        // Log final da interação sendo retornada
        if (files.length > 0) {
          console.log(`✅ [getTicketById] Retornando interação ${i.id} COM ${files.length} arquivo(s):`, {
            files: files.map((f: any) => ({ id: f.id, name: f.name, hasData: !!f.data }))
          });
        }

        return result;
      })
    );

    // Log final antes de retornar
    console.log('📦 [getTicketById] Retornando ticket com interações:', {
      ticketId: ticket.id,
      interactionsCount: interactions.length,
      interactionsWithFiles: interactions.filter((i: any) => i.files && i.files.length > 0).length,
      allInteractions: interactions.map((i: any) => ({
        id: i.id,
        type: i.type,
        content: i.content?.substring(0, 50),
        hasFiles: !!i.files && i.files.length > 0,
        filesCount: i.files?.length || 0,
        files: i.files?.map((f: any) => ({
          id: f.id,
          name: f.name,
          hasData: !!f.data,
          dataLength: f.data?.length || 0
        })) || []
      }))
    });

    return {
      ...ticket,
      files: files.map(f => ({
        id: f.id,
        name: f.name,
        size: parseInt(f.size),
        type: f.type,
        data: f.data_url,
        interactionId: f.interaction_id || null,
      })),
      comments: comments.map(c => ({
        id: c.id,
        content: c.content,
        author: c.author,
        createdAt: c.created_at,
      })),
      interactions: interactions,
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

export const addInteraction = async (
  ticketId: string,
  authorId: string,
  type: string,
  content: string,
  metadata?: any,
  files?: Array<{
    name: string;
    size: number;
    type: string;
    dataUrl: string;
  }>
) => {
  try {
    const db = getDatabase();

    console.log('💬 Adicionando interação ao ticket:', ticketId, type, {
      hasFiles: !!files && files.length > 0,
      filesCount: files?.length || 0
    });

    const insertResult = await db('interactions')
      .insert({
        ticket_id: ticketId,
        author_id: authorId,
        type,
        content,
        metadata: metadata ? JSON.stringify(metadata) : null,
      })
      .returning('*');

    const interaction = Array.isArray(insertResult) ? insertResult[0] : insertResult;

    if (!interaction || !interaction.id) {
      throw new Error('Falha ao criar interação: nenhum registro retornado');
    }

    // Salvar arquivos se fornecidos
    if (files && files.length > 0) {
      console.log('📎 Salvando arquivos da interação:', {
        count: files.length,
        interactionId: interaction.id,
        ticketId: ticketId,
        files: files.map(f => ({
          name: f.name,
          size: f.size,
          type: f.type,
          hasDataUrl: !!f.dataUrl,
          dataUrlLength: f.dataUrl?.length || 0
        }))
      });

      try {
        const insertResult = await db('ticket_files')
          .insert(
            files.map(file => ({
              ticket_id: ticketId,
              interaction_id: interaction.id,
              name: file.name,
              size: file.size.toString(),
              type: file.type,
              data_url: file.dataUrl,
            }))
          )
          .returning('*');

        console.log('✅ Arquivos da interação salvos com sucesso:', {
          savedCount: Array.isArray(insertResult) ? insertResult.length : 1,
          fileIds: Array.isArray(insertResult)
            ? insertResult.map((f: any) => f.id)
            : []
        });
      } catch (fileError: any) {
        console.error('❌ Erro ao salvar arquivos da interação:', fileError);
        throw new Error(`Erro ao salvar arquivos: ${fileError.message}`);
      }
    } else {
      console.log('⚠️ Nenhum arquivo fornecido para a interação');
    }

    const author = await db('users')
      .where({ id: authorId })
      .select('id', 'name', 'email', 'role', 'avatar')
      .first();

    // Buscar arquivos da interação
    const interactionFiles = await db('ticket_files')
      .where({ interaction_id: interaction.id })
      .select('id', 'name', 'size', 'type', 'data_url');

    console.log('📎 Arquivos buscados da interação:', {
      interactionId: interaction.id,
      filesCount: interactionFiles.length,
      files: interactionFiles.map((f: any) => ({
        id: f.id,
        name: f.name,
        size: f.size,
        type: f.type,
        hasDataUrl: !!f.data_url,
        dataUrlLength: f.data_url?.length || 0
      }))
    });

    // Garantir que todos os arquivos tenham data_url válido
    const filesWithData = interactionFiles
      .map((f: any) => {
        if (!f.data_url) {
          console.warn(`⚠️ [addInteraction] Arquivo sem data_url:`, {
            fileId: f.id,
            fileName: f.name,
            interactionId: interaction.id
          });
        }
        return {
          id: f.id,
          name: f.name,
          size: parseInt(f.size) || 0,
          type: f.type || 'application/octet-stream',
          data: f.data_url, // IMPORTANTE: sempre retornar data_url
        };
      })
      .filter((f: any) => f.data); // Filtrar apenas arquivos com dados válidos

    console.log('✅ Interação criada com sucesso:', {
      id: interaction.id,
      hasFiles: filesWithData.length > 0,
      filesCount: filesWithData.length,
      files: filesWithData.map((f: any) => ({
        id: f.id,
        name: f.name,
        hasData: !!f.data,
        dataLength: f.data?.length || 0
      }))
    });

    return {
      id: interaction.id,
      type: interaction.type,
      content: interaction.content,
      author,
      metadata: interaction.metadata ? JSON.parse(interaction.metadata) : null,
      files: filesWithData.length > 0 ? filesWithData : undefined, // Retornar undefined se não houver arquivos válidos
      createdAt: interaction.created_at,
    };
  } catch (error: any) {
    console.error('❌ Erro ao adicionar interação:', error);
    throw error;
  }
};

