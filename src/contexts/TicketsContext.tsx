import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Ticket } from '../types';
import { mockTickets } from '../data/mockData';

interface TicketsContextType {
  tickets: Ticket[];
  deleteTicket: (id: string) => void;
  updateTicket: (id: string, updates: Partial<Ticket>) => void;
  addTicket: (ticket: Ticket) => void;
}

const TicketsContext = createContext<TicketsContextType | undefined>(undefined);

export function TicketsProvider({ children }: { children: ReactNode }) {
  const [tickets, setTickets] = useState<Ticket[]>(() => {
    // Carregar tickets salvos do localStorage ou usar os mockados
    const savedTickets = localStorage.getItem('tickets');
    if (savedTickets) {
      try {
        const parsed = JSON.parse(savedTickets);
        // Converter datas de string para Date
        return parsed.map((t: any) => ({
          ...t,
          createdAt: new Date(t.createdAt),
          updatedAt: new Date(t.updatedAt),
        }));
      } catch {
        return mockTickets;
      }
    }
    return mockTickets;
  });

  useEffect(() => {
    // Salvar tickets no localStorage sempre que houver mudanças
    localStorage.setItem('tickets', JSON.stringify(tickets));
  }, [tickets]);

  const deleteTicket = (id: string) => {
    setTickets((prev) => prev.filter((ticket) => ticket.id !== id));
  };

  const updateTicket = (id: string, updates: Partial<Ticket>) => {
    setTickets((prev) =>
      prev.map((ticket) =>
        ticket.id === id
          ? { ...ticket, ...updates, updatedAt: new Date() }
          : ticket
      )
    );
  };

  const addTicket = (ticket: Ticket) => {
    setTickets((prev) => [...prev, ticket]);
  };

  return (
    <TicketsContext.Provider
      value={{
        tickets,
        deleteTicket,
        updateTicket,
        addTicket,
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

