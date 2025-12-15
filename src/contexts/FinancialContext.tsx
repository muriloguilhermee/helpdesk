import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { FinancialTicket, User, TicketFile } from '../types';
import { api } from '../services/api';

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

  // Carregar tickets financeiros APENAS do banco de dados (API)
  useEffect(() => {
    const loadFinancialTickets = async () => {
      try {
        const user = getCurrentUser();
        if (!user) {
          console.log('🚫 Nenhum usuário logado, não carregar tickets financeiros ainda.');
          setIsLoading(false);
          return;
        }

        setIsLoading(true);
        console.log('📡 Carregando tickets financeiros da API...');

        // SEMPRE usar API - sem fallback para dados locais
        const apiTickets = await api.getFinancialTickets();

        // Transform API response to FinancialTicket format
        const transformedTickets = apiTickets.map((t: any) => ({
          id: t.id,
          title: t.title,
          description: t.description,
          amount: t.amount,
          dueDate: new Date(t.dueDate),
          paymentDate: t.paymentDate ? new Date(t.paymentDate) : undefined,
          status: t.status,
          client: t.client,
          createdBy: t.createdBy,
          invoiceFile: t.invoiceFile,
          receiptFile: t.receiptFile,
          notes: t.notes,
          erpId: t.erpId,
          erpType: t.erpType,
          invoiceNumber: t.invoiceNumber,
          barcode: t.barcode,
          ourNumber: t.ourNumber,
          paymentErpId: t.paymentErpId,
          paymentMethod: t.paymentMethod,
          transactionId: t.transactionId,
          erpMetadata: t.erpMetadata,
          paymentMetadata: t.paymentMetadata,
          createdAt: new Date(t.createdAt),
          updatedAt: new Date(t.updatedAt),
        }));

        console.log('✅ Tickets financeiros carregados da API:', transformedTickets.length);
        setFinancialTickets(transformedTickets);
        setIsLoading(false);
      } catch (apiError: any) {
        console.error('❌ Erro ao carregar tickets financeiros da API:', apiError);

        // Se for 401 (não autenticado), apenas limpa lista e não trata como erro de conexão
        if (apiError?.status === 401) {
          console.warn('⚠️ Não autenticado ao carregar tickets financeiros. Aguarde login.');
          setFinancialTickets([]);
          setIsLoading(false);
          return;
        }

        // Se a API falhar, mostrar lista vazia ao invés de dados locais
        setFinancialTickets([]);
        setIsLoading(false);
      }
    };

    loadFinancialTickets();
  }, []);

  const addFinancialTicket = async (ticket: FinancialTicket) => {
    try {
      // SEMPRE usar API - sem fallback para dados locais
      console.log('📝 Criando ticket financeiro via API:', ticket.title);
      const createdTicket = await api.createFinancialTicket({
        title: ticket.title,
        description: ticket.description,
        amount: ticket.amount,
        dueDate: ticket.dueDate,
        paymentDate: ticket.paymentDate,
        status: ticket.status,
        clientId: ticket.client.id,
        invoiceFile: ticket.invoiceFile && ticket.invoiceFile.data ? {
          name: ticket.invoiceFile.name,
          size: ticket.invoiceFile.size,
          type: ticket.invoiceFile.type,
          data: ticket.invoiceFile.data,
        } : undefined,
        receiptFile: ticket.receiptFile && ticket.receiptFile.data ? {
          name: ticket.receiptFile.name,
          size: ticket.receiptFile.size,
          type: ticket.receiptFile.type,
          data: ticket.receiptFile.data,
        } : undefined,
        notes: ticket.notes,
        erpId: ticket.erpId,
        erpType: ticket.erpType,
        invoiceNumber: ticket.invoiceNumber,
        barcode: ticket.barcode,
        ourNumber: ticket.ourNumber,
        paymentErpId: ticket.paymentErpId,
        paymentMethod: ticket.paymentMethod,
        transactionId: ticket.transactionId,
        erpMetadata: ticket.erpMetadata,
        paymentMetadata: ticket.paymentMetadata,
      });

      // Transform API response to FinancialTicket format
      const transformedTicket = {
        id: createdTicket.id,
        title: createdTicket.title,
        description: createdTicket.description,
        amount: createdTicket.amount,
        dueDate: new Date(createdTicket.dueDate),
        paymentDate: createdTicket.paymentDate ? new Date(createdTicket.paymentDate) : undefined,
        status: createdTicket.status,
        client: createdTicket.client,
        createdBy: createdTicket.createdBy,
        invoiceFile: createdTicket.invoiceFile,
        receiptFile: createdTicket.receiptFile,
        notes: createdTicket.notes,
        erpId: createdTicket.erpId,
        erpType: createdTicket.erpType,
        invoiceNumber: createdTicket.invoiceNumber,
        barcode: createdTicket.barcode,
        ourNumber: createdTicket.ourNumber,
        paymentErpId: createdTicket.paymentErpId,
        paymentMethod: createdTicket.paymentMethod,
        transactionId: createdTicket.transactionId,
        erpMetadata: createdTicket.erpMetadata,
        paymentMetadata: createdTicket.paymentMetadata,
        createdAt: new Date(createdTicket.createdAt),
        updatedAt: new Date(createdTicket.updatedAt),
      };

      // Adicionar ticket criado à lista (dados do banco)
      setFinancialTickets((prev) => [...prev, transformedTicket]);
      console.log('✅ Ticket financeiro criado com sucesso');
    } catch (apiError: any) {
      console.error('❌ Erro ao criar ticket financeiro:', apiError);
      throw apiError; // Propagar erro para que o componente possa tratar
    }
  };

  const updateFinancialTicket = async (id: string, updates: Partial<FinancialTicket>) => {
    try {
      // SEMPRE usar API - sem fallback para dados locais
      console.log('📝 Atualizando ticket financeiro via API:', id, updates);
      const updatedTicket = await api.updateFinancialTicket(id, {
        title: updates.title,
        description: updates.description,
        amount: updates.amount,
        dueDate: updates.dueDate,
        paymentDate: updates.paymentDate,
        status: updates.status,
        clientId: updates.client?.id,
        invoiceFile: updates.invoiceFile !== undefined ? (updates.invoiceFile && updates.invoiceFile.data ? {
          name: updates.invoiceFile.name,
          size: updates.invoiceFile.size,
          type: updates.invoiceFile.type,
          data: updates.invoiceFile.data,
        } : null) : undefined,
        receiptFile: updates.receiptFile !== undefined ? (updates.receiptFile && updates.receiptFile.data ? {
          name: updates.receiptFile.name,
          size: updates.receiptFile.size,
          type: updates.receiptFile.type,
          data: updates.receiptFile.data,
        } : null) : undefined,
        notes: updates.notes,
        erpId: updates.erpId,
        erpType: updates.erpType,
        invoiceNumber: updates.invoiceNumber,
        barcode: updates.barcode,
        ourNumber: updates.ourNumber,
        paymentErpId: updates.paymentErpId,
        paymentMethod: updates.paymentMethod,
        transactionId: updates.transactionId,
        erpMetadata: updates.erpMetadata,
        paymentMetadata: updates.paymentMetadata,
      });

      // Transform API response to FinancialTicket format
      const transformedTicket = {
        id: updatedTicket.id,
        title: updatedTicket.title,
        description: updatedTicket.description,
        amount: updatedTicket.amount,
        dueDate: new Date(updatedTicket.dueDate),
        paymentDate: updatedTicket.paymentDate ? new Date(updatedTicket.paymentDate) : undefined,
        status: updatedTicket.status,
        client: updatedTicket.client,
        createdBy: updatedTicket.createdBy,
        invoiceFile: updatedTicket.invoiceFile,
        receiptFile: updatedTicket.receiptFile,
        notes: updatedTicket.notes,
        erpId: updatedTicket.erpId,
        erpType: updatedTicket.erpType,
        invoiceNumber: updatedTicket.invoiceNumber,
        barcode: updatedTicket.barcode,
        ourNumber: updatedTicket.ourNumber,
        paymentErpId: updatedTicket.paymentErpId,
        paymentMethod: updatedTicket.paymentMethod,
        transactionId: updatedTicket.transactionId,
        erpMetadata: updatedTicket.erpMetadata,
        paymentMetadata: updatedTicket.paymentMetadata,
        createdAt: new Date(updatedTicket.createdAt),
        updatedAt: new Date(updatedTicket.updatedAt),
      };

      // Atualizar lista local com dados do banco
      setFinancialTickets((prev) =>
        prev.map((ticket) =>
          ticket.id === id ? transformedTicket : ticket
        )
      );

      console.log('✅ Ticket financeiro atualizado com sucesso');
    } catch (apiError: any) {
      console.error('❌ Erro ao atualizar ticket financeiro:', apiError);
      throw apiError; // Propagar erro para que o componente possa tratar
    }
  };

  const deleteFinancialTicket = async (id: string) => {
    try {
      // SEMPRE usar API - sem fallback para dados locais
      console.log('🗑️ Deletando ticket financeiro via API:', id);
      await api.deleteFinancialTicket(id);

      // Remover ticket da lista local
      setFinancialTickets((prev) => prev.filter((ticket) => ticket.id !== id));
      console.log('✅ Ticket financeiro deletado com sucesso');
    } catch (apiError: any) {
      console.error('❌ Erro ao deletar ticket financeiro:', apiError);
      throw apiError; // Propagar erro para que o componente possa tratar
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

