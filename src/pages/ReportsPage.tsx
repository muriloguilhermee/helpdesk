import { Download, BarChart3, TrendingUp, FileText } from 'lucide-react';
import { useTickets } from '../contexts/TicketsContext';
import { getStatusColor } from '../utils/statusColors';

export default function ReportsPage() {
  const { tickets } = useTickets();

  const stats = {
    total: tickets.length,
    abertos: tickets.filter(t => t.status === 'aberto').length,
    emAndamento: tickets.filter(t => t.status === 'em_andamento').length,
    resolvidos: tickets.filter(t => t.status === 'resolvido').length,
    fechados: tickets.filter(t => t.status === 'fechado').length,
  };

  const ticketsByCategory = tickets.reduce((acc, ticket) => {
    acc[ticket.category] = (acc[ticket.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const ticketsByPriority = tickets.reduce((acc, ticket) => {
    acc[ticket.priority] = (acc[ticket.priority] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">Relatórios</h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">Análise e estatísticas do sistema</p>
        </div>
        <button className="btn-primary flex items-center justify-center gap-2 w-full sm:w-auto">
          <Download className="w-5 h-5" />
          <span className="hidden sm:inline">Exportar Relatório</span>
          <span className="sm:hidden">Exportar</span>
        </button>
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
            {Object.entries(ticketsByCategory).map(([category, count]) => (
              <div key={category}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">{category}</span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">{count}</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-primary-600 h-2 rounded-full"
                    style={{ width: `${(count / stats.total) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card dark:bg-gray-800 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Chamados por Prioridade</h2>
          <div className="space-y-3">
            {Object.entries(ticketsByPriority).map(([priority, count]) => (
              <div key={priority}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">{priority}</span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">{count}</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-primary-600 h-2 rounded-full"
                    style={{ width: `${(count / stats.total) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

