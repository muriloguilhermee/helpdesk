-- Migração para adicionar 'technician_n2' e 'financial' à constraint CHECK da tabela users
-- Execute este script no SQL Editor do Supabase ou no banco de dados PostgreSQL

-- Passo 1: Remover a constraint antiga
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- Passo 2: Adicionar a nova constraint com todas as roles
ALTER TABLE users ADD CONSTRAINT users_role_check 
  CHECK (role IN ('admin', 'technician', 'technician_n2', 'user', 'financial'));

-- Verificar se a constraint foi aplicada corretamente
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'users'::regclass 
  AND conname = 'users_role_check';

