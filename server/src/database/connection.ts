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
      console.error('❌ Variáveis de ambiente disponíveis:', Object.keys(process.env).filter(k => k.includes('DATABASE') || k.includes('DB')));
      throw new Error(
        'Database configuration is required. Please set DATABASE_URL or DB_HOST in Railway Variables.\n' +
        'Go to Railway Dashboard → Your Service → Variables → + New Variable\n' +
        'Add: DATABASE_URL=postgresql://user:password@host:port/database\n' +
        'See CONFIGURAR_RAILWAY.md for detailed instructions.'
      );
    }

    // Suporta connection string (para Supabase, Neon, etc) ou configuração individual
    const isSupabase = process.env.DATABASE_URL?.includes('supabase');

    let connectionConfig: string | object;

    if (process.env.DATABASE_URL) {
      // Se for Supabase, converter string para objeto para adicionar SSL
      if (isSupabase) {
        // Parse da connection string
        const url = new URL(process.env.DATABASE_URL);
        connectionConfig = {
          host: url.hostname,
          port: parseInt(url.port || '5432'),
          user: url.username,
          password: url.password,
          database: url.pathname.slice(1), // Remove a barra inicial
          ssl: { rejectUnauthorized: false },
        };
      } else {
        // Para outros serviços, usar string diretamente
        connectionConfig = process.env.DATABASE_URL;
      }
    } else {
      // Configuração individual
      connectionConfig = {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: process.env.DB_NAME || 'helpdesk',
        // Adicionar SSL para Supabase se necessário
        ...(isSupabase ? { ssl: { rejectUnauthorized: false } } : {}),
      };
    }

    // Para Supabase, usar configuração otimizada com pool menor e timeouts maiores
    db = knex({
      client: 'pg',
      connection: connectionConfig,
      pool: {
        min: isSupabase ? 0 : 2,
        max: isSupabase ? 1 : 10, // Supabase funciona melhor com menos conexões
        acquireTimeoutMillis: 120000, // Aumentado para 2 minutos
        createTimeoutMillis: 60000, // Aumentado para 1 minuto
        idleTimeoutMillis: 30000,
        reapIntervalMillis: 1000,
        createRetryIntervalMillis: 500, // Aumentado para 500ms
        propagateCreateError: false, // Não propagar erro de criação
      },
      acquireConnectionTimeout: 120000, // Aumentado para 2 minutos
      debug: false,
    });

    // Test connection with retry logic
    let retries = 3;
    let connected = false;

    while (retries > 0 && !connected) {
      try {
        await db.raw('SELECT 1');
        console.log('✅ Database connected successfully');
        connected = true;
      } catch (error: any) {
        retries--;
        if (retries > 0) {
          console.log(`⏳ Tentando conectar novamente... (${retries} tentativas restantes)`);
          await new Promise(resolve => setTimeout(resolve, 2000)); // Aguardar 2 segundos
        } else {
          throw error;
        }
      }
    }

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
        table.text('avatar').nullable(); // Armazena base64 da imagem
        table.string('company').nullable();
        table.timestamps(true, true);
      });
      console.log('✅ Created users table');
    } else {
      // Verificar se company existe, se não, adicionar
      const hasCompany = await db!.schema.hasColumn('users', 'company');
      if (!hasCompany) {
        await db!.schema.alterTable('users', (table) => {
          table.string('company').nullable();
        });
        console.log('✅ Added company column to users table');
      }
    }

    const hasTicketsTable = await db!.schema.hasTable('tickets');
    if (!hasTicketsTable) {
      // Verificar se existe tabela queues primeiro
      const hasQueuesTable = await db!.schema.hasTable('queues');
      if (!hasQueuesTable) {
        await db!.schema.createTable('queues', (table) => {
          table.uuid('id').primary().defaultTo(db!.raw('gen_random_uuid()'));
          table.string('name').notNullable();
          table.text('description').nullable();
          table.timestamps(true, true);
        });
        console.log('✅ Created queues table');
      }

      await db!.schema.createTable('tickets', (table) => {
        table.string('id').primary();
        table.string('title').notNullable();
        table.text('description').notNullable();
        table.enum('status', ['aberto', 'em_andamento', 'em_atendimento', 'pendente', 'resolvido', 'fechado', 'encerrado']).notNullable();
        table.enum('priority', ['baixa', 'media', 'alta', 'critica']).notNullable();
        table.enum('category', ['tecnico', 'suporte', 'financeiro', 'outros']).notNullable();
        table.string('service_type').nullable();
        table.decimal('total_value', 10, 2).nullable();
        // SET NULL: quando usuário criador é excluído, mantém ticket mas remove referência
        table.uuid('created_by').references('id').inTable('users').onDelete('SET NULL').nullable();
        // SET NULL: quando técnico é excluído, remove atribuição mas mantém ticket
        table.uuid('assigned_to').references('id').inTable('users').onDelete('SET NULL').nullable();
        // SET NULL: quando cliente é excluído, remove referência mas mantém ticket
        table.uuid('client_id').references('id').inTable('users').onDelete('SET NULL').nullable();
        table.uuid('queue_id').references('id').inTable('queues').onDelete('SET NULL').nullable();
        table.timestamps(true, true);
      });
      console.log('✅ Created tickets table with SET NULL on user references (tickets preserved when user deleted)');
    } else {
      // Verificar se queue_id existe, se não, adicionar
      const hasQueueId = await db!.schema.hasColumn('tickets', 'queue_id');
      if (!hasQueueId) {
        const hasQueuesTable = await db!.schema.hasTable('queues');
        if (!hasQueuesTable) {
          await db!.schema.createTable('queues', (table) => {
            table.uuid('id').primary().defaultTo(db!.raw('gen_random_uuid()'));
            table.string('name').notNullable();
            table.text('description').nullable();
            table.timestamps(true, true);
          });
          console.log('✅ Created queues table');
        }
        await db!.schema.alterTable('tickets', (table) => {
          table.uuid('queue_id').references('id').inTable('queues').onDelete('SET NULL').nullable();
        });
        console.log('✅ Added queue_id column to tickets table');
      }
    }

    const hasTicketFilesTable = await db!.schema.hasTable('ticket_files');
    if (!hasTicketFilesTable) {
      await db!.schema.createTable('ticket_files', (table) => {
        table.uuid('id').primary().defaultTo(db!.raw('gen_random_uuid()'));
        // CASCADE: quando ticket é excluído, exclui arquivos
        table.string('ticket_id').references('id').inTable('tickets').onDelete('CASCADE');
        table.string('name').notNullable();
        table.bigInteger('size').notNullable();
        table.string('type').notNullable();
        table.text('data_url').notNullable(); // Base64 ou URL
        table.timestamps(true, true);
      });
      console.log('✅ Created ticket_files table with CASCADE');
    }

    const hasCommentsTable = await db!.schema.hasTable('comments');
    if (!hasCommentsTable) {
      await db!.schema.createTable('comments', (table) => {
        table.uuid('id').primary().defaultTo(db!.raw('gen_random_uuid()'));
        // CASCADE: quando ticket é excluído, exclui comentários
        table.string('ticket_id').references('id').inTable('tickets').onDelete('CASCADE');
        table.text('content').notNullable();
        // SET NULL: quando usuário é excluído, mantém comentário mas remove referência ao autor
        table.uuid('author_id').references('id').inTable('users').onDelete('SET NULL').nullable();
        table.timestamps(true, true);
      });
      console.log('✅ Created comments table (CASCADE on ticket, SET NULL on author)');
    }

    const hasFinancialTicketsTable = await db!.schema.hasTable('financial_tickets');
    if (!hasFinancialTicketsTable) {
      await db!.schema.createTable('financial_tickets', (table) => {
        table.string('id').primary();
        table.string('title').notNullable();
        table.text('description').nullable();
        table.decimal('amount', 10, 2).notNullable();
        table.date('due_date').notNullable();
        table.date('payment_date').nullable();
        table.string('status').notNullable().defaultTo('pending');
        table.uuid('client_id').references('id').inTable('users').onDelete('SET NULL').nullable();
        table.uuid('created_by').references('id').inTable('users').onDelete('SET NULL').nullable();
        table.string('invoice_file_name').nullable();
        table.bigInteger('invoice_file_size').nullable();
        table.string('invoice_file_type').nullable();
        table.text('invoice_file_data').nullable();
        table.string('receipt_file_name').nullable();
        table.bigInteger('receipt_file_size').nullable();
        table.string('receipt_file_type').nullable();
        table.text('receipt_file_data').nullable();
        table.text('notes').nullable();
        // Campos para integração com ERP
        table.string('erp_id').nullable();
        table.string('erp_type').nullable();
        table.string('invoice_number').nullable();
        table.string('barcode').nullable();
        table.string('our_number').nullable();
        table.string('payment_erp_id').nullable();
        table.string('payment_method').nullable();
        table.string('transaction_id').nullable();
        table.text('erp_metadata').nullable(); // JSON armazenado como texto
        table.text('payment_metadata').nullable(); // JSON armazenado como texto
        table.timestamps(true, true);
      });
      console.log('✅ Created financial_tickets table');
    }

    // Create indexes for performance
    await db!.schema.raw(`
      CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
      CREATE INDEX IF NOT EXISTS idx_tickets_created_by ON tickets(created_by);
      CREATE INDEX IF NOT EXISTS idx_tickets_assigned_to ON tickets(assigned_to);
      CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON tickets(created_at);
      CREATE INDEX IF NOT EXISTS idx_comments_ticket_id ON comments(ticket_id);
      CREATE INDEX IF NOT EXISTS idx_financial_tickets_client_id ON financial_tickets(client_id);
      CREATE INDEX IF NOT EXISTS idx_financial_tickets_created_by ON financial_tickets(created_by);
      CREATE INDEX IF NOT EXISTS idx_financial_tickets_status ON financial_tickets(status);
      CREATE INDEX IF NOT EXISTS idx_financial_tickets_due_date ON financial_tickets(due_date);
      CREATE INDEX IF NOT EXISTS idx_financial_tickets_erp_id ON financial_tickets(erp_id);
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

