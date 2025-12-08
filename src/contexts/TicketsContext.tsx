import { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { Ticket, User, Comment, Interaction } from '../types';
import { mockTickets } from '../data/mockData';
import { dbAdapter as database } from '../services/dbAdapter';

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

  // Carregar tickets do banco de dados
  useEffect(() => {
    const loadTickets = async () => {
      try {
        await database.init();
        const savedTickets = await database.getTickets();
        
        if (savedTickets && savedTickets.length > 0) {
          previousTicketsCountRef.current = savedTickets.length;
          setTickets(savedTickets);
        } else {
          // Se não houver tickets, usar os mockados e salvar no banco
          await database.saveTickets(mockTickets);
          previousTicketsCountRef.current = mockTickets.length;
          setTickets(mockTickets);
        }
      } catch (error) {
        console.error('Erro ao carregar tickets:', error);
        // Fallback para mockTickets em caso de erro
        setTickets(mockTickets);
      } finally {
        setIsLoading(false);
      }
    };

    loadTickets();
  }, []);


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
    setTickets((prev) => prev.filter((ticket) => ticket.id !== id));
    try {
      await database.deleteTicket(id);
    } catch (error) {
      console.error('Erro ao deletar ticket do banco de dados:', error);
    }
  };

  const updateTicket = async (id: string, updates: Partial<Ticket>) => {
    const updatedTickets = tickets.map((ticket) =>
      ticket.id === id
        ? { ...ticket, ...updates, updatedAt: new Date() }
        : ticket
    );
    setTickets(updatedTickets);
    
    // Encontrar o ticket atualizado e salvar no banco
    const updatedTicket = updatedTickets.find(t => t.id === id);
    if (updatedTicket) {
      try {
        await database.saveTicket(updatedTicket);
      } catch (error) {
        console.error('Erro ao atualizar ticket no banco de dados:', error);
      }
    }
  };

  const addTicket = async (ticket: Ticket) => {
    const newTickets = [...tickets, ticket];
    setTickets(newTickets);
    
    try {
      await database.saveTicket(ticket);
    } catch (error) {
      console.error('Erro ao salvar ticket no banco de dados:', error);
    }
  };

  const addComment = (ticketId: string, comment: Comment) => {
    setTickets((prev) =>
      prev.map((ticket) =>
        ticket.id === ticketId
          ? {
              ...ticket,
              comments: [...(ticket.comments || []), comment],
              updatedAt: new Date(),
            }
          : ticket
      )
    );
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

