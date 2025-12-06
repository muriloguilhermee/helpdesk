import { useEffect, useRef } from 'react';
import { useTickets } from '../contexts/TicketsContext';
import { useNotifications } from '../contexts/NotificationsContext';
import { Ticket } from '../types';

export function TicketsNotifications() {
  const { tickets } = useTickets();
  const { addNotification } = useNotifications();
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
        // Novo ticket criado
        addNotification({
          type: 'ticket_created',
          title: 'Novo chamado criado',
          message: `Chamado "${ticket.title}" foi criado`,
          ticketId: ticket.id,
          ticketTitle: ticket.title,
        });
      } else {
        const previousTicket = previousTicketsRef.current.get(ticket.id)!;
        
        // Verificar mudanças de status
        if (previousTicket.status !== ticket.status) {
          if (ticket.status === 'fechado' || ticket.status === 'encerrado') {
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

        // Verificar mudanças de atribuição
        if (previousTicket.assignedTo?.id !== ticket.assignedTo?.id) {
          if (ticket.assignedTo) {
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

        // Verificar novos comentários
        const previousCommentsCount = previousTicket.comments?.length || 0;
        const currentCommentsCount = ticket.comments?.length || 0;
        if (currentCommentsCount > previousCommentsCount) {
          const newComment = ticket.comments?.[ticket.comments.length - 1];
          if (newComment) {
            addNotification({
              type: 'comment_added',
              title: 'Novo comentário',
              message: `${newComment.author.name} comentou no chamado "${ticket.title}"`,
              ticketId: ticket.id,
              ticketTitle: ticket.title,
              userId: newComment.author.id,
              userName: newComment.author.name,
            });
          }
        }
      }
    });

    // Atualizar referência
    previousTicketsRef.current = new Map(tickets.map(t => [t.id, t]));
  }, [tickets, addNotification]);

  return null;
}

