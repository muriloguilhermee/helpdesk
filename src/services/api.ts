const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

class ApiService {
  private getToken(): string | null {
    return localStorage.getItem('token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.getToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
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
}

export const api = new ApiService();

