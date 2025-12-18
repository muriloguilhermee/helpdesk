import { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { Ticket, User, Comment, Interaction } from '../types';
import { mockTickets } from '../data/mockData';
import { database } from '../services/database';
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

  // Quando o usuário atualiza nome/avatar/email, propagar para todos os tickets/interações/comentários em memória
  useEffect(() => {
    const handler = (e: Event) => {
      const updatedUser = (e as CustomEvent<User>).detail;
      if (!updatedUser?.id) return;

      setTickets((prev) =>
        prev.map((t) => {
          const replaceUser = (u: any) => (u && u.id === updatedUser.id ? { ...u, ...updatedUser } : u);

          return {
            ...t,
            createdBy: replaceUser(t.createdBy),
            assignedTo: replaceUser(t.assignedTo),
            client: replaceUser(t.client),
            comments: (t.comments || []).map((c) => ({
              ...c,
              author: replaceUser(c.author),
            })),
            interactions: (t.interactions || []).map((i: any) => ({
              ...i,
              author: replaceUser(i.author),
              metadata: i?.metadata
                ? {
                    ...i.metadata,
                    assignedTo: replaceUser(i.metadata.assignedTo),
                    previousAssignee: replaceUser(i.metadata.previousAssignee),
                  }
                : i.metadata,
            })),
          };
        })
      );
    };

    window.addEventListener('userUpdated', handler as EventListener);
    return () => window.removeEventListener('userUpdated', handler as EventListener);
  }, []);

  // Carregar tickets APENAS do banco de dados (API)
  useEffect(() => {
    const loadTickets = async () => {
      try {
        const user = getCurrentUser();
        if (!user) {
          setIsLoading(false);
          return;
        }

        // SEMPRE usar API - sem fallback para dados locais
        const apiTickets = await api.getTickets();

        // Verificar se apiTickets é um array
        if (!Array.isArray(apiTickets)) {
          setTickets([]);
          setIsLoading(false);
          return;
        }

        // Transform API response to Ticket format
        const transformedTickets = apiTickets.map((t: any) => {
          return {
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
            queue: t.queue?.name || t.queue_name || null,
            queueId: t.queue?.id || t.queue_id || null,
            files: (t.files || []).map((f: any) => ({
              id: f.id,
              name: f.name,
              size: f.size,
              type: f.type,
              data: f.data,
            })),
            comments: (t.comments || []).map((c: any) => ({
              id: c.id,
              content: c.content,
              author: c.author,
              createdAt: new Date(c.createdAt || c.created_at),
              files: (c.files || []).map((f: any) => ({
                id: f.id,
                name: f.name,
                size: f.size,
                type: f.type,
                data: f.data || f.data_url, // Aceitar tanto 'data' quanto 'data_url'
              })),
            })),
            createdAt: new Date(t.created_at),
            updatedAt: new Date(t.updated_at),
          };
        });

        previousTicketsCountRef.current = transformedTickets.length;
        setTickets(transformedTickets);
        setIsLoading(false);
      } catch (apiError: any) {
        // Se for 401 (não autenticado), apenas limpa lista sem exibir alerta
        if (apiError?.status === 401) {
          setTickets([]);
          setIsLoading(false);
          return;
        }

        // Outros erros: mostrar alerta de conexão
        // Se for rate limit, apenas mantém lista atual para não derrubar a UI
        if (apiError?.status === 429) {
          setIsLoading(false);
          return;
        }

        setTickets([]);
        setIsLoading(false);
      }
    };

    loadTickets();

    // Atualizar tickets automaticamente a cada 30 segundos (evita 429)
    const intervalId = setInterval(() => {
      const user = getCurrentUser();
      if (user) {
        loadTickets();
      }
    }, 30000); // 30 segundos

    return () => {
      clearInterval(intervalId);
    };
  }, []);


  // Detectar quando um novo chamado é criado e notificar técnicos
  useEffect(() => {
    const currentTicketsCount = tickets.length;
    const previousCount = previousTicketsCountRef.current;
    const user = getCurrentUser();

    // Se um novo ticket foi adicionado e o usuário é técnico
    if (currentTicketsCount > previousCount && (user?.role === 'technician' || user?.role === 'technician_n2')) {
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
      database.saveTickets(tickets).catch((error: any) => {
      });
    }
  }, [tickets, isLoading]);

  const deleteTicket = async (id: string) => {
    try {
      // SEMPRE usar API - sem fallback para dados locais
      await api.deleteTicket(id);

      // Remover ticket da lista local
      setTickets((prev) => prev.filter((ticket) => ticket.id !== id));
      previousTicketsCountRef.current = tickets.length - 1;
    } catch (apiError: any) {
      throw apiError; // Propagar erro para que o componente possa tratar
    }
  };

  const updateTicket = async (id: string, updates: Partial<Ticket> & { queueId?: string | null }) => {
    try {
      // SEMPRE usar API - sem fallback para dados locais
      // Construir objeto de atualização apenas com campos definidos
      const updateData: any = {};
      if (updates.title !== undefined) updateData.title = updates.title;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.status !== undefined) updateData.status = updates.status as any;
      if (updates.priority !== undefined) updateData.priority = updates.priority as any;
      if (updates.category !== undefined) updateData.category = updates.category as any;
      if (updates.serviceType !== undefined) updateData.serviceType = updates.serviceType;
      if (updates.totalValue !== undefined) updateData.totalValue = updates.totalValue;
      // Só enviar assignedTo se estiver explicitamente definido (não enviar null se não foi passado)
      if (updates.assignedTo !== undefined) {
        updateData.assignedTo = updates.assignedTo?.id || null;
      }
      if (updates.client !== undefined) updateData.clientId = updates.client?.id;
      if (updates.queueId !== undefined) {
        updateData.queueId = updates.queueId;
      } else if (updates.queue !== undefined) {
        updateData.queueId = (updates.queue && typeof updates.queue === 'object' && 'id' in updates.queue)
          ? (updates.queue as any).id
          : (typeof updates.queue === 'string' ? updates.queue : null);
      }

      const updatedTicket = await api.updateTicket(id, updateData);

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
        queue: updatedTicket.queue?.name || updatedTicket.queue_name || null,
        queueId: updatedTicket.queue?.id || updatedTicket.queue_id || null,
        files: updatedTicket.files || [],
        comments: updatedTicket.comments || [],
        createdAt: new Date(updatedTicket.created_at),
        updatedAt: new Date(updatedTicket.updated_at),
      };

      // Atualizar lista local com dados do banco
      setTickets((prev) =>
        prev.map((ticket) =>
          ticket.id === id ? transformedTicket : ticket
        )
      );

    } catch (apiError: any) {
      throw apiError; // Propagar erro para que o componente possa tratar
    }
  };

  const addTicket = async (ticket: Ticket) => {
    try {
      // SEMPRE usar API - sem fallback para dados locais
      const createdTicket = await api.createTicket({
        title: ticket.title,
        description: ticket.description,
        priority: ticket.priority as any,
        category: ticket.category as any,
        serviceType: ticket.serviceType,
        assignedTo: ticket.assignedTo?.id,
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
    } catch (apiError: any) {
      throw apiError; // Propagar erro para que o componente possa tratar
    }
  };

  const addComment = async (ticketId: string, comment: Comment) => {
    try {
      // SEMPRE usar API - sem fallback para dados locais
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
                  files: (createdComment.files || []).map((f: any) => ({
                    id: f.id,
                    name: f.name,
                    size: f.size,
                    type: f.type,
                    data: f.data,
                  })),
                }],
                updatedAt: new Date(),
              }
            : ticket
        )
      );
    } catch (apiError: any) {
      throw apiError; // Propagar erro para que o componente possa tratar
    }
  };

  const addInteraction = async (ticketId: string, interaction: Interaction) => {
    try {

      // Se for uma interação de usuário com texto, salvar como comentário na API
      let createdComment: any | null = null;
      if (interaction.type === 'user' && interaction.content?.trim()) {
        try {
          const filesToSend =
            interaction.files && interaction.files.length > 0
              ? interaction.files
                  .filter((f) => !!(f as any).data)
                  .map((f: any) => ({
                    name: f.name,
                    size: f.size,
                    type: f.type,
                    data: f.data,
                  }))
              : undefined;

          createdComment = await api.addComment(ticketId, interaction.content, filesToSend);
        } catch (error) {
          // Erro silencioso
        }
      }

      // Atualizar estado local com a nova interação e, se existir, o comentário vindo do backend
      setTickets((prev) =>
        prev.map((ticket) => {
          if (ticket.id !== ticketId) return ticket;

          const newComments =
            createdComment && createdComment.id
              ? [
                  ...(ticket.comments || []),
                  {
                    id: createdComment.id,
                    content: createdComment.content,
                    author: createdComment.author,
                    createdAt: new Date(createdComment.createdAt),
                    files: (createdComment.files || []).map((f: any) => ({
                      id: f.id,
                      name: f.name,
                      size: f.size,
                      type: f.type,
                      data: f.data || f.data_url,
                    })),
                  },
                ]
              : ticket.comments || [];

          return {
            ...ticket,
            comments: newComments,
            interactions: [...(ticket.interactions || []), interaction],
            updatedAt: new Date(),
          };
        })
      );
    } catch (error) {
      throw error;
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

