import { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { Ticket, User, Comment, Interaction } from '../types';
import { mockTickets } from '../data/mockData';
import { dbAdapter as database } from '../services/dbAdapter';
import { api } from '../services/api';

// Função helper para converter datas de forma segura
const safeDateParse = (dateValue: any): Date => {
  if (!dateValue) {
    return new Date();
  }

  // Se já é uma Date, retornar
  if (dateValue instanceof Date) {
    return dateValue;
  }

  // Se é string, tentar converter
  if (typeof dateValue === 'string') {
    const parsed = new Date(dateValue);
    // Verificar se a data é válida
    if (isNaN(parsed.getTime())) {
      console.warn('⚠️ Data inválida recebida:', dateValue, 'usando data atual');
      return new Date();
    }
    return parsed;
  }

  // Se é número (timestamp), converter
  if (typeof dateValue === 'number') {
    return new Date(dateValue);
  }

  // Fallback para data atual
  console.warn('⚠️ Tipo de data desconhecido:', typeof dateValue, dateValue);
  return new Date();
};

// Função helper para converter arrays de comentários/interações com datas
const transformComments = (comments: any[]): Comment[] => {
  if (!comments || !Array.isArray(comments)) return [];
  return comments.map(comment => ({
    ...comment,
    createdAt: safeDateParse(comment.createdAt || comment.created_at),
    author: comment.author || null,
  }));
};

const transformInteractions = (interactions: any[]): Interaction[] => {
  if (!interactions || !Array.isArray(interactions)) return [];
  return interactions.map(interaction => {
    const files = interaction.files || [];
    if (files.length > 0) {
      console.log('📎 Interação com arquivos:', {
        interactionId: interaction.id,
        filesCount: files.length,
        files: files.map((f: any) => ({ name: f.name, type: f.type, size: f.size }))
      });
    }
    return {
      ...interaction,
      createdAt: safeDateParse(interaction.createdAt || interaction.created_at),
      author: interaction.author || null,
      files: files.length > 0 ? files : undefined, // Preservar arquivos se existirem
    };
  });
};

interface TicketsContextType {
  tickets: Ticket[];
  deleteTicket: (id: string) => void;
  updateTicket: (id: string, updates: Partial<Ticket>) => void;
  addTicket: (ticket: Ticket) => void;
  addComment: (ticketId: string, comment: Comment) => void;
  addInteraction: (ticketId: string, interaction: Interaction) => void;
}

const TicketsContext = createContext<TicketsContextType | undefined>(undefined);

export function TicketsProvider({ children }: { children: ReactNode }) {
  const previousTicketsCountRef = useRef<number>(0);

  // Função para obter usuário logado do localStorage
  const getCurrentUser = (): User | null => {
    try {
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        return JSON.parse(savedUser);
      }
    } catch {
      return null;
    }
    return null;
  };

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));

  // Listener para mudanças no token
  useEffect(() => {
    const handleStorageChange = () => {
      const newToken = localStorage.getItem('token');
      if (newToken !== token) {
        setToken(newToken);
      }
    };

    // Verificar mudanças no localStorage
    window.addEventListener('storage', handleStorageChange);

    // Verificar periodicamente (para mudanças na mesma aba)
    const interval = setInterval(() => {
      const currentToken = localStorage.getItem('token');
      if (currentToken !== token) {
        setToken(currentToken);
      }
    }, 500);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [token]);

  // Função para carregar tickets (reutilizável)
  const loadTickets = async () => {
    // Verificar se há token antes de carregar
    const currentToken = localStorage.getItem('token');
    if (!currentToken) {
      console.log('⏳ Aguardando autenticação para carregar tickets...');
      setIsLoading(false);
      return;
    }

    try {
      console.log('📡 Carregando tickets da API...');
      // SEMPRE usar API - sem fallback para dados locais
      const apiTickets = await api.getTickets();

      // Transform API response to Ticket format
      const transformedTickets = apiTickets.map((t: any) => {
        // Log detalhado de cada ticket recebido da API
        console.log('🔄 Transformando ticket da API:', {
          id: t.id,
          status_original: t.status,
          status_tipo: typeof t.status,
          assigned_to_user: t.assigned_to_user,
          assigned_to_id: t.assigned_to,
          title: t.title,
          interactions_count: t.interactions?.length || 0
        });

        const transformed = {
          id: t.id,
          title: t.title,
          description: t.description,
          status: t.status, // Preservar status exatamente como vem da API
          priority: t.priority,
          category: t.category,
          serviceType: t.service_type,
          totalValue: t.total_value ? parseFloat(t.total_value) : undefined,
          createdBy: t.created_by_user || { id: t.created_by, name: '', email: '', role: 'user' },
          assignedTo: t.assigned_to_user, // Pode ser null, undefined ou objeto
          client: t.client_user,
          files: t.files || [],
          comments: transformComments(t.comments || []),
          interactions: transformInteractions(t.interactions || []),
          createdAt: safeDateParse(t.created_at),
          updatedAt: safeDateParse(t.updated_at),
        };

        // Log do ticket transformado
        console.log('✅ Ticket transformado:', {
          id: transformed.id,
          status: transformed.status,
          status_normalizado: String(transformed.status || '').toLowerCase().trim(),
          é_aberto: String(transformed.status || '').toLowerCase().trim() === 'aberto',
          assignedTo: transformed.assignedTo ? transformed.assignedTo.name : 'Não atribuído',
          assignedToId: transformed.assignedTo?.id || null,
          title: transformed.title
        });

        return transformed;
      });

      console.log('✅ Tickets carregados da API:', transformedTickets.length);

      // Filtrar tickets "aberto" para debug
      const ticketsAberto = transformedTickets.filter(t => {
        const statusNormalized = String(t.status || '').toLowerCase().trim();
        return statusNormalized === 'aberto';
      });

      console.log('📊 Estatísticas dos tickets:', {
        total: transformedTickets.length,
        abertos: ticketsAberto.length,
        em_atendimento: transformedTickets.filter(t => t.status === 'em_atendimento').length,
        atribuidos: transformedTickets.filter(t => t.assignedTo).length,
        nao_atribuidos: transformedTickets.filter(t => !t.assignedTo).length,
        detalhes: transformedTickets.map(t => ({
          id: t.id,
          status: t.status,
          status_normalizado: String(t.status || '').toLowerCase().trim(),
          é_aberto: String(t.status || '').toLowerCase().trim() === 'aberto',
          assignedTo: t.assignedTo?.name || 'Não atribuído',
          assignedToId: t.assignedTo?.id || null,
          title: t.title
        })),
        tickets_aberto_detalhados: ticketsAberto.map(t => ({
          id: t.id,
          status: t.status,
          assignedTo: t.assignedTo?.name || 'Não atribuído',
          assignedToId: t.assignedTo?.id || null,
          title: t.title
        }))
      });

      // Verificar se há tickets locais que não estão na resposta da API
      // (pode acontecer se um ticket foi criado recentemente e a API ainda não o retornou)
      setTickets((prevTickets) => {
        const apiTicketIds = new Set(transformedTickets.map(t => t.id));
        const missingTickets = prevTickets.filter(t => !apiTicketIds.has(t.id));

        if (missingTickets.length > 0) {
          console.log('⚠️ Tickets locais não encontrados na API (podem ser recém-criados):', missingTickets.map(t => ({
            id: t.id,
            status: t.status,
            title: t.title,
            criado_em: t.createdAt
          })));

          // Se o ticket foi criado há menos de 5 segundos, mantê-lo na lista
          const now = Date.now();
          const recentTickets = missingTickets.filter(t => {
            const age = now - t.createdAt.getTime();
            const isRecent = age < 5000; // 5 segundos
            console.log(`📋 Ticket ${t.id}: idade ${age}ms, ${isRecent ? 'MANTENDO' : 'REMOVENDO'}`);
            return isRecent;
          });

          if (recentTickets.length > 0) {
            console.log('✅ Mantendo tickets recém-criados na lista:', recentTickets.map(t => t.id));
            const merged = [...transformedTickets, ...recentTickets];
            previousTicketsCountRef.current = merged.length;
            return merged;
          }
        }

        previousTicketsCountRef.current = transformedTickets.length;
        return transformedTickets;
      });
      setIsLoading(false);
    } catch (apiError: any) {
      console.error('❌ Erro ao carregar tickets da API:', apiError);
      // Se for rate limit (429), não tentar novamente e mostrar mensagem
      if (apiError.status === 429) {
        console.warn('⚠️ Rate limit atingido. Aguardando antes de tentar novamente...');
        // Salvar timestamp do erro para pausar polling
        localStorage.setItem('lastRateLimitError', Date.now().toString());
        setIsLoading(false);
        // Não atualizar tickets, manter os que já estão carregados
        return;
      }
      // Se a API falhar, mostrar lista vazia ao invés de dados locais
      setTickets([]);
      setIsLoading(false);
      // Não mostrar alerta a cada erro para não incomodar o usuário
      if (apiError.status !== 401) {
        console.warn('Erro ao conectar com o servidor. Tentando novamente...');
      }
    }
  };

  // Carregar tickets APENAS do banco de dados (API)
  useEffect(() => {

    loadTickets();

    // Adicionar polling automático para recarregar tickets a cada 30 segundos
    // Intervalo maior para evitar rate limiting (429)
    const interval = setInterval(() => {
      const currentToken = localStorage.getItem('token');
      // Não fazer polling se não houver token ou se estiver carregando
      if (currentToken && !isLoading) {
        // Verificar se há erro de rate limit recente (últimos 2 minutos)
        const lastError = localStorage.getItem('lastRateLimitError');
        if (lastError) {
          const errorTime = parseInt(lastError);
          const timeSinceError = Date.now() - errorTime;
          // Se foi há menos de 2 minutos, não fazer polling
          if (timeSinceError < 120000) {
            console.log('⏸️ Polling pausado devido a rate limit recente');
            return;
          } else {
            // Limpar erro antigo
            localStorage.removeItem('lastRateLimitError');
          }
        }
        loadTickets();
      }
    }, 30000); // 30 segundos (reduzido de 10 para evitar rate limiting)

    return () => clearInterval(interval);
  }, [token, isLoading]);


  // Detectar quando um novo chamado é criado e notificar técnicos
  useEffect(() => {
    const currentTicketsCount = tickets.length;
    const previousCount = previousTicketsCountRef.current;
    const user = getCurrentUser();

    // Se um novo ticket foi adicionado e o usuário é técnico
    if (currentTicketsCount > previousCount && user?.role === 'technician') {
      // Tocar som de notificação
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        // Som de notificação (dois beeps)
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.2);

        // Segundo beep
        setTimeout(() => {
          const oscillator2 = audioContext.createOscillator();
          const gainNode2 = audioContext.createGain();

          oscillator2.connect(gainNode2);
          gainNode2.connect(audioContext.destination);

          oscillator2.frequency.value = 1000;
          oscillator2.type = 'sine';

          gainNode2.gain.setValueAtTime(0.3, audioContext.currentTime);
          gainNode2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

          oscillator2.start(audioContext.currentTime);
          oscillator2.stop(audioContext.currentTime + 0.2);
        }, 250);
      } catch (error) {
        console.warn('Não foi possível tocar o som de notificação:', error);
      }

      // Mostrar notificação do navegador (se permitido)
      if ('Notification' in window && Notification.permission === 'granted') {
        const newTicket = tickets[tickets.length - 1];
        new Notification('Novo Chamado Criado', {
          body: `${newTicket.title} - Prioridade: ${newTicket.priority}`,
          icon: '/vite.svg',
          tag: `ticket-${newTicket.id}`,
        });
      } else if ('Notification' in window && Notification.permission === 'default') {
        // Solicitar permissão
        Notification.requestPermission().then((permission) => {
          if (permission === 'granted' && tickets.length > 0) {
            const newTicket = tickets[tickets.length - 1];
            new Notification('Novo Chamado Criado', {
              body: `${newTicket.title} - Prioridade: ${newTicket.priority}`,
              icon: '/vite.svg',
              tag: `ticket-${newTicket.id}`,
            });
          }
        });
      }
    }

    previousTicketsCountRef.current = currentTicketsCount;
  }, [tickets]);

  useEffect(() => {
    // Salvar tickets no banco de dados sempre que houver mudanças
    if (!isLoading && tickets.length > 0) {
      database.saveTickets(tickets).catch((error) => {
        console.error('Erro ao salvar tickets no banco de dados:', error);
      });
    }
  }, [tickets, isLoading]);

  const deleteTicket = async (id: string) => {
    try {
      // SEMPRE usar API - sem fallback para dados locais
      console.log('🗑️ Deletando ticket via API:', id);
      await api.deleteTicket(id);

      // Remover ticket da lista local
      setTickets((prev) => prev.filter((ticket) => ticket.id !== id));
      previousTicketsCountRef.current = tickets.length - 1;
      console.log('✅ Ticket deletado com sucesso');
    } catch (apiError: any) {
      console.error('❌ Erro ao deletar ticket:', apiError);
      throw apiError; // Propagar erro para que o componente possa tratar
    }
  };

  const updateTicket = async (id: string, updates: Partial<Ticket>) => {
    try {
      // SEMPRE usar API - sem fallback para dados locais
      console.log('📝 Atualizando ticket via API:', id, updates);

      // Preparar dados para envio - só incluir campos que foram explicitamente atualizados
      const updateData: any = {};
      if (updates.title !== undefined) updateData.title = updates.title;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.status !== undefined) updateData.status = updates.status as any;
      if (updates.priority !== undefined) updateData.priority = updates.priority as any;
      if (updates.category !== undefined) updateData.category = updates.category as any;
      if (updates.serviceType !== undefined) updateData.serviceType = updates.serviceType;
      if (updates.totalValue !== undefined) updateData.totalValue = updates.totalValue;
      // Só enviar assignedTo se foi explicitamente fornecido (não remover atribuição ao mudar status)
      if ('assignedTo' in updates) {
        updateData.assignedTo = updates.assignedTo?.id || null;
      }
      if (updates.client?.id !== undefined) updateData.clientId = updates.client.id;
      if (updates.queue !== undefined) {
        updateData.queueId = (updates.queue && typeof updates.queue === 'object' && 'id' in updates.queue)
          ? (updates.queue as any).id
          : (typeof updates.queue === 'string' ? updates.queue : null);
      }

      console.log('📤 Enviando dados para API:', updateData);
      const updatedTicket = await api.updateTicket(id, updateData);
      console.log('📥 Resposta da API:', updatedTicket);

      // Transform API response to Ticket format
      const transformedTicket = {
        id: updatedTicket.id,
        title: updatedTicket.title,
        description: updatedTicket.description,
        status: updatedTicket.status,
        priority: updatedTicket.priority,
        category: updatedTicket.category,
        serviceType: updatedTicket.service_type,
        totalValue: updatedTicket.total_value ? parseFloat(updatedTicket.total_value) : undefined,
        createdBy: updatedTicket.created_by_user || { id: updatedTicket.created_by, name: '', email: '', role: 'user' },
        assignedTo: updatedTicket.assigned_to_user,
        client: updatedTicket.client_user,
        files: updatedTicket.files || [],
        comments: transformComments(updatedTicket.comments || []),
        interactions: transformInteractions(updatedTicket.interactions || []),
        createdAt: safeDateParse(updatedTicket.created_at),
        updatedAt: safeDateParse(updatedTicket.updated_at),
      };

      console.log('🔄 Ticket transformado:', {
        id: transformedTicket.id,
        status: transformedTicket.status,
        assignedTo: transformedTicket.assignedTo?.name || 'Não atribuído'
      });

      // Atualizar lista local com dados do banco
      // Se assignedTo não foi explicitamente atualizado, preservar o valor atual se existir
      setTickets((prev) =>
        prev.map((ticket) => {
          if (ticket.id === id) {
            // Se assignedTo não foi enviado na atualização (ex: apenas status foi atualizado),
            // preservar o valor atual se existir (evita perder atribuição ao mudar apenas status)
            if (!('assignedTo' in updates)) {
              // Se o ticket atual tinha assignedTo, preservar
              if (ticket.assignedTo) {
                console.log('🔒 Preservando atribuição ao atualizar status:', ticket.assignedTo.name);
                transformedTicket.assignedTo = ticket.assignedTo;
              }
              // Se não tinha assignedTo antes, usar o valor da API (pode ser null)
            }
            // Se assignedTo foi explicitamente enviado na atualização, usar o valor da API
            return transformedTicket;
          }
          return ticket;
        })
      );

      console.log('✅ Ticket atualizado com sucesso');
    } catch (apiError: any) {
      console.error('❌ Erro ao atualizar ticket:', apiError);
      throw apiError; // Propagar erro para que o componente possa tratar
    }
  };

  const addTicket = async (ticket: Ticket) => {
    try {
      // SEMPRE usar API - sem fallback para dados locais
      console.log('📝 Criando ticket via API:', ticket.title);
      const createdTicket = await api.createTicket({
        title: ticket.title,
        description: ticket.description,
        priority: ticket.priority as any,
        category: ticket.category as any,
        serviceType: ticket.serviceType,
        totalValue: ticket.totalValue,
        clientId: ticket.client?.id || ticket.createdBy.id,
        files: ticket.files?.map(f => ({
          name: f.name,
          size: f.size,
          type: f.type,
          dataUrl: f.data || '',
        })),
      });

      // Transform API response to Ticket format
      console.log('🔄 Transformando resposta da API:', {
        id: createdTicket.id,
        status: createdTicket.status,
        status_verificado: createdTicket.status === 'aberto' ? '✅ CORRETO' : `❌ ERRADO - Status: "${createdTicket.status}"`,
        assigned_to_user: createdTicket.assigned_to_user,
        created_by_user: createdTicket.created_by_user
      });

      // Verificar se o status está correto
      if (createdTicket.status !== 'aberto') {
        console.error('⚠️ ATENÇÃO: Ticket criado mas status não é "aberto"!', {
          id: createdTicket.id,
          status_esperado: 'aberto',
          status_atual: createdTicket.status
        });
      }

      const transformedTicket = {
        id: createdTicket.id,
        title: createdTicket.title,
        description: createdTicket.description,
        status: createdTicket.status,
        priority: createdTicket.priority,
        category: createdTicket.category,
        serviceType: createdTicket.service_type,
        totalValue: createdTicket.total_value ? parseFloat(createdTicket.total_value) : undefined,
        createdBy: createdTicket.created_by_user || { id: createdTicket.created_by, name: '', email: '', role: 'user' },
        assignedTo: createdTicket.assigned_to_user,
        client: createdTicket.client_user,
        files: createdTicket.files || [],
        comments: transformComments(createdTicket.comments || []),
        interactions: transformInteractions(createdTicket.interactions || []),
        createdAt: safeDateParse(createdTicket.created_at),
        updatedAt: safeDateParse(createdTicket.updated_at),
      };

      console.log('🔄 Ticket transformado após criação:', {
        id: transformedTicket.id,
        status: transformedTicket.status,
        status_normalizado: String(transformedTicket.status || '').toLowerCase().trim(),
        é_aberto: String(transformedTicket.status || '').toLowerCase().trim() === 'aberto',
        assignedTo: transformedTicket.assignedTo ? transformedTicket.assignedTo.name : 'Não atribuído',
        assignedToId: transformedTicket.assignedTo?.id || null,
        createdBy: transformedTicket.createdBy?.name || 'Desconhecido'
      });

      // Adicionar ticket criado à lista (dados do banco)
      setTickets((prev) => {
        const updated = [...prev, transformedTicket];
        previousTicketsCountRef.current = updated.length;
        console.log('✅ Ticket adicionado à lista local:', {
          id: transformedTicket.id,
          status: transformedTicket.status,
          assignedTo: transformedTicket.assignedTo?.name || 'Não atribuído',
          totalTickets: updated.length
        });
        return updated;
      });

      // Forçar reload imediato para garantir que todos vejam o novo ticket
      // Aguardar um pouco para garantir que o backend salvou completamente
      console.log('🔄 Forçando reload de tickets após criação...');
      console.log('📋 Estado ANTES do reload:', {
        ticket_criado_id: transformedTicket.id,
        ticket_criado_status: transformedTicket.status,
        ticket_criado_assignedTo: transformedTicket.assignedTo?.name || 'Não atribuído',
        total_tickets_antes: tickets.length + 1
      });
      setTimeout(() => {
        console.log('🔄 Executando loadTickets após criação do ticket...');
        loadTickets().then(() => {
          console.log('✅ loadTickets concluído após criação');
        }).catch((error) => {
          console.error('❌ Erro no loadTickets após criação:', error);
        });
      }, 1500); // Aguardar 1.5 segundos para garantir que o backend salvou

      console.log('✅ Ticket criado com sucesso');
    } catch (apiError: any) {
      console.error('❌ Erro ao criar ticket:', apiError);
      throw apiError; // Propagar erro para que o componente possa tratar
    }
  };

  const addComment = async (ticketId: string, comment: Comment) => {
    try {
      // SEMPRE usar API - sem fallback para dados locais
      console.log('💬 Adicionando comentário via API:', ticketId);
      const createdComment = await api.addComment(ticketId, comment.content);

      console.log('✅ Comentário criado no backend:', createdComment);

      // Recarregar o ticket completo do backend para garantir que todos vejam o comentário
      // Isso é importante para que outros usuários vejam os comentários imediatamente
      console.log('🔄 Recarregando ticket do backend para atualizar comentários...');
      const updatedTicket = await api.getTicketById(ticketId);

      console.log('📦 Ticket recarregado:', {
        id: updatedTicket.id,
        interactions_count: updatedTicket.interactions?.length || 0,
        comments_count: updatedTicket.comments?.length || 0
      });

      // Transformar resposta da API
      const transformedTicket = {
        id: updatedTicket.id,
        title: updatedTicket.title,
        description: updatedTicket.description,
        status: updatedTicket.status,
        priority: updatedTicket.priority,
        category: updatedTicket.category,
        serviceType: updatedTicket.service_type,
        totalValue: updatedTicket.total_value ? parseFloat(updatedTicket.total_value) : undefined,
        createdBy: updatedTicket.created_by_user || { id: updatedTicket.created_by, name: '', email: '', role: 'user' },
        assignedTo: updatedTicket.assigned_to_user,
        client: updatedTicket.client_user,
        files: updatedTicket.files || [],
        comments: transformComments(updatedTicket.comments || []),
        interactions: transformInteractions(updatedTicket.interactions || []),
        createdAt: safeDateParse(updatedTicket.created_at),
        updatedAt: safeDateParse(updatedTicket.updated_at),
      };

      // Atualizar ticket com dados completos do banco
      setTickets((prev) =>
        prev.map((ticket) =>
          ticket.id === ticketId
            ? transformedTicket
            : ticket
        )
      );
      console.log('✅ Comentário adicionado e ticket atualizado com sucesso');
    } catch (apiError: any) {
      console.error('❌ Erro ao adicionar comentário:', apiError);
      throw apiError; // Propagar erro para que o componente possa tratar
    }
  };

  const addInteraction = async (ticketId: string, interaction: Interaction) => {
    try {
      // SEMPRE usar API - sem fallback para dados locais
      console.log('💬 Adicionando interação via API:', ticketId, interaction.type, {
        hasFiles: !!interaction.files && interaction.files.length > 0,
        filesCount: interaction.files?.length || 0
      });

      // Preparar arquivos para envio
      const filesToSend = interaction.files?.map(file => ({
        name: file.name,
        size: file.size,
        type: file.type || 'application/octet-stream',
        data: file.data, // Base64 data URL
      }));

      const createdInteraction = await api.addInteraction(
        ticketId,
        interaction.type,
        interaction.content,
        interaction.metadata,
        filesToSend
      );

      console.log('✅ Interação criada no backend:', createdInteraction);

      // Recarregar o ticket completo do backend para garantir que todos vejam a interação
      // Isso é importante para que outros usuários vejam as interações imediatamente
      console.log('🔄 Recarregando ticket do backend para atualizar interações...');
      const updatedTicket = await api.getTicketById(ticketId);

      console.log('📦 Ticket recarregado:', {
        id: updatedTicket.id,
        interactions_count: updatedTicket.interactions?.length || 0,
        comments_count: updatedTicket.comments?.length || 0
      });

      // Transformar resposta da API
      const transformedTicket = {
        id: updatedTicket.id,
        title: updatedTicket.title,
        description: updatedTicket.description,
        status: updatedTicket.status,
        priority: updatedTicket.priority,
        category: updatedTicket.category,
        serviceType: updatedTicket.service_type,
        totalValue: updatedTicket.total_value ? parseFloat(updatedTicket.total_value) : undefined,
        createdBy: updatedTicket.created_by_user || { id: updatedTicket.created_by, name: '', email: '', role: 'user' },
        assignedTo: updatedTicket.assigned_to_user,
        client: updatedTicket.client_user,
        files: updatedTicket.files || [],
        comments: transformComments(updatedTicket.comments || []),
        interactions: transformInteractions(updatedTicket.interactions || []),
        createdAt: safeDateParse(updatedTicket.created_at),
        updatedAt: safeDateParse(updatedTicket.updated_at),
      };

      // Atualizar ticket com dados completos do banco
      setTickets((prev) =>
        prev.map((ticket) =>
          ticket.id === ticketId
            ? transformedTicket
            : ticket
        )
      );
      console.log('✅ Interação adicionada e ticket atualizado com sucesso');
    } catch (apiError: any) {
      console.error('❌ Erro ao adicionar interação:', apiError);
      throw apiError; // Propagar erro para que o componente possa tratar
    }
  };

  return (
    <TicketsContext.Provider
      value={{
        tickets,
        deleteTicket,
        updateTicket,
        addTicket,
        addComment,
        addInteraction,
      }}
    >
      {children}
    </TicketsContext.Provider>
  );
}

export function useTickets() {
  const context = useContext(TicketsContext);
  if (context === undefined) {
    throw new Error('useTickets must be used within a TicketsProvider');
  }
  return context;
}

