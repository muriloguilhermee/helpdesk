import { useState } from 'react';
import { Plus, Search, Trash2, Edit, HelpCircle, Clock, CheckCircle, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTickets } from '../contexts/TicketsContext';
import { TicketFilters } from '../types';
import { getStatusColor, getStatusLabel, getStatusIcon } from '../utils/statusColors';
import { formatDateShort } from '../utils/formatDate';
import { formatCurrency } from '../utils/formatCurrency';
import { UserAvatar } from '../utils/userAvatar';

export default function TicketsList() {
  const { hasPermission, user } = useAuth();
  const { tickets, deleteTicket } = useTickets();
  const navigate = useNavigate();
  const [filters, setFilters] = useState<TicketFilters>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Filtrar tickets baseado no role do usuário
  // Usuários veem seus próprios chamados E chamados de melhoria
  // Técnicos veem chamados atribuídos a eles E chamados de melhoria
  let availableTickets = tickets;
  if (user?.role === 'technician') {
    // Técnicos veem chamados atribuídos a eles OU chamados de melhoria
    availableTickets = tickets.filter(ticket => 
      ticket.assignedTo?.id === user.id || ticket.category === 'melhoria'
    );
  } else if (user?.role === 'user') {
    // Usuários veem chamados que eles criaram OU chamados de melhoria
    availableTickets = tickets.filter(ticket => 
      ticket.createdBy.id === user.id || ticket.category === 'melhoria'
    );
  }
  // Admins veem todos os chamados (availableTickets = tickets)

  const filteredTickets = availableTickets.filter((ticket) => {
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
  });

  const handleDeleteClick = (e: React.MouseEvent, ticketId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDeleteConfirmId(ticketId);
  };

  const handleConfirmDelete = () => {
    if (deleteConfirmId) {
      deleteTicket(deleteConfirmId);
      setDeleteConfirmId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
          {user?.role === 'technician' ? 'Meus Chamados' : user?.role === 'user' ? 'Meus Chamados' : 'Chamados'}
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
        <div className="flex-1 relative flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar chamados..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.currentTarget.blur();
                }
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
            />
          </div>
          <button
            onClick={() => {
              // A busca já funciona em tempo real, mas o botão pode ser usado para focar no input
              const input = document.querySelector('input[type="text"][placeholder*="Buscar chamados"]') as HTMLInputElement;
              if (input) {
                input.focus();
              }
            }}
            className="btn-primary flex items-center gap-2 px-4 py-2 whitespace-nowrap"
            title="Pesquisar"
          >
            <Search className="w-5 h-5" />
            <span className="hidden sm:inline">Pesquisar</span>
          </button>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="btn-secondary flex items-center gap-2 px-4 py-2 whitespace-nowrap"
              title="Limpar busca"
            >
              <X className="w-5 h-5" />
              <span className="hidden sm:inline">Limpar</span>
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            value={filters.status || ''}
            className="flex-1 min-w-[120px] sm:flex-none sm:min-w-0 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            onChange={(e) => setFilters({ ...filters, status: e.target.value as any || undefined })}
          >
            <option value="">Todos os status</option>
            <option value="aberto">Aberto</option>
            <option value="em_atendimento">Em Atendimento</option>
            <option value="em_andamento">Em Andamento</option>
            <option value="pendente">Pendente</option>
            <option value="resolvido">Resolvido</option>
            <option value="em_fase_de_testes">Em fase de testes</option>
            <option value="homologacao">Homologação</option>
            <option value="fechado">Fechado</option>
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
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300"></th>
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
                      onClick={() => navigate(`/tickets/${ticket.id}`)}
                    >
                      <td className="py-4 px-4 text-sm text-gray-600 dark:text-gray-400">
                        {formatDateShort(ticket.updatedAt)}
                      </td>
                      <td className="py-4 px-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                        {ticket.id}
                      </td>
                      <td className="py-4 px-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{ticket.title}</div>
                          {ticket.system && (
                            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                              <span className="font-medium">Sistema:</span> {ticket.system}
                            </div>
                          )}
                          {ticket.serviceType && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{ticket.serviceType}</div>
                          )}
                          <div className="text-xs text-primary-600 dark:text-primary-400 font-medium mt-1 capitalize">
                            {ticket.category}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-900 dark:text-gray-100">
                        {ticket.category === 'integracao' 
                          ? (ticket.integrationValue ? formatCurrency(ticket.integrationValue) : '-')
                          : (ticket.totalValue ? formatCurrency(ticket.totalValue) : '-')
                        }
                      </td>
                      <td className="py-4 px-4">
                        {client && (
                          <div className="flex items-center gap-2">
                            <UserAvatar user={client} size="sm" />
                            <span className="text-sm text-gray-900 dark:text-gray-100">{client.name}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        {ticket.assignedTo ? (
                          <div className="flex items-center gap-2">
                            <UserAvatar user={ticket.assignedTo} size="sm" />
                            <span className="text-sm text-gray-900 dark:text-gray-100">{ticket.assignedTo.name}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400 dark:text-gray-500">Não atribuído</span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                          <StatusIcon className="w-3.5 h-3.5" />
                          {getStatusLabel(ticket.status)}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/tickets/${ticket.id}`);
                            }}
                            className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                            title="Editar"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          {hasPermission('delete:ticket') && (
                            <button
                              onClick={(e) => handleDeleteClick(e, ticket.id)}
                              className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                              title="Excluir"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
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

      {/* Modal de Confirmação de Exclusão */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6 space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Excluir Chamado</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Esta ação não pode ser desfeita</p>
              </div>
            </div>

            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Tem certeza que deseja excluir este chamado? Todos os dados relacionados serão permanentemente removidos.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="btn-secondary"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDelete}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
