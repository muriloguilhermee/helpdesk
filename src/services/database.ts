/**
 * Serviço de Banco de Dados Local
 * Usa IndexedDB para armazenamento persistente e robusto
 * Facilita migração futura para banco de dados real
 */

import { User, Ticket, FinancialTicket, Queue } from '../types';

interface DatabaseSchema {
  users: User[];
  tickets: Ticket[];
  financialTickets: FinancialTicket[];
  settings: any;
  notifications: any[];
  queues: Queue[];
}

class LocalDatabase {
  private dbName = 'helpdesk-db';
  private dbVersion = 2; // Incrementado para adicionar suporte a filas
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        console.error('Erro ao abrir banco de dados:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Criar object stores se não existirem
        if (!db.objectStoreNames.contains('users')) {
          const usersStore = db.createObjectStore('users', { keyPath: 'id' });
          usersStore.createIndex('email', 'email', { unique: true });
        }

        if (!db.objectStoreNames.contains('tickets')) {
          const ticketsStore = db.createObjectStore('tickets', { keyPath: 'id' });
          ticketsStore.createIndex('createdBy', 'createdBy.id', { unique: false });
          ticketsStore.createIndex('status', 'status', { unique: false });
          ticketsStore.createIndex('category', 'category', { unique: false });
        }

        if (!db.objectStoreNames.contains('financialTickets')) {
          const financialStore = db.createObjectStore('financialTickets', { keyPath: 'id' });
          financialStore.createIndex('client', 'client.id', { unique: false });
          financialStore.createIndex('status', 'status', { unique: false });
        }

        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }

        if (!db.objectStoreNames.contains('notifications')) {
          const notificationsStore = db.createObjectStore('notifications', { keyPath: 'id', autoIncrement: true });
          notificationsStore.createIndex('read', 'read', { unique: false });
        }

