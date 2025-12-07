import { ERPService, ERPTicketData, ERPPaymentData } from '../../services/integrations/erpService';
import { useFinancial } from '../../contexts/FinancialContext';

/**
 * Endpoint para receber webhook de boleto criado no ERP
 * 
 * POST /api/webhooks/erp/ticket
 * 
 * Body esperado:
 * {
 *   erpId: string,
 *   erpType: 'contaazul' | 'bling' | 'tiny' | 'omie' | 'other',
 *   title: string,
 *   description?: string,
 *   amount: number,
 *   dueDate: string (ISO),
 *   clientEmail: string,
 *   clientName: string,
 *   clientDocument?: string,
 *   invoiceNumber?: string,
 *   barcode?: string,
 *   ourNumber?: string,
 *   invoiceFileUrl?: string,
 *   metadata?: object
 * }
 */
export async function handleERPTicketWebhook(
  data: ERPTicketData,
  financialTickets: any[],
  addFinancialTicket: (ticket: any) => void,
  updateFinancialTicket: (id: string, updates: any) => void,
  allUsers: any[]
): Promise<{ success: boolean; ticketId?: string; message: string }> {
  // Validar dados
  const validation = ERPService.validateERPTicketData(data);
  if (!validation.valid) {
    return {
      success: false,
      message: `Dados inválidos: ${validation.errors.join(', ')}`,
    };
  }

  // Processar ticket
  return await ERPService.processERPTicket(
    data,
    financialTickets,
    addFinancialTicket,
    updateFinancialTicket,
    allUsers
  );
}

/**
 * Endpoint para receber webhook de pagamento confirmado no ERP
 * 
 * POST /api/webhooks/erp/payment
 * 
 * Body esperado:
 * {
 *   erpId: string,
 *   erpTicketId: string,
 *   erpType: 'contaazul' | 'bling' | 'tiny' | 'omie' | 'other',
 *   paymentDate: string (ISO),
 *   amount: number,
 *   paymentMethod?: string,
 *   transactionId?: string,
 *   receiptFileUrl?: string,
 *   metadata?: object
 * }
 */
export async function handleERPPaymentWebhook(
  data: ERPPaymentData,
  financialTickets: any[],
  updateFinancialTicket: (id: string, updates: any) => void
): Promise<{ success: boolean; message: string }> {
  // Validar dados
  const validation = ERPService.validateERPPaymentData(data);
  if (!validation.valid) {
    return {
      success: false,
      message: `Dados inválidos: ${validation.errors.join(', ')}`,
    };
  }

  // Processar pagamento
  return await ERPService.processERPPayment(
    data,
    financialTickets,
    updateFinancialTicket
  );
}

/**
 * Função auxiliar para processar webhook com autenticação
 */
export async function processWebhookWithAuth(
  requestData: any,
  webhookType: 'ticket' | 'payment',
  apiKey?: string
): Promise<{ success: boolean; data?: any; message: string }> {
  // Verificar autenticação (em produção, validar API key)
  const storedApiKey = localStorage.getItem('erpApiKey');
  if (apiKey && storedApiKey && apiKey !== storedApiKey) {
    return {
      success: false,
      message: 'API Key inválida',
    };
  }

  // Processar webhook baseado no tipo
  if (webhookType === 'ticket') {
    // Implementação será feita no componente que usa o hook
    return {
      success: true,
      message: 'Webhook de ticket processado',
      data: requestData,
    };
  } else {
    return {
      success: true,
      message: 'Webhook de pagamento processado',
      data: requestData,
    };
  }
}


