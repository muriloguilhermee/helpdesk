import { useState, useMemo, useEffect } from 'react';
import { Ticket, AlertCircle, CheckCircle, Clock, TrendingUp, Award } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTickets } from '../contexts/TicketsContext';
import { getStatusColor } from '../utils/statusColors';
import { formatDate } from '../utils/formatDate';
import { database } from '../services/database';
import { mockUsers } from '../data/mockData';
import { api } from '../services/api';
import { UserAvatar } from '../utils/userAvatar';
import { User as UserType } from '../types';

export default function Dashboard() {
  const { hasPermission, user } = useAuth();
  const { tickets } = useTickets();
  const [searchQuery, setSearchQuery] = useState(() => {
    // Carregar busca do localStorage se existir
    return localStorage.getItem('dashboardSearchQuery') || '';
  });

  // Sincronizar busca com Header via localStorage
  useEffect(() => {
    const handleSearchChange = () => {
      const stored = localStorage.getItem('dashboardSearchQuery') || '';
      if (stored !== searchQuery) {
        setSearchQuery(stored);
      }
    };

    window.addEventListener('dashboardSearchChange', handleSearchChange);
    // Verificar mudanças periodicamente (para mesma aba)
    const interval = setInterval(() => {
      const stored = localStorage.getItem('dashboardSearchQuery') || '';
      if (stored !== searchQuery) {
        setSearchQuery(stored);
      }
    }, 100);

    return () => {
      window.removeEventListener('dashboardSearchChange', handleSearchChange);
      clearInterval(interval);
    };
  }, [searchQuery]);

  // CORREÇÃO: Filtragem de chamados em andamento para analistas (admins)
  // Admins (analistas) devem ver TODOS os chamados em andamento, incluindo os de técnicos N1
  // Esta lógica garante que chamados abertos por técnicos N1 apareçam corretamente
  // na seção "Em andamento" para analistas, não apenas no total
  let availableTickets = tickets;
  if (user?.role === 'user') {
    // Usuários veem chamados que eles criaram OU chamados de melhoria
    availableTickets = tickets.filter(ticket =>
      ticket.createdBy.id === user.id || ticket.category === 'melhoria'
    );
  } else if (user?.role === 'technician_n2') {
    // Técnicos N2 veem APENAS chamados na fila "Suporte N2"
    availableTickets = tickets.filter(ticket => {
      const queueName = ticket.queue || '';
      return queueName.toLowerCase().includes('suporte n2') || queueName.toLowerCase().includes('n2');
    });
  } else if (user?.role === 'technician') {
    // Técnicos N1 veem apenas chamados atribuídos a eles
    availableTickets = tickets.filter(ticket =>
      ticket.assignedTo?.id === user.id
    );
  }
  // IMPORTANTE: Admins (analistas) veem todos os chamados (availableTickets = tickets)
  // Isso garante que chamados em andamento de técnicos N1 apareçam na lista,
  // não apenas no total, resolvendo o problema de visibilidade

  const stats = {
    total: availableTickets.length,
    abertos: availableTickets.filter(t => t.status === 'aberto').length,
    // CORREÇÃO: Esta linha garante que admins veem todos os chamados em andamento,
    // incluindo os de técnicos N1, pois availableTickets para admins = todos os tickets
    emAndamento: availableTickets.filter(t => t.status === 'em_andamento').length,
    resolvidos: availableTickets.filter(t => t.status === 'resolvido').length,
  };

  // Filtrar tickets por busca
  const filteredTickets = useMemo(() => {
    if (!searchQuery || !searchQuery.trim()) {
      return availableTickets;
    }
    const query = searchQuery.toLowerCase().trim();
    return availableTickets.filter(ticket => {
      if (!ticket) return false;
      const title = ticket.title || '';
      const description = ticket.description || '';
      return title.toLowerCase().includes(query) || description.toLowerCase().includes(query);
    });
  }, [searchQuery, availableTickets]);

  const recentTickets = filteredTickets
    .filter(ticket => ticket && ticket.updatedAt)
    .sort((a, b) => {
      const dateA = a.updatedAt instanceof Date ? a.updatedAt.getTime() : new Date(a.updatedAt).getTime();
      const dateB = b.updatedAt instanceof Date ? b.updatedAt.getTime() : new Date(b.updatedAt).getTime();
      return dateB - dateA;
    })
    .slice(0, 3);

  // Carregar técnicos e calcular performance
  const [technicians, setTechnicians] = useState<UserType[]>([]);
  const [technicianPerformance, setTechnicianPerformance] = useState<Record<string, {
    total: number;
    resolvidos: number;
    emAndamento: number;
    abertos: number;
    taxaResolucao: number;
    tempoMedioResolucao: number; // em dias
  }>>({});

  useEffect(() => {
    const loadTechnicians = async () => {
      try {
        // Usar API se disponível, senão usar database local
        const apiUrl = import.meta.env.VITE_API_URL;
        let allUsers: UserType[];
        if (apiUrl) {
          try {
            allUsers = await api.getUsers();
          } catch (error) {
            await database.init();
            allUsers = await database.getUsers();
          }
        } else {
          await database.init();
          allUsers = await database.getUsers();
        }

        // Filtrar apenas técnicos que NÃO são mockados
        const mockUserEmails = new Set(mockUsers.map(u => u.email.toLowerCase()));
        const customTechnicians = allUsers.filter((u: any) =>
          (u.role === 'technician' || u.role === 'technician_n2') && !mockUserEmails.has(u.email.toLowerCase())
        );

        // Ordenar técnicos alfabeticamente
        const sortedTechnicians = [...customTechnicians].sort((a: any, b: any) =>
          a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' })
        );

        setTechnicians(sortedTechnicians);
      } catch (error) {
        setTechnicians([]);
      }
    };

    loadTechnicians();
  }, []);

  // Calcular performance dos técnicos
  useEffect(() => {
    if (technicians.length === 0) return;

    const performance: Record<string, {
      total: number;
      resolvidos: number;
      emAndamento: number;
      abertos: number;
      taxaResolucao: number;
      tempoMedioResolucao: number;
    }> = {};

    technicians.forEach((tech) => {
      if (tech.role === 'technician_n2') {
        // Lógica especial para técnicos N2
        // N2 recebe chamados via transferência do N1 e pode transferir de volta

        // 1. Total: Todos os chamados que estão na fila N2 OU que passaram pela fila N2
        const ticketsN2 = tickets.filter(t => {
          const queueName = (t.queue || '').toLowerCase();
          const isInN2Queue = queueName.includes('suporte n2') || queueName.includes('n2');

          // Verificar se já passou pela fila N2 (mesmo que tenha sido transferido de volta)
          const hasBeenInN2 = t.interactions?.some((interaction) => {
            if (interaction.type === 'queue_transfer') {
              const toQueue = (interaction.metadata?.toQueue || '').toLowerCase();
              return toQueue.includes('suporte n2') || toQueue.includes('n2');
            }
            return false;
          });

          const isN2Ticket = isInN2Queue || hasBeenInN2;

          return isN2Ticket;
        });

        // 2. Resolvidos: Chamados que foram:
        //    - Fechados/resolvidos (independente da fila atual)
        //    - Transferidos de volta para N1 (Retorno N2) - conta como resolvido pelo N2
        const resolvidos = ticketsN2.filter(t => {
          // Se está fechado ou resolvido
          if (t.status === 'resolvido' || t.status === 'fechado') {
            return true;
          }

          // Se foi transferido de N2 para N1 (Retorno N2)
          // Verificar se a fila atual é "Retorno N2" ou se houve transferência de N2 para N1
          const queueName = t.queue?.toLowerCase() || '';
          const isInReturnQueue = queueName.includes('retorno n2');

          const transferredToN1 = t.interactions?.some((interaction) => {
            if (interaction.type === 'queue_transfer') {
              const fromQueue = interaction.metadata?.fromQueue?.toLowerCase() || '';
              const toQueue = interaction.metadata?.toQueue?.toLowerCase() || '';
              const fromN2 = fromQueue.includes('suporte n2') || fromQueue.includes('n2');
              const toN1 = toQueue.includes('suporte n1') || toQueue.includes('retorno n2') || toQueue.includes('n1');
              return fromN2 && toN1;
            }
            return false;
          });

          return isInReturnQueue || transferredToN1;
        });

        // 3. Em Andamento: Chamados na fila N2 atribuídos a este técnico N2 que estão em andamento ou em atendimento
        const emAndamento = ticketsN2.filter(t => {
          const queueName = (t.queue || '').toLowerCase();
          const isInN2Queue = queueName.includes('suporte n2') || queueName.includes('n2');
          const isNotResolved = !resolvidos.some(r => r.id === t.id);
          const isInProgress = t.status === 'em_andamento' || t.status === 'em_atendimento';
          const isAssignedToThisN2 = t.assignedTo?.id === tech.id;

          // Se está na fila N2, não resolvido, em andamento/atendimento e atribuído a este técnico N2
          return isInN2Queue && isNotResolved && isInProgress && isAssignedToThisN2;
        });

        // 4. Abertos: Chamados na fila N2 mas não atribuídos (ou atribuídos a outros técnicos)
        const abertos = ticketsN2.filter(t => {
          const queueName = t.queue?.toLowerCase() || '';
          const isInN2Queue = queueName.includes('suporte n2') || queueName.includes('n2');
          const isNotAssigned = !t.assignedTo;
          const isNotResolved = !resolvidos.some(r => r.id === t.id);
          const isOpen = t.status === 'aberto' || t.status === 'pendente';

          // Se está na fila N2, não atribuído, não resolvido e está aberto/pendente
          return isInN2Queue && isNotResolved && isOpen && isNotAssigned;
        });

        // Calcular tempo médio de resolução (em dias)
        // Considerar apenas chamados que foram realmente resolvidos (fechados ou transferidos de volta)
        let tempoMedio = 0;
        if (resolvidos.length > 0) {
          const tempos: number[] = [];
          resolvidos.forEach(ticket => {
            // Encontrar quando chegou na fila N2
            let n2ArrivalDate: Date | null = null;
            const n2Transfer = ticket.interactions?.find((interaction) => {
              if (interaction.type === 'queue_transfer') {
                const toQueue = interaction.metadata?.toQueue?.toLowerCase() || '';
                return toQueue.includes('suporte n2') || toQueue.includes('n2');
              }
              return false;
            });

            if (n2Transfer) {
              n2ArrivalDate = n2Transfer.createdAt instanceof Date ? n2Transfer.createdAt : new Date(n2Transfer.createdAt);
            } else {
              // Se não encontrou transferência, usar data de criação do ticket
              n2ArrivalDate = ticket.createdAt instanceof Date ? ticket.createdAt : new Date(ticket.createdAt);
            }

            // Encontrar quando foi resolvido (fechado ou transferido de volta)
            let resolutionDate: Date | null = null;
            if (ticket.status === 'resolvido' || ticket.status === 'fechado') {
              resolutionDate = ticket.updatedAt instanceof Date ? ticket.updatedAt : new Date(ticket.updatedAt);
            } else {
              // Foi transferido de volta para N1
              const returnTransfer = ticket.interactions?.find((interaction) => {
                if (interaction.type === 'queue_transfer') {
                  const fromQueue = interaction.metadata?.fromQueue?.toLowerCase() || '';
                  const toQueue = interaction.metadata?.toQueue?.toLowerCase() || '';
                  const fromN2 = fromQueue.includes('suporte n2') || fromQueue.includes('n2');
                  const toN1 = toQueue.includes('suporte n1') || toQueue.includes('retorno n2') || toQueue.includes('n1');
                  return fromN2 && toN1;
                }
                return false;
              });

              if (returnTransfer) {
                resolutionDate = returnTransfer.createdAt instanceof Date ? returnTransfer.createdAt : new Date(returnTransfer.createdAt);
              }
            }

            if (n2ArrivalDate && resolutionDate) {
              const diffMs = resolutionDate.getTime() - n2ArrivalDate.getTime();
              const diffDays = diffMs / (1000 * 60 * 60 * 24);
              if (diffDays > 0) {
                tempos.push(diffDays);
              }
            }
          });

          if (tempos.length > 0) {
            tempoMedio = tempos.reduce((a, b) => a + b, 0) / tempos.length;
          }
        }

        performance[tech.id] = {
          total: ticketsN2.length,
          resolvidos: resolvidos.length,
          emAndamento: emAndamento.length,
          abertos: abertos.length,
          taxaResolucao: ticketsN2.length > 0 ? (resolvidos.length / ticketsN2.length) * 100 : 0,
          tempoMedioResolucao: tempoMedio,
        };
      } else {
        // Lógica padrão para técnicos N1
        // Buscar todos os tickets atribuídos a este técnico
        const techTickets = tickets.filter(t => t.assignedTo?.id === tech.id);

        const resolvidos = techTickets.filter(t => t.status === 'resolvido' || t.status === 'fechado');
        const emAndamento = techTickets.filter(t => t.status === 'em_andamento' || t.status === 'em_atendimento');
        const abertos = techTickets.filter(t => t.status === 'aberto' || t.status === 'pendente');

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
      }
    });

    setTechnicianPerformance(performance);
  }, [technicians, tickets]);

  // Separar técnicos N1 e N2
  const techniciansN1 = useMemo(() => {
    return technicians.filter(tech => tech.role === 'technician');
  }, [technicians]);

  const techniciansN2 = useMemo(() => {
    return technicians.filter(tech => tech.role === 'technician_n2');
  }, [technicians]);

  // Ordenar técnicos N1 por performance (mais resolvidos primeiro)
  const sortedTechniciansN1 = useMemo(() => {
    return [...techniciansN1].sort((a, b) => {
      const perfA = technicianPerformance[a.id];
      const perfB = technicianPerformance[b.id];
      if (!perfA && !perfB) return 0;
      if (!perfA) return 1;
      if (!perfB) return -1;
      return perfB.resolvidos - perfA.resolvidos;
    });
  }, [techniciansN1, technicianPerformance]);

  // Ordenar técnicos N2 por performance (mais resolvidos primeiro)
  const sortedTechniciansN2 = useMemo(() => {
    return [...techniciansN2].sort((a, b) => {
      const perfA = technicianPerformance[a.id];
      const perfB = technicianPerformance[b.id];
      if (!perfA && !perfB) return 0;
      if (!perfA) return 1;
      if (!perfB) return -1;
      return perfB.resolvidos - perfA.resolvidos;
    });
  }, [techniciansN2, technicianPerformance]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">Visão geral do sistema de chamados</p>
        </div>
        {hasPermission('create:ticket') && (
          <Link to="/tickets/new" className="btn-primary flex items-center justify-center gap-2 w-full sm:w-auto">
            <Ticket className="w-5 h-5" />
            <span className="hidden sm:inline">Novo Chamado</span>
            <span className="sm:hidden">Novo</span>
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="card dark:bg-gray-800 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total de Chamados</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-2">{stats.total}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <Ticket className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="card dark:bg-gray-800 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Abertos</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-2">{stats.abertos}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
        </div>

        <div className="card dark:bg-gray-800 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Em Andamento</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-2">{stats.emAndamento}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </div>

        <div className="card dark:bg-gray-800 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Resolvidos</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-2">{stats.resolvidos}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="card dark:bg-gray-800 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Taxa de Resolução</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-2">
                {stats.total > 0 ? Math.round((stats.resolvidos / stats.total) * 100) : 0}%
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Performance dos Técnicos N1 */}
      {sortedTechniciansN1.length > 0 && (
        <div className="card dark:bg-gray-800 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Performance dos Técnicos N1</h2>
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
                {sortedTechniciansN1.map((tech) => {
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

      {/* Performance dos Técnicos N2 */}
      {sortedTechniciansN2.length > 0 && (
        <div className="card dark:bg-gray-800 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Performance dos Técnicos N2</h2>
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
                {sortedTechniciansN2.map((tech) => {
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card dark:bg-gray-800 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              {searchQuery ? 'Resultados da Busca' : 'Chamados Recentes'}
            </h2>
            <Link to="/tickets" className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-sm font-medium">
              Ver todos
            </Link>
          </div>
          <div className="space-y-4">
            {recentTickets.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">
                  {searchQuery ? 'Nenhum chamado encontrado para sua busca.' : 'Nenhum chamado recente.'}
                </p>
              </div>
            ) : (
              recentTickets.map((ticket) => (
              <Link
                key={ticket.id}
                to={`/tickets/${ticket.id}`}
                className="block p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 dark:text-gray-100">{ticket.title}</h3>
                    {ticket.system && (
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        <span className="font-medium">Sistema:</span> {ticket.system}
                      </p>
                    )}
                    {ticket.serviceType && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{ticket.serviceType}</p>
                    )}
                    <span className="inline-block text-xs text-primary-600 dark:text-primary-400 font-medium mt-1 capitalize">
                      {ticket.category}
                    </span>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">{ticket.description}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className={`badge ${getStatusColor(ticket.status)}`}>
                        {ticket.status.replace('_', ' ')}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDate(ticket.updatedAt)}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
              ))
            )}
          </div>
        </div>

        <div className="card dark:bg-gray-800 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Estatísticas</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <span className="text-gray-700 dark:text-gray-300">Taxa de Resolução</span>
              <span className="font-semibold text-gray-900 dark:text-gray-100">
                {Math.round((stats.resolvidos / stats.total) * 100)}%
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <span className="text-gray-700 dark:text-gray-300">Tempo Médio de Resolução</span>
              <span className="font-semibold text-gray-900 dark:text-gray-100">2.5 dias</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <span className="text-gray-700 dark:text-gray-300">Chamados Críticos</span>
              <span className="font-semibold text-red-600 dark:text-red-400">
                {availableTickets.filter(t => t.priority === 'critica').length}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


