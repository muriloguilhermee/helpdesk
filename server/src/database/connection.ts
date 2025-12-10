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

    console.log('🔍 Verificando configuração do banco de dados...');
    const dbUrl = process.env.DATABASE_URL || '';
    console.log(`   DATABASE_URL presente: ${dbUrl ? 'Sim' : 'Não'}`);
    if (dbUrl) {
      // Mostrar apenas hostname para segurança
      try {
        const url = new URL(dbUrl);
        console.log(`   Host: ${url.hostname}`);
        console.log(`   Port: ${url.port || '5432'}`);
        console.log(`   Database: ${url.pathname.slice(1)}`);
      } catch (e) {
        console.log('   (Não foi possível parsear URL)');
      }
    }

    // Suporta connection string (para Supabase, Neon, etc) ou configuração individual
    const isSupabase = dbUrl.includes('supabase') ||
                       dbUrl.includes('supabase.co') ||
                       dbUrl.includes('pooler.supabase.com');
    const isPooler = dbUrl.includes('pooler.supabase.com') || dbUrl.includes(':6543');
    if (isPooler) {
      console.log('   ✅ Detectado Connection Pooler do Supabase (recomendado)');
    }
    console.log(`   É Supabase: ${isSupabase ? 'Sim' : 'Não'}`);

    let connectionConfig: string | object;

    if (process.env.DATABASE_URL) {
      // Se for Supabase, converter string para objeto para adicionar SSL
      if (isSupabase) {
        try {
          // Parse da connection string
          const url = new URL(process.env.DATABASE_URL);
          connectionConfig = {
            host: url.hostname,
            port: parseInt(url.port || '5432'),
            user: url.username,
            password: url.password,
            database: url.pathname.slice(1), // Remove a barra inicial
            ssl: { rejectUnauthorized: false },
            connectionTimeoutMillis: 30000,
            statement_timeout: 30000,
          };
          console.log(`🔗 Configurando conexão Supabase: ${url.hostname}`);
        } catch (error) {
          console.error('❌ Erro ao parsear DATABASE_URL:', error);
          throw new Error('Invalid DATABASE_URL format');
        }
      } else {
        // Para outros serviços, usar string diretamente
        connectionConfig = process.env.DATABASE_URL;
        console.log('🔗 Usando connection string direta');
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
        connectionTimeoutMillis: 30000,
        statement_timeout: 30000,
      };
      console.log(`🔗 Configurando conexão individual: ${process.env.DB_HOST}`);
    }

    // Para Supabase, usar configuração otimizada com pool menor e timeouts maiores
    // IMPORTANTE: Para Supabase, usar pool mínimo 0 e máximo 1 para evitar timeouts
    const poolConfig = {
      min: isSupabase ? 0 : 2,
      max: isSupabase ? 1 : 10, // Supabase funciona melhor com menos conexões
      acquireTimeoutMillis: 300000, // 5 minutos (aumentado)
      createTimeoutMillis: 120000, // 2 minutos (aumentado)
      idleTimeoutMillis: 10000, // 10 segundos (reduzido para liberar conexões mais rápido)
      reapIntervalMillis: 2000, // Verificar conexões inativas a cada 2s
      createRetryIntervalMillis: 3000, // 3 segundos entre tentativas de criar conexão
      propagateCreateError: false, // Não propagar erro de criação
      destroyTimeoutMillis: 10000, // 10 segundos para destruir conexões
    };

    console.log('🔧 Configurando pool de conexões...');
    console.log(`   Pool min: ${poolConfig.min}, max: ${poolConfig.max}`);
    console.log(`   Timeout de aquisição: ${poolConfig.acquireTimeoutMillis/1000}s`);

    // Criar conexão Knex
    db = knex({
      client: 'pg',
      connection: connectionConfig,
      pool: poolConfig,
      acquireConnectionTimeout: 300000, // 5 minutos
      debug: false,
    });

    // Test connection with retry logic and exponential backoff
    let retries = 10; // Aumentado para 10 tentativas
    let connected = false;
    let attempt = 0;

    console.log('🔄 Iniciando tentativas de conexão...');

    while (retries > 0 && !connected) {
      attempt++;
      try {
        console.log(`🔄 Tentativa ${attempt}/${retries + attempt - 1} - Conectando ao banco de dados...`);

        // Tentar conectar com timeout de 60 segundos
        const connectionPromise = db.raw('SELECT 1 as test');
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Connection timeout após 60s')), 60000)
        );

        await Promise.race([connectionPromise, timeoutPromise]);

        console.log('✅ Database connected successfully!');
        connected = true;
      } catch (error: any) {
        retries--;
        const errorMsg = error.message || String(error);
        console.log(`❌ Erro na tentativa ${attempt}: ${errorMsg}`);

        if (retries > 0) {
          const waitTime = Math.min(3000 * attempt, 30000); // Backoff: 3s, 6s, 9s... max 30s
          console.log(`⏳ Aguardando ${waitTime/1000}s antes da próxima tentativa... (${retries} tentativas restantes)`);

          // Tentar destruir conexões órfãs antes de tentar novamente
          try {
            if (db) {
              console.log('🧹 Limpando conexões existentes...');
              await db.destroy().catch((e) => {
                console.log(`   (Erro ao destruir: ${e.message})`);
              });
            }

            // Aguardar um pouco antes de recriar
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Recriar a conexão
            console.log('🔧 Recriando conexão...');
            db = knex({
              client: 'pg',
              connection: connectionConfig,
              pool: poolConfig,
              acquireConnectionTimeout: 300000,
              debug: false,
            });
          } catch (destroyError: any) {
            console.log(`⚠️ Erro ao limpar/recriar conexões: ${destroyError.message}`);
          }

          await new Promise(resolve => setTimeout(resolve, waitTime));
        } else {
          console.error('❌ Todas as tentativas de conexão falharam!');
          console.error('💡 Dicas:');
          console.error('   1. Verifique se DATABASE_URL está correto no Railway');
          console.error('   2. Para Supabase, use a Connection String do Pooler (porta 6543)');
          console.error('   3. Verifique se o banco de dados está acessível');
          console.error('   4. Verifique os logs do Supabase para mais detalhes');
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