        if (!db.objectStoreNames.contains('queues')) {
          const queuesStore = db.createObjectStore('queues', { keyPath: 'id' });
          queuesStore.createIndex('name', 'name', { unique: true });
        }
      };
    });
  }

  private async ensureDB(): Promise<IDBDatabase> {
    if (!this.db) {
      await this.init();
    }
    if (!this.db) {
      throw new Error('Banco de dados não inicializado');
    }
    return this.db;
  }

  // ========== USERS ==========
  async getUsers(): Promise<User[]> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['users'], 'readonly');
      const store = transaction.objectStore('users');
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result || []);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  async saveUser(user: User, password?: string): Promise<void> {
    // IndexedDB não armazena senha (fica no localStorage)
    // password é ignorado aqui, mas mantido na assinatura para compatibilidade
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['users'], 'readwrite');
      const store = transaction.objectStore('users');
      const request = store.put(user);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async saveUsers(users: User[]): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['users'], 'readwrite');
      const store = transaction.objectStore('users');

      // Limpar todos os usuários primeiro
      store.clear();

      // Adicionar todos os usuários
      let completed = 0;
      const total = users.length;

      if (total === 0) {
        resolve();
        return;
      }

      users.forEach((user) => {
        const request = store.add(user);
        request.onsuccess = () => {
          completed++;
          if (completed === total) {
            resolve();
          }
        };
        request.onerror = () => {
          reject(request.error);
        };
      });
    });
  }

  async deleteUser(userId: string): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['users'], 'readwrite');
      const store = transaction.objectStore('users');
      const request = store.delete(userId);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // ========== TICKETS ==========
  async getTickets(): Promise<Ticket[]> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['tickets'], 'readonly');
      const store = transaction.objectStore('tickets');
      const request = store.getAll();

      request.onsuccess = () => {
        const tickets = request.result || [];
        // Converter datas de string para Date
        const parsedTickets = tickets.map((t: any) => ({
          ...t,
          createdAt: new Date(t.createdAt),
          updatedAt: new Date(t.updatedAt),
          comments: t.comments ? t.comments.map((c: any) => ({
            ...c,
            createdAt: new Date(c.createdAt),
          })) : undefined,
        }));
        resolve(parsedTickets);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  async saveTicket(ticket: Ticket): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['tickets'], 'readwrite');
      const store = transaction.objectStore('tickets');

      // Converter datas para ISO string
      const ticketToSave = {
        ...ticket,
        createdAt: ticket.createdAt instanceof Date ? ticket.createdAt.toISOString() : ticket.createdAt,
        updatedAt: ticket.updatedAt instanceof Date ? ticket.updatedAt.toISOString() : ticket.updatedAt,
        comments: ticket.comments ? ticket.comments.map(c => ({
          ...c,
          createdAt: c.createdAt instanceof Date ? c.createdAt.toISOString() : c.createdAt,
        })) : undefined,
      };

      const request = store.put(ticketToSave);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async saveTickets(tickets: Ticket[]): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['tickets'], 'readwrite');
      const store = transaction.objectStore('tickets');

      // Limpar todos os tickets primeiro
      store.clear();

      // Adicionar todos os tickets
      let completed = 0;
      const total = tickets.length;

      if (total === 0) {
        resolve();
        return;
      }

      tickets.forEach((ticket) => {
        const ticketToSave = {
          ...ticket,
          createdAt: ticket.createdAt instanceof Date ? ticket.createdAt.toISOString() : ticket.createdAt,
          updatedAt: ticket.updatedAt instanceof Date ? ticket.updatedAt.toISOString() : ticket.updatedAt,
          comments: ticket.comments ? ticket.comments.map(c => ({
            ...c,
            createdAt: c.createdAt instanceof Date ? c.createdAt.toISOString() : c.createdAt,
          })) : undefined,
        };

        const request = store.add(ticketToSave);
        request.onsuccess = () => {
          completed++;
          if (completed === total) {
            resolve();
          }
        };
        request.onerror = () => {
          reject(request.error);
        };
      });
    });
  }

  async deleteTicket(ticketId: string): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['tickets'], 'readwrite');
      const store = transaction.objectStore('tickets');
      const request = store.delete(ticketId);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // ========== FINANCIAL TICKETS ==========
  async getFinancialTickets(): Promise<FinancialTicket[]> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['financialTickets'], 'readonly');
      const store = transaction.objectStore('financialTickets');
      const request = store.getAll();

      request.onsuccess = () => {
        const tickets = request.result || [];
        // Converter datas de string para Date
        const parsedTickets = tickets.map((t: any) => ({
          ...t,
          dueDate: new Date(t.dueDate),
          paymentDate: t.paymentDate ? new Date(t.paymentDate) : undefined,
          createdAt: new Date(t.createdAt),
          updatedAt: new Date(t.updatedAt),
        }));
        resolve(parsedTickets);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  async saveFinancialTicket(ticket: FinancialTicket): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['financialTickets'], 'readwrite');
      const store = transaction.objectStore('financialTickets');

      // Converter datas para ISO string
      const ticketToSave = {
        ...ticket,
        dueDate: ticket.dueDate instanceof Date ? ticket.dueDate.toISOString() : ticket.dueDate,
        paymentDate: ticket.paymentDate instanceof Date ? ticket.paymentDate.toISOString() : ticket.paymentDate,
        createdAt: ticket.createdAt instanceof Date ? ticket.createdAt.toISOString() : ticket.createdAt,
        updatedAt: ticket.updatedAt instanceof Date ? ticket.updatedAt.toISOString() : ticket.updatedAt,
      };

      const request = store.put(ticketToSave);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async saveFinancialTickets(tickets: FinancialTicket[]): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['financialTickets'], 'readwrite');
      const store = transaction.objectStore('financialTickets');

      // Limpar todos os tickets primeiro
      store.clear();

      // Adicionar todos os tickets
      let completed = 0;
      const total = tickets.length;

      if (total === 0) {
        resolve();
        return;
      }

      tickets.forEach((ticket) => {
        const ticketToSave = {
          ...ticket,
          dueDate: ticket.dueDate instanceof Date ? ticket.dueDate.toISOString() : ticket.dueDate,
          paymentDate: ticket.paymentDate instanceof Date ? ticket.paymentDate.toISOString() : ticket.paymentDate,
          createdAt: ticket.createdAt instanceof Date ? ticket.createdAt.toISOString() : ticket.createdAt,
          updatedAt: ticket.updatedAt instanceof Date ? ticket.updatedAt.toISOString() : ticket.updatedAt,
        };

        const request = store.add(ticketToSave);
        request.onsuccess = () => {
          completed++;
          if (completed === total) {
            resolve();
          }
        };
        request.onerror = () => {
          reject(request.error);
        };
      });
    });
  }

  async deleteFinancialTicket(ticketId: string): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['financialTickets'], 'readwrite');
      const store = transaction.objectStore('financialTickets');
      const request = store.delete(ticketId);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // ========== SETTINGS ==========
  async getSetting(key: string): Promise<any> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['settings'], 'readonly');
      const store = transaction.objectStore('settings');
      const request = store.get(key);

      request.onsuccess = () => {
        resolve(request.result?.value);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  async saveSetting(key: string, value: any): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['settings'], 'readwrite');
      const store = transaction.objectStore('settings');
      const request = store.put({ key, value });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // ========== NOTIFICATIONS ==========
  async getNotifications(): Promise<any[]> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['notifications'], 'readonly');
      const store = transaction.objectStore('notifications');
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result || []);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  async saveNotification(notification: any): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['notifications'], 'readwrite');
      const store = transaction.objectStore('notifications');
      const request = store.add(notification);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async saveNotifications(notifications: any[]): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['notifications'], 'readwrite');
      const store = transaction.objectStore('notifications');

      // Limpar todas as notificações primeiro
      store.clear();

      // Adicionar todas as notificações
      let completed = 0;
      const total = notifications.length;

      if (total === 0) {
        resolve();
        return;
      }

      notifications.forEach((notification) => {
        const request = store.add(notification);
        request.onsuccess = () => {
          completed++;
          if (completed === total) {
            resolve();
          }
        };
        request.onerror = () => {
          reject(request.error);
        };
      });
    });
  }

  // ========== MIGRATION FROM LOCALSTORAGE ==========
  async migrateFromLocalStorage(): Promise<void> {
    try {
      // Migrar usuários
      const allUsers = localStorage.getItem('allUsers');
      if (allUsers) {
        const users = JSON.parse(allUsers);
        await this.saveUsers(users);
      }

      // Migrar tickets
      const tickets = localStorage.getItem('tickets');
      if (tickets) {
        const ticketsData = JSON.parse(tickets);
        // Converter datas
        const parsedTickets = ticketsData.map((t: any) => ({
          ...t,
          createdAt: new Date(t.createdAt),
          updatedAt: new Date(t.updatedAt),
        }));
        await this.saveTickets(parsedTickets);
      }

      // Migrar tickets financeiros
      const financialTickets = localStorage.getItem('financialTickets');
      if (financialTickets) {
        const financialData = JSON.parse(financialTickets);
        const parsedFinancial = financialData.map((t: any) => ({
          ...t,
          dueDate: new Date(t.dueDate),
          paymentDate: t.paymentDate ? new Date(t.paymentDate) : undefined,
          createdAt: new Date(t.createdAt),
          updatedAt: new Date(t.updatedAt),
        }));
        await this.saveFinancialTickets(parsedFinancial);
      }

      // Migrar configurações
      const settings = localStorage.getItem('settings');
      if (settings) {
        await this.saveSetting('appSettings', JSON.parse(settings));
      }

      // Migrar notificações
      const notifications = localStorage.getItem('notifications');
      if (notifications) {
        const notificationsData = JSON.parse(notifications);
        await this.saveNotifications(notificationsData);
      }

      console.log('Migração do localStorage concluída com sucesso!');
    } catch (error) {
      console.error('Erro ao migrar do localStorage:', error);
    }
  }

  // ========== EXPORT/IMPORT ==========
  async exportData(): Promise<string> {
    const [users, tickets, financialTickets, settings, notifications] = await Promise.all([
      this.getUsers(),
      this.getTickets(),
      this.getFinancialTickets(),
      this.getSetting('appSettings'),
      this.getNotifications(),
    ]);

    return JSON.stringify({
      users,
      tickets,
      financialTickets,
      settings,
      notifications,
      exportDate: new Date().toISOString(),
    }, null, 2);
  }

  async importData(jsonData: string): Promise<void> {
    const data = JSON.parse(jsonData);

    if (data.users) await this.saveUsers(data.users);
    if (data.tickets) await this.saveTickets(data.tickets);
    if (data.financialTickets) await this.saveFinancialTickets(data.financialTickets);
    if (data.settings) await this.saveSetting('appSettings', data.settings);
    if (data.notifications) await this.saveNotifications(data.notifications);
  }

  // ========== CLEAR ALL ==========
  async clearAll(): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['users', 'tickets', 'financialTickets', 'settings', 'notifications'], 'readwrite');

      transaction.objectStore('users').clear();
      transaction.objectStore('tickets').clear();
      transaction.objectStore('financialTickets').clear();
      transaction.objectStore('settings').clear();
      transaction.objectStore('notifications').clear();
      if (db.objectStoreNames.contains('queues')) {
        transaction.objectStore('queues').clear();
      }

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  // ========== QUEUES ==========
  async getQueues(): Promise<Queue[]> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['queues'], 'readonly');
      const store = transaction.objectStore('queues');
      const request = store.getAll();

      request.onsuccess = () => {
        const queues = request.result || [];
        const parsedQueues = queues.map((q: any) => ({
          ...q,
          createdAt: new Date(q.createdAt),
          updatedAt: new Date(q.updatedAt),
        }));
        resolve(parsedQueues);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  async saveQueue(queue: Queue): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['queues'], 'readwrite');
      const store = transaction.objectStore('queues');

      const queueToSave = {
        ...queue,
        createdAt: queue.createdAt instanceof Date ? queue.createdAt.toISOString() : queue.createdAt,
        updatedAt: queue.updatedAt instanceof Date ? queue.updatedAt.toISOString() : queue.updatedAt,
      };

      const request = store.put(queueToSave);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async deleteQueue(queueId: string): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['queues'], 'readwrite');
      const store = transaction.objectStore('queues');
      const request = store.delete(queueId);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

