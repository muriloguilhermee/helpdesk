import { useState, useRef, useMemo, useEffect } from 'react';
import { Plus, Save, X, Upload, Download, FileText, Calendar, DollarSign, Trash2, Edit, Search } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useFinancial } from '../contexts/FinancialContext';
import { FinancialTicket, PaymentStatus, TicketFile } from '../types';
import { formatDate } from '../utils/formatDate';
import { formatCurrency } from '../utils/formatCurrency';
import { formatFileSize } from '../utils/formatFileSize';
import { api } from '../services/api';

export default function FinancialManagementPage() {
  const { user, hasPermission } = useAuth();
  const { financialTickets, addFinancialTicket, updateFinancialTicket, deleteFinancialTicket } = useFinancial();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTicket, setEditingTicket] = useState<FinancialTicket | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const invoiceInputRef = useRef<HTMLInputElement>(null);
  const receiptInputRef = useRef<HTMLInputElement>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    amount: '',
    dueDate: '',
    clientId: '',
    status: 'pending' as PaymentStatus,
    notes: '',
  });
  const [invoiceFile, setInvoiceFile] = useState<TicketFile | null>(null);
  const [receiptFile, setReceiptFile] = useState<TicketFile | null>(null);

  // Estado para armazenar clientes
  const [allClients, setAllClients] = useState<any[]>([]);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));

  // Listener para mudanças no token
  useEffect(() => {
    const interval = setInterval(() => {
      const currentToken = localStorage.getItem('token');
      if (currentToken !== token) {
        setToken(currentToken);
      }
    }, 500);

    return () => clearInterval(interval);
  }, [token]);

  // Buscar todos os clientes da API (banco de dados)
  useEffect(() => {
    const loadClients = async () => {
      // Verificar se há token antes de carregar
      const currentToken = localStorage.getItem('token');
      if (!currentToken) {
        console.log('⏳ Aguardando autenticação para carregar clientes...');
        return;
      }

      try {
        console.log('📡 Carregando clientes da API...');
        // SEMPRE usar API - buscar usuários do banco de dados
        const apiUsers = await api.getUsers();

        // Filtrar apenas clientes (usuários normais)
        const clients = apiUsers.filter((u: any) => u.role === 'user');

        console.log('✅ Clientes carregados da API:', clients.length);
        setAllClients(clients);
      } catch (error: any) {
        console.error('❌ Erro ao carregar clientes da API:', error);
        setAllClients([]);
      }
    };

    loadClients();
  }, [token]);

  // Recarregar clientes quando o modal de criar for aberto (para pegar novos usuários)
  useEffect(() => {
    if (showCreateModal || showEditModal) {
      const loadClients = async () => {
        // Verificar se há token antes de carregar
        const currentToken = localStorage.getItem('token');
        if (!currentToken) {
          return;
        }

        try {
          const allUsers = await api.getUsers();
          const clients = allUsers.filter((u: any) => u.role === 'user');

          setAllClients(clients);
        } catch (error) {
          console.error('Erro ao recarregar clientes:', error);
        }
      };

      loadClients();
    }
  }, [showCreateModal, showEditModal]);

  // Agrupar clientes por empresa e ordenar
  const clientsByCompany = useMemo(() => {
    return allClients.reduce((acc: Record<string, any[]>, client: any) => {
      const company = client.company || 'Sem Empresa';
      if (!acc[company]) {
        acc[company] = [];
      }
      acc[company].push(client);
      return acc;
    }, {});
  }, [allClients]);

  // Ordenar empresas e clientes dentro de cada empresa
  const sortedCompanies = useMemo(() => {
    const companies = Object.keys(clientsByCompany).sort((a, b) =>
      a.localeCompare(b, 'pt-BR', { sensitivity: 'base' })
    );

    // Ordenar clientes dentro de cada empresa
    companies.forEach(company => {
      clientsByCompany[company].sort((a: any, b: any) =>
        a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' })
      );
    });

    return companies;
  }, [clientsByCompany]);



  const filteredTickets = financialTickets.filter((ticket) => {
    if (searchQuery && !ticket.title.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>, type: 'invoice' | 'receipt') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const ticketFile: TicketFile = {
        id: `file-${Date.now()}`,
        name: file.name,
        size: file.size,
        type: file.type,
        data: reader.result as string,
      };

      if (type === 'invoice') {
        setInvoiceFile(ticketFile);
      } else {
        setReceiptFile(ticketFile);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveFile = (type: 'invoice' | 'receipt') => {
    if (type === 'invoice') {
      setInvoiceFile(null);
      if (invoiceInputRef.current) {
        invoiceInputRef.current.value = '';
      }
    } else {
      setReceiptFile(null);
      if (receiptInputRef.current) {
        receiptInputRef.current.value = '';
      }
    }
  };

  const handleCreateTicket = async () => {
    try {
      if (!user || !formData.clientId) {
        alert('Por favor, selecione um cliente');
        return;
      }

      if (!formData.title.trim()) {
        alert('Por favor, preencha o título');
        return;
      }

      const amount = parseFloat(formData.amount);
      if (!formData.amount || isNaN(amount) || amount <= 0) {
        alert('Por favor, informe um valor válido');
        return;
      }

      if (!formData.dueDate) {
        alert('Por favor, selecione uma data de vencimento');
        return;
      }

      const dueDate = new Date(formData.dueDate);
      if (isNaN(dueDate.getTime())) {
        alert('Por favor, selecione uma data de vencimento válida');
        return;
      }

      const client = allClients.find((c: any) => c.id === formData.clientId);
      if (!client) {
        alert('Cliente não encontrado. Por favor, selecione novamente.');
        return;
      }

      const newTicket: FinancialTicket = {
        id: `FT-${Date.now()}`,
        title: formData.title.trim(),
        description: formData.description?.trim() || undefined,
        amount: amount,
        dueDate: dueDate,
        status: formData.status,
        client: client,
        createdBy: user,
        createdAt: new Date(),
        updatedAt: new Date(),
        invoiceFile: invoiceFile || undefined,
        receiptFile: receiptFile || undefined,
        notes: formData.notes?.trim() || undefined,
      };

      await addFinancialTicket(newTicket);

      // Limpar formulário
      setFormData({
        title: '',
        description: '',
        amount: '',
        dueDate: '',
        clientId: '',
        status: 'pending',
        notes: '',
      });
      setInvoiceFile(null);
      setReceiptFile(null);
      setShowCreateModal(false);

      alert('Ticket financeiro criado com sucesso!');
    } catch (error: any) {
      console.error('Erro ao criar ticket financeiro:', error);
      alert(error.message || 'Erro ao criar ticket financeiro. Verifique se o backend está rodando.');
    }
  };

  const handleEditClick = (ticket: FinancialTicket) => {
    setEditingTicket(ticket);
    setFormData({
      title: ticket.title,
      description: ticket.description || '',
      amount: ticket.amount.toString(),
      dueDate: ticket.dueDate.toISOString().split('T')[0],
      clientId: ticket.client.id,
      status: ticket.status,
      notes: ticket.notes || '',
    });
    setInvoiceFile(ticket.invoiceFile || null);
    setReceiptFile(ticket.receiptFile || null);
    setShowEditModal(true);
  };

  const handleUpdateTicket = async () => {
    if (!editingTicket || !user) return;

    const client = allClients.find((c: any) => c.id === formData.clientId);
    if (!client) return;

    try {
      await updateFinancialTicket(editingTicket.id, {
        title: formData.title,
        description: formData.description || undefined,
        amount: parseFloat(formData.amount),
        dueDate: new Date(formData.dueDate),
        status: formData.status,
        client: client,
        invoiceFile: invoiceFile || undefined,
        receiptFile: receiptFile || undefined,
        notes: formData.notes || undefined,
        paymentDate: formData.status === 'paid' ? (editingTicket.paymentDate || new Date()) : undefined,
      });

      setShowEditModal(false);
      setEditingTicket(null);
      alert('Ticket financeiro atualizado com sucesso!');
    } catch (error: any) {
      console.error('Erro ao atualizar ticket financeiro:', error);
      alert(error.message || 'Erro ao atualizar ticket financeiro. Verifique se o backend está rodando.');
    }
  };

  const handleDeleteTicket = async () => {
    if (deleteConfirmId) {
      try {
        await deleteFinancialTicket(deleteConfirmId);
        setDeleteConfirmId(null);
        alert('Ticket financeiro excluído com sucesso!');
      } catch (error: any) {
        console.error('Erro ao excluir ticket financeiro:', error);
        alert(error.message || 'Erro ao excluir ticket financeiro. Verifique se o backend está rodando.');
      }
    }
  };

  const handleDownloadFile = (file: TicketFile) => {
    if (file.data) {
      const link = document.createElement('a');
      link.href = file.data;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

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

  if (!hasPermission('view:all:financial') && !hasPermission('view:financial')) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">Você não tem permissão para acessar esta página</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">Gestão Financeira</h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">Criar e gerenciar tickets financeiros</p>
        </div>
        {hasPermission('create:financial') && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary flex items-center justify-center gap-2 w-full sm:w-auto"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">Novo Ticket Financeiro</span>
            <span className="sm:hidden">Novo</span>
          </button>
        )}
      </div>

      {/* Busca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
        <input
          type="text"
          placeholder="Buscar tickets financeiros..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
        />
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
            {filteredTickets.map((ticket) => (
              <div
                key={ticket.id}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                          {ticket.title}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          Cliente: {ticket.client.name}
                        </p>
                      </div>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
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
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
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

                    {(ticket.invoiceFile || ticket.receiptFile) && (
                      <div className="flex gap-2 mt-4">
                        {ticket.invoiceFile && ticket.status !== 'paid' && (
                          <button
                            onClick={() => handleDownloadFile(ticket.invoiceFile!)}
                            className="text-sm text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1"
                          >
                            <Download className="w-4 h-4" />
                            Boleto
                          </button>
                        )}
                        {ticket.receiptFile && (
                          <button
                            onClick={() => handleDownloadFile(ticket.receiptFile!)}
                            className="text-sm text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1"
                          >
                            <Download className="w-4 h-4" />
                            Comprovante
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {hasPermission('edit:financial') && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEditClick(ticket)}
                        className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                        title="Editar"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      {hasPermission('delete:financial') && (
                        <button
                          onClick={() => setDeleteConfirmId(ticket.id)}
                          className="p-2 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Criar Ticket */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full p-6 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Novo Ticket Financeiro</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Cliente *
                </label>
                <select
                  value={formData.clientId}
                  onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  required
                >
                  <option value="">Selecione um cliente</option>
                  {sortedCompanies.map((company) => (
                    <optgroup key={company} label={company}>
                      {clientsByCompany[company].map((client: any) => (
                        <option key={client.id} value={client.id}>
                          {client.name} ({client.email})
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                {allClients.length === 0 && (
                  <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-1">
                    Nenhum cliente cadastrado. Cadastre usuários com role "user" primeiro.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Título *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="Ex: Pagamento de serviço"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Descrição
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="Descrição do ticket financeiro"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Valor (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    placeholder="0.00"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Data de Vencimento *
                  </label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as PaymentStatus })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="pending">Pendente</option>
                  <option value="paid">Pago</option>
                  <option value="overdue">Vencido</option>
                  <option value="cancelled">Cancelado</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Boleto/Ticket (PDF)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    ref={invoiceInputRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileSelect(e, 'invoice')}
                    className="hidden"
                    id="invoice-upload"
                  />
                  <label
                    htmlFor="invoice-upload"
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  >
                    <div className="flex items-center gap-2">
                      <Upload className="w-4 h-4" />
                      <span className="text-sm">
                        {invoiceFile ? invoiceFile.name : 'Selecionar arquivo'}
                      </span>
                    </div>
                  </label>
                  {invoiceFile && (
                    <button
                      onClick={() => handleRemoveFile('invoice')}
                      className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                {invoiceFile && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {formatFileSize(invoiceFile.size)}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Comprovante de Pagamento
                </label>
                <div className="flex items-center gap-2">
                  <input
                    ref={receiptInputRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileSelect(e, 'receipt')}
                    className="hidden"
                    id="receipt-upload"
                  />
                  <label
                    htmlFor="receipt-upload"
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  >
                    <div className="flex items-center gap-2">
                      <Upload className="w-4 h-4" />
                      <span className="text-sm">
                        {receiptFile ? receiptFile.name : 'Selecionar arquivo'}
                      </span>
                    </div>
                  </label>
                  {receiptFile && (
                    <button
                      onClick={() => handleRemoveFile('receipt')}
                      className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                {receiptFile && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {formatFileSize(receiptFile.size)}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Observações
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="Observações adicionais"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="btn-secondary"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleCreateTicket}
                className="btn-primary flex items-center gap-2"
              >
                <Save className="w-5 h-5" />
                Criar Ticket
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Editar Ticket */}
      {showEditModal && editingTicket && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full p-6 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Editar Ticket Financeiro</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Cliente *
                </label>
                <select
                  value={formData.clientId}
                  onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  required
                >
                  <option value="">Selecione um cliente</option>
                  {sortedCompanies.map((company) => (
                    <optgroup key={company} label={company}>
                      {clientsByCompany[company].map((client: any) => (
                        <option key={client.id} value={client.id}>
                          {client.name} ({client.email})
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                {allClients.length === 0 && (
                  <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-1">
                    Nenhum cliente cadastrado. Cadastre usuários com role "user" primeiro.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Título *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Descrição
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Valor (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Data de Vencimento *
                  </label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as PaymentStatus })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="pending">Pendente</option>
                  <option value="paid">Pago</option>
                  <option value="overdue">Vencido</option>
                  <option value="cancelled">Cancelado</option>
                </select>
              </div>

              {formData.status === 'paid' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Data de Pagamento
                  </label>
                  <input
                    type="date"
                    value={editingTicket.paymentDate ? editingTicket.paymentDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}
                    onChange={(e) => {
                      const paymentDate = e.target.value ? new Date(e.target.value) : undefined;
                      updateFinancialTicket(editingTicket.id, { paymentDate });
                    }}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Boleto/Ticket (PDF)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    ref={invoiceInputRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileSelect(e, 'invoice')}
                    className="hidden"
                    id="edit-invoice-upload"
                  />
                  <label
                    htmlFor="edit-invoice-upload"
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  >
                    <div className="flex items-center gap-2">
                      <Upload className="w-4 h-4" />
                      <span className="text-sm">
                        {invoiceFile ? invoiceFile.name : editingTicket.invoiceFile?.name || 'Selecionar arquivo'}
                      </span>
                    </div>
                  </label>
                  {(invoiceFile || editingTicket.invoiceFile) && (
                    <button
                      onClick={() => handleRemoveFile('invoice')}
                      className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Comprovante de Pagamento
                </label>
                <div className="flex items-center gap-2">
                  <input
                    ref={receiptInputRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileSelect(e, 'receipt')}
                    className="hidden"
                    id="edit-receipt-upload"
                  />
                  <label
                    htmlFor="edit-receipt-upload"
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  >
                    <div className="flex items-center gap-2">
                      <Upload className="w-4 h-4" />
                      <span className="text-sm">
                        {receiptFile ? receiptFile.name : editingTicket.receiptFile?.name || 'Selecionar arquivo'}
                      </span>
                    </div>
                  </label>
                  {(receiptFile || editingTicket.receiptFile) && (
                    <button
                      onClick={() => handleRemoveFile('receipt')}
                      className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Observações
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowEditModal(false)}
                className="btn-secondary"
              >
                Cancelar
              </button>
              <button
                onClick={handleUpdateTicket}
                className="btn-primary flex items-center gap-2"
              >
                <Save className="w-5 h-5" />
                Salvar Alterações
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6 space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Excluir Ticket Financeiro</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Esta ação não pode ser desfeita</p>
              </div>
            </div>

            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Tem certeza que deseja excluir este ticket financeiro? Todos os dados relacionados serão permanentemente removidos.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="btn-secondary"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteTicket}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

