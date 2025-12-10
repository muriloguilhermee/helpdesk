import knex, { Knex } from 'knex';
import dotenv from 'dotenv';

dotenv.config();

let db: Knex | null = null;

export const getDatabase = (): Knex => {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return db;
};

export const initializeDatabase = async (): Promise<void> => {
  try {
    // Verifica se há configuração de banco de dados
    if (!process.env.DATABASE_URL && !process.env.DB_HOST) {
      throw new Error(
        'Database configuration is required. Please set DATABASE_URL or DB_HOST in .env file.\n' +
        'Example: DATABASE_URL=postgresql://user:password@host:port/database'
      );
    }

    // Suporta connection string (para Supabase, Neon, etc) ou configuração individual
    const connectionConfig = process.env.DATABASE_URL
      ? process.env.DATABASE_URL // Connection string completa
      : {
          host: process.env.DB_HOST || 'localhost',
          port: parseInt(process.env.DB_PORT || '5432'),
          user: process.env.DB_USER || 'postgres',
          password: process.env.DB_PASSWORD || 'postgres',
          database: process.env.DB_NAME || 'helpdesk',
        };

    db = knex({
      client: 'pg',
      connection: connectionConfig,
      pool: {
        min: 2,
        max: 10,
      },
    });

    // Test connection
    await db.raw('SELECT 1');
    console.log('✅ Database connected successfully');

    // Run migrations
    await runMigrations();
  } catch (error) {
    console.error('❌ Database connection error:', error);
    throw error;
  }
};

const runMigrations = async (): Promise<void> => {
  try {
    // Create tables if they don't exist
    const hasUsersTable = await db!.schema.hasTable('users');
    if (!hasUsersTable) {
      await db!.schema.createTable('users', (table) => {
        table.uuid('id').primary().defaultTo(db!.raw('gen_random_uuid()'));
        table.string('email').unique().notNullable();
        table.string('name').notNullable();
        table.string('password').notNullable();
        table.enum('role', ['admin', 'technician', 'user']).notNullable();
        table.text('avatar').nullable();
        table.timestamps(true, true);
      });
      console.log('✅ Created users table');
    }

    const hasTicketsTable = await db!.schema.hasTable('tickets');
    if (!hasTicketsTable) {
      await db!.schema.createTable('tickets', (table) => {
        table.string('id').primary();
        table.string('title').notNullable();
        table.text('description').notNullable();
        table.enum('status', ['aberto', 'em_andamento', 'em_atendimento', 'pendente', 'resolvido', 'fechado', 'encerrado']).notNullable();
        table.enum('priority', ['baixa', 'media', 'alta', 'critica']).notNullable();
        table.enum('category', ['tecnico', 'suporte', 'financeiro', 'outros']).notNullable();
        table.string('service_type').nullable();
        table.decimal('total_value', 10, 2).nullable();
        table.uuid('created_by').references('id').inTable('users').onDelete('CASCADE');
        table.uuid('assigned_to').references('id').inTable('users').onDelete('SET NULL').nullable();
        table.uuid('client_id').references('id').inTable('users').onDelete('SET NULL').nullable();
        table.timestamps(true, true);
      });
      console.log('✅ Created tickets table');
    }

    const hasTicketFilesTable = await db!.schema.hasTable('ticket_files');
    if (!hasTicketFilesTable) {
      await db!.schema.createTable('ticket_files', (table) => {
        table.uuid('id').primary().defaultTo(db!.raw('gen_random_uuid()'));
        table.string('ticket_id').references('id').inTable('tickets').onDelete('CASCADE');
        table.string('name').notNullable();
        table.bigInteger('size').notNullable();
        table.string('type').notNullable();
        table.text('data_url').notNullable(); // Base64 ou URL
        table.timestamps(true, true);
      });
      console.log('✅ Created ticket_files table');
    }

    const hasCommentsTable = await db!.schema.hasTable('comments');
    if (!hasCommentsTable) {
      await db!.schema.createTable('comments', (table) => {
        table.uuid('id').primary().defaultTo(db!.raw('gen_random_uuid()'));
        table.string('ticket_id').references('id').inTable('tickets').onDelete('CASCADE');
        table.text('content').notNullable();
        table.uuid('author_id').references('id').inTable('users').onDelete('CASCADE');
        table.timestamps(true, true);
      });
      console.log('✅ Created comments table');
    }

    // Create indexes for performance
    await db!.schema.raw(`
      CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
      CREATE INDEX IF NOT EXISTS idx_tickets_created_by ON tickets(created_by);
      CREATE INDEX IF NOT EXISTS idx_tickets_assigned_to ON tickets(assigned_to);
      CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON tickets(created_at);
      CREATE INDEX IF NOT EXISTS idx_comments_ticket_id ON comments(ticket_id);
    `);

    console.log('✅ Database migrations completed');
  } catch (error) {
    console.error('❌ Migration error:', error);
    throw error;
  }
};

export const closeDatabase = async (): Promise<void> => {
  if (db) {
    await db.destroy();
    db = null;
    console.log('✅ Database connection closed');
  }
};

