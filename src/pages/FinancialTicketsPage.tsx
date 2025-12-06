import { useState } from 'react';
import { Download, FileText, Calendar, DollarSign, CheckCircle, Clock, XCircle, Search, Filter } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useFinancial } from '../contexts/FinancialContext';
import { formatDate } from '../utils/formatDate';
import { formatCurrency } from '../utils/formatCurrency';
import { PaymentStatus } from '../types';

export default function FinancialTicketsPage() {
  const { user, hasPermission } = useAuth();
  const { financialTickets, getTicketsByClient } = useFinancial();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | 'all'>('all');

  // Filtrar tickets baseado no role do usuário
  let availableTickets = financialTickets;
  if (user?.role === 'user') {
    // Usuários veem apenas seus próprios tickets
    availableTickets = getTicketsByClient(user.id);
  } else if (user?.role === 'financial') {
    // Usuário financeiro vê todos
    availableTickets = financialTickets;
  } else if (user?.role === 'admin') {
    // Admin vê todos
    availableTickets = financialTickets;
  } else {
    // Outros roles não veem tickets financeiros
    availableTickets = [];
  }

  // Filtrar por busca e status
  const filteredTickets = availableTickets.filter((ticket) => {
    if (searchQuery && !ticket.title.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (statusFilter !== 'all' && ticket.status !== statusFilter) {
      return false;
    }
    return true;
  });

  // Calcular estatísticas
  const stats = {
    total: filteredTickets.length,
    pending: filteredTickets.filter(t => t.status === 'pending').length,
    paid: filteredTickets.filter(t => t.status === 'paid').length,
    overdue: filteredTickets.filter(t => t.status === 'overdue').length,
    totalAmount: filteredTickets.reduce((sum, t) => sum + t.amount, 0),
    paidAmount: filteredTickets.filter(t => t.status === 'paid').reduce((sum, t) => sum + t.amount, 0),
  };

  // Obter tickets dos últimos meses
  const now = new Date();
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const last3Months = new Date(now.getFullYear(), now.getMonth() - 3, 1);
  
  const lastMonthTickets = filteredTickets.filter(t => 
    t.paymentDate && new Date(t.paymentDate) >= lastMonth
  );
  const last3MonthsTickets = filteredTickets.filter(t => 
    t.paymentDate && new Date(t.paymentDate) >= last3Months
  );

  const getStatusColor = (status: PaymentStatus) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'overdue':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: PaymentStatus) => {
    switch (status) {
      case 'paid':
        return 'Pago';
      case 'pending':
        return 'Pendente';
      case 'overdue':
        return 'Vencido';
      case 'cancelled':
        return 'Cancelado';
      default:
        return status;
    }
  };

  const getStatusIcon = (status: PaymentStatus) => {
    switch (status) {
      case 'paid':
        return CheckCircle;
      case 'pending':
        return Clock;
      case 'overdue':
        return XCircle;
      default:
        return FileText;
    }
  };

  const handleDownloadInvoice = (ticket: typeof filteredTickets[0]) => {
    if (ticket.invoiceFile?.data) {
      const link = document.createElement('a');
      link.href = ticket.invoiceFile.data;
      link.download = ticket.invoiceFile.name || `ticket-${ticket.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      alert('Arquivo não disponível para download');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">Tickets Financeiros</h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
            {user?.role === 'user' ? 'Seus tickets e pagamentos' : 'Gestão financeira'}
          </p>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card dark:bg-gray-800 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">{stats.total}</p>
            </div>
            <FileText className="w-8 h-8 text-primary-600 dark:text-primary-400" />
          </div>
        </div>
        <div className="card dark:bg-gray-800 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Pendentes</p>
              <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">{stats.pending}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
          </div>
        </div>
        <div className="card dark:bg-gray-800 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Pagos</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">{stats.paid}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
        </div>
        <div className="card dark:bg-gray-800 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Pago</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                {formatCurrency(stats.paidAmount)}
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-primary-600 dark:text-primary-400" />
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar tickets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-400 dark:text-gray-500" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as PaymentStatus | 'all')}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            <option value="all">Todos os status</option>
            <option value="pending">Pendente</option>
            <option value="paid">Pago</option>
            <option value="overdue">Vencido</option>
            <option value="cancelled">Cancelado</option>
          </select>
        </div>
      </div>

      {/* Histórico dos últimos meses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card dark:bg-gray-800 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Último Mês</h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Tickets pagos:</span>
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{lastMonthTickets.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Valor total:</span>
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {formatCurrency(lastMonthTickets.reduce((sum, t) => sum + t.amount, 0))}
              </span>
            </div>
          </div>
        </div>
        <div className="card dark:bg-gray-800 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Últimos 3 Meses</h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Tickets pagos:</span>
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{last3MonthsTickets.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Valor total:</span>
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {formatCurrency(last3MonthsTickets.reduce((sum, t) => sum + t.amount, 0))}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Tickets */}
      <div className="card dark:bg-gray-800 dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Tickets Financeiros</h2>
        {filteredTickets.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">Nenhum ticket financeiro encontrado</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTickets.map((ticket) => {
              const StatusIcon = getStatusIcon(ticket.status);
              const isOverdue = ticket.status === 'pending' && new Date(ticket.dueDate) < new Date();
              
              const hasInvoice = ticket.invoiceFile && (ticket.status === 'pending' || ticket.status === 'overdue');
              
              return (
                <div
                  key={ticket.id}
                  className={`border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                    hasInvoice 
                      ? 'border-green-500 dark:border-green-600 bg-green-50/30 dark:bg-green-900/10' 
                      : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            {ticket.title}
                          </h3>
                          {ticket.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {ticket.description}
                            </p>
                          )}
                        </div>
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                          <StatusIcon className="w-3.5 h-3.5" />
                          {getStatusLabel(ticket.status)}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Valor</p>
                          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                            {formatCurrency(ticket.amount)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Vencimento</p>
                          <p className={`text-sm font-medium ${isOverdue ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-gray-100'}`}>
                            {formatDate(ticket.dueDate)}
                          </p>
                        </div>
                        {ticket.paymentDate && (
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Pagamento</p>
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {formatDate(ticket.paymentDate)}
                            </p>
                          </div>
                        )}
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Criado em</p>
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {formatDate(ticket.createdAt)}
                          </p>
                        </div>
                      </div>

                      {/* Botão de Download do Boleto - Destacado */}
                      {ticket.invoiceFile && (ticket.status === 'pending' || ticket.status === 'overdue') && (
                        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                          <button
                            onClick={() => handleDownloadInvoice(ticket)}
                            className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-lg hover:shadow-xl"
                            title="Baixar boleto para pagamento"
                          >
                            <Download className="w-5 h-5" />
                            <span>Baixar Boleto para Pagamento</span>
                          </button>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center sm:text-left">
                            Clique para baixar o boleto e efetuar o pagamento
                          </p>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {ticket.invoiceFile && ticket.status !== 'pending' && ticket.status !== 'overdue' && ticket.status !== 'paid' && (
                        <button
                          onClick={() => handleDownloadInvoice(ticket)}
                          className="btn-primary flex items-center gap-2"
                          title="Baixar boleto/ticket"
                        >
                          <Download className="w-4 h-4" />
                          <span className="hidden sm:inline">Baixar Boleto</span>
                        </button>
                      )}
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

