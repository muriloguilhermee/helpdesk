/**
 * Adaptador de Banco de Dados
 * Detecta automaticamente se deve usar PostgreSQL ou IndexedDB
 * Mantém compatibilidade total com código existente
 */

import { User, Ticket, FinancialTicket, Queue, Interaction, TicketFile } from '../types';
import { database } from './database';

// Verificar se PostgreSQL está disponível
const hasPostgresConfig = !!import.meta.env.VITE_SUPABASE_URL || !!import.meta.env.VITE_DATABASE_URL;

// Interface comum para ambos os bancos
interface DatabaseAdapter {
  init(): Promise<void>;
  getUsers(): Promise<User[]>;
  saveUser(user: User, password?: string): Promise<void>;
  getTickets(): Promise<Ticket[]>;
  getTicket(id: string): Promise<Ticket | null>;
  saveTicket(ticket: Ticket): Promise<void>;
  saveTickets(tickets: Ticket[]): Promise<void>;
  deleteTicket(id: string): Promise<void>;
  getQueues(): Promise<Queue[]>;
  saveQueue(queue: Queue): Promise<void>;
  addInteraction(ticketId: string, interaction: Interaction): Promise<void>;
}

// Implementação PostgreSQL (carregada dinamicamente)
let postgresAdapter: DatabaseAdapter | null = null;

async function getPostgresAdapter(): Promise<DatabaseAdapter | null> {
  if (!hasPostgresConfig) return null;

  if (postgresAdapter) return postgresAdapter;

  try {
    // Tentar carregar adaptador PostgreSQL
    const { PostgresAdapter } = await import('./postgresAdapter');
    postgresAdapter = new PostgresAdapter();
    await postgresAdapter.init();
    console.log('✅ Usando PostgreSQL/Supabase');
    return postgresAdapter;
  } catch (error) {
    console.warn('⚠️ PostgreSQL não disponível, usando IndexedDB:', error);
    return null;
  }
}

// Adaptador unificado que escolhe automaticamente
class UnifiedDatabaseAdapter implements DatabaseAdapter {
  private adapter: DatabaseAdapter = database as any;

  async init(): Promise<void> {
    // Sempre inicializar IndexedDB primeiro (fallback)
    await database.init();

    // Tentar usar PostgreSQL se disponível
    const pgAdapter = await getPostgresAdapter();
    if (pgAdapter) {
      this.adapter = pgAdapter;
    } else {
      console.log('📦 Usando IndexedDB (modo local)');
    }
  }

  async getUsers(): Promise<User[]> {
    return this.adapter.getUsers();
  }

  async saveUser(user: User, password?: string): Promise<void> {
    // Se for PostgresAdapter, passar password se disponível
    if (this.adapter && typeof (this.adapter as any).saveUser === 'function') {
      return (this.adapter as any).saveUser(user, password);
    }
    return this.adapter.saveUser(user);
  }

  async getTickets(): Promise<Ticket[]> {
    return this.adapter.getTickets();
  }

  async getTicket(id: string): Promise<Ticket | null> {
    return this.adapter.getTicket(id);
  }

  async saveTicket(ticket: Ticket): Promise<void> {
    return this.adapter.saveTicket(ticket);
  }

  async saveTickets(tickets: Ticket[]): Promise<void> {
    return this.adapter.saveTickets(tickets);
  }

  async deleteTicket(id: string): Promise<void> {
    return this.adapter.deleteTicket(id);
  }

  async getQueues(): Promise<Queue[]> {
    return this.adapter.getQueues();
  }

  async saveQueue(queue: Queue): Promise<void> {
    return this.adapter.saveQueue(queue);
  }

  async addInteraction(ticketId: string, interaction: Interaction): Promise<void> {
    return this.adapter.addInteraction(ticketId, interaction);
  }
}

// Exportar instância única
export const dbAdapter = new UnifiedDatabaseAdapter();

// Exportar também como 'database' para compatibilidade
export { dbAdapter as database };


