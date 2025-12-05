import { useState } from 'react';
import { ArrowLeft, MessageSquare, User, Calendar, Tag, Trash2, AlertTriangle, Paperclip, Download, File, X, Save } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTickets } from '../contexts/TicketsContext';
import { getStatusColor, getPriorityColor } from '../utils/statusColors';
import { formatDate } from '../utils/formatDate';
import { formatFileSize } from '../utils/formatFileSize';
import { UserAvatar } from '../utils/userAvatar';
import { TicketStatus, Comment } from '../types';
import { mockUsers } from '../data/mockData';

export default function TicketDetails() {
  const { hasPermission, user } = useAuth();
  const { tickets, deleteTicket, updateTicket, addComment } = useTickets();
  const { id } = useParams();
  const navigate = useNavigate();
  const [comment, setComment] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<TicketStatus>('aberto');
  const [selectedTechnician, setSelectedTechnician] = useState<string>('');

  const ticket = tickets.find(t => t.id === id);

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
  if (user?.role === 'user' && ticket.createdBy.id !== user.id) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">Você não tem permissão para ver este chamado</p>
        <button onClick={() => navigate('/tickets')} className="btn-primary mt-4">
          Voltar para lista
        </button>
      </div>
    );
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

  const handleUpdateStatus = () => {
    if (ticket && selectedStatus) {
      updateTicket(ticket.id, { status: selectedStatus });
      setShowStatusModal(false);
    }
  };

  // Carregar todos os usuários (mockUsers + usuários criados) para obter técnicos
  const allUsers = (() => {
    const savedUsers = localStorage.getItem('allUsers');
    if (savedUsers) {
      try {
        return JSON.parse(savedUsers);
      } catch {
        return mockUsers;
      }
    }
    return mockUsers;
  })();
  
  const allTechnicians = allUsers.filter((u: any) => u.role === 'technician');

  const handleAssignTechnician = () => {
    if (ticket) {
      if (selectedTechnician) {
        const technician = allTechnicians.find((u: any) => u.id === selectedTechnician);
        if (technician) {
          updateTicket(ticket.id, { assignedTo: technician });
        }
      } else {
        // Remover atribuição
        updateTicket(ticket.id, { assignedTo: undefined });
      }
      setShowAssignModal(false);
      setSelectedTechnician('');
    }
  };

  const handleCloseTicket = () => {
    if (ticket) {
      updateTicket(ticket.id, { status: 'encerrado' });
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
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-2">
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

          <div className="card dark:bg-gray-800 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Comentários</h2>
            </div>

            <div className="space-y-4 mb-6">
              {ticket.comments && ticket.comments.length > 0 ? (
                ticket.comments.map((comment) => (
                  <div key={comment.id} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <UserAvatar user={comment.author} size="sm" />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">{comment.author.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{formatDate(comment.createdAt)}</p>
                      </div>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300">{comment.content}</p>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">Nenhum comentário ainda</p>
              )}
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Adicione um comentário..."
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 mb-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
              />
              <button onClick={handleAddComment} className="btn-primary">
                Adicionar Comentário
              </button>
            </div>
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
            </div>
          </div>

          <div className="card dark:bg-gray-800 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Ações</h2>
            <div className="space-y-2">
              {hasPermission('edit:ticket') && (
                <button 
                  onClick={() => {
                    if (ticket) {
                      setSelectedStatus(ticket.status);
                      setShowStatusModal(true);
                    }
                  }}
                  className="w-full btn-primary"
                >
                  Atualizar Status
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
                <option value="aberto">Aberto</option>
                <option value="em_andamento">Em Andamento</option>
                <option value="em_atendimento">Em Atendimento</option>
                <option value="pendente">Pendente</option>
                <option value="resolvido">Resolvido</option>
                <option value="fechado">Fechado</option>
                <option value="encerrado">Encerrado</option>
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
    </div>
  );
}


