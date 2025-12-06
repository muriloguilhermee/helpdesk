import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { FinancialTicket, User, TicketFile } from '../types';
import { database } from '../services/database';

interface FinancialContextType {
  financialTickets: FinancialTicket[];
  addFinancialTicket: (ticket: FinancialTicket) => void;
  updateFinancialTicket: (id: string, updates: Partial<FinancialTicket>) => void;
  deleteFinancialTicket: (id: string) => void;
  getTicketsByClient: (clientId: string) => FinancialTicket[];
}

const FinancialContext = createContext<FinancialContextType | undefined>(undefined);

export function FinancialProvider({ children }: { children: ReactNode }) {
  const [financialTickets, setFinancialTickets] = useState<FinancialTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Carregar tickets financeiros do banco de dados
  useEffect(() => {
    const loadFinancialTickets = async () => {
      try {
        await database.init();
        const savedTickets = await database.getFinancialTickets();
        setFinancialTickets(savedTickets || []);
      } catch (error) {
        console.error('Erro ao carregar tickets financeiros:', error);
        setFinancialTickets([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadFinancialTickets();
  }, []);

  useEffect(() => {
    // Salvar tickets financeiros no banco de dados sempre que houver mudanças
    if (!isLoading && financialTickets.length >= 0) {
      database.saveFinancialTickets(financialTickets).catch((error) => {
        console.error('Erro ao salvar tickets financeiros no banco de dados:', error);
      });
    }
  }, [financialTickets, isLoading]);

  const addFinancialTicket = async (ticket: FinancialTicket) => {
    const newTickets = [...financialTickets, ticket];
    setFinancialTickets(newTickets);
    
    try {
      await database.saveFinancialTicket(ticket);
    } catch (error) {
      console.error('Erro ao salvar ticket financeiro no banco de dados:', error);
    }
  };

  const updateFinancialTicket = async (id: string, updates: Partial<FinancialTicket>) => {
    const updatedTickets = financialTickets.map((ticket) =>
      ticket.id === id
        ? { ...ticket, ...updates, updatedAt: new Date() }
        : ticket
    );
    setFinancialTickets(updatedTickets);
    
    // Encontrar o ticket atualizado e salvar no banco
    const updatedTicket = updatedTickets.find(t => t.id === id);
    if (updatedTicket) {
      try {
        await database.saveFinancialTicket(updatedTicket);
      } catch (error) {
        console.error('Erro ao atualizar ticket financeiro no banco de dados:', error);
      }
    }
  };

  const deleteFinancialTicket = async (id: string) => {
    setFinancialTickets((prev) => prev.filter((ticket) => ticket.id !== id));
    
    try {
      await database.deleteFinancialTicket(id);
    } catch (error) {
      console.error('Erro ao deletar ticket financeiro do banco de dados:', error);
    }
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

