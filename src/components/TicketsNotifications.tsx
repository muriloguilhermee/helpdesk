import { useEffect, useRef } from 'react';
import { useTickets } from '../contexts/TicketsContext';
import { useNotifications } from '../contexts/NotificationsContext';
import { useAuth } from '../contexts/AuthContext';
import { Ticket } from '../types';

export function TicketsNotifications() {
  const { tickets } = useTickets();
  const { addNotification } = useNotifications();
  const { user } = useAuth();
  const previousTicketsRef = useRef<Map<string, Ticket>>(new Map());
  const isInitialMount = useRef(true);

  useEffect(() => {
    if (isInitialMount.current) {
      // Primeira vez - salvar estado inicial
      tickets.forEach(ticket => {
        previousTicketsRef.current.set(ticket.id, ticket);
      });
      isInitialMount.current = false;
      return;
    }

    const currentTicketsMap = new Map(tickets.map(t => [t.id, t]));

    // Verificar novos tickets
    tickets.forEach(ticket => {
      if (!previousTicketsRef.current.has(ticket.id)) {
        // Novo ticket criado - notificar apenas se for do usuário ou se for técnico e não atribuído
        if (user) {
          const isMyTicket = ticket.createdBy.id === user.id || ticket.client?.id === user.id;
          const isTechnicianUnassigned = user.role === 'technician' && !ticket.assignedTo;
          const isAdmin = user.role === 'admin';
          
          if (isMyTicket || isTechnicianUnassigned || isAdmin) {
            addNotification({
              type: 'ticket_created',
              title: 'Novo chamado criado',
              message: `Chamado "${ticket.title}" foi criado`,
              ticketId: ticket.id,
              ticketTitle: ticket.title,
            });
          }
        }
      } else {
        const previousTicket = previousTicketsRef.current.get(ticket.id)!;
        
        // Verificar mudanças de status - apenas para usuários relacionados
        if (previousTicket.status !== ticket.status && user) {
          const isMyTicket = ticket.createdBy.id === user.id || ticket.client?.id === user.id;
          const isAssignedToMe = ticket.assignedTo?.id === user.id;
          const isTechnicianUnassigned = user.role === 'technician' && !ticket.assignedTo;
          const isAdmin = user.role === 'admin';
          
          if (isMyTicket || isAssignedToMe || isTechnicianUnassigned || isAdmin) {
            if (ticket.status === 'fechado') {
              addNotification({
                type: 'ticket_closed',
                title: 'Chamado fechado',
                message: `Chamado "${ticket.title}" foi fechado`,
                ticketId: ticket.id,
                ticketTitle: ticket.title,
              });
            } else {
              addNotification({
                type: 'ticket_updated',
                title: 'Chamado atualizado',
                message: `Status do chamado "${ticket.title}" foi alterado para ${ticket.status}`,
                ticketId: ticket.id,
                ticketTitle: ticket.title,
              });
            }
          }
        }

        // Verificar mudanças de atribuição - notificar apenas o técnico atribuído
        if (previousTicket.assignedTo?.id !== ticket.assignedTo?.id && user) {
          if (ticket.assignedTo) {
            // Notificar apenas o técnico que foi atribuído
            if (ticket.assignedTo.id === user.id || user.role === 'admin') {
              addNotification({
                type: 'ticket_assigned',
                title: 'Chamado atribuído',
                message: `Chamado "${ticket.title}" foi atribuído a ${ticket.assignedTo.name}`,
                ticketId: ticket.id,
                ticketTitle: ticket.title,
                userId: ticket.assignedTo.id,
                userName: ticket.assignedTo.name,
              });
            }
          }
        }

        // Verificar novas interações (comentários) - apenas para usuários relacionados
        const previousInteractionsCount = previousTicket.interactions?.length || 0;
        const currentInteractionsCount = ticket.interactions?.length || 0;
        if (currentInteractionsCount > previousInteractionsCount && user) {
          const newInteraction = ticket.interactions?.[ticket.interactions.length - 1];
          if (newInteraction && newInteraction.type === 'user') {
            const isMyTicket = ticket.createdBy.id === user.id || ticket.client?.id === user.id;
            const isAssignedToMe = ticket.assignedTo?.id === user.id;
            const isTechnicianUnassigned = user.role === 'technician' && !ticket.assignedTo;
            const isAdmin = user.role === 'admin';
            const isNotMyInteraction = newInteraction.author.id !== user.id;
            
            // Notificar apenas se não for a própria interação e se o usuário está relacionado ao ticket
            if (isNotMyInteraction && (isMyTicket || isAssignedToMe || isTechnicianUnassigned || isAdmin)) {
              addNotification({
                type: 'comment_added',
                title: 'Nova interação',
                message: `${newInteraction.author.name} interagiu no chamado "${ticket.title}"`,
                ticketId: ticket.id,
                ticketTitle: ticket.title,
                userId: newInteraction.author.id,
                userName: newInteraction.author.name,
              });
            }
          }
        }
      }
    });

    // Atualizar referência
    previousTicketsRef.current = new Map(tickets.map(t => [t.id, t]));
  }, [tickets, addNotification]);

  return null;
}


