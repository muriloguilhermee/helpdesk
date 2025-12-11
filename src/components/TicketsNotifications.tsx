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
        // Novo ticket criado - notificar TODOS os técnicos se o ticket não estiver atribuído
        if (user) {
          const isMyTicket = ticket.createdBy.id === user.id || ticket.client?.id === user.id;
          // Técnicos devem ser notificados de TODOS os tickets não atribuídos (status aberto)
          const isTechnicianUnassigned = user.role === 'technician' && !ticket.assignedTo && (ticket.status === 'aberto' || ticket.status === 'pendente');
          const isAdmin = user.role === 'admin';

          if (isMyTicket || isTechnicianUnassigned || isAdmin) {
            addNotification({
              type: 'ticket_created',
              title: 'Novo chamado criado',
              message: `Chamado "${ticket.title}" foi criado${!ticket.assignedTo ? ' e está aguardando atribuição' : ''}`,
              ticketId: ticket.id,
              ticketTitle: ticket.title,
            });

            // Tocar som de notificação para técnicos quando um novo ticket não atribuído é criado
            if (isTechnicianUnassigned) {
              try {
                const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();

                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);

                // Som de notificação (dois beeps)
                oscillator.frequency.value = 800;
                oscillator.type = 'sine';

                gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.2);

                // Segundo beep
                setTimeout(() => {
                  const oscillator2 = audioContext.createOscillator();
                  const gainNode2 = audioContext.createGain();

                  oscillator2.connect(gainNode2);
                  gainNode2.connect(audioContext.destination);

                  oscillator2.frequency.value = 1000;
                  oscillator2.type = 'sine';

                  gainNode2.gain.setValueAtTime(0.3, audioContext.currentTime);
                  gainNode2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

                  oscillator2.start(audioContext.currentTime);
                  oscillator2.stop(audioContext.currentTime + 0.2);
                }, 250);
              } catch (error) {
                console.warn('Não foi possível tocar o som de notificação:', error);
              }

              // Mostrar notificação do navegador (se permitido)
              if ('Notification' in window && Notification.permission === 'granted') {
                new Notification('Novo Chamado Disponível', {
                  body: `Chamado "${ticket.title}" está aguardando atribuição`,
                  icon: '/vite.svg',
                  tag: `ticket-${ticket.id}`,
                });
              } else if ('Notification' in window && Notification.permission === 'default') {
                Notification.requestPermission();
              }
            }
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
            if (newInteraction.author) {
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
      }
    });

    // Atualizar referência
    previousTicketsRef.current = new Map(tickets.map(t => [t.id, t]));
  }, [tickets, addNotification]);

  return null;
}


