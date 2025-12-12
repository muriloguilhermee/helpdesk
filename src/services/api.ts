// Garantir que a URL sempre termine com /api
const getApiUrl = () => {
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  // Remover /api se já existir e adicionar novamente para garantir
  const cleanUrl = baseUrl.replace(/\/api\/?$/, '');
  return `${cleanUrl}/api`;
};

const API_URL = getApiUrl();

class ApiService {
  private rateLimitUntil: number = 0; // Timestamp até quando estamos em rate limit

  private getToken(): string | null {
    return localStorage.getItem('token');
  }

  private isRateLimited(): boolean {
    return Date.now() < this.rateLimitUntil;
  }

  private setRateLimited(seconds: number = 60): void {
    this.rateLimitUntil = Date.now() + (seconds * 1000);
    console.log(`🚫 Rate limit ativo até ${new Date(this.rateLimitUntil).toLocaleTimeString()}`);
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retries = 2
  ): Promise<T> {
    // Verificar se estamos em rate limit - não fazer requisição se estiver bloqueado
    if (this.isRateLimited()) {
      const waitTime = Math.ceil((this.rateLimitUntil - Date.now()) / 1000);
      throw new Error(`Rate limit ativo. Aguarde ${waitTime} segundos antes de tentar novamente.`);
    }

    const token = this.getToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
      console.log('🔑 Token encontrado, adicionando ao header Authorization');
    } else {
      console.error('❌ Token não encontrado no localStorage!');
      console.error('   Endpoint:', endpoint);
      console.error('   localStorage token:', localStorage.getItem('token'));
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
        // Para 401, verificar se é problema de token
        if (response.status === 401) {
          console.error('❌ Erro 401 (Unauthorized):', {
            endpoint,
            hasToken: !!token,
            tokenPreview: token ? token.substring(0, 20) + '...' : 'null'
          });

          // Tentar obter token novamente
          const currentToken = this.getToken();
          if (!currentToken) {
            const errorWithStatus = new Error('Token não fornecido. Faça login novamente.');
            (errorWithStatus as any).status = 401;
            throw errorWithStatus;
          }
        }

        // Para 429, marcar como rate limited e lançar erro
        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After');
          const waitSeconds = retryAfter ? parseInt(retryAfter) : 120; // 2 minutos por padrão
          this.setRateLimited(waitSeconds);

          const errorWithStatus = new Error(`Muitas tentativas. Aguarde ${waitSeconds} segundos antes de tentar novamente.`);
          (errorWithStatus as any).status = 429;
          throw errorWithStatus;
        }

        // Tentar ler JSON; se falhar, ler texto para logar a mensagem real
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorJson = await response.json();
          errorMessage = errorJson.error || errorMessage;
        } catch {
          try {
            const errorText = await response.text();
            if (errorText) errorMessage = errorText;
          } catch {
            // ignore
          }
        }

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

      // Se for erro de rate limit, marcar como rate limited e não tentar novamente
      if (error.status === 429) {
        const waitSeconds = 120; // 2 minutos por padrão
        this.setRateLimited(waitSeconds);

        // Se for login, dar mensagem mais clara
        if (endpoint.includes('/auth/login')) {
          throw new Error(`Muitas tentativas de login. Aguarde ${waitSeconds} segundos antes de tentar novamente.`);
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

  async addInteraction(ticketId: string, type: string, content: string, metadata?: any, files?: Array<{
    name: string;
    size: number;
    type: string;
    dataUrl: string; // Base64 data URL
  }>) {
    const payload = {
      type,
      content,
      metadata,
      files: files?.map(f => ({
        name: f.name,
        size: f.size,
        type: f.type,
        dataUrl: f.dataUrl, // Enviar como dataUrl para o backend
      }))
    };

    console.log('📤 Payload da requisição:', {
      type,
      content: content.substring(0, 50) + '...',
      hasMetadata: !!metadata,
      hasFiles: !!files && files.length > 0,
      filesCount: files?.length || 0,
      files: files?.map(f => ({
        name: f.name,
        size: f.size,
        type: f.type,
        hasDataUrl: !!f.dataUrl,
        dataUrlLength: f.dataUrl?.length || 0
      }))
    });

    return this.request<any>(`/tickets/${ticketId}/interactions`, {
      method: 'POST',
      body: JSON.stringify(payload),
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

