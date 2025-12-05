import { useState } from 'react';
import { Plus, Search, Trash2, Edit, HelpCircle, Clock, CheckCircle } from 'lucide-react';
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
  let availableTickets = tickets;
  if (user?.role === 'technician') {
    // Técnicos só veem chamados atribuídos a eles
    availableTickets = tickets.filter(ticket => ticket.assignedTo?.id === user.id);
  } else if (user?.role === 'user') {
    // Usuários só veem chamados que eles criaram
    availableTickets = tickets.filter(ticket => ticket.createdBy.id === user.id);
  }

  const filteredTickets = availableTickets.filter((ticket) => {
    if (filters.status && ticket.status !== filters.status) return false;
    if (filters.priority && ticket.priority !== filters.priority) return false;
    if (filters.category && ticket.category !== filters.category) return false;
    if (searchQuery && !ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !ticket.description.toLowerCase().includes(searchQuery.toLowerCase())) return false;
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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          {user?.role === 'technician' ? 'Meus Chamados' : user?.role === 'user' ? 'Meus Chamados' : 'Chamados'}
        </h1>
        {hasPermission('create:ticket') && (
          <Link to="/tickets/new" className="btn-primary flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Novo Chamado
          </Link>
        )}
      </div>

      {/* Filtros */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar chamados..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={filters.status || ''}
            onChange={(e) => setFilters({ ...filters, status: e.target.value as any || undefined })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Todos os status</option>
            <option value="aberto">Aberto</option>
            <option value="em_atendimento">Em Atendimento</option>
            <option value="encerrado">Encerrado</option>
          </select>
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Atualizado em</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Id</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Título e Serviço</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Valor total</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Cliente</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Técnico</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Status</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-700"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-gray-500">
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
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => navigate(`/tickets/${ticket.id}`)}
                    >
                      <td className="py-4 px-4 text-sm text-gray-600">
                        {formatDateShort(ticket.updatedAt)}
                      </td>
                      <td className="py-4 px-4 text-sm font-medium text-gray-900">
                        {ticket.id}
                      </td>
                      <td className="py-4 px-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{ticket.title}</div>
                          {ticket.serviceType && (
                            <div className="text-xs text-gray-500 mt-1">{ticket.serviceType}</div>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-900">
                        {ticket.totalValue ? formatCurrency(ticket.totalValue) : '-'}
                      </td>
                      <td className="py-4 px-4">
                        {client && (
                          <div className="flex items-center gap-2">
                            <UserAvatar user={client} size="sm" />
                            <span className="text-sm text-gray-900">{client.name}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        {ticket.assignedTo ? (
                          <div className="flex items-center gap-2">
                            <UserAvatar user={ticket.assignedTo} size="sm" />
                            <span className="text-sm text-gray-900">{ticket.assignedTo.name}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">Não atribuído</span>
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
                            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                            title="Editar"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          {hasPermission('delete:ticket') && (
                            <button
                              onClick={(e) => handleDeleteClick(e, ticket.id)}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
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
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Excluir Chamado</h2>
                <p className="text-sm text-gray-600 mt-1">Esta ação não pode ser desfeita</p>
              </div>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-gray-700">
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
