-- Schema PostgreSQL para Helpdesk
-- Execute este SQL no Supabase SQL Editor
-- IMPORTANTE: Execute este script completo no SQL Editor do Supabase

-- Tabela de Usuários
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'technician', 'technician_n2', 'user', 'financial')),
  avatar TEXT,
  company VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Filas
CREATE TABLE IF NOT EXISTS queues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Chamados
CREATE TABLE IF NOT EXISTS tickets (
  id VARCHAR(50) PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  description TEXT NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'aberto'
    CHECK (status IN ('aberto', 'em_andamento', 'em_atendimento', 'pendente', 'resolvido', 'fechado', 'encerrado', 'em_fase_de_testes', 'homologacao', 'aguardando_cliente')),
  priority VARCHAR(50) NOT NULL DEFAULT 'media'
    CHECK (priority IN ('baixa', 'media', 'alta', 'critica')),
  category VARCHAR(50) NOT NULL
    CHECK (category IN ('suporte', 'tecnico', 'integracao', 'melhoria', 'financeiro', 'outros')),
  service_type VARCHAR(255),
  total_value DECIMAL(10, 2),
  integration_value DECIMAL(10, 2),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  client_id UUID REFERENCES users(id) ON DELETE SET NULL,
  queue_id UUID REFERENCES queues(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Comentários (compatibilidade com sistema antigo)
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id VARCHAR(50) NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  author_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Interações
CREATE TABLE IF NOT EXISTS interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id VARCHAR(50) NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL
    CHECK (type IN ('user', 'system', 'status_change', 'assignment', 'queue_transfer', 'internal_note')),
  content TEXT NOT NULL,
  author_id UUID REFERENCES users(id) ON DELETE SET NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Arquivos
CREATE TABLE IF NOT EXISTS ticket_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id VARCHAR(50) REFERENCES tickets(id) ON DELETE CASCADE,
  interaction_id UUID REFERENCES interactions(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  size BIGINT NOT NULL,
  type VARCHAR(100),
  data_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Tickets Financeiros
CREATE TABLE IF NOT EXISTS financial_tickets (
  id VARCHAR(50) PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  amount DECIMAL(10, 2) NOT NULL,
  due_date DATE NOT NULL,
  payment_date DATE,
  status VARCHAR(50) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
  client_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  invoice_file_name VARCHAR(255),
  invoice_file_size BIGINT,
  invoice_file_type VARCHAR(100),
  invoice_file_data TEXT,
  receipt_file_name VARCHAR(255),
  receipt_file_size BIGINT,
  receipt_file_type VARCHAR(100),
  receipt_file_data TEXT,
  notes TEXT,
  -- Campos para integração com ERP
  erp_id VARCHAR(255),
  erp_type VARCHAR(50),
  invoice_number VARCHAR(255),
  barcode VARCHAR(255),
  our_number VARCHAR(255),
  payment_erp_id VARCHAR(255),
  payment_method VARCHAR(100),
  transaction_id VARCHAR(255),
  erp_metadata JSONB,
  payment_metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_priority ON tickets(priority);
CREATE INDEX IF NOT EXISTS idx_tickets_category ON tickets(category);
CREATE INDEX IF NOT EXISTS idx_tickets_created_by ON tickets(created_by);
CREATE INDEX IF NOT EXISTS idx_tickets_assigned_to ON tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tickets_client_id ON tickets(client_id);
CREATE INDEX IF NOT EXISTS idx_tickets_queue_id ON tickets(queue_id);
CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON tickets(created_at);
CREATE INDEX IF NOT EXISTS idx_tickets_updated_at ON tickets(updated_at);
CREATE INDEX IF NOT EXISTS idx_comments_ticket_id ON comments(ticket_id);
CREATE INDEX IF NOT EXISTS idx_comments_author_id ON comments(author_id);
CREATE INDEX IF NOT EXISTS idx_interactions_ticket_id ON interactions(ticket_id);
CREATE INDEX IF NOT EXISTS idx_interactions_type ON interactions(type);
CREATE INDEX IF NOT EXISTS idx_interactions_author_id ON interactions(author_id);
CREATE INDEX IF NOT EXISTS idx_interactions_created_at ON interactions(created_at);
CREATE INDEX IF NOT EXISTS idx_ticket_files_ticket_id ON ticket_files(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_files_interaction_id ON ticket_files(interaction_id);
CREATE INDEX IF NOT EXISTS idx_financial_tickets_client_id ON financial_tickets(client_id);
CREATE INDEX IF NOT EXISTS idx_financial_tickets_created_by ON financial_tickets(created_by);
CREATE INDEX IF NOT EXISTS idx_financial_tickets_status ON financial_tickets(status);
CREATE INDEX IF NOT EXISTS idx_financial_tickets_due_date ON financial_tickets(due_date);
CREATE INDEX IF NOT EXISTS idx_financial_tickets_erp_id ON financial_tickets(erp_id);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tickets_updated_at ON tickets;
CREATE TRIGGER update_tickets_updated_at
  BEFORE UPDATE ON tickets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_queues_updated_at ON queues;
CREATE TRIGGER update_queues_updated_at
  BEFORE UPDATE ON queues
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_financial_tickets_updated_at ON financial_tickets;
CREATE TRIGGER update_financial_tickets_updated_at
  BEFORE UPDATE ON financial_tickets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- IMPORTANTE: Execute o script seed.ts após executar este schema
-- O script seed.ts criará o usuário administrador com a senha hashada corretamente
--
-- Para executar o seed:
-- cd server
-- npm run seed
--
-- Credenciais padrão que serão criadas:
-- Email: muriloguilherme@evacloudd.com
-- Senha: Eloah@210818
-- ============================================


