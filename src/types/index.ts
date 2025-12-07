export type TicketStatus = 'aberto' | 'em_andamento' | 'em_atendimento' | 'pendente' | 'resolvido' | 'fechado' | 'em_fase_de_testes' | 'homologacao' | 'aguardando_cliente';
export type TicketPriority = 'baixa' | 'media' | 'alta' | 'critica';
export type TicketCategory = 'suporte' | 'tecnico' | 'integracao' | 'melhoria';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'technician' | 'financial';
  avatar?: string;
  company?: string;
}

export type PaymentStatus = 'pending' | 'paid' | 'overdue' | 'cancelled';

export interface FinancialTicket {
  id: string;
  title: string;
  description?: string;
  amount: number;
  dueDate: Date;
  paymentDate?: Date;
  status: PaymentStatus;
  client: User;
  createdBy: User;
  createdAt: Date;
  updatedAt: Date;
  invoiceFile?: TicketFile; // Arquivo do boleto/ticket
  receiptFile?: TicketFile; // Comprovante de pagamento
  notes?: string;
  // Campos para integração com ERP
  erpId?: string; // ID do boleto no ERP
  erpType?: 'contaazul' | 'bling' | 'tiny' | 'omie' | 'other';
  invoiceNumber?: string; // Número da nota fiscal
  barcode?: string; // Código de barras do boleto
  ourNumber?: string; // Nosso número
  paymentErpId?: string; // ID do pagamento no ERP
  paymentMethod?: string; // Método de pagamento
  transactionId?: string; // ID da transação
  erpMetadata?: Record<string, any>; // Metadados do ERP
  paymentMetadata?: Record<string, any>; // Metadados do pagamento
}

export interface TicketFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string; // URL do arquivo (em produção seria o caminho no servidor)
  data?: string; // Base64 para demonstração (em produção não seria necessário)
}

export interface Ticket {
  id: string;
  title: string;
  system?: string; // Sistema ao qual o chamado se refere
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  category: TicketCategory;
  serviceType?: string;
  totalValue?: number;
  integrationValue?: number; // Valor específico para categoria integração
  client?: User;
  createdBy: User;
  assignedTo?: User;
  queue?: string; // Nome da fila do chamado
  createdAt: Date;
  updatedAt: Date;
  comments?: Comment[];
  interactions?: Interaction[]; // Novo sistema de interações
  files?: TicketFile[];
}

export interface Queue {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Comment {
  id: string;
  content: string;
  author: User;
  createdAt: Date;
}

export type InteractionType = 'user' | 'system' | 'status_change' | 'assignment' | 'internal_note' | 'queue_transfer';

export interface Interaction {
  id: string;
  type: InteractionType;
  content: string;
  author?: User; // Opcional para interações do sistema
  createdAt: Date;
  metadata?: {
    oldStatus?: TicketStatus;
    newStatus?: TicketStatus;
    assignedTo?: User;
    previousAssignee?: User;
    fromQueue?: string;
    toQueue?: string;
  };
}

export interface TicketFilters {
  status?: TicketStatus;
  priority?: TicketPriority;
  category?: TicketCategory;
  assignedTo?: string;
  search?: string;
}


