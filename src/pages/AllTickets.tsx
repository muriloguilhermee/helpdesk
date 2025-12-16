import { useState, useEffect } from 'react';
import { Plus, Search, Trash2, Edit, HelpCircle, Clock, CheckCircle, X, MessageSquare } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTickets } from '../contexts/TicketsContext';
import { TicketFilters, TicketStatus } from '../types';
import { getStatusColor, getStatusLabel, getStatusIcon } from '../utils/statusColors';
import { formatDateShort } from '../utils/formatDate';
import { formatCurrency } from '../utils/formatCurrency';
import { UserAvatar } from '../utils/userAvatar';

export default function AllTickets() {
  const { hasPermission, user } = useAuth();
  const { tickets } = useTickets();
  const navigate = useNavigate();
  const [filters, setFilters] = useState<TicketFilters>({});
  const [searchQuery, setSearchQuery] = useState(() => {
    return localStorage.getItem('dashboardSearchQuery') || '';
  });

  // Sincronizar busca com Header via localStorage
  useEffect(() => {
    const handleSearchChange = () => {
      const stored = localStorage.getItem('dashboardSearchQuery') || '';
      if (stored !== searchQuery) {
        setSearchQuery(stored);
      }
    };

    window.addEventListener('dashboardSearchChange', handleSearchChange);
    const interval = setInterval(() => {
      const stored = localStorage.getItem('dashboardSearchQuery') || '';
      if (stored !== searchQuery) {
        setSearchQuery(stored);
      }
    }, 100);

    return () => {
      window.removeEventListener('dashboardSearchChange', handleSearchChange);
      clearInterval(interval);
    };
  }, [searchQuery]);

  // Função para capitalizar status corretamente
  const capitalizeStatus = (status: TicketStatus): string => {
    const label = getStatusLabel(status);
    return label
      .split(' ')
      .map((word, index) => {
        if (word.toLowerCase() === 'de' && index > 0) {
          return word.toLowerCase();
        }
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      })
      .join(' ');
  };

  // Array de status ordenado alfabeticamente
  const statusOptions: TicketStatus[] = [
    'aberto',
    'aguardando_cliente',
    'em_andamento',
    'em_atendimento',
    'em_fase_de_testes',
    'fechado',
    'homologacao',
    'pendente',
    'resolvido',
  ].sort((a, b) => {
    const labelA = capitalizeStatus(a as TicketStatus);
    const labelB = capitalizeStatus(b as TicketStatus);
    return labelA.localeCompare(labelB, 'pt-BR', { sensitivity: 'base' });
  }) as TicketStatus[];

  // Técnicos veem chamados de OUTROS técnicos (não os atribuídos a eles)
  // Técnicos N2 veem APENAS chamados na fila "Suporte N2"
  // Isso evita duplicação com "Meus Chamados"
  let availableTickets = tickets;
  const isTechnician = user?.role === 'technician';
  const isTechnicianN2 = user?.role === 'technician_n2';

  if (isTechnicianN2) {
    // Técnicos N2 veem APENAS chamados na fila "Suporte N2"
    availableTickets = tickets.filter(ticket => {
      const queueName = ticket.queue || '';
      return queueName.toLowerCase().includes('suporte n2') || queueName.toLowerCase().includes('n2');
    });
  } else if (isTechnician) {
    // Técnicos N1 veem apenas chamados de OUTROS técnicos (não os atribuídos a eles)
    // Isso evita duplicação com "Meus Chamados"
    availableTickets = tickets.filter(ticket => {
      // Excluir tickets atribuídos ao técnico atual
      // Mostrar apenas tickets não atribuídos OU atribuídos a outros técnicos
      if (!ticket.assignedTo) {
        return true; // Mostrar tickets não atribuídos
      }
      // Mostrar apenas se NÃO estiver atribuído ao técnico atual
      return ticket.assignedTo.id !== user.id;
    });
  }

  const filteredTickets = availableTickets
    .filter((ticket) => {
      if (filters.status && ticket.status !== filters.status) return false;
      if (filters.priority && ticket.priority !== filters.priority) return false;
      if (filters.category && ticket.category !== filters.category) return false;
      if (searchQuery && searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const titleMatch = ticket.title?.toLowerCase().includes(query) || false;
        const descriptionMatch = ticket.description?.toLowerCase().includes(query) || false;
        if (!titleMatch && !descriptionMatch) return false;
      }
      return true;
    })
    .sort((a, b) => {
      // Ordenar por data de atualização (mais recentes primeiro)
      const dateA = new Date(a.updatedAt).getTime();
      const dateB = new Date(b.updatedAt).getTime();
      return dateB - dateA; // Decrescente (mais recente primeiro)
    });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
          Todos os Chamados
        </h1>
        {hasPermission('create:ticket') && (
          <Link to="/tickets/new" className="btn-primary flex items-center justify-center gap-2 w-full sm:w-auto">
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">Novo Chamado</span>
            <span className="sm:hidden">Novo</span>
          </Link>
        )}
      </div>

      {/* Filtros */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex flex-wrap gap-2">
          <select
            value={filters.status || ''}
            className="flex-1 min-w-[120px] sm:flex-none sm:min-w-0 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            onChange={(e) => setFilters({ ...filters, status: e.target.value as any || undefined })}
          >
            <option value="">Todos os status</option>
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {capitalizeStatus(status)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">Atualizado em</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">Id</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">Título e Serviço</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">Valor total</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">Cliente</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">Técnico</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">Status</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-gray-500 dark:text-gray-400">
                    Nenhum chamado encontrado
                  </td>
                </tr>
              ) : (
                filteredTickets.map((ticket) => {
                  const StatusIcon = getStatusIcon(ticket.status);
                  const client = ticket.client || ticket.createdBy;

                  return (
                    <tr
                      key={ticket.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
                      onClick={() => {
                        sessionStorage.setItem('viewingTicketFrom', 'all-tickets');
                        navigate(`/tickets/${ticket.id}`, { state: { fromAllTickets: true } });
                      }}
                    >
                      <td className="py-4 px-4 text-sm text-gray-600 dark:text-gray-400">
                        {formatDateShort(ticket.updatedAt)}
                      </td>
                      <td className="py-4 px-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                        {ticket.id}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {ticket.title}
                          </span>
                          {ticket.serviceType && (
                            <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {ticket.serviceType}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-600 dark:text-gray-400">
                        {ticket.totalValue ? formatCurrency(ticket.totalValue) : '-'}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <UserAvatar user={client} size="sm" />
                          <span className="text-sm text-gray-900 dark:text-gray-100">{client.name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        {ticket.assignedTo ? (
                          <div className="flex items-center gap-2">
                            <UserAvatar user={ticket.assignedTo} size="sm" />
                            <span className="text-sm text-gray-900 dark:text-gray-100">{ticket.assignedTo.name}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500 dark:text-gray-400">Não atribuído</span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <StatusIcon className="w-4 h-4" />
                          <span className={`text-xs font-medium px-2 py-1 rounded-full ${getStatusColor(ticket.status)}`}>
                            {getStatusLabel(ticket.status)}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                          <Link
                            to={`/tickets/${ticket.id}`}
                            state={{ fromAllTickets: true }}
                            onClick={() => sessionStorage.setItem('viewingTicketFrom', 'all-tickets')}
                            className="p-2 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                            title="Ver detalhes"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