// Instância singleton
export const database = new LocalDatabase();

// Inicializar banco de dados quando o módulo for carregado
database.init().then(async () => {
  console.log('Banco de dados inicializado com sucesso!');
  // Migrar dados do localStorage na primeira vez
  await database.migrateFromLocalStorage();

  // Garantir que as filas padrão existem
  try {
    const queues = await database.getQueues();
    const queueNames = queues.map((q: any) => q.name);

    // Criar Suporte N1 se não existir
    if (!queueNames.includes('Suporte N1')) {
      const suporteN1: Queue = {
        id: `queue-n1-${Date.now()}`,
        name: 'Suporte N1',
        description: 'Fila padrão de suporte nível 1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await database.saveQueue(suporteN1);
      console.log('Fila "Suporte N1" criada com sucesso!');
    }

    // Criar Suporte N2 se não existir
    if (!queueNames.includes('Suporte N2')) {
      const suporteN2: Queue = {
        id: `queue-n2-${Date.now()}`,
        name: 'Suporte N2',
        description: 'Fila de suporte nível 2 (Desenvolvedores)',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await database.saveQueue(suporteN2);
      console.log('Fila "Suporte N2" criada com sucesso!');
    }
  } catch (error) {
    console.error('Erro ao verificar/criar filas padrão:', error);
  }
}).catch((error) => {
  console.error('Erro ao inicializar banco de dados:', error);
});

