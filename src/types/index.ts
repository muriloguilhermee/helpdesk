export type TicketStatus = 'aberto' | 'em_andamento' | 'em_atendimento' | 'pendente' | 'resolvido' | 'fechado' | 'encerrado';
export type TicketPriority = 'baixa' | 'media' | 'alta' | 'critica';
export type TicketCategory = 'suporte' | 'tecnico' | 'integracao';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'technician';
  avatar?: string;
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
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  category: TicketCategory;
  serviceType?: string;
  totalValue?: number;
  client?: User;
  createdBy: User;
  assignedTo?: User;
  createdAt: Date;
  updatedAt: Date;
  comments?: Comment[];
  files?: TicketFile[];
}

export interface Comment {
  id: string;
  content: string;
  author: User;
  createdAt: Date;
}

export interface TicketFilters {
  status?: TicketStatus;
  priority?: TicketPriority;
  category?: TicketCategory;
  assignedTo?: string;
  search?: string;
}


