import { useState, useRef, useEffect, useMemo } from 'react';
import { Download, BarChart3, TrendingUp, FileText, User, FileSpreadsheet, FileText as FileTextIcon, ChevronDown } from 'lucide-react';
import { useTickets } from '../contexts/TicketsContext';
import { useAuth } from '../contexts/AuthContext';
import { getStatusColor } from '../utils/statusColors';
import { mockUsers } from '../data/mockData';
import PieChart from '../components/PieChart';
import { UserAvatar } from '../utils/userAvatar';
import { exportToExcel, exportToPDF } from '../utils/exportReport';
import { api } from '../services/api';

export default function ReportsPage() {
  const { tickets } = useTickets();
  const { user } = useAuth();
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [isLoadingTechnicians, setIsLoadingTechnicians] = useState(false);

  // Filtrar apenas chamados criados pelo usuário atual
  // Se for admin ou técnico, ver todos os tickets; se for user, ver apenas os seus
  let userTickets = tickets || [];
  if (user?.role === 'user') {
    userTickets = tickets.filter(t => t && t.createdBy && t.createdBy.id === user.id);
  }
  // Técnicos e admins veem todos os tickets (userTickets = tickets)

  // Garantir que todos os tickets tenham os campos necessários
  userTickets = userTickets.filter(t => t && t.id && t.title);

  const stats = {
    total: userTickets.length,
    abertos: userTickets.filter(t => t.status === 'aberto').length,
    emAndamento: userTickets.filter(t => t.status === 'em_andamento').length,
    resolvidos: userTickets.filter(t => t.status === 'resolvido').length,
    fechados: userTickets.filter(t => t.status === 'fechado').length,
  };

  // Todas as categorias possíveis
  const allCategories = ['suporte', 'tecnico', 'integracao', 'melhoria'];
  const categoryLabels: Record<string, string> = {
    suporte: 'Suporte',
    tecnico: 'Técnico',
    integracao: 'Integração',
    melhoria: 'Melhoria',
  };
  const categoryColors: Record<string, string> = {
    suporte: '#3b82f6', // blue
    tecnico: '#10b981', // green
    integracao: '#f59e0b', // amber
    melhoria: '#8b5cf6', // purple
  };

  // Contar tickets por categoria (apenas dos chamados do usuário)
  const ticketsByCategory = allCategories.reduce((acc, category) => {
    acc[category] = userTickets.filter(t => t && t.category === category).length;
    return acc;
  }, {} as Record<string, number>);

  const ticketsByPriority = userTickets.reduce((acc, ticket) => {
    if (ticket && ticket.priority) {
      acc[ticket.priority] = (acc[ticket.priority] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  // Contar tickets por status
  const ticketsByStatus = userTickets.reduce((acc, ticket) => {
    if (ticket && ticket.status) {
      acc[ticket.status] = (acc[ticket.status] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  // Carregar técnicos pela API (não depender de localStorage, que pode estar vazio em produção)
  useEffect(() => {
    let cancelled = false;

    async function loadTechnicians() {
      // Se não está logado, não tenta buscar
      if (!user) return;

      setIsLoadingTechnicians(true);
      try {
        const users = await api.getUsers();
        if (cancelled) return;

        const techs = (users || []).filter(
          (u: any) => u?.role === 'technician' || u?.role === 'technician_n2'
        );

        setTechnicians(techs);
      } catch (err) {
        // Fallback: tenta recuperar do localStorage (se existir)
        try {
          const savedUsers = localStorage.getItem('allUsers');
          const parsed = savedUsers ? JSON.parse(savedUsers) : [];
          const mockUserEmails = new Set(mockUsers.map(u => u.email.toLowerCase()));
          const customUsers = (parsed || []).filter((u: any) => !mockUserEmails.has(u.email.toLowerCase()));
          const techs = customUsers.filter((u: any) => u.role === 'technician' || u.role === 'technician_n2');
          if (!cancelled) setTechnicians(techs);
        } catch {
          if (!cancelled) setTechnicians([]);
        }
      } finally {
        if (!cancelled) setIsLoadingTechnicians(false);
      }
    }

    loadTechnicians();
    return () => {
      cancelled = true;
    };
  }, [user]);

  // Contar tickets por técnico (apenas dos chamados do usuário)
  const ticketsByTechnician = useMemo(() => {
    return technicians.reduce((acc: Record<string, number>, tech: any) => {
      const count = userTickets.filter(t => t.assignedTo?.id === tech.id).length;
      acc[tech.id] = count;
      return acc;
    }, {} as Record<string, number>);
  }, [technicians, userTickets]);

  // Fechar menu ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleExportPDF = async () => {
    try {
      await exportToPDF(
        userTickets,
        stats,
        ticketsByCategory,
        ticketsByPriority,
        ticketsByStatus,
        ticketsByTechnician
      );
      setShowExportMenu(false);
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      alert('Erro ao exportar PDF. Por favor, tente novamente.');
    }
  };

  const handleExportExcel = () => {
    try {
      exportToExcel(
        userTickets,
        stats,
        ticketsByCategory,
        ticketsByPriority,
        ticketsByStatus,
        ticketsByTechnician
      );
      setShowExportMenu(false);
    } catch (error) {
      console.error('Erro ao exportar Excel:', error);
      alert('Erro ao exportar Excel. Por favor, tente novamente.');
    }
  };

  // Preparar dados para gráfico de pizza de categorias
  const categoryChartData = allCategories.map(category => ({
    label: categoryLabels[category],
    value: ticketsByCategory[category] || 0,
    color: categoryColors[category],
  }));

  // Preparar dados para gráfico de pizza de prioridades
  const priorityLabels: Record<string, string> = {
    baixa: 'Baixa',
    media: 'Média',
    alta: 'Alta',
    critica: 'Crítica',
  };
  const priorityColors: Record<string, string> = {
    baixa: '#10b981', // green
    media: '#3b82f6', // blue
    alta: '#f59e0b', // amber
    critica: '#ef4444', // red
  };

  const priorityChartData = Object.entries(ticketsByPriority)
    .filter(([_, count]) => count > 0)
    .map(([priority, count]) => ({
      label: priorityLabels[priority] || priority,
      value: count,
      color: priorityColors[priority] || '#6b7280',
    }));

  // Preparar dados para gráfico de pizza de status
  const statusLabels: Record<string, string> = {
    aberto: 'Aberto',
    em_andamento: 'Em Andamento',
    em_atendimento: 'Em Atendimento',
    pendente: 'Pendente',
    aguardando_cliente: 'Aguardando Cliente',
    resolvido: 'Resolvido',
    fechado: 'Fechado',
    em_fase_de_testes: 'Em fase de testes',
    homologacao: 'Homologação',
  };
  const statusColors: Record<string, string> = {
    aberto: '#ef4444', // red
    em_andamento: '#f59e0b', // amber
    em_atendimento: '#3b82f6', // blue
    pendente: '#f97316', // orange
    aguardando_cliente: '#fbbf24', // amber-400
    resolvido: '#10b981', // green
    fechado: '#6b7280', // gray
    em_fase_de_testes: '#8b5cf6', // purple
    homologacao: '#6366f1', // indigo
  };

  const statusChartData = Object.entries(ticketsByStatus)
    .filter(([_, count]) => count > 0)
    .map(([status, count]) => ({
      label: statusLabels[status] || status,
      value: count,
      color: statusColors[status] || '#6b7280',
    }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">Relatórios</h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">Análise e estatísticas do sistema</p>
        </div>
        <div className="relative" ref={exportMenuRef}>
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="btn-primary flex items-center justify-center gap-2 w-full sm:w-auto"
          >
            <Download className="w-5 h-5" />
            <span className="hidden sm:inline">Exportar Relatório</span>
            <span className="sm:hidden">Exportar</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${showExportMenu ? 'rotate-180' : ''}`} />
          </button>

          {showExportMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
              <button
                onClick={handleExportPDF}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors first:rounded-t-lg"
              >
                <FileTextIcon className="w-5 h-5 text-red-600 dark:text-red-400" />
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Exportar como PDF</span>
              </button>
              <button
                onClick={handleExportExcel}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors last:rounded-b-lg"
              >
                <FileSpreadsheet className="w-5 h-5 text-green-600 dark:text-green-400" />
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Exportar como Excel</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="card dark:bg-gray-800 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total de Chamados</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-2">{stats.total}</p>
            </div>
            <BarChart3 className="w-12 h-12 text-primary-600 dark:text-primary-400" />
          </div>
        </div>

        <div className="card dark:bg-gray-800 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Abertos</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-2">{stats.abertos}</p>
            </div>
            <FileText className="w-12 h-12 text-yellow-600 dark:text-yellow-400" />
          </div>
        </div>

        <div className="card dark:bg-gray-800 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Em Andamento</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-2">{stats.emAndamento}</p>
            </div>
            <TrendingUp className="w-12 h-12 text-orange-600 dark:text-orange-400" />
          </div>
        </div>

        <div className="card dark:bg-gray-800 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Resolvidos</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-2">{stats.resolvidos}</p>
            </div>
            <TrendingUp className="w-12 h-12 text-green-600 dark:text-green-400" />
          </div>
        </div>

        <div className="card dark:bg-gray-800 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Taxa de Resolução</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-2">
                {Math.round((stats.resolvidos / stats.total) * 100)}%
              </p>
            </div>
            <BarChart3 className="w-12 h-12 text-blue-600 dark:text-blue-400" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card dark:bg-gray-800 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Chamados por Categoria</h2>
          <div className="space-y-3">
            {allCategories.map((category) => {
              const count = ticketsByCategory[category] || 0;
              return (
                <div key={category}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {categoryLabels[category]}
                    </span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">{count}</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="h-2 rounded-full"
                      style={{
                        width: stats.total > 0 ? `${(count / stats.total) * 100}%` : '0%',
                        backgroundColor: categoryColors[category]
                      }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card dark:bg-gray-800 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Chamados por Prioridade</h2>
          <div className="space-y-3">
            {Object.entries(ticketsByPriority).map(([priority, count]) => (
              <div key={priority}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                    {priorityLabels[priority] || priority}
                  </span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">{count}</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="h-2 rounded-full"
                    style={{
                      width: stats.total > 0 ? `${(count / stats.total) * 100}%` : '0%',
                      backgroundColor: priorityColors[priority] || '#6b7280'
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Gráficos de Pizza */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card dark:bg-gray-800 dark:border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">Distribuição por Categoria</h2>
          <div className="flex justify-center">
            <PieChart data={categoryChartData} size={250} />
          </div>
        </div>

        <div className="card dark:bg-gray-800 dark:border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">Distribuição por Prioridade</h2>
          <div className="flex justify-center">
            <PieChart data={priorityChartData} size={250} />
          </div>
        </div>

        <div className="card dark:bg-gray-800 dark:border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">Distribuição por Status</h2>
          <div className="flex justify-center">
            <PieChart data={statusChartData} size={250} />
          </div>
        </div>
      </div>

      {/* Relatório por Técnicos */}
      <div className="card dark:bg-gray-800 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-4">
          <User className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Chamados por Técnico</h2>
        </div>
        {isLoadingTechnicians ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">Carregando técnicos...</p>
        ) : technicians.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">Nenhum técnico encontrado</p>
        ) : (
          <div className="space-y-4">
            {technicians.map((tech: any) => {
              const count = ticketsByTechnician[tech.id] || 0;
              const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0;
              return (
                <div key={tech.id} className="flex items-center gap-4">
                  <UserAvatar user={tech} size="md" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{tech.name}</span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {count} chamado{count !== 1 ? 's' : ''} ({percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-primary-600 h-2 rounded-full"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

