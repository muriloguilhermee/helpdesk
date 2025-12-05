import { useState } from 'react';
import { ArrowLeft, MessageSquare, User, Calendar, Tag, Trash2, AlertTriangle, Paperclip, Download, File } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTickets } from '../contexts/TicketsContext';
import { getStatusColor, getPriorityColor } from '../utils/statusColors';
import { formatDate } from '../utils/formatDate';
import { formatFileSize } from '../utils/formatFileSize';
import { UserAvatar } from '../utils/userAvatar';

export default function TicketDetails() {
  const { hasPermission, user } = useAuth();
  const { tickets, deleteTicket } = useTickets();
  const { id } = useParams();
  const navigate = useNavigate();
  const [comment, setComment] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const ticket = tickets.find(t => t.id === id);

  if (!ticket) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Chamado não encontrado</p>
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
        <p className="text-gray-500">Você não tem permissão para ver este chamado</p>
        <button onClick={() => navigate('/tickets')} className="btn-primary mt-4">
          Voltar para lista
        </button>
      </div>
    );
  }

  const handleAddComment = () => {
    if (comment.trim()) {
      // Aqui você adicionaria a lógica para salvar o comentário
      console.log('Novo comentário:', comment);
      setComment('');
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
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/tickets')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">{ticket.title}</h1>
          <div className="flex items-center gap-3 mt-2">
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
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Descrição</h2>
            <p className="text-gray-700 whitespace-pre-wrap">{ticket.description}</p>
          </div>

          {/* Arquivos Anexados */}
          {ticket.files && ticket.files.length > 0 && (
            <div className="card">
              <div className="flex items-center gap-2 mb-4">
                <Paperclip className="w-5 h-5 text-gray-600" />
                <h2 className="text-xl font-semibold text-gray-900">Arquivos Anexados</h2>
                <span className="text-sm text-gray-500">({ticket.files.length})</span>
              </div>
              <div className="space-y-2">
                {ticket.files.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <File className="w-5 h-5 text-gray-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                        <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
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

          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="w-5 h-5 text-gray-600" />
              <h2 className="text-xl font-semibold text-gray-900">Comentários</h2>
            </div>

            <div className="space-y-4 mb-6">
              {ticket.comments && ticket.comments.length > 0 ? (
                ticket.comments.map((comment) => (
                  <div key={comment.id} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <UserAvatar user={comment.author} size="sm" />
                      <div>
                        <p className="font-medium text-gray-900">{comment.author.name}</p>
                        <p className="text-xs text-gray-500">{formatDate(comment.createdAt)}</p>
                      </div>
                    </div>
                    <p className="text-gray-700">{comment.content}</p>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">Nenhum comentário ainda</p>
              )}
            </div>

            <div className="border-t border-gray-200 pt-4">
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Adicione um comentário..."
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 mb-3"
              />
              <button onClick={handleAddComment} className="btn-primary">
                Adicionar Comentário
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Informações</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Criado por</p>
                  <p className="font-medium text-gray-900">{ticket.createdBy.name}</p>
                </div>
              </div>

              {ticket.assignedTo && (
                <div className="flex items-start gap-3">
                  <User className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Atribuído a</p>
                    <p className="font-medium text-gray-900">{ticket.assignedTo.name}</p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Criado em</p>
                  <p className="font-medium text-gray-900">{formatDate(ticket.createdAt)}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Atualizado em</p>
                  <p className="font-medium text-gray-900">{formatDate(ticket.updatedAt)}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Tag className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Categoria</p>
                  <p className="font-medium text-gray-900 capitalize">{ticket.category}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Ações</h2>
            <div className="space-y-2">
              {hasPermission('edit:ticket') && (
                <button className="w-full btn-primary">Atualizar Status</button>
              )}
              {hasPermission('assign:ticket') && (
                <button className="w-full btn-secondary">Atribuir Técnico</button>
              )}
              {hasPermission('edit:ticket') && (
                <button className="w-full btn-secondary">Fechar Chamado</button>
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Excluir Chamado</h2>
                <p className="text-sm text-gray-600 mt-1">Esta ação não pode ser desfeita</p>
              </div>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-gray-700">
                Tem certeza que deseja excluir o chamado <strong>"{ticket?.title}"</strong>?
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
    </div>
  );
}


