# Migração para adicionar Técnico N2

## Problema
O banco de dados em produção ainda tem a constraint CHECK antiga que não permite `technician_n2` e `financial`.

## Solução

### Opção 1: Executar SQL manualmente (RECOMENDADO)

1. Acesse o **Supabase Dashboard** ou o **Render Dashboard**
2. Vá para o **SQL Editor**
3. Execute o seguinte SQL:

```sql
-- Remover a constraint antiga
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- Adicionar a nova constraint com todas as roles
ALTER TABLE users ADD CONSTRAINT users_role_check
  CHECK (role IN ('admin', 'technician', 'technician_n2', 'user', 'financial'));
```

### Opção 2: Usar o arquivo de migração

Execute o arquivo `migration_add_technician_n2.sql` no SQL Editor do Supabase.

### Opção 3: Reiniciar o servidor (migração automática)

O código foi atualizado para fazer a migração automaticamente quando o servidor iniciar.
Basta fazer o deploy no Render e a migração será executada automaticamente.

## Verificação

Após executar a migração, verifique se funcionou:

```sql
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'users'::regclass
  AND conname = 'users_role_check';
```

A constraint deve mostrar: `CHECK (role IN ('admin', 'technician', 'technician_n2', 'user', 'financial'))`

