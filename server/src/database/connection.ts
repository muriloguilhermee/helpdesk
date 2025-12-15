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
      console.error('');
      console.error('❌ ============================================');
      console.error('❌ ERRO: Configuração de banco de dados não encontrada!');
      console.error('❌ ============================================');
      console.error('');
      console.error('📋 Variáveis de ambiente encontradas relacionadas a banco:');
      const dbVars = Object.keys(process.env).filter(k => 
        k.includes('DATABASE') || k.includes('DB') || k.includes('SUPABASE')
      );
      if (dbVars.length > 0) {
        dbVars.forEach(v => console.error(`   - ${v}`));
      } else {
        console.error('   (nenhuma variável encontrada)');
      }
      console.error('');
      console.error('💡 SOLUÇÃO:');
      console.error('');
      console.error('1. Crie um arquivo .env na pasta server/');
      console.error('2. Adicione a connection string do Supabase:');
      console.error('');
      console.error('   DATABASE_URL=postgresql://postgres:[SENHA]@db.xxxxx.supabase.co:5432/postgres');
      console.error('');
      console.error('3. Para obter a connection string:');
      console.error('   - Acesse: https://app.supabase.com');
      console.error('   - Vá em: Settings → Database → Connection string');
      console.error('   - Selecione: URI');
      console.error('   - IMPORTANTE: Substitua [SENHA] pela senha real do banco');
      console.error('');
      console.error('📖 Veja server/CONFIGURAR_SUPABASE.md para instruções detalhadas');
      console.error('');
      throw new Error(
        'Database configuration is required. Please set DATABASE_URL in server/.env file.\n' +
        'See server/CONFIGURAR_SUPABASE.md for detailed instructions.'
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

    // Test connection with retry for temporary errors
    console.log('🔄 Testando conexão com o banco de dados...');
    
    let retries = 3;
    let lastError: any = null;
    
    while (retries > 0) {
      try {
        // Tentar conectar com timeout de 30 segundos
        const connectionPromise = db.raw('SELECT 1 as test');
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Connection timeout após 30s')), 30000)
        );

        await Promise.race([connectionPromise, timeoutPromise]);
        console.log('✅ Database connected successfully!');
        lastError = null;
        break; // Sucesso, sair do loop
      } catch (error: any) {
        lastError = error;
        
        // Se for erro temporário (XX000 - db_termination), tentar novamente
        if (error.code === 'XX000' || 
            (error.message && (error.message.includes('shutdown') || error.message.includes('db_termination') || error.message.includes('termination')))) {
          retries--;
          if (retries > 0) {
            const waitTime = (4 - retries) * 5; // 5s, 10s, 15s
            console.log(`⚠️  Erro temporário detectado (banco reiniciando). Aguardando ${waitTime}s antes de tentar novamente... (${retries} tentativas restantes)`);
            await new Promise(resolve => setTimeout(resolve, waitTime * 1000));
            continue; // Tentar novamente
          }
        } else {
          // Outro tipo de erro, não tentar novamente
          break;
        }
      }
    }
    
    // Se ainda há erro após retries, mostrar mensagem
    if (lastError) {
      const error = lastError;
      console.error('');
      console.error('❌ ============================================');
      console.error('❌ ERRO ao conectar ao banco de dados!');
      console.error('❌ ============================================');
      console.error('');
      console.error('📋 Detalhes do erro:');
      console.error(`   Mensagem: ${error.message || 'N/A'}`);
      console.error(`   Code: ${error.code || 'N/A'}`);
      console.error(`   Detail: ${error.detail || 'N/A'}`);
      console.error(`   Hint: ${error.hint || 'N/A'}`);
      console.error('');
      
      // Diagnóstico baseado no erro
      console.error('💡 Diagnóstico:');
      console.error('');
      
      if (error.code === 'ECONNREFUSED') {
        console.error('   ❌ Conexão recusada - possíveis causas:');
        console.error('      1. Host ou porta incorretos na connection string');
        console.error('      2. Firewall bloqueando a conexão');
        console.error('      3. IP não está na whitelist do Supabase');
        console.error('      4. Connection string mal formatada');
        console.error('');
        console.error('   💡 Soluções:');
        console.error('      - Execute: npm run test-connection (para diagnóstico detalhado)');
        console.error('      - Verifique a connection string no arquivo .env');
        console.error('      - No Supabase: Settings → Database → verifique Connection pooling');
        console.error('      - Tente usar Connection Pooler (porta 6543) ao invés da porta direta');
      } else if (error.code === '28P01' || error.message.includes('password') || error.message.includes('authentication')) {
        console.error('   ❌ Autenticação falhou - possíveis causas:');
        console.error('      1. Senha incorreta na connection string');
        console.error('      2. Usuário incorreto');
        console.error('      3. Connection string ainda contém [SENHA] como placeholder');
        console.error('');
        console.error('   💡 Soluções:');
        console.error('      - Verifique a senha em: Supabase Dashboard → Settings → Database');
        console.error('      - Se necessário, resete a senha do banco');
        console.error('      - IMPORTANTE: Substitua [SENHA] pela senha real na connection string');
        console.error('      - Execute: npm run check-env (para verificar configuração)');
      } else if (error.code === '3D000' || error.message.includes('database')) {
        console.error('   ❌ Banco de dados não encontrado');
        console.error('      - Verifique se o nome do banco está correto (geralmente "postgres")');
      } else if (error.message.includes('SSL') || error.message.includes('certificate')) {
        console.error('   ❌ Erro de SSL');
        console.error('      - Para Supabase, SSL é obrigatório');
        console.error('      - Verifique se a connection string está correta');
      } else if (error.message.includes('timeout')) {
        console.error('   ❌ Timeout na conexão');
        console.error('      - O banco pode estar sobrecarregado');
        console.error('      - Tente usar Connection Pooler (porta 6543)');
        console.error('      - Verifique se há problemas de rede');
      } else if (error.code === 'XX000' || 
                 (error.message && (error.message.includes('shutdown') || error.message.includes('db_termination') || error.message.includes('termination')))) {
        console.error('   ❌ Banco de dados foi encerrado ou está reiniciando');
        console.error('      - Este é geralmente um problema temporário');
        console.error('      - O servidor tentou reconectar automaticamente 3 vezes');
        console.error('');
        console.error('   💡 Soluções:');
        console.error('      1. Aguarde 1-2 minutos e tente iniciar o servidor novamente');
        console.error('      2. Verifique o status do projeto no Supabase Dashboard');
        console.error('      3. Verifique se há manutenção programada');
        console.error('      4. Tente usar conexão direta (porta 5432) ao invés de pooler');
        console.error('      5. Verifique os logs do Supabase para mais detalhes');
      } else {
        console.error('   ❌ Erro desconhecido');
        console.error('      - Execute: npm run test-connection (para diagnóstico detalhado)');
        console.error('      - Verifique os logs do Supabase');
        console.error('      - Tente usar Connection Pooler (porta 6543)');
      }
      
      console.error('');
      console.error('📖 Para mais ajuda, veja: server/CONFIGURAR_SUPABASE.md');
      console.error('');
      
      throw error;
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

