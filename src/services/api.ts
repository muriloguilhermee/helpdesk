// Garantir que a URL sempre termine com /api
const getApiUrl = () => {
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  // Remover /api se já existir e adicionar novamente para garantir
  const cleanUrl = baseUrl.replace(/\/api\/?$/, '');
  return `${cleanUrl}/api`;
};

const API_URL = getApiUrl();

class ApiService {
  private getToken(): string | null {
    return localStorage.getItem('token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retries = 2
  ): Promise<T> {
    const token = this.getToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }

    // Adicionar timeout e retry para conexões intermitentes
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 segundos

    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      // Se receber 429 (Too Many Requests), aguardar e tentar novamente
      // Para login, usar menos retries e mais tempo de espera
      const isLoginEndpoint = endpoint.includes('/auth/login');
      const maxRetries = isLoginEndpoint ? 1 : retries; // Login só tenta 1 vez após erro
      
      if (response.status === 429 && maxRetries > 0) {
        const retryAfter = response.headers.get('Retry-After');
        // Para login, aguardar mais tempo (60 segundos) para evitar bloqueios
        const waitTime = retryAfter 
          ? parseInt(retryAfter) * 1000 
          : (isLoginEndpoint ? 60000 : 5000); // 60s para login, 5s para outros

        console.log(`⏳ Rate limit atingido. Aguardando ${waitTime/1000}s antes de tentar novamente...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));

        // Tentar novamente com um retry a menos
        return this.request<T>(endpoint, options, maxRetries - 1);
      }

      if (!response.ok) {
        // Para 429, lançar erro específico sem tentar novamente se já tentou
        if (response.status === 429) {
          const errorWithStatus = new Error('Muitas tentativas de login. Aguarde alguns minutos antes de tentar novamente.');
          (errorWithStatus as any).status = 429;
          throw errorWithStatus;
        }
        
        const error = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
        const errorMessage = error.error || `HTTP error! status: ${response.status}`;
        const errorWithStatus = new Error(errorMessage);
        (errorWithStatus as any).status = response.status;
        throw errorWithStatus;
      }

      if (response.status === 204) {
        return {} as T;
      }

      return response.json();
    } catch (error: any) {
      clearTimeout(timeoutId);

      // Se for erro de rate limit, não tentar novamente (já tentou acima)
      if (error.status === 429) {
        // Se for login, dar mensagem mais clara
        if (endpoint.includes('/auth/login')) {
          throw new Error('Muitas tentativas de login. Por favor, aguarde alguns minutos antes de tentar novamente.');
        }
        throw error;
      }

      if (error.name === 'AbortError') {
        throw new Error('Timeout: O servidor demorou muito para responder. Tente novamente.');
      }
      if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
        const apiUrl = import.meta.env.VITE_API_URL;
        if (!apiUrl) {
          throw new Error('Backend não configurado! Configure VITE_API_URL no Vercel (Settings → Environment Variables).');
        }
        throw new Error(`Erro ao conectar com o servidor (${apiUrl}). Verifique se o backend está rodando no Render.`);
      }
      throw error;
    }
  }

  // Auth
  async login(email: string, password: string) {
    console.log('📡 Fazendo requisição de login para:', `${API_URL}/auth/login`);
    try {
      const response = await this.request<{ user: any; token: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      console.log('✅ Login bem-sucedido, resposta:', response);
      return response;
    } catch (error: any) {
      console.error('❌ Erro na requisição de login:', error);
      throw error;
    }
  }

  async register(data: {
    name: string;
    email: string;
    password: string;
    role: 'admin' | 'technician' | 'user';
    avatar?: string;
  }) {
    return this.request<{ user: any; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Users
  async getUsers() {
    return this.request<any[]>('/users');
  }

  async getUserById(id: string) {
    return this.request<any>(`/users/${id}`);
  }

  async createUser(data: {
    name: string;
    email: string;
    password: string;
    role: 'admin' | 'technician' | 'user';
    avatar?: string;
    company?: string;
  }) {
    return this.request<any>('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateUser(id: string, data: {
    name?: string;
    email?: string;
    password?: string;
    role?: 'admin' | 'technician' | 'user';
    avatar?: string | null;
    company?: string | null;
  }) {
    return this.request<any>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteUser(id: string) {
    return this.request<void>(`/users/${id}`, {
      method: 'DELETE',
    });
  }

  // Tickets
  async getTickets(filters?: {
    status?: string;
    priority?: string;
    category?: string;
    assignedTo?: string;
    search?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });
    }
    const query = queryParams.toString();
    return this.request<any[]>(`/tickets${query ? `?${query}` : ''}`);
  }

  async getPendingTickets() {
    return this.request<any[]>('/tickets/pending');
  }

  async getTicketById(id: string) {
    return this.request<any>(`/tickets/${id}`);
  }

  async createTicket(data: {
    title: string;
    description: string;
    priority: 'baixa' | 'media' | 'alta' | 'critica';
    category: 'tecnico' | 'suporte' | 'financeiro' | 'outros';
    serviceType?: string;
    totalValue?: number;
    clientId?: string;
    files?: Array<{
      name: string;
      size: number;
      type: string;
      dataUrl: string;
    }>;
  }) {
    return this.request<any>('/tickets', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateTicket(id: string, data: {
    title?: string;
    description?: string;
    status?: string;
    priority?: string;
    category?: string;
    serviceType?: string;
    totalValue?: number;
    assignedTo?: string | null;
    clientId?: string;
    queueId?: string | null;
  }) {
    return this.request<any>(`/tickets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteTicket(id: string) {
    return this.request<void>(`/tickets/${id}`, {
      method: 'DELETE',
    });
  }

  async addComment(ticketId: string, content: string) {
    return this.request<any>(`/tickets/${ticketId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  }

  // Financial Tickets
  async getFinancialTickets() {
    return this.request<any[]>('/financial');
  }

  async getFinancialTicketById(id: string) {
    return this.request<any>(`/financial/${id}`);
  }

  async createFinancialTicket(data: {
    title: string;
    description?: string;
    amount: number;
    dueDate: string | Date;
    paymentDate?: string | Date;
    status: 'pending' | 'paid' | 'overdue' | 'cancelled';
    clientId: string;
    invoiceFile?: {
      name: string;
      size: number;
      type: string;
      data: string;
    };
    receiptFile?: {
      name: string;
      size: number;
      type: string;
      data: string;
    };
    notes?: string;
    erpId?: string;
    erpType?: string;
    invoiceNumber?: string;
    barcode?: string;
    ourNumber?: string;
    paymentErpId?: string;
    paymentMethod?: string;
    transactionId?: string;
    erpMetadata?: Record<string, any>;
    paymentMetadata?: Record<string, any>;
  }) {
    return this.request<any>('/financial', {
      method: 'POST',
      body: JSON.stringify({
        ...data,
        dueDate: data.dueDate instanceof Date ? data.dueDate.toISOString() : data.dueDate,
        paymentDate: data.paymentDate ? (data.paymentDate instanceof Date ? data.paymentDate.toISOString() : data.paymentDate) : undefined,
      }),
    });
  }

  async updateFinancialTicket(id: string, data: {
    title?: string;
    description?: string;
    amount?: number;
    dueDate?: string | Date;
    paymentDate?: string | Date | null;
    status?: 'pending' | 'paid' | 'overdue' | 'cancelled';
    clientId?: string;
    invoiceFile?: {
      name: string;
      size: number;
      type: string;
      data: string;
    } | null;
    receiptFile?: {
      name: string;
      size: number;
      type: string;
      data: string;
    } | null;
    notes?: string;
    erpId?: string;
    erpType?: string;
    invoiceNumber?: string;
    barcode?: string;
    ourNumber?: string;
    paymentErpId?: string;
    paymentMethod?: string;
    transactionId?: string;
    erpMetadata?: Record<string, any>;
    paymentMetadata?: Record<string, any>;
  }) {
    return this.request<any>(`/financial/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        ...data,
        dueDate: data.dueDate ? (data.dueDate instanceof Date ? data.dueDate.toISOString() : data.dueDate) : undefined,
        paymentDate: data.paymentDate !== undefined ? (data.paymentDate === null ? null : (data.paymentDate instanceof Date ? data.paymentDate.toISOString() : data.paymentDate)) : undefined,
      }),
    });
  }

  async deleteFinancialTicket(id: string) {
    return this.request<void>(`/financial/${id}`, {
      method: 'DELETE',
    });
  }
}

export const api = new ApiService();

