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

  // Filtrar tickets baseado no role do usuário
  // Usuários veem seus próprios chamados E chamados de melhoria
  // Técnicos veem chamados atribuídos a eles E chamados de melhoria
  let availableTickets = tickets;
  if (user?.role === 'technician') {
    // Técnicos veem chamados atribuídos a eles OU chamados de melhoria
    availableTickets = tickets.filter(ticket =>
      ticket.assignedTo?.id === user.id || ticket.category === 'melhoria'
    );
  } else if (user?.role === 'user') {
    // Usuários veem chamados que eles criaram OU chamados de melhoria
    availableTickets = tickets.filter(ticket =>
      ticket.createdBy.id === user.id || ticket.category === 'melhoria'
    );
  }
  // Admins veem todos os chamados (availableTickets = tickets)

  const stats = {
    total: availableTickets.length,
    abertos: availableTickets.filter(t => t.status === 'aberto').length,
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
      // Verificar se há token antes de carregar
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('⏳ Aguardando autenticação para carregar técnicos...');
        return;
      }

      try {
        // Usar API se disponível, senão usar database local
        const apiUrl = import.meta.env.VITE_API_URL;
        let allUsers: UserType[];
        if (apiUrl) {
          try {
            allUsers = await api.getUsers();
          } catch (error) {
            console.error('Erro ao buscar usuários da API, usando database local:', error);
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
      // Buscar todos os tickets atribuídos a este técnico (sem filtro de role)
      const techTickets = tickets.filter(t => t.assignedTo?.id === tech.id);

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

      {/* Performance dos Técnicos */}
      {sortedTechnicians.length > 0 && (
        <div className="card dark:bg-gray-800 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Performance dos Técnicos</h2>
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


