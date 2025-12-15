import { Bell, X, CheckCheck, Trash2, Ticket, User as UserIcon, LogIn, LogOut, MessageSquare, UserCheck } from 'lucide-react';
import { useState, useRef, useEffect, useMemo } from 'react';
import { useNotifications } from '../contexts/NotificationsContext';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { formatDate } from '../utils/formatDate';
import { useTickets } from '../contexts/TicketsContext';

export default function NotificationsDropdown() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll } = useNotifications();
  const { user } = useAuth();
  const { tickets } = useTickets();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'login':
        return <LogIn className="w-5 h-5 text-green-600 dark:text-green-400" />;
      case 'logout':
        return <LogOut className="w-5 h-5 text-gray-600 dark:text-gray-400" />;
      case 'ticket_created':
        return <Ticket className="w-5 h-5 text-blue-600 dark:text-blue-400" />;
      case 'ticket_updated':
        return <Ticket className="w-5 h-5 text-orange-600 dark:text-orange-400" />;
      case 'ticket_closed':
        return <Ticket className="w-5 h-5 text-red-600 dark:text-red-400" />;
      case 'ticket_assigned':
        return <UserCheck className="w-5 h-5 text-purple-600 dark:text-purple-400" />;
      case 'comment_added':
        return <MessageSquare className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />;
      default:
        return <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />;
    }
  };

  // Filtrar notificações baseado no usuário logado
  const filteredNotifications = useMemo(() => {
    if (!user) return [];

    // Admin vê todas as notificações
    if (user.role === 'admin') {
      return notifications;
    }

    return notifications.filter(notification => {
      // Notificações de login/logout sempre aparecem
      if (notification.type === 'login' || notification.type === 'logout') {
        return notification.userId === user.id;
      }

      // Para notificações de tickets, verificar se o usuário está relacionado
      if (notification.ticketId) {
        const ticket = tickets.find(t => t.id === notification.ticketId);
        if (!ticket) return false;

        // Usuário comum: apenas seus próprios tickets
        if (user.role === 'user') {
          return ticket.createdBy.id === user.id || ticket.client?.id === user.id;
        }

        // Técnico: tickets atribuídos a ele ou não atribuídos
        if (user.role === 'technician' || user.role === 'technician_n2') {
          const isAssignedToMe = ticket.assignedTo?.id === user.id;
          const isNotAssigned = !ticket.assignedTo;
          const isMyTicket = ticket.createdBy.id === user.id;

          // Notificação de atribuição: apenas se foi atribuído a ele
          if (notification.type === 'ticket_assigned') {
            return notification.userId === user.id;
          }

          // Outras notificações: se está atribuído a ele ou não atribuído
          return isAssignedToMe || isNotAssigned || isMyTicket;
        }
      }

      return false;
    });
  }, [notifications, user, tickets]);

  const filteredUnreadCount = filteredNotifications.filter(n => !n.read).length;

  const handleNotificationClick = (notification: any) => {
    markAsRead(notification.id);
    if (notification.ticketId) {
      navigate(`/tickets/${notification.ticketId}`);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
      >
        <Bell className="w-5 h-5" />
        {filteredUnreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        )}
        {filteredUnreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {filteredUnreadCount > 9 ? '9+' : filteredUnreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 max-h-[500px] flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Notificações
              {filteredUnreadCount > 0 && (
                <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                  ({filteredUnreadCount} não lidas)
                </span>
              )}
            </h3>
            <div className="flex items-center gap-2">
              {filteredUnreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="p-1 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                  title="Marcar todas como lidas"
                >
                  <CheckCheck className="w-4 h-4" />
                </button>
              )}
              {filteredNotifications.length > 0 && (
                <button
                  onClick={clearAll}
                  className="p-1 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                  title="Limpar todas"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="overflow-y-auto flex-1">
            {filteredNotifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400">Nenhuma notificação</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer ${
                      !notification.read ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {notification.title}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                          {formatDate(notification.createdAt)}
                        </p>
                      </div>
                      {!notification.read && (
                        <div className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}




