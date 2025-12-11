import { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { Ticket, User, Comment, Interaction } from '../types';
import { mockTickets } from '../data/mockData';
import { dbAdapter as database } from '../services/dbAdapter';
import { api } from '../services/api';

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

  // Carregar tickets APENAS do banco de dados (API)
  useEffect(() => {
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
        const transformedTickets = apiTickets.map((t: any) => ({
          id: t.id,
          title: t.title,
          description: t.description,
          status: t.status,
          priority: t.priority,
          category: t.category,
          serviceType: t.service_type,
          totalValue: t.total_value ? parseFloat(t.total_value) : undefined,
          createdBy: t.created_by_user || { id: t.created_by, name: '', email: '', role: 'user' },
          assignedTo: t.assigned_to_user,
          client: t.client_user,
          files: t.files || [],
          comments: t.comments || [],
          createdAt: new Date(t.created_at),
          updatedAt: new Date(t.updated_at),
        }));

        console.log('✅ Tickets carregados da API:', transformedTickets.length);
        console.log('📊 Estatísticas dos tickets:', {
          total: transformedTickets.length,
          abertos: transformedTickets.filter(t => t.status === 'aberto').length,
          em_atendimento: transformedTickets.filter(t => t.status === 'em_atendimento').length,
          atribuidos: transformedTickets.filter(t => t.assignedTo).length,
          nao_atribuidos: transformedTickets.filter(t => !t.assignedTo).length,
          detalhes: transformedTickets.map(t => ({
            id: t.id,
            status: t.status,
            assignedTo: t.assignedTo?.name || 'Não atribuído',
            title: t.title
          }))
        });
        previousTicketsCountRef.current = transformedTickets.length;
        setTickets(transformedTickets);
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
        comments: updatedTicket.comments || [],
        createdAt: new Date(updatedTicket.created_at),
        updatedAt: new Date(updatedTicket.updated_at),
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
        comments: createdTicket.comments || [],
        createdAt: new Date(createdTicket.created_at),
        updatedAt: new Date(createdTicket.updated_at),
      };

      // Adicionar ticket criado à lista (dados do banco)
      setTickets((prev) => [...prev, transformedTicket]);
      previousTicketsCountRef.current = tickets.length + 1;
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

      // Atualizar ticket com comentário do banco
      setTickets((prev) =>
        prev.map((ticket) =>
          ticket.id === ticketId
            ? {
                ...ticket,
                comments: [...(ticket.comments || []), {
                  id: createdComment.id,
                  content: createdComment.content,
                  author: createdComment.author,
                  createdAt: new Date(createdComment.createdAt),
                }],
                updatedAt: new Date(),
              }
            : ticket
        )
      );
      console.log('✅ Comentário adicionado com sucesso');
    } catch (apiError: any) {
      console.error('❌ Erro ao adicionar comentário:', apiError);
      throw apiError; // Propagar erro para que o componente possa tratar
    }
  };

  const addInteraction = async (ticketId: string, interaction: Interaction) => {
    const updatedTickets = tickets.map((ticket) =>
      ticket.id === ticketId
        ? {
            ...ticket,
            interactions: [...(ticket.interactions || []), interaction],
            updatedAt: new Date(),
          }
        : ticket
    );
    setTickets(updatedTickets);

    // Encontrar o ticket atualizado e salvar no banco
    const updatedTicket = updatedTickets.find(t => t.id === ticketId);
    if (updatedTicket) {
      try {
        await database.saveTicket(updatedTicket);
      } catch (error) {
        console.error('Erro ao salvar interação no banco de dados:', error);
      }
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

