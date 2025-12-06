import { useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationsContext';

export function AuthNotifications() {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const previousUserRef = useRef<string | null>(null);

  useEffect(() => {
    // Verificar se é a primeira renderização
    if (previousUserRef.current === null && user) {
      // Primeira vez carregando - apenas salvar o ID
      previousUserRef.current = user.id;
      return;
    }

    if (user && previousUserRef.current !== user.id) {
      // Novo login detectado
      addNotification({
        type: 'login',
        title: 'Usuário fez login',
        message: `${user.name} entrou no sistema`,
        userId: user.id,
        userName: user.name,
      });
      previousUserRef.current = user.id;
    } else if (!user && previousUserRef.current !== null) {
      // Logout detectado
      const previousUserId = previousUserRef.current;
      addNotification({
        type: 'logout',
        title: 'Usuário fez logout',
        message: 'Um usuário saiu do sistema',
        userId: previousUserId,
      });
      previousUserRef.current = null;
    }
  }, [user, addNotification]);

  return null;
}

