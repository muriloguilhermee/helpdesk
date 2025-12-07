import { useState, useMemo } from 'react';
import { ArrowLeft, MessageSquare, User, Calendar, Tag, Trash2, AlertTriangle, Paperclip, Download, File, X, Save, DollarSign, Wrench, RefreshCw, Send, Filter, Eye, Zap } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTickets } from '../contexts/TicketsContext';
import { getStatusColor, getPriorityColor, getStatusLabel } from '../utils/statusColors';
import { formatDate } from '../utils/formatDate';
import { formatFileSize } from '../utils/formatFileSize';
import { formatCurrency } from '../utils/formatCurrency';
import { UserAvatar } from '../utils/userAvatar';
import { TicketStatus, Comment, TicketCategory, TicketPriority, Interaction, InteractionType } from '../types';
import { mockUsers } from '../data/mockData';

export default function TicketDetails() {
  const { hasPermission, user } = useAuth();
  const { tickets, deleteTicket, updateTicket, addComment, addInteraction } = useTickets();
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'interactions' | 'ticket'>('interactions');
  const [replyText, setReplyText] = useState('');
  const [showReplyBox, setShowReplyBox] = useState(false);
  const [interactionOrder, setInteractionOrder] = useState<'asc' | 'desc'>('asc');
  const [interactionFilter, setInteractionFilter] = useState<'all' | InteractionType>('all');
  const [viewMode, setViewMode] = useState<'normal' | 'compact'>('normal');
  const [comment, setComment] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [showAddValueModal, setShowAddValueModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [selectedQueue, setSelectedQueue] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<TicketStatus>('aberto');
  const [selectedTechnician, setSelectedTechnician] = useState<string>('');
  const [serviceType, setServiceType] = useState('');
  const [totalValue, setTotalValue] = useState('');
  const [integrationValue, setIntegrationValue] = useState('');
  const [newIntegrationValue, setNewIntegrationValue] = useState('');

  const ticket = useMemo(() => tickets.find(t => t.id === id), [tickets, id]);
  
  // Verificar se o chamado está fechado (fechado ou resolvido)
  const isClosed = ticket?.status === 'fechado' || ticket?.status === 'resolvido';
  // Verificar se o usuário é admin
  const isAdmin = user?.role === 'admin';
  // Verificar se o usuário é técnico
  const isTechnician = user?.role === 'technician';
  // Verificar se pode alterar status (admin sempre pode, outros só se não estiver fechado)
  const canChangeStatus = hasPermission('edit:ticket') && (isAdmin || !isClosed);

  if (!ticket) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">Chamado não encontrado</p>
        <button onClick={() => navigate('/tickets')} className="btn-primary mt-4">
          Voltar para lista
        </button>
      </div>
    );
  }

  // Verificar se o usuário tem permissão para ver este chamado
  // Usuários podem ver seus próprios chamados OU chamados de melhoria
  // Técnicos podem ver chamados atribuídos a eles OU chamados de melhoria
  if (user?.role === 'user') {
    const isOwnTicket = ticket.createdBy.id === user.id;
    const isMelhoria = ticket.category === 'melhoria';
    if (!isOwnTicket && !isMelhoria) {
      return (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">Você não tem permissão para ver este chamado</p>
          <button onClick={() => navigate('/tickets')} className="btn-primary mt-4">
            Voltar para lista
          </button>
        </div>
      );
    }
  }
  
  if (user?.role === 'technician') {
    const isAssignedToMe = ticket.assignedTo?.id === user.id;
    const isMelhoria = ticket.category === 'melhoria';
    if (!isAssignedToMe && !isMelhoria) {
      return (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">Você não tem permissão para ver este chamado</p>
          <button onClick={() => navigate('/tickets')} className="btn-primary mt-4">
            Voltar para lista
          </button>
        </div>
      );
    }
  }

  const handleAddComment = () => {
    if (comment.trim() && user && ticket) {
      const newComment: Comment = {
        id: `comment-${Date.now()}`,
        content: comment.trim(),
        author: user,
        createdAt: new Date(),
      };
      addComment(ticket.id, newComment);
      setComment('');
    }
  };

  const handleAddInteraction = async () => {
    if (replyText.trim() && user && ticket) {
      const newInteraction: Interaction = {
        id: `interaction-${Date.now()}`,
        type: 'user',
        content: replyText.trim(),
        author: user,
        createdAt: new Date(),
      };
      await addInteraction(ticket.id, newInteraction);
      setReplyText('');
      setShowReplyBox(false);
    }
  };

  // Combinar comentários antigos com interações e criar interações iniciais se necessário
  const allInteractions = useMemo(() => {
    const interactions: Interaction[] = [];
    
    // Adicionar interação inicial do criador do chamado
    if (ticket) {
      interactions.push({
        id: `initial-${ticket.id}`,
        type: 'user',
        content: ticket.description,
        author: ticket.createdBy,
        createdAt: ticket.createdAt,
      });

      // Converter comentários antigos para interações
      if (ticket.comments && ticket.comments.length > 0) {
        ticket.comments.forEach(comment => {
          interactions.push({
            id: comment.id,
            type: 'user',
            content: comment.content,
            author: comment.author,
            createdAt: comment.createdAt,
          });
        });
      }

      // Adicionar interações do sistema
      if (ticket.interactions && ticket.interactions.length > 0) {
        interactions.push(...ticket.interactions);
      }

      // Adicionar interação do sistema quando status muda
      // (isso será adicionado quando o status for atualizado)
    }

    // Ordenar por data
    return interactions.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return interactionOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });
  }, [ticket, ticket?.interactions, ticket?.comments, interactionOrder]);

  // Filtrar interações
  const filteredInteractions = useMemo(() => {
    if (interactionFilter === 'all') {
      return allInteractions;
    }
    return allInteractions.filter(i => i.type === interactionFilter);
  }, [allInteractions, interactionFilter]);

  const handleUpdateStatus = () => {
    if (ticket && selectedStatus) {
      // Se o chamado está fechado/resolvido e o usuário está tentando reabrir, verificar se é admin
      if (isClosed && selectedStatus !== 'fechado' && selectedStatus !== 'resolvido') {
        if (!isAdmin) {
          alert('Apenas administradores podem reabrir chamados fechados.');
          return;
        }
      }
      // Criar interação do sistema para mudança de status
      if (ticket.status !== selectedStatus && user) {
        const statusInteraction: Interaction = {
          id: `status-${Date.now()}`,
          type: 'status_change',
          content: `Status alterado de "${getStatusLabel(ticket.status)}" para "${getStatusLabel(selectedStatus)}"`,
          author: user,
          createdAt: new Date(),
          metadata: {
            oldStatus: ticket.status,
            newStatus: selectedStatus,
          },
        };
        addInteraction(ticket.id, statusInteraction);
      }
      // Manter o status como "resolvido" se selecionado (não mudar para "fechado")
      updateTicket(ticket.id, { status: selectedStatus });
      setShowStatusModal(false);
    }
  };

  // Carregar apenas técnicos customizados (não mockados)
  const allUsers = (() => {
    const savedUsers = localStorage.getItem('allUsers');
    if (savedUsers) {
      try {
        return JSON.parse(savedUsers);
      } catch {
        return [];
      }
    }
    return [];
  })();
  
  // Filtrar apenas técnicos que NÃO são mockados
  const mockUserEmails = new Set(mockUsers.map(u => u.email.toLowerCase()));
  const customTechnicians = allUsers.filter((u: any) => 
    u.role === 'technician' && !mockUserEmails.has(u.email.toLowerCase())
  );
  
  // Ordenar técnicos alfabeticamente
  const allTechnicians = [...customTechnicians].sort((a: any, b: any) => 
    a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' })
  );

  // Função para capitalizar status corretamente (primeira letra maiúscula, exceto "de")
  const capitalizeStatus = (status: TicketStatus): string => {
    const label = getStatusLabel(status);
    return label
      .split(' ')
      .map((word, index) => {
        // Primeira palavra sempre maiúscula, "de" sempre minúscula
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
    const labelA = capitalizeStatus(a);
    const labelB = capitalizeStatus(b);
    return labelA.localeCompare(labelB, 'pt-BR', { sensitivity: 'base' });
  }) as TicketStatus[];

  const handleAssignTechnician = () => {
    if (ticket && user) {
      if (selectedTechnician) {
        const technician = allTechnicians.find((u: any) => u.id === selectedTechnician);
        if (technician) {
          // Criar interação do sistema para atribuição
          const assignmentInteraction: Interaction = {
            id: `assignment-${Date.now()}`,
            type: 'assignment',
            content: ticket.assignedTo 
              ? `Chamado atribuído de "${ticket.assignedTo.name}" para "${technician.name}"`
              : `Chamado atribuído para "${technician.name}"`,
            author: user,
            createdAt: new Date(),
            metadata: {
              previousAssignee: ticket.assignedTo,
              assignedTo: technician,
            },
          };
          addInteraction(ticket.id, assignmentInteraction);
          updateTicket(ticket.id, { assignedTo: technician });
        }
      } else {
        // Criar interação do sistema para remoção de atribuição
        if (ticket.assignedTo) {
          const unassignmentInteraction: Interaction = {
            id: `unassignment-${Date.now()}`,
            type: 'assignment',
            content: `Atribuição removida de "${ticket.assignedTo.name}"`,
            author: user,
            createdAt: new Date(),
            metadata: {
              previousAssignee: ticket.assignedTo,
            },
          };
          addInteraction(ticket.id, unassignmentInteraction);
        }
        // Remover atribuição
        updateTicket(ticket.id, { assignedTo: undefined });
      }
      setShowAssignModal(false);
      setSelectedTechnician('');
    }
  };

  const handleTransferToQueue = async () => {
    if (ticket && user && selectedQueue) {
      const currentQueue = ticket.assignedTo?.name || 'Sem atribuição';
      const queueNames: Record<string, string> = {
        'n2': 'Suporte N2',
        'n1': 'Suporte N1',
        'desenvolvimento': 'Desenvolvimento',
        'infraestrutura': 'Infraestrutura',
      };
      const queueName = queueNames[selectedQueue] || selectedQueue;
      
      // Criar interação de transferência
      const transferInteraction: Interaction = {
        id: `transfer-${Date.now()}`,
        type: 'queue_transfer',
        content: `Chamado transferido para fila de ${queueName}`,
        author: user,
        createdAt: new Date(),
        metadata: {
          fromQueue: currentQueue,
          toQueue: queueName,
        },
      };
      
      await addInteraction(ticket.id, transferInteraction);
      setShowTransferModal(false);
      setSelectedQueue('');
    }
  };

  const handleCloseTicket = () => {
    if (ticket) {
      updateTicket(ticket.id, { status: 'fechado' });
    }
  };

  const handleUpdateServiceInfo = () => {
    if (ticket) {
      const updates: any = {
        serviceType: serviceType || undefined,
      };
      
      // Se for categoria integração, usar integrationValue, senão usar totalValue
      if (ticket.category === 'integracao') {
        updates.integrationValue = integrationValue ? parseFloat(integrationValue) : undefined;
        updates.totalValue = undefined; // Limpar totalValue se for integração
      } else {
        updates.totalValue = totalValue ? parseFloat(totalValue) : undefined;
        updates.integrationValue = undefined; // Limpar integrationValue se não for integração
      }
      
      updateTicket(ticket.id, updates);
      setShowServiceModal(false);
      setServiceType('');
      setTotalValue('');
      setIntegrationValue('');
    }
  };

  const handleOpenServiceModal = () => {
    if (ticket) {
      setServiceType(ticket.serviceType || '');
      setTotalValue(ticket.totalValue ? ticket.totalValue.toString() : '');
      setIntegrationValue(ticket.integrationValue ? ticket.integrationValue.toString() : '');
      setShowServiceModal(true);
    }
  };

  const handleOpenAddValueModal = () => {
    if (ticket) {
      setNewIntegrationValue(ticket.integrationValue ? ticket.integrationValue.toString() : '');
      setShowAddValueModal(true);
    }
  };

  const handleAddIntegrationValue = () => {
    if (ticket) {
      updateTicket(ticket.id, {
        integrationValue: newIntegrationValue ? parseFloat(newIntegrationValue) : undefined,
      });
      setShowAddValueModal(false);
      setNewIntegrationValue('');
    }
  };

  const handleDeleteTicket = () => {
    if (ticket && hasPermission('delete:ticket')) {
      deleteTicket(ticket.id);
      navigate('/tickets');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <button
          onClick={() => navigate('/tickets')}
          className="self-start p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100 break-words">{ticket.title}</h1>
          {ticket.system && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              <span className="font-medium">Sistema:</span> {ticket.system}
            </p>
          )}
          {ticket.serviceType && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{ticket.serviceType}</p>
          )}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-2">
            <span className="text-xs text-primary-600 dark:text-primary-400 font-medium capitalize px-2 py-1 bg-primary-50 dark:bg-primary-900/20 rounded">
              {ticket.category}
            </span>
            <span className={`badge ${getStatusColor(ticket.status)}`}>
              {ticket.status.replace('_', ' ')}
            </span>
            <span className={`badge ${getPriorityColor(ticket.priority)}`}>
              {ticket.priority}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {ticket.system && (
            <div className="card dark:bg-gray-800 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Sistema</h2>
              <p className="text-gray-700 dark:text-gray-300">{ticket.system}</p>
            </div>
          )}
          <div className="card dark:bg-gray-800 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Descrição</h2>
            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{ticket.description}</p>
          </div>

          {/* Arquivos Anexados */}
          {ticket.files && ticket.files.length > 0 && (
            <div className="card dark:bg-gray-800 dark:border-gray-700">
              <div className="flex items-center gap-2 mb-4">
                <Paperclip className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Arquivos Anexados</h2>
                <span className="text-sm text-gray-500 dark:text-gray-400">({ticket.files.length})</span>
              </div>
              <div className="space-y-2">
                {ticket.files.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <File className="w-5 h-5 text-gray-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{file.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{formatFileSize(file.size)}</p>
                      </div>
                    </div>
                    {file.data && (
                      <a
                        href={file.data}
                        download={file.name}
                        className="p-2 text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors"
                        title="Download"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sistema de Abas e Interações */}
          <div className="card dark:bg-gray-800 dark:border-gray-700">
            {/* Abas */}
            <div className="flex border-b border-gray-200 dark:border-gray-700 mb-4">
              <button
                onClick={() => setActiveTab('interactions')}
                className={`px-6 py-3 font-medium text-sm transition-colors ${
                  activeTab === 'interactions'
                    ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                INTERAÇÕES
              </button>
              <button
                onClick={() => setActiveTab('ticket')}
                className={`px-6 py-3 font-medium text-sm transition-colors ${
                  activeTab === 'ticket'
                    ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                CHAMADO
              </button>
              <div className="flex-1"></div>
              <div className="flex items-center px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                Chamado #{ticket.id.slice(-5)}
              </div>
            </div>

            {activeTab === 'interactions' ? (
              <div className="space-y-4">
                {/* Barra de Ferramentas */}
                <div className="flex flex-wrap items-center gap-2 pb-4 border-b border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => setShowReplyBox(!showReplyBox)}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2 text-sm font-medium"
                  >
                    <Send className="w-4 h-4" />
                    Responder
                  </button>
                  <select
                    value={interactionOrder}
                    onChange={(e) => setInteractionOrder(e.target.value as 'asc' | 'desc')}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                  >
                    <option value="asc">Primeira para última</option>
                    <option value="desc">Última para primeira</option>
                  </select>
                  <select
                    value={interactionFilter}
                    onChange={(e) => setInteractionFilter(e.target.value as 'all' | InteractionType)}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                  >
                    <option value="all">Todas</option>
                    <option value="user">Usuários</option>
                    <option value="system">Sistema</option>
                    <option value="status_change">Mudanças de Status</option>
                    <option value="assignment">Atribuições</option>
                    <option value="queue_transfer">Transferências</option>
                  </select>
                  <select
                    value={viewMode}
                    onChange={(e) => setViewMode(e.target.value as 'normal' | 'compact')}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                  >
                    <option value="normal">Visão normal</option>
                    <option value="compact">Visão compacta</option>
                  </select>
                </div>

                {/* Resumo do Chamado */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">Chamado #{ticket.id.slice(-5)}</h3>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">Status Atual:</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                          {getStatusLabel(ticket.status).toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                      <p><strong>Aberto em:</strong> {formatDate(ticket.createdAt)}</p>
                      <p><strong>Assunto:</strong> {ticket.title}</p>
                      <p><strong>Criado por:</strong> {ticket.createdBy.name} ({ticket.createdBy.email})</p>
                      {ticket.assignedTo && (
                        <p><strong>Fila:</strong> {ticket.assignedTo.name}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Timeline de Interações */}
                <div className="space-y-4">
                  {filteredInteractions.length > 0 ? (
                    filteredInteractions.map((interaction, index) => {
                      const isSystem = interaction.type === 'system' || interaction.type === 'status_change' || interaction.type === 'assignment';
                      const isTransfer = interaction.type === 'queue_transfer';
                      const isCreator = interaction.type === 'user' && interaction.author?.id === ticket.createdBy.id;
                      
                      return (
                        <div key={interaction.id} className="flex gap-4">
                          <div className="flex-shrink-0">
                            {isTransfer ? (
                              <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                                <Zap className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                              </div>
                            ) : isSystem ? (
                              <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                <RefreshCw className="w-5 h-5 text-green-600 dark:text-green-400" />
                              </div>
                            ) : interaction.author ? (
                              <UserAvatar user={interaction.author} size="md" />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                <User className="w-5 h-5 text-gray-500" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className="font-medium text-gray-900 dark:text-gray-100">
                                {isTransfer
                                  ? 'Analista'
                                  : isSystem 
                                    ? 'Sistema' 
                                    : interaction.author 
                                      ? interaction.author.name 
                                      : 'Usuário'}
                              </span>
                              {interaction.author && !isSystem && !isTransfer && (
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  ({interaction.author.email})
                                </span>
                              )}
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {formatDate(interaction.createdAt)}
                              </span>
                            </div>
                            <div className={`${
                              isCreator
                                ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                                : isTransfer
                                  ? 'bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800'
                                  : isSystem
                                    ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                                    : 'bg-gray-50 dark:bg-gray-700/50'
                            } rounded-lg p-3`}>
                              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{interaction.content}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400 text-center py-8">Nenhuma interação encontrada</p>
                  )}
                </div>

                {/* Caixa de Resposta */}
                {showReplyBox && (
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                    <textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Digite sua resposta..."
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 mb-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                    />
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => {
                          setShowReplyBox(false);
                          setReplyText('');
                        }}
                        className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleAddInteraction}
                        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2"
                      >
                        <Send className="w-4 h-4" />
                        Enviar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                {ticket.system && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Sistema</h3>
                    <p className="text-gray-700 dark:text-gray-300">{ticket.system}</p>
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Descrição</h3>
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{ticket.description}</p>
                </div>
                {ticket.files && ticket.files.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
                      <Paperclip className="w-5 h-5" />
                      Arquivos Anexados ({ticket.files.length})
                    </h3>
                    <div className="space-y-2">
                      {ticket.files.map((file) => (
                        <div
                          key={file.id}
                          className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-700"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <File className="w-5 h-5 text-gray-400 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{file.name}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">{formatFileSize(file.size)}</p>
                            </div>
                          </div>
                          {file.data && (
                            <a
                              href={file.data}
                              download={file.name}
                              className="p-2 text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors"
                              title="Download"
                            >
                              <Download className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="card dark:bg-gray-800 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Informações</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Criado por</p>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{ticket.createdBy.name}</p>
                </div>
              </div>

              {ticket.assignedTo && (
                <div className="flex items-start gap-3">
                  <User className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Atribuído a</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{ticket.assignedTo.name}</p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Criado em</p>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{formatDate(ticket.createdAt)}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Atualizado em</p>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{formatDate(ticket.updatedAt)}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Tag className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Categoria</p>
                  <p className="font-medium text-gray-900 dark:text-gray-100 capitalize">{ticket.category}</p>
                </div>
              </div>

              {(ticket.totalValue || ticket.integrationValue) && (
                <div className="flex items-start gap-3">
                  <DollarSign className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {ticket.category === 'integracao' ? 'Valor da Integração' : 'Valor Total'}
                    </p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {ticket.category === 'integracao' 
                        ? (ticket.integrationValue ? formatCurrency(ticket.integrationValue) : '-')
                        : (ticket.totalValue ? formatCurrency(ticket.totalValue) : '-')
                      }
                    </p>
                  </div>
                </div>
              )}

              {ticket.serviceType && (
                <div className="flex items-start gap-3">
                  <Wrench className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Tipo de Serviço</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{ticket.serviceType}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="card dark:bg-gray-800 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Ações</h2>
            <div className="space-y-2">
              {ticket?.category === 'integracao' && hasPermission('edit:ticket') && !isClosed && (
                <button 
                  onClick={handleOpenAddValueModal}
                  className="w-full btn-primary flex items-center justify-center gap-2"
                >
                  <DollarSign className="w-4 h-4" />
                  Adicionar Valor
                </button>
              )}
              {canChangeStatus && (
                <button 
                  onClick={() => {
                    if (ticket) {
                      setSelectedStatus(ticket.status);
                      setShowStatusModal(true);
                    }
                  }}
                  className="w-full btn-secondary"
                >
                  Atualizar Status
                </button>
              )}
              {isClosed && !isAdmin && (
                <div className="w-full p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg text-sm text-yellow-800 dark:text-yellow-400">
                  Este chamado está fechado. Apenas administradores podem reabri-lo.
                </div>
              )}
              {isTechnician && hasPermission('edit:ticket') && (
                <button 
                  onClick={handleOpenServiceModal}
                  className="w-full btn-secondary flex items-center justify-center gap-2"
                >
                  <Wrench className="w-4 h-4" />
                  Informar Serviço e Valor
                </button>
              )}
              {hasPermission('assign:ticket') && (
                <button 
                  onClick={() => {
                    if (ticket) {
                      setSelectedTechnician(ticket.assignedTo?.id || '');
                      setShowAssignModal(true);
                    }
                  }}
                  className="w-full btn-secondary"
                >
                  Atribuir Técnico
                </button>
              )}
              {hasPermission('edit:ticket') && (
                <button 
                  onClick={() => setShowTransferModal(true)}
                  className="w-full btn-secondary flex items-center justify-center gap-2"
                >
                  <Zap className="w-4 h-4" />
                  Transferir para Fila
                </button>
              )}
              {hasPermission('edit:ticket') && !isClosed && (
                <button 
                  onClick={handleCloseTicket}
                  className="w-full btn-secondary"
                >
                  Fechar Chamado
                </button>
              )}
              {hasPermission('delete:ticket') && (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Excluir Chamado
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Confirmação de Exclusão */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-4 sm:p-6 space-y-4 sm:space-y-6 my-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Excluir Chamado</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Esta ação não pode ser desfeita</p>
              </div>
            </div>

            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Tem certeza que deseja excluir o chamado <strong className="text-gray-900 dark:text-gray-100">"{ticket?.title}"</strong>?
                Todos os dados relacionados serão permanentemente removidos.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="btn-secondary"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteTicket}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Atualizar Status */}
      {showStatusModal && ticket && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-4 sm:p-6 space-y-4 sm:space-y-6 my-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Atualizar Status</h2>
              <button
                onClick={() => setShowStatusModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Novo Status
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as TicketStatus)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {capitalizeStatus(status)}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowStatusModal(false)}
                className="btn-secondary"
              >
                Cancelar
              </button>
              <button
                onClick={handleUpdateStatus}
                className="btn-primary flex items-center gap-2"
              >
                <Save className="w-5 h-5" />
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Atribuir Técnico */}
      {showAssignModal && ticket && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-4 sm:p-6 space-y-4 sm:space-y-6 my-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Atribuir Técnico</h2>
              <button
                onClick={() => setShowAssignModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Selecionar Técnico
              </label>
              <select
                value={selectedTechnician}
                onChange={(e) => setSelectedTechnician(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="">Nenhum (remover atribuição)</option>
                {allTechnicians.map((tech: any) => (
                  <option key={tech.id} value={tech.id}>
                    {tech.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowAssignModal(false)}
                className="btn-secondary"
              >
                Cancelar
              </button>
              <button
                onClick={handleAssignTechnician}
                className="btn-primary flex items-center gap-2"
              >
                <Save className="w-5 h-5" />
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Informar Serviço e Valor */}
      {showServiceModal && ticket && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-4 sm:p-6 space-y-4 sm:space-y-6 my-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Informar Serviço e Valor</h2>
              <button
                onClick={() => {
                  setShowServiceModal(false);
                  setServiceType('');
                  setTotalValue('');
                  setIntegrationValue('');
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tipo de Serviço
                </label>
                <input
                  type="text"
                  value={serviceType}
                  onChange={(e) => setServiceType(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                  placeholder="Ex: Instalação de Rede, Manutenção de Hardware"
                />
              </div>

              {ticket.category === 'integracao' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Valor da Integração (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={integrationValue}
                    onChange={(e) => setIntegrationValue(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                    placeholder="0.00"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Informe o valor específico da integração
                  </p>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Valor Total (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={totalValue}
                    onChange={(e) => setTotalValue(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                    placeholder="0.00"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Informe o valor do serviço após a avaliação
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setShowServiceModal(false);
                  setServiceType('');
                  setTotalValue('');
                  setIntegrationValue('');
                }}
                className="btn-secondary"
              >
                Cancelar
              </button>
              <button
                onClick={handleUpdateServiceInfo}
                className="btn-primary flex items-center gap-2"
              >
                <Save className="w-5 h-5" />
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Adicionar Valor (apenas para integração) */}
      {showAddValueModal && ticket && ticket.category === 'integracao' && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4 overflow-y-auto"
          style={{ 
            position: 'fixed', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowAddValueModal(false);
            }
          }}
        >
          <div 
            className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-md w-full p-4 sm:p-6 space-y-4 sm:space-y-6 my-4 relative border-2 border-gray-300 dark:border-gray-600"
            style={{ 
              position: 'relative', 
              zIndex: 10000, 
              maxHeight: '90vh', 
              overflowY: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Adicionar Valor da Integração</h2>
              <button
                onClick={() => {
                  setShowAddValueModal(false);
                  setNewIntegrationValue('');
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Valor da Integração (R$) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={newIntegrationValue}
                  onChange={(e) => setNewIntegrationValue(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                  placeholder="0.00"
                  required
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Informe o valor da integração
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setShowAddValueModal(false);
                  setNewIntegrationValue('');
                }}
                className="btn-secondary"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddIntegrationValue}
                className="btn-primary flex items-center gap-2"
              >
                <Save className="w-5 h-5" />
                Adicionar Valor
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Transferir para Fila */}
      {showTransferModal && ticket && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-4 sm:p-6 space-y-4 sm:space-y-6 my-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Zap className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                Transferir para Fila
              </h2>
              <button
                onClick={() => {
                  setShowTransferModal(false);
                  setSelectedQueue('');
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Selecionar Fila
              </label>
              <select
                value={selectedQueue}
                onChange={(e) => setSelectedQueue(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="">Selecione uma fila</option>
                <option value="n2">Suporte N2 (Desenvolvedores)</option>
                <option value="n1">Suporte N1</option>
                <option value="desenvolvimento">Desenvolvimento</option>
                <option value="infraestrutura">Infraestrutura</option>
              </select>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                O chamado será transferido para a fila selecionada e uma interação será registrada.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setShowTransferModal(false);
                  setSelectedQueue('');
                }}
                className="btn-secondary"
              >
                Cancelar
              </button>
              <button
                onClick={handleTransferToQueue}
                disabled={!selectedQueue}
                className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Zap className="w-4 h-4" />
                Transferir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


