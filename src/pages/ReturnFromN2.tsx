import { useAuth } from '../contexts/AuthContext';
import { useTickets } from '../contexts/TicketsContext';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Clock, AlertCircle, Tag, Calendar, User, Zap, ArrowLeftRight } from 'lucide-react';
import { getStatusColor, getStatusLabel, getStatusIcon, getPriorityColor } from '../utils/statusColors';
import { formatDateShort } from '../utils/formatDate';
import { formatCurrency } from '../utils/formatCurrency';
import { UserAvatar } from '../utils/userAvatar';

export default function ReturnFromN2() {
  const { user } = useAuth();
  const { tickets, updateTicket } = useTickets();
  const navigate = useNavigate();

  // Apenas técnicos N1 visualizam esta tela
  if (user?.role !== 'technician') {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">Somente técnicos N1 podem acessar retornos do N2.</p>
      </div>
    );
  }

  // Filtra chamados que voltaram do N2 e estão atribuídos ao técnico N1
  // Verifica se está na fila "Retorno N2" OU se foi transferido de N2 para N1
  // E se está atribuído ao técnico logado
  const retornoTickets = tickets.filter((ticket) => {
    // Primeiro verificar se está atribuído ao técnico
    const isAssignedToMe = ticket.assignedTo?.id === user?.id;
    if (!isAssignedToMe) return false;
    
    const queueName = ticket.queue?.toLowerCase() || '';
    const isReturnQueue = queueName.includes('retorno n2');
    
    // Verificar também nas interações se houve transferência de N2 para N1
    const hasN2ToN1Transfer = ticket.interactions?.some((interaction) => {
      if (interaction.type === 'queue_transfer') {
        const fromQueue = interaction.metadata?.fromQueue?.toLowerCase() || '';
        const toQueue = interaction.metadata?.toQueue?.toLowerCase() || '';
        const content = interaction.content?.toLowerCase() || '';
        
        // Verificar se foi transferido de N2 para N1 ou Retorno N2
        const fromN2 = fromQueue.includes('suporte n2') || fromQueue.includes('n2');
        const toN1 = toQueue.includes('suporte n1') || toQueue.includes('retorno n2') || toQueue.includes('n1');
        const mentionsN2ToN1 = content.includes('suporte n2') && (content.includes('suporte n1') || content.includes('retorno n2'));
        
        return fromN2 && (toN1 || mentionsN2ToN1);
      }
      return false;
    });
    
    // Mostrar apenas chamados atribuídos ao técnico que estão na fila "Retorno N2" ou foram transferidos de N2 para N1
    return isReturnQueue || hasN2ToN1Transfer;
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
      status: 'fechado',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">Retorno N2</h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">Chamados devolvidos do N2 para o N1</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card dark:bg-gray-800 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Retornos</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">{retornoTickets.length}</p>
            </div>
            <ArrowLeftRight className="w-8 h-8 text-purple-600" />
          </div>
        </div>
        <div className="card dark:bg-gray-800 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Não Atribuídos</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                {retornoTickets.filter(t => !t.assignedTo).length}
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
                {retornoTickets.filter(t => t.assignedTo?.id === user?.id).length}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden mt-4">
        <div className="overflow-x-auto">
          <table className="w-full">
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {retornoTickets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-500 dark:text-gray-400">
                    Nenhum retorno do N2 encontrado
                  </td>
                </tr>
              ) : (
                retornoTickets.map((ticket) => {
                  const StatusIcon = getStatusIcon(ticket.status);
                  const client = ticket.client || ticket.createdBy;
                  const isAssignedToMe = ticket.assignedTo?.id === user?.id;
                  const isNotAssigned = !ticket.assignedTo;

                  return (
                    <tr
                      key={ticket.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50 dark:bg-gray-700 transition-colors border-b border-gray-200 dark:border-gray-600"
                    >
                      <td className="py-5 px-4">
                        <div className="flex flex-col gap-1">
                          <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            Criado
                          </div>
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {formatDateShort(new Date(ticket.createdAt))}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Atualizado: {formatDateShort(new Date(ticket.updatedAt))}
                          </div>
                        </div>
                      </td>
                      <td className="py-5 px-4">
                        <div className="flex flex-col gap-1">
                          <div className="text-xs text-gray-500 dark:text-gray-400">ID</div>
                          <div className="text-sm font-bold text-primary-600 dark:text-primary-400 font-mono">
                            #{ticket.id.slice(-5)}
                          </div>
                        </div>
                      </td>
                      <td className="py-5 px-4">
                        <div className="space-y-2 min-w-[280px]">
                          <div className="flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 text-gray-400 dark:text-gray-500 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                              <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 leading-tight">
                                {ticket.title}
                              </div>
                              {ticket.description && (
                                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                                  {ticket.description.substring(0, 100)}
                                  {ticket.description.length > 100 && '...'}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            {ticket.queue && (
                              <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-md text-xs font-medium">
                                <Zap className="w-3 h-3" />
                                {ticket.queue}
                              </div>
                            )}
                            <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                              <Tag className="w-3 h-3" />
                              {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}
                            </div>
                            <div className="text-xs text-primary-600 dark:text-primary-400 font-medium capitalize">
                              {ticket.category}
                            </div>
                          </div>

                          {ticket.serviceType && (
                            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                              <span className="font-medium">Serviço:</span> {ticket.serviceType}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-5 px-4">
                        <div className="flex flex-col gap-1">
                          <div className="text-xs text-gray-500 dark:text-gray-400">Valor</div>
                          <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                            {ticket.category === 'integracao'
                              ? (ticket.integrationValue ? formatCurrency(ticket.integrationValue) : '-')
                              : (ticket.totalValue ? formatCurrency(ticket.totalValue) : '-')
                            }
                          </div>
                        </div>
                      </td>
                      <td className="py-5 px-4">
                        {client && (
                          <div className="flex flex-col gap-2">
                            <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                              <User className="w-3.5 h-3.5" />
                              Cliente
                            </div>
                            <div className="flex items-center gap-2">
                              <UserAvatar user={client} size="sm" />
                              <div className="flex flex-col">
                                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{client.name}</span>
                                {client.company && (
                                  <span className="text-xs text-gray-500 dark:text-gray-400">{client.company}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="py-5 px-4">
                        <div className="flex flex-col gap-2">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                            <StatusIcon className="w-3.5 h-3.5" />
                            {getStatusLabel(ticket.status)}
                          </span>
                          {ticket.assignedTo && (
                            <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
                              <UserAvatar user={ticket.assignedTo} size="sm" />
                              <span>{ticket.assignedTo.name}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-5 px-4">
                        <div className="flex items-center justify-end gap-2">
                          {isNotAssigned && (
                            <button
                              onClick={() => handleAcceptTicket(ticket.id)}
                              className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors shadow-sm hover:shadow-md"
                            >
                              Aceitar
                            </button>
                          )}
                          {isAssignedToMe && (
                            <>
                              <button
                                onClick={() => navigate(`/tickets/${ticket.id}`)}
                                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                              >
                                Tratar
                              </button>
                              <button
                                onClick={() => handleCloseTicket(ticket.id)}
                                className="px-4 py-2 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 transition-colors"
                              >
                                Fechar
                              </button>
                            </>
                          )}
                          {!isNotAssigned && !isAssignedToMe && (
                            <button
                              onClick={() => navigate(`/tickets/${ticket.id}`)}
                              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            >
                              Ver detalhes
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
    </div>
  );
}


