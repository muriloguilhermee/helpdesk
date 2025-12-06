import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { FinancialTicket, User, TicketFile } from '../types';

interface FinancialContextType {
  financialTickets: FinancialTicket[];
  addFinancialTicket: (ticket: FinancialTicket) => void;
  updateFinancialTicket: (id: string, updates: Partial<FinancialTicket>) => void;
  deleteFinancialTicket: (id: string) => void;
  getTicketsByClient: (clientId: string) => FinancialTicket[];
}

const FinancialContext = createContext<FinancialContextType | undefined>(undefined);

export function FinancialProvider({ children }: { children: ReactNode }) {
  const [financialTickets, setFinancialTickets] = useState<FinancialTicket[]>(() => {
    // Carregar tickets financeiros salvos do localStorage
    const savedTickets = localStorage.getItem('financialTickets');
    if (savedTickets) {
      try {
        const parsed = JSON.parse(savedTickets);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Converter datas de string para Date
          return parsed.map((t: any) => ({
            ...t,
            dueDate: new Date(t.dueDate),
            paymentDate: t.paymentDate ? new Date(t.paymentDate) : undefined,
            createdAt: new Date(t.createdAt),
            updatedAt: new Date(t.updatedAt),
          }));
        }
      } catch {
        // Se houver erro, continuar para lista vazia
      }
    }
    return [];
  });

  useEffect(() => {
    // Salvar tickets financeiros no localStorage sempre que houver mudanças
    try {
      const ticketsToSave = financialTickets.map(t => ({
        ...t,
        dueDate: t.dueDate instanceof Date ? t.dueDate.toISOString() : t.dueDate,
        paymentDate: t.paymentDate instanceof Date ? t.paymentDate.toISOString() : t.paymentDate,
        createdAt: t.createdAt instanceof Date ? t.createdAt.toISOString() : t.createdAt,
        updatedAt: t.updatedAt instanceof Date ? t.updatedAt.toISOString() : t.updatedAt,
        client: {
          ...t.client,
        },
        createdBy: {
          ...t.createdBy,
        },
      }));
      localStorage.setItem('financialTickets', JSON.stringify(ticketsToSave));
    } catch (error) {
      console.error('Erro ao salvar tickets financeiros no localStorage:', error);
    }
  }, [financialTickets]);

  const addFinancialTicket = (ticket: FinancialTicket) => {
    setFinancialTickets((prev) => {
      const newTickets = [...prev, ticket];
      // Salvar imediatamente
      try {
        const ticketsToSave = newTickets.map(t => ({
          ...t,
          dueDate: t.dueDate instanceof Date ? t.dueDate.toISOString() : t.dueDate,
          paymentDate: t.paymentDate instanceof Date ? t.paymentDate.toISOString() : t.paymentDate,
          createdAt: t.createdAt instanceof Date ? t.createdAt.toISOString() : t.createdAt,
          updatedAt: t.updatedAt instanceof Date ? t.updatedAt.toISOString() : t.updatedAt,
          client: {
            ...t.client,
          },
          createdBy: {
            ...t.createdBy,
          },
        }));
        localStorage.setItem('financialTickets', JSON.stringify(ticketsToSave));
      } catch (error) {
        console.error('Erro ao salvar ticket financeiro no localStorage:', error);
      }
      return newTickets;
    });
  };

  const updateFinancialTicket = (id: string, updates: Partial<FinancialTicket>) => {
    setFinancialTickets((prev) =>
      prev.map((ticket) =>
        ticket.id === id
          ? { ...ticket, ...updates, updatedAt: new Date() }
          : ticket
      )
    );
  };

  const deleteFinancialTicket = (id: string) => {
    setFinancialTickets((prev) => prev.filter((ticket) => ticket.id !== id));
  };

  const getTicketsByClient = (clientId: string) => {
    return financialTickets.filter(ticket => ticket.client.id === clientId);
  };

  return (
    <FinancialContext.Provider
      value={{
        financialTickets,
        addFinancialTicket,
        updateFinancialTicket,
        deleteFinancialTicket,
        getTicketsByClient,
      }}
    >
      {children}
    </FinancialContext.Provider>
  );
}

export function useFinancial() {
  const context = useContext(FinancialContext);
  if (context === undefined) {
    throw new Error('useFinancial must be used within a FinancialProvider');
  }
  return context;
}

