import { useState } from 'react';
import { Search, CheckCircle, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTickets } from '../contexts/TicketsContext';
import { getStatusColor, getStatusLabel, getStatusIcon } from '../utils/statusColors';
import { formatDateShort } from '../utils/formatDate';
import { formatCurrency } from '../utils/formatCurrency';
import { UserAvatar } from '../utils/userAvatar';

export default function PendingTickets() {
  const { user } = useAuth();
  const { tickets, updateTicket } = useTickets();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  // Filtrar apenas chamados pendentes ou abertos (não atribuídos ou atribuídos ao técnico atual)
  const pendingTickets = tickets.filter((ticket) => {
    const isPending = ticket.status === 'aberto' || ticket.status === 'pendente';
    const isAssignedToMe = ticket.assignedTo?.id === user?.id;
    const isNotAssigned = !ticket.assignedTo;

    return isPending && (isAssignedToMe || isNotAssigned);
  });

  const filteredTickets = pendingTickets.filter((ticket) => {
    if (searchQuery && !ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !ticket.description.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const handleAcceptTicket = (ticketId: string) => {
    if (!user) return;

    updateTicket(ticketId, {
      assignedTo: user,
      status: 'em_atendimento',
    });
  };

  const handleCloseTicket = (ticketId: string) => {
    updateTicket(ticketId, {
      status: 'encerrado',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">Novos Chamados</h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">Chamados novos ou atribuídos a você</p>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card dark:bg-gray-800 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Novos</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">{pendingTickets.length}</p>
            </div>
            <Clock className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="card dark:bg-gray-800 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Não Atribuídos</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                {pendingTickets.filter(t => !t.assignedTo).length}
              </p>
            </div>
            <Clock className="w-8 h-8 text-orange-600" />
          </div>
        </div>
        <div className="card dark:bg-gray-800 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Atribuídos a Você</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                {pendingTickets.filter(t => t.assignedTo?.id === user?.id).length}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>
      </div>

      {/* Busca */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar chamados..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Atualizado em</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Id</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Título e Serviço</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Valor total</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Cliente</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Status</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-500 dark:text-gray-400">
                    Nenhum novo chamado encontrado
                  </td>
                </tr>
              ) : (
                filteredTickets.map((ticket) => {
                  const StatusIcon = getStatusIcon(ticket.status);
                  const client = ticket.client || ticket.createdBy;
                  const isAssignedToMe = ticket.assignedTo?.id === user?.id;
                  const isNotAssigned = !ticket.assignedTo;

                  return (
                    <tr
                      key={ticket.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50 dark:bg-gray-700 transition-colors"
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
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                          <StatusIcon className="w-3.5 h-3.5" />
                          {getStatusLabel(ticket.status)}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center justify-end gap-2">
                          {isNotAssigned && (
                            <button
                              onClick={() => handleAcceptTicket(ticket.id)}
                              className="px-3 py-1.5 bg-primary-600 text-white text-xs font-medium rounded-lg hover:bg-primary-700 transition-colors"
                            >
                              Aceitar
                            </button>
                          )}
                          {isAssignedToMe && (
                            <>
                              <button
                                onClick={() => navigate(`/tickets/${ticket.id}`)}
                                className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors"
                              >
                                Ver Detalhes
                              </button>
                              <button
                                onClick={() => handleCloseTicket(ticket.id)}
                                className="px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 transition-colors flex items-center gap-1"
                              >
                                <CheckCircle className="w-3.5 h-3.5" />
                                Fechar
                              </button>
                            </>
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
    </div>
  );
}

