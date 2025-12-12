import { useState, useEffect } from 'react';
import { Search, MessageSquare, Eye } from 'lucide-react';
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

  // Para técnicos, mostrar TODOS os tickets (incluindo os atribuídos a outros técnicos)
  // Para outros roles, usar a mesma lógica de TicketsList
  let availableTickets = tickets;
  if (user?.role === 'user') {
    availableTickets = tickets.filter(ticket =>
      ticket.createdBy.id === user.id || ticket.category === 'melhoria'
    );
  } else if (user?.role === 'technician') {
    // Técnicos veem TODOS os tickets nesta página
    availableTickets = tickets;
  }
  // Admins veem todos os chamados (availableTickets = tickets)

  const filteredTickets = availableTickets
    .filter((ticket) => {
      if (filters.status && ticket.status !== filters.status) return false;
      if (filters.priority && ticket.priority !== filters.priority) return false;
      if (filters.category && ticket.category !== filters.category) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          ticket.title.toLowerCase().includes(query) ||
          ticket.description?.toLowerCase().includes(query) ||
          ticket.id.toLowerCase().includes(query)
        );
      }
      return true;
    })
    .sort((a, b) => {
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

  // Verificar se é técnico (para mostrar aviso sobre permissões limitadas)
  const isTechnician = user?.role === 'technician';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">Todos Chamados</h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
            {isTechnician
              ? 'Visualize todos os chamados. Você pode adicionar comentários para informar sobre contatos de clientes.'
              : 'Visualize todos os chamados do sistema'}
          </p>
        </div>
      </div>

      {/* Aviso para técnicos sobre permissões limitadas */}
      {isTechnician && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <MessageSquare className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                Permissões Limitadas
              </h3>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                Nesta página, você pode visualizar todos os chamados, mas apenas pode adicionar comentários e interações.
                Use esta funcionalidade quando um cliente entrar em contato sobre um chamado atribuído a outro técnico.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar chamados por título ou descrição..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                localStorage.setItem('dashboardSearchQuery', e.target.value);
                window.dispatchEvent(new Event('dashboardSearchChange'));
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>
        <div className="sm:w-64">
          <select
            value={filters.status || ''}
            onChange={(e) => setFilters({ ...filters, status: e.target.value as TicketStatus || undefined })}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Atualizado em
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Id
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Título e Serviço
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Valor total
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Técnico
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Ações
                </th>
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
                  const isAssignedToOther = isTechnician && ticket.assignedTo && ticket.assignedTo.id !== user?.id;

                  return (
                    <tr
                      key={ticket.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {formatDateShort(new Date(ticket.updatedAt))}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className="text-sm font-mono font-bold text-primary-600 dark:text-primary-400">
                          #{ticket.id.slice(-5)}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {ticket.title}
                        </div>
                        {ticket.serviceType && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {ticket.serviceType}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {ticket.totalValue ? formatCurrency(ticket.totalValue) : '-'}
                      </td>
                      <td className="px-4 py-4">
                        {client && (
                          <div className="flex items-center gap-2">
                            <UserAvatar user={client} size="sm" />
                            <span className="text-sm text-gray-900 dark:text-gray-100">{client.name}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        {ticket.assignedTo ? (
                          <div className="flex items-center gap-2">
                            <UserAvatar user={ticket.assignedTo} size="sm" />
                            <span className="text-sm text-gray-900 dark:text-gray-100">
                              {ticket.assignedTo.name}
                            </span>
                            {isAssignedToOther && (
                              <span className="text-xs text-orange-600 dark:text-orange-400 font-medium">
                                (Outro técnico)
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500 dark:text-gray-400">Não atribuído</span>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                          <StatusIcon className="w-3.5 h-3.5" />
                          {getStatusLabel(ticket.status)}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                        <Link
                          to={`/tickets/${ticket.id}`}
                          className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 flex items-center gap-1"
                        >
                          <Eye className="w-4 h-4" />
                          <span>Ver</span>
                        </Link>
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

