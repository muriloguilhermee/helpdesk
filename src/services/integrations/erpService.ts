import { FinancialTicket, PaymentStatus } from '../../types';

/**
 * Interface para dados recebidos do ERP
 */
export interface ERPTicketData {
  erpId: string; // ID do boleto no ERP
  erpType: 'contaazul' | 'bling' | 'tiny' | 'omie' | 'other';
  title: string;
  description?: string;
  amount: number;
  dueDate: string; // ISO date string
  clientEmail: string;
  clientName: string;
  clientDocument?: string; // CPF/CNPJ
  invoiceNumber?: string; // Número da nota fiscal
  barcode?: string; // Código de barras do boleto
  ourNumber?: string; // Nosso número
  invoiceFileUrl?: string; // URL do PDF do boleto
  metadata?: Record<string, any>; // Dados adicionais do ERP
}

/**
 * Interface para dados de pagamento recebidos do ERP
 */
export interface ERPPaymentData {
  erpId: string; // ID do pagamento no ERP
  erpTicketId: string; // ID do boleto no ERP
  erpType: 'contaazul' | 'bling' | 'tiny' | 'omie' | 'other';
  paymentDate: string; // ISO date string
  amount: number;
  paymentMethod?: string; // Ex: 'boleto', 'pix', 'cartao'
  transactionId?: string;
  receiptFileUrl?: string; // URL do comprovante
  metadata?: Record<string, any>;
}

/**
 * Serviço para gerenciar integrações com ERPs
 */
export class ERPService {
  /**
   * Processa um boleto recebido do ERP e cria/atualiza o ticket financeiro
   */
  static async processERPTicket(
    erpData: ERPTicketData,
    financialTickets: FinancialTicket[],
    addFinancialTicket: (ticket: FinancialTicket) => void,
    updateFinancialTicket: (id: string, updates: Partial<FinancialTicket>) => void,
    allUsers: any[]
  ): Promise<{ success: boolean; ticketId?: string; message: string }> {
    try {
      // Buscar ou criar cliente baseado no email
      let client = allUsers.find((u: any) => 
        u.email.toLowerCase() === erpData.clientEmail.toLowerCase() && u.role === 'user'
      );

      // Se não encontrar cliente, criar um novo
      if (!client) {
        client = {
          id: `user-${Date.now()}`,
          name: erpData.clientName,
          email: erpData.clientEmail,
          role: 'user',
          company: erpData.clientDocument || undefined,
        };
        // Salvar novo usuário
        const savedUsers = localStorage.getItem('allUsers');
        const users = savedUsers ? JSON.parse(savedUsers) : [];
        users.push(client);
        localStorage.setItem('allUsers', JSON.stringify(users));
      }

      // Verificar se já existe ticket com este erpId
      const existingTicket = financialTickets.find(
        (t: any) => t.erpId === erpData.erpId && t.erpType === erpData.erpType
      );

      if (existingTicket) {
        // Atualizar ticket existente
        updateFinancialTicket(existingTicket.id, {
          amount: erpData.amount,
          dueDate: new Date(erpData.dueDate),
          title: erpData.title,
          description: erpData.description,
          client: client,
        });
        return {
          success: true,
          ticketId: existingTicket.id,
          message: 'Ticket atualizado com sucesso',
        };
      } else {
        // Criar novo ticket
        const newTicket: FinancialTicket = {
          id: `FT-${Date.now()}`,
          title: erpData.title,
          description: erpData.description,
          amount: erpData.amount,
          dueDate: new Date(erpData.dueDate),
          status: 'pending',
          client: client,
          createdBy: client, // Ou usuário do sistema
          createdAt: new Date(),
          updatedAt: new Date(),
          notes: `Integração ${erpData.erpType.toUpperCase()}. ERP ID: ${erpData.erpId}`,
        };

        // Adicionar metadados do ERP se necessário
        (newTicket as any).erpId = erpData.erpId;
        (newTicket as any).erpType = erpData.erpType;
        (newTicket as any).invoiceNumber = erpData.invoiceNumber;
        (newTicket as any).barcode = erpData.barcode;
        (newTicket as any).ourNumber = erpData.ourNumber;
        (newTicket as any).erpMetadata = erpData.metadata;

        addFinancialTicket(newTicket);

        return {
          success: true,
          ticketId: newTicket.id,
          message: 'Ticket criado com sucesso',
        };
      }
    } catch (error) {
      console.error('Erro ao processar ticket do ERP:', error);
      return {
        success: false,
        message: `Erro ao processar ticket: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      };
    }
  }

  /**
   * Processa um pagamento recebido do ERP e atualiza o status do ticket
   */
  static async processERPPayment(
    paymentData: ERPPaymentData,
    financialTickets: FinancialTicket[],
    updateFinancialTicket: (id: string, updates: Partial<FinancialTicket>) => void
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Buscar ticket pelo erpId
      const ticket = financialTickets.find(
        (t: any) => t.erpId === paymentData.erpTicketId && t.erpType === paymentData.erpType
      );

      if (!ticket) {
        return {
          success: false,
          message: 'Ticket não encontrado para este pagamento',
        };
      }

      // Atualizar status para pago
      updateFinancialTicket(ticket.id, {
        status: 'paid',
        paymentDate: new Date(paymentData.paymentDate),
        notes: ticket.notes 
          ? `${ticket.notes}\nPagamento confirmado via ${paymentData.erpType.toUpperCase()}. ID: ${paymentData.erpId}`
          : `Pagamento confirmado via ${paymentData.erpType.toUpperCase()}. ID: ${paymentData.erpId}`,
      });

      // Adicionar metadados do pagamento se necessário
      const updatedTicket = financialTickets.find(t => t.id === ticket.id);
      if (updatedTicket) {
        (updatedTicket as any).paymentErpId = paymentData.erpId;
        (updatedTicket as any).paymentMethod = paymentData.paymentMethod;
        (updatedTicket as any).transactionId = paymentData.transactionId;
        (updatedTicket as any).paymentMetadata = paymentData.metadata;
      }

      return {
        success: true,
        message: 'Pagamento processado com sucesso',
      };
    } catch (error) {
      console.error('Erro ao processar pagamento do ERP:', error);
      return {
        success: false,
        message: `Erro ao processar pagamento: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      };
    }
  }

  /**
   * Valida os dados recebidos do ERP
   */
  static validateERPTicketData(data: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.erpId) errors.push('erpId é obrigatório');
    if (!data.erpType) errors.push('erpType é obrigatório');
    if (!data.title) errors.push('title é obrigatório');
    if (!data.amount || data.amount <= 0) errors.push('amount deve ser maior que zero');
    if (!data.dueDate) errors.push('dueDate é obrigatório');
    if (!data.clientEmail) errors.push('clientEmail é obrigatório');
    if (!data.clientName) errors.push('clientName é obrigatório');

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Valida os dados de pagamento recebidos do ERP
   */
  static validateERPPaymentData(data: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.erpId) errors.push('erpId é obrigatório');
    if (!data.erpTicketId) errors.push('erpTicketId é obrigatório');
    if (!data.erpType) errors.push('erpType é obrigatório');
    if (!data.paymentDate) errors.push('paymentDate é obrigatório');
    if (!data.amount || data.amount <= 0) errors.push('amount deve ser maior que zero');

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}


