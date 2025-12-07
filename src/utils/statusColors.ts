import { TicketStatus, TicketPriority } from '../types';
import { HelpCircle, Clock, CheckCircle } from 'lucide-react';

export const getStatusColor = (status: TicketStatus): string => {
  const colors: Record<TicketStatus, string> = {
    aberto: 'bg-red-50 text-red-700 border border-red-200',
    em_andamento: 'bg-yellow-100 text-yellow-800',
    em_atendimento: 'bg-blue-50 text-blue-700 border border-blue-200',
    pendente: 'bg-orange-100 text-orange-800',
    resolvido: 'bg-green-100 text-green-800',
    fechado: 'bg-gray-100 text-gray-800',
    em_fase_de_testes: 'bg-purple-50 text-purple-700 border border-purple-200',
    homologacao: 'bg-indigo-50 text-indigo-700 border border-indigo-200',
    aguardando_cliente: 'bg-amber-50 text-amber-700 border border-amber-200',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};

export const getStatusLabel = (status: TicketStatus): string => {
  const labels: Record<TicketStatus, string> = {
    aberto: 'Aberto',
    em_andamento: 'Em Andamento',
    em_atendimento: 'Em atendimento',
    pendente: 'Pendente',
    resolvido: 'Resolvido',
    fechado: 'Fechado',
    em_fase_de_testes: 'Em fase de testes',
    homologacao: 'Homologação',
    aguardando_cliente: 'Aguardando Cliente',
  };
  return labels[status] || status;
};

export const getStatusIcon = (status: TicketStatus) => {
  switch (status) {
    case 'aberto':
      return HelpCircle;
    case 'em_atendimento':
      return Clock;
    case 'fechado':
    case 'resolvido':
      return CheckCircle;
    default:
      return HelpCircle;
  }
};

export const getPriorityColor = (priority: TicketPriority): string => {
  const colors: Record<TicketPriority, string> = {
    baixa: 'bg-gray-100 text-gray-800',
    media: 'bg-blue-100 text-blue-800',
    alta: 'bg-orange-100 text-orange-800',
    critica: 'bg-red-100 text-red-800',
  };
  return colors[priority];
};


