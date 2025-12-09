import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Activity,
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingUp,
  Users,
  Bell,
  Award,
  ArrowRight,
  History,
  X,
  GitBranch,
  Zap,
  RefreshCw,
  BarChart3
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTickets } from '../contexts/TicketsContext';
import { Ticket, User as UserType } from '../types';
import { getStatusColor, getPriorityColor, getStatusLabel, getStatusIcon } from '../utils/statusColors';
import { formatDate } from '../utils/formatDate';
import { UserAvatar } from '../utils/userAvatar';
import { api } from '../services/api';
import { database } from '../services/database';
import { mockUsers } from '../data/mockData';

export default function LiveMonitor() {
  const { user, hasPermission } = useAuth();
  const { tickets, updateTicket } = useTickets();
  const [isLive, setIsLive] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(3000); // 3 segundos
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [newTicketsCount, setNewTicketsCount] = useState(0);
  const [recentActivity, setRecentActivity] = useState<Array<{
    type: 'created' | 'updated' | 'status_changed' | 'assigned' | 'queue_transfer' | 'interaction_added' | 'accepted';
    ticket: Ticket;
    timestamp: Date;
    oldStatus?: string;
    newStatus?: string;
    oldAssignee?: UserType;
    newAssignee?: UserType;
    oldQueue?: string;
    newQueue?: string;
    interaction?: any;
  }>>([]);
  const [technicians, setTechnicians] = useState<UserType[]>([]);
  const [technicianPerformance, setTechnicianPerformance] = useState<Record<string, {
    total: number;
    resolvidos: number;
    emAndamento: number;
    abertos: number;
    taxaResolucao: number;
    tempoMedioResolucao: number; // em dias
  }>>({});
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [statusTransitions, setStatusTransitions] = useState<Record<string, Record<string, number>>>({});

  const previousTicketsRef = useRef<Ticket[]>([]);
  const notificationSoundRef = useRef<HTMLAudioElement | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState(false);

  // Verificar se é admin - usar Navigate ao invés de window.location
  // Isso será tratado no render abaixo

  // Inicializar com tickets do contexto imediatamente
  useEffect(() => {
    if (tickets.length > 0) {
      if (previousTicketsRef.current.length === 0) {
        previousTicketsRef.current = tickets;
      }
      setIsLoading(false);
    }
  }, [tickets]);

  // Carregar técnicos
  useEffect(() => {
    const loadTechnicians = async () => {
      try {
        await database.init();
        const allUsers = await database.getUsers();

        // Filtrar apenas técnicos que NÃO são mockados
        const mockUserEmails = new Set(mockUsers.map(u => u.email.toLowerCase()));
        const customTechnicians = allUsers.filter((u: any) =>
          u.role === 'technician' && !mockUserEmails.has(u.email.toLowerCase())
        );

        // Ordenar técnicos alfabeticamente
        const sortedTechnicians = [...customTechnicians].sort((a: any, b: any) =>
          a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' })
        );

        setTechnicians(sortedTechnicians);
      } catch (error) {
        console.error('Erro ao carregar técnicos:', error);
        setTechnicians([]);
      }
    };

    loadTechnicians();
  }, []);

  // Calcular performance dos técnicos
  const calculatePerformance = useCallback(() => {
    if (technicians.length === 0) return;

    const ticketsToUse = previousTicketsRef.current.length > 0
      ? previousTicketsRef.current
      : tickets;

    const performance: Record<string, {
      total: number;
      resolvidos: number;
      emAndamento: number;
      abertos: number;
      taxaResolucao: number;
      tempoMedioResolucao: number;
    }> = {};

    technicians.forEach((tech) => {
      // Buscar todos os tickets atribuídos a este técnico
      const techTickets = ticketsToUse.filter(t => t.assignedTo?.id === tech.id);

      const resolvidos = techTickets.filter(t => t.status === 'resolvido');
      const emAndamento = techTickets.filter(t => t.status === 'em_andamento');
      const abertos = techTickets.filter(t => t.status === 'aberto');

      // Calcular tempo médio de resolução (em dias)
      let tempoMedio = 0;
      if (resolvidos.length > 0) {
        const tempos: number[] = [];
        resolvidos.forEach(ticket => {
          const createdAt = ticket.createdAt instanceof Date ? ticket.createdAt : new Date(ticket.createdAt);
          const updatedAt = ticket.updatedAt instanceof Date ? ticket.updatedAt : new Date(ticket.updatedAt);
          const diffMs = updatedAt.getTime() - createdAt.getTime();
          const diffDays = diffMs / (1000 * 60 * 60 * 24);
          tempos.push(diffDays);
        });
        tempoMedio = tempos.reduce((a, b) => a + b, 0) / tempos.length;
      }

      performance[tech.id] = {
        total: techTickets.length,
        resolvidos: resolvidos.length,
        emAndamento: emAndamento.length,
        abertos: abertos.length,
        taxaResolucao: techTickets.length > 0 ? (resolvidos.length / techTickets.length) * 100 : 0,
        tempoMedioResolucao: tempoMedio,
      };
    });

    setTechnicianPerformance(performance);
  }, [technicians, tickets]);

  useEffect(() => {
    calculatePerformance();
  }, [calculatePerformance]);

  // Atualizar performance quando os tickets mudarem via API
  useEffect(() => {
    if (previousTicketsRef.current.length > 0) {
      calculatePerformance();
    }
  }, [lastUpdate, calculatePerformance]);

  // Ordenar técnicos por performance (mais resolvidos primeiro)
  const sortedTechnicians = useMemo(() => {
    return [...technicians].sort((a, b) => {
      const perfA = technicianPerformance[a.id];
      const perfB = technicianPerformance[b.id];
      if (!perfA && !perfB) return 0;
      if (!perfA) return 1;
      if (!perfB) return -1;
      return perfB.resolvidos - perfA.resolvidos;
    });
  }, [technicians, technicianPerformance]);

  // Detectar mudanças e criar atividades
  const detectChanges = useCallback((oldTickets: Ticket[], updatedTickets: Ticket[]) => {
    // Não fazer nada se não houver tickets para comparar
    if (oldTickets.length === 0 || updatedTickets.length === 0) {
      return;
    }

    console.log('🔍 Detectando mudanças...', {
      oldTicketsCount: oldTickets.length,
      updatedTicketsCount: updatedTickets.length,
    });

    const activities: Array<{
      type: 'created' | 'updated' | 'status_changed' | 'assigned' | 'queue_transfer' | 'interaction_added' | 'accepted';
      ticket: Ticket;
      timestamp: Date;
      oldStatus?: string;
      newStatus?: string;
      oldAssignee?: UserType;
      newAssignee?: UserType;
      oldQueue?: string;
      newQueue?: string;
      interaction?: any;
    }> = [];

    const transitions: Record<string, Record<string, number>> = {};

    // Novos tickets
    const createdTickets = updatedTickets.filter(
      nt => !oldTickets.find(ot => ot.id === nt.id)
    );
    createdTickets.forEach(ticket => {
      activities.push({
        type: 'created',
        ticket,
        timestamp: new Date(),
      });
      setNewTicketsCount(prev => prev + 1);
      playNotificationSound();
    });

    // Verificar cada ticket atualizado
    updatedTickets.forEach(newTicket => {
      const oldTicket = oldTickets.find(ot => ot.id === newTicket.id);
      if (!oldTicket) return; // Ticket novo já foi tratado acima

      // Verificar se realmente houve mudança comparando campos importantes
      const hasStatusChange = oldTicket.status !== newTicket.status;
      const hasAssignmentChange = oldTicket.assignedTo?.id !== newTicket.assignedTo?.id;
      const hasQueueChange = (oldTicket.queue || '') !== (newTicket.queue || '');
      const oldInteractionsCount = (oldTicket.interactions || []).length;
      const newInteractionsCount = (newTicket.interactions || []).length;
      const hasInteractionChange = newInteractionsCount > oldInteractionsCount;

      // Se não houver nenhuma mudança relevante, pular
      if (!hasStatusChange && !hasAssignmentChange && !hasQueueChange && !hasInteractionChange) {
        return;
      }

      // Mudanças de status
      if (oldTicket.status !== newTicket.status) {
        console.log('✅ Mudança de status detectada:', {
          ticketId: newTicket.id,
          from: oldTicket.status,
          to: newTicket.status,
        });
        activities.push({
          type: 'status_changed',
          ticket: newTicket,
          timestamp: new Date(),
          oldStatus: oldTicket.status,
          newStatus: newTicket.status,
        });

        // Registrar transição
        const fromStatus = oldTicket.status;
        const toStatus = newTicket.status;

        if (!transitions[fromStatus]) {
          transitions[fromStatus] = {};
        }
        transitions[fromStatus][toStatus] = (transitions[fromStatus][toStatus] || 0) + 1;

        console.log('📊 Transição registrada:', { from: fromStatus, to: toStatus, count: transitions[fromStatus][toStatus] });

        playNotificationSound();
      }

      // Atribuições
      const oldAssigned = oldTicket.assignedTo?.id;
      const newAssigned = newTicket.assignedTo?.id;
      if (oldAssigned !== newAssigned) {
        activities.push({
          type: 'assigned',
          ticket: newTicket,
          timestamp: new Date(),
          oldAssignee: oldTicket.assignedTo,
          newAssignee: newTicket.assignedTo,
        });
        playNotificationSound();
      }

      // Transferências de fila
      const oldQueue = oldTicket.queue || 'Sem atribuição';
      const newQueue = newTicket.queue || 'Sem atribuição';
      if (oldQueue !== newQueue) {
        console.log('✅ Transferência de fila detectada:', {
          ticketId: newTicket.id,
          from: oldQueue,
          to: newQueue,
        });
        activities.push({
          type: 'queue_transfer',
          ticket: newTicket,
          timestamp: new Date(),
          oldQueue: oldQueue,
          newQueue: newQueue,
        });
        playNotificationSound();
      }

      // Novas interações
      const oldInteractions = oldTicket.interactions || [];
      const newInteractions = newTicket.interactions || [];
      if (newInteractions.length > oldInteractions.length) {
        console.log('✅ Novas interações detectadas:', {
          ticketId: newTicket.id,
          oldCount: oldInteractions.length,
          newCount: newInteractions.length,
        });
        // Encontrar novas interações
        const newInteractionIds = new Set(newInteractions.map((i: any) => i.id));
        const oldInteractionIds = new Set(oldInteractions.map((i: any) => i.id));
        const addedInteractions = newInteractions.filter((i: any) => !oldInteractionIds.has(i.id));

        addedInteractions.forEach((interaction: any) => {
          // Verificar tipo de interação
          if (interaction.type === 'queue_transfer') {
            // Já foi detectado acima como queue_transfer
            return;
          } else if (interaction.type === 'status_change') {
            // Já foi detectado acima como status_changed
            return;
          } else if (interaction.type === 'assignment') {
            // Já foi detectado acima como assigned
            return;
          } else {
            // Nova interação (comentário, nota interna, etc)
            console.log('✅ Nova interação adicionada:', {
              ticketId: newTicket.id,
              type: interaction.type,
              content: interaction.content?.substring(0, 50),
            });
            activities.push({
              type: 'interaction_added',
              ticket: newTicket,
              timestamp: interaction.createdAt instanceof Date ? interaction.createdAt : new Date(interaction.createdAt),
              interaction: interaction,
            });
          }
        });
      }

      // Aceitar chamado (quando status muda de "aberto" ou "pendente" para "em_atendimento" e há atribuição)
      if (
        (oldTicket.status === 'aberto' || oldTicket.status === 'pendente') &&
        newTicket.status === 'em_atendimento' &&
        newTicket.assignedTo &&
        (!oldTicket.assignedTo || oldTicket.assignedTo.id !== newTicket.assignedTo.id)
      ) {
        activities.push({
          type: 'accepted',
          ticket: newTicket,
          timestamp: new Date(),
          newAssignee: newTicket.assignedTo,
        });
        playNotificationSound();
      }
    });

    // Atualizar transições de status
    if (Object.keys(transitions).length > 0) {
      console.log('📈 Transições de status detectadas:', transitions);
      setStatusTransitions(prev => {
        const updated = { ...prev };
        Object.keys(transitions).forEach(from => {
          if (!updated[from]) updated[from] = {};
          Object.keys(transitions[from]).forEach(to => {
            updated[from][to] = (updated[from][to] || 0) + transitions[from][to];
          });
        });
        console.log('📊 Status transitions atualizado:', updated);
        return updated;
      });
    }

    // Adicionar novas atividades ao início da lista
    if (activities.length > 0) {
      console.log('📊 Atividades detectadas:', activities.length, activities.map(a => a.type));
      setRecentActivity(prev => [...activities, ...prev].slice(0, 100)); // Aumentar para 100
    } else {
      console.log('ℹ️ Nenhuma atividade nova detectada');
    }
  }, []);

  // Tocar som de notificação
  const playNotificationSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.1);
    } catch (error) {
      console.warn('Não foi possível tocar som:', error);
    }
  };

  // Monitorar mudanças nos tickets do contexto em tempo real
  useEffect(() => {
    if (!isLive) return;

    // Detectar mudanças sempre que os tickets mudarem
    if (tickets.length > 0 && previousTicketsRef.current.length > 0) {
      detectChanges(previousTicketsRef.current, tickets);
      previousTicketsRef.current = [...tickets]; // Criar nova cópia
    } else if (tickets.length > 0 && previousTicketsRef.current.length === 0) {
      // Primeira carga
      previousTicketsRef.current = [...tickets]; // Criar nova cópia
    }
  }, [tickets, isLive, detectChanges]);

  // Carregar tickets periodicamente
  useEffect(() => {
    if (!isLive) return;

    const fetchTickets = async () => {
      try {
        const updatedTickets = await api.getTickets();
        // Transformar resposta da API para formato Ticket
        const transformedTickets = updatedTickets.map((t: any) => ({
          id: t.id,
          title: t.title,
          description: t.description,
          status: t.status,
          priority: t.priority,
          category: t.category,
          serviceType: t.service_type,
          totalValue: t.total_value ? parseFloat(t.total_value) : undefined,
          createdBy: t.created_by_user || { id: t.created_by, name: '', email: '', role: 'user' },
          assignedTo: t.assigned_to_user,
          client: t.client_user,
          queue: t.queue_name || t.queue,
          files: t.files || [],
          comments: t.comments || [],
          interactions: t.interactions || [],
          createdAt: new Date(t.created_at),
          updatedAt: new Date(t.updated_at),
        }));

        // Detectar mudanças
        detectChanges(previousTicketsRef.current, transformedTickets);
        previousTicketsRef.current = [...transformedTickets]; // Criar nova cópia
        setLastUpdate(new Date());
        setApiError(false);
        setIsLoading(false);
      } catch (error) {
        console.warn('⚠️ API não disponível, usando tickets do contexto local:', error);
        setApiError(true);
        // Usar tickets do contexto como fallback
        const currentTickets = tickets.length > 0 ? tickets : previousTicketsRef.current;
        if (currentTickets.length > 0) {
          // Só detectar mudanças se houver tickets anteriores para comparar
          if (previousTicketsRef.current.length > 0) {
            detectChanges(previousTicketsRef.current, currentTickets);
          }
          previousTicketsRef.current = currentTickets.map(t => ({ ...t })); // Criar cópia profunda
          setLastUpdate(new Date());
        }
        setIsLoading(false);
      }
    };

    // Primeira carga
    fetchTickets();
    const interval = setInterval(fetchTickets, refreshInterval);
    return () => clearInterval(interval);
  }, [isLive, refreshInterval, detectChanges]);

  // Estatísticas
  const stats = useMemo(() => {
    const ticketsToUse = previousTicketsRef.current.length > 0
      ? previousTicketsRef.current
      : tickets;

    const filtered = [...ticketsToUse];

    return {
      total: filtered.length,
      aberto: filtered.filter(t => t.status === 'aberto').length,
      em_atendimento: filtered.filter(t => t.status === 'em_atendimento').length,
      pendente: filtered.filter(t => t.status === 'pendente').length,
      resolvido: filtered.filter(t => t.status === 'resolvido').length,
      fechado: filtered.filter(t => t.status === 'fechado').length,
      critica: filtered.filter(t => t.priority === 'critica').length,
      alta: filtered.filter(t => t.priority === 'alta').length,
      media: filtered.filter(t => t.priority === 'media').length,
      baixa: filtered.filter(t => t.priority === 'baixa').length,
      semAtribuicao: filtered.filter(t => !t.assignedTo).length,
    };
  }, [tickets]);

  // Filtrar tickets - usar tickets do contexto ou da API
  const getFilteredTickets = (): Ticket[] => {
    const ticketsToUse = previousTicketsRef.current.length > 0
      ? previousTicketsRef.current
      : tickets;

    return [...ticketsToUse].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  };

  const filteredTickets = getFilteredTickets();

  // Limpar notificações
  const clearNotifications = () => {
    setNewTicketsCount(0);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Carregando...</p>
        </div>
      </div>
    );
  }

  if (user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">Acesso negado. Apenas administradores podem acessar esta página.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${isLive ? 'bg-red-100 dark:bg-red-900/30' : 'bg-gray-200 dark:bg-gray-700'}`}>
                <Activity className={`w-6 h-6 ${isLive ? 'text-red-600 dark:text-red-400 animate-pulse' : 'text-gray-500'}`} />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Monitor ao Vivo
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {isLive ? 'Ativo' : 'Pausado'} • Última atualização: {formatDate(lastUpdate)}
                  {apiError && (
                    <span className="ml-2 text-orange-600 dark:text-orange-400">
                      (Modo local - API não disponível)
                    </span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Notificações */}
              {newTicketsCount > 0 && (
                <button
                  onClick={clearNotifications}
                  className="relative p-2 bg-red-100 dark:bg-red-900/30 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                >
                  <Bell className="w-5 h-5 text-red-600 dark:text-red-400" />
                  <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {newTicketsCount}
                  </span>
                </button>
              )}

              {/* Controles */}
              <button
                onClick={() => setIsLive(!isLive)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  isLive
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {isLive ? 'Pausar' : 'Iniciar'}
              </button>

              <select
                value={refreshInterval}
                onChange={(e) => setRefreshInterval(Number(e.target.value))}
                className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm"
              >
                <option value={1000}>1s</option>
                <option value={3000}>3s</option>
                <option value={5000}>5s</option>
                <option value={10000}>10s</option>
              </select>
            </div>
          </div>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            icon={<AlertCircle className="w-6 h-6" />}
            label="Total"
            value={stats.total}
            color="blue"
          />
          <StatCard
            icon={<Clock className="w-6 h-6" />}
            label="Abertos"
            value={stats.aberto}
            color="yellow"
          />
          <StatCard
            icon={<Users className="w-6 h-6" />}
            label="Em Atendimento"
            value={stats.em_atendimento}
            color="blue"
          />
          <StatCard
            icon={<AlertCircle className="w-6 h-6" />}
            label="Críticos"
            value={stats.critica}
            color="red"
          />
        </div>

        {/* Performance dos Técnicos */}
        {sortedTechnicians.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Performance dos Técnicos</h2>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Técnico</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Total</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Resolvidos</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Em Andamento</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Abertos</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Taxa Resolução</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Tempo Médio</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedTechnicians.map((tech) => {
                    const perf = technicianPerformance[tech.id];
                    if (!perf) return null;

                    return (
                      <tr key={tech.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <UserAvatar user={tech} size="sm" />
                            <span className="font-medium text-gray-900 dark:text-gray-100">{tech.name}</span>
                          </div>
                        </td>
                        <td className="text-center py-3 px-4">
                          <span className="text-gray-900 dark:text-gray-100 font-semibold">{perf.total}</span>
                        </td>
                        <td className="text-center py-3 px-4">
                          <span className="text-green-600 dark:text-green-400 font-semibold">{perf.resolvidos}</span>
                        </td>
                        <td className="text-center py-3 px-4">
                          <span className="text-orange-600 dark:text-orange-400 font-semibold">{perf.emAndamento}</span>
                        </td>
                        <td className="text-center py-3 px-4">
                          <span className="text-yellow-600 dark:text-yellow-400 font-semibold">{perf.abertos}</span>
                        </td>
                        <td className="text-center py-3 px-4">
                          <span className={`font-semibold ${
                            perf.taxaResolucao >= 80 ? 'text-green-600 dark:text-green-400' :
                            perf.taxaResolucao >= 50 ? 'text-yellow-600 dark:text-yellow-400' :
                            'text-red-600 dark:text-red-400'
                          }`}>
                            {perf.taxaResolucao.toFixed(1)}%
                          </span>
                        </td>
                        <td className="text-center py-3 px-4">
                          <span className="text-gray-700 dark:text-gray-300">
                            {perf.tempoMedioResolucao > 0
                              ? `${perf.tempoMedioResolucao.toFixed(1)} dias`
                              : '-'
                            }
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Gráfico de Fluxo de Status */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <GitBranch className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Fluxo de Movimentações de Status
              </h2>
              {Object.keys(statusTransitions).length > 0 && (
                <span className="ml-auto text-sm text-gray-500 dark:text-gray-400">
                  {Object.values(statusTransitions).reduce((sum, toStatuses) =>
                    sum + Object.values(toStatuses).reduce((s: number, count: number) => s + count, 0), 0
                  )} movimentação{Object.values(statusTransitions).reduce((sum, toStatuses) =>
                    sum + Object.values(toStatuses).reduce((s: number, count: number) => s + count, 0), 0
                  ) !== 1 ? 'ões' : ''}
                </span>
              )}
            </div>
          </div>
          <div className="p-4">
            {Object.keys(statusTransitions).length > 0 ? (
              <StatusFlowChart transitions={statusTransitions} />
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <p>Nenhuma movimentação registrada ainda.</p>
                <p className="text-sm mt-2">As movimentações aparecerão aqui quando os chamados mudarem de status.</p>
                <p className="text-xs mt-2 text-gray-400 dark:text-gray-500">
                  Dica: Mude o status de um chamado para ver as movimentações aparecerem aqui.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lista de Chamados */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Chamados Recentes
                </h2>
              </div>
              <div className="divide-y divide-gray-200 dark:divide-gray-700 max-h-[600px] overflow-y-auto">
                {isLoading ? (
                  <div className="p-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
                    <p className="text-gray-500 dark:text-gray-400">Carregando chamados...</p>
                  </div>
                ) : (
                  <>
                    {filteredTickets.slice(0, 20).map((ticket) => (
                      <TicketCard
                        key={ticket.id}
                        ticket={ticket}
                        onViewHistory={() => setSelectedTicket(ticket)}
                      />
                    ))}
                    {filteredTickets.length === 0 && (
                      <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                        Nenhum chamado encontrado
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Atividades Recentes */}
          <div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Atividades Recentes
                </h2>
              </div>
              <div className="p-4 max-h-[600px] overflow-y-auto">
                {recentActivity.length === 0 ? (
                  <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                    Nenhuma atividade recente
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentActivity.map((activity, index) => (
                      <ActivityItem key={index} activity={activity} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Modal de Histórico do Chamado */}
        {selectedTicket && (
          <TicketHistoryModal
            ticket={selectedTicket}
            onClose={() => setSelectedTicket(null)}
          />
        )}
      </div>
    </div>
  );
}

// Componente de Card de Estatística
function StatCard({ icon, label, value, color }: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: 'blue' | 'red' | 'yellow' | 'green';
}) {
  const colorClasses = {
    blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    red: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
    yellow: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400',
    green: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">{label}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

// Componente de Card de Ticket
function TicketCard({ ticket, onViewHistory }: { ticket: Ticket; onViewHistory: () => void }) {
  const StatusIcon = getStatusIcon(ticket.status);
  const statusColor = getStatusColor(ticket.status);
  const priorityColor = getPriorityColor(ticket.priority);

  return (
    <div className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Link
              to={`/tickets/${ticket.id}`}
              className="text-sm font-medium text-gray-900 dark:text-white hover:underline"
            >
              #{ticket.id}
            </Link>
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColor}`}>
              {getStatusLabel(ticket.status)}
            </span>
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${priorityColor}`}>
              {ticket.priority}
            </span>
          </div>
          <h3 className="font-medium text-gray-900 dark:text-white mb-1">
            {ticket.title}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
            {ticket.description}
          </p>
        </div>
        <StatusIcon className={`w-5 h-5 ${statusColor.includes('text-') ? statusColor.split(' ')[0] : 'text-gray-400'}`} />
      </div>
      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          {ticket.createdBy && (
            <UserAvatar user={ticket.createdBy} size="sm" />
          )}
          <span>{ticket.createdBy?.name || 'Desconhecido'}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 dark:text-gray-400">{formatDate(ticket.updatedAt)}</span>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onViewHistory();
            }}
            className="p-1.5 text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded transition-colors border border-primary-200 dark:border-primary-800"
            title="Ver histórico completo do chamado"
          >
            <History className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Componente de Item de Atividade
function ActivityItem({ activity }: {
  activity: {
    type: 'created' | 'updated' | 'status_changed' | 'assigned' | 'queue_transfer' | 'interaction_added' | 'accepted';
    ticket: Ticket;
    timestamp: Date;
    oldStatus?: string;
    newStatus?: string;
    oldAssignee?: UserType;
    newAssignee?: UserType;
    oldQueue?: string;
    newQueue?: string;
    interaction?: any;
  };
}) {
  const icons = {
    created: <Zap className="w-4 h-4 text-green-500" />,
    updated: <RefreshCw className="w-4 h-4 text-blue-500" />,
    status_changed: <BarChart3 className="w-4 h-4 text-yellow-500" />,
    assigned: <Users className="w-4 h-4 text-purple-500" />,
    queue_transfer: <GitBranch className="w-4 h-4 text-indigo-500" />,
    interaction_added: <Activity className="w-4 h-4 text-cyan-500" />,
    accepted: <CheckCircle className="w-4 h-4 text-emerald-500" />,
  };

  const labels = {
    created: 'Criado',
    updated: 'Atualizado',
    status_changed: 'Status alterado',
    assigned: 'Atribuído',
    queue_transfer: 'Transferido de fila',
    interaction_added: 'Interação adicionada',
    accepted: 'Chamado aceito',
  };

  return (
    <div className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50">
      <div className="mt-0.5">{icons[activity.type]}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-900 dark:text-white">
          <Link to={`/tickets/${activity.ticket.id}`} className="hover:underline font-medium">
            #{activity.ticket.id}
          </Link>
          {' '}
          <span className="text-gray-600 dark:text-gray-400">
            {labels[activity.type]}
          </span>
        </p>
        {activity.type === 'status_changed' && activity.oldStatus && activity.newStatus && (
          <div className="flex items-center gap-2 mt-1 text-xs">
            <span className={`px-2 py-0.5 rounded ${getStatusColor(activity.oldStatus as any)}`}>
              {getStatusLabel(activity.oldStatus as any)}
            </span>
            <ArrowRight className="w-3 h-3 text-gray-400" />
            <span className={`px-2 py-0.5 rounded ${getStatusColor(activity.newStatus as any)}`}>
              {getStatusLabel(activity.newStatus as any)}
            </span>
          </div>
        )}
        {activity.type === 'assigned' && (
          <div className="flex items-center gap-2 mt-1 text-xs text-gray-600 dark:text-gray-400">
            {activity.oldAssignee ? (
              <>
                <span>{activity.oldAssignee.name}</span>
                <ArrowRight className="w-3 h-3" />
                <span>{activity.newAssignee?.name || 'Não atribuído'}</span>
              </>
            ) : (
              <span>Atribuído para {activity.newAssignee?.name || 'Não atribuído'}</span>
            )}
          </div>
        )}
        {activity.type === 'queue_transfer' && activity.oldQueue && activity.newQueue && (
          <div className="flex items-center gap-2 mt-1 text-xs">
            <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
              {activity.oldQueue}
            </span>
            <ArrowRight className="w-3 h-3 text-gray-400" />
            <span className="px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300">
              {activity.newQueue}
            </span>
          </div>
        )}
        {activity.type === 'interaction_added' && activity.interaction && (
          <div className="mt-1 text-xs text-gray-600 dark:text-gray-400">
            <p className="line-clamp-2">{activity.interaction.content}</p>
            {activity.interaction.author && (
              <p className="text-gray-500 dark:text-gray-500 mt-1">
                por {activity.interaction.author.name}
              </p>
            )}
          </div>
        )}
        {activity.type === 'accepted' && activity.newAssignee && (
          <div className="flex items-center gap-2 mt-1 text-xs text-emerald-600 dark:text-emerald-400">
            <CheckCircle className="w-3 h-3" />
            <span>Aceito por {activity.newAssignee.name}</span>
          </div>
        )}
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {formatDate(activity.timestamp)}
        </p>
      </div>
    </div>
  );
}

// Componente de Gráfico de Fluxo de Status
function StatusFlowChart({ transitions }: { transitions: Record<string, Record<string, number>> }) {
  const statusLabels: Record<string, string> = {
    'aberto': 'Aberto',
    'pendente': 'Pendente',
    'em_atendimento': 'Em Atendimento',
    'em_andamento': 'Em Andamento',
    'resolvido': 'Resolvido',
    'fechado': 'Fechado',
    'encerrado': 'Encerrado',
  };

  const statusColors: Record<string, string> = {
    'aberto': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    'pendente': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
    'em_atendimento': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    'em_andamento': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    'resolvido': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    'fechado': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    'encerrado': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  };

  const allStatuses = new Set<string>();
  Object.keys(transitions).forEach(from => {
    allStatuses.add(from);
    Object.keys(transitions[from]).forEach(to => allStatuses.add(to));
  });

  // Calcular total de movimentações
  const totalMovements = Object.values(transitions).reduce((sum, toStatuses) => {
    return sum + Object.values(toStatuses).reduce((s, count) => s + count, 0);
  }, 0);

  return (
    <div className="space-y-4">
      {totalMovements > 0 && (
        <div className="mb-4 p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
          <p className="text-sm text-primary-700 dark:text-primary-300">
            <span className="font-semibold">{totalMovements}</span> movimentação{totalMovements !== 1 ? 'ões' : ''} de status registrada{totalMovements !== 1 ? 's' : ''}
          </p>
        </div>
      )}
      {Array.from(allStatuses).map(fromStatus => {
        const toStatuses = transitions[fromStatus] || {};
        if (Object.keys(toStatuses).length === 0) return null;

        return (
          <div key={fromStatus} className="border-l-2 border-gray-200 dark:border-gray-700 pl-4">
            <div className={`inline-block px-3 py-1 rounded text-sm font-medium mb-2 ${statusColors[fromStatus] || 'bg-gray-100 text-gray-800'}`}>
              {statusLabels[fromStatus] || fromStatus}
            </div>
            <div className="ml-4 space-y-2">
              {Object.entries(toStatuses).map(([toStatus, count]) => (
                <div key={toStatus} className="flex items-center gap-2">
                  <ArrowRight className="w-4 h-4 text-gray-400" />
                  <div className={`inline-block px-3 py-1 rounded text-sm ${statusColors[toStatus] || 'bg-gray-100 text-gray-800'}`}>
                    {statusLabels[toStatus] || toStatus}
                  </div>
                  <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                    ({count}x)
                  </span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
      {Object.keys(transitions).length === 0 && (
        <p className="text-center text-gray-500 dark:text-gray-400 py-4">
          Nenhuma movimentação registrada ainda. As movimentações aparecerão aqui quando os chamados mudarem de status.
        </p>
      )}
    </div>
  );
}

// Modal de Histórico do Chamado
function TicketHistoryModal({ ticket, onClose }: { ticket: Ticket; onClose: () => void }) {
  const { tickets } = useTickets();
  const fullTicket = tickets.find(t => t.id === ticket.id) || ticket;

  // Construir histórico baseado em interações e mudanças
  const history = useMemo(() => {
    const items: Array<{
      type: string;
      description: string;
      user?: UserType;
      timestamp: Date;
      metadata?: any;
    }> = [];

    // Criação do chamado
    items.push({
      type: 'created',
      description: 'Chamado criado',
      user: fullTicket.createdBy,
      timestamp: fullTicket.createdAt,
    });

    // Interações
    if (fullTicket.interactions && fullTicket.interactions.length > 0) {
      fullTicket.interactions.forEach(interaction => {
        let description = '';
        if (interaction.type === 'status_change' && interaction.metadata) {
          description = `Status alterado de "${getStatusLabel(interaction.metadata.oldStatus as any)}" para "${getStatusLabel(interaction.metadata.newStatus as any)}"`;
        } else if (interaction.type === 'assignment' && interaction.metadata) {
          description = `Atribuído para ${interaction.metadata.assignedTo?.name || 'Não atribuído'}`;
        } else {
          description = interaction.content;
        }

        items.push({
          type: interaction.type,
          description,
          user: interaction.author,
          timestamp: interaction.createdAt,
          metadata: interaction.metadata,
        });
      });
    }

    // Comentários antigos
    if (fullTicket.comments && fullTicket.comments.length > 0) {
      fullTicket.comments.forEach(comment => {
        items.push({
          type: 'comment',
          description: comment.content,
          user: comment.author,
          timestamp: comment.createdAt,
        });
      });
    }

    return items.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [fullTicket]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Histórico do Chamado #{ticket.id}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{ticket.title}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
            {history.map((item, index) => (
              <div key={index} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                    {item.user ? (
                      <UserAvatar user={item.user} size="sm" />
                    ) : (
                      <Activity className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                    )}
                  </div>
                  {index < history.length - 1 && (
                    <div className="w-0.5 h-full bg-gray-200 dark:bg-gray-700 mt-2" />
                  )}
                </div>
                <div className="flex-1 pb-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-gray-900 dark:text-white">
                      {item.user?.name || 'Sistema'}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDate(item.timestamp)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{item.description}</p>
                </div>
              </div>
            ))}
            {history.length === 0 && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                Nenhum histórico disponível
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

