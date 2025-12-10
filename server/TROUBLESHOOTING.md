# 🔧 Troubleshooting - Problemas de Conexão

## 🚨 Servidor não conecta ao banco

### Passo 1: Verificar configuração

```bash
cd server
npm run check-env
```

Isso vai mostrar se o arquivo `.env` existe e se as variáveis estão configuradas.

### Passo 2: Testar conexão diretamente

```bash
npm run test-connection
```

Este script tenta conectar diretamente e mostra o erro exato.

### Passo 3: Verificar erros comuns

#### ❌ Erro: "ECONNREFUSED"

**Causa**: Conexão recusada pelo servidor

**Soluções**:
1. Verifique se a connection string está correta
2. Verifique se o host está correto (deve ser algo como `db.xxxxx.supabase.co`)
3. Verifique se a porta está correta (5432 para conexão direta, 6543 para pooler)
4. No Supabase: Settings → Database → verifique se Connection pooling está habilitado
5. Tente usar Connection Pooler ao invés da conexão direta

**Como usar Connection Pooler**:
- No Supabase Dashboard → Settings → Database
- Role até "Connection pooling"
- Selecione "Session mode" ou "Transaction mode"
- Copie a connection string (terá porta 6543)
- Use essa connection string no `.env`

#### ❌ Erro: "password authentication failed" ou "28P01"

**Causa**: Senha incorreta

**Soluções**:
1. Verifique se substituiu `[SENHA]` pela senha real
2. No Supabase: Settings → Database → Database password
3. Se não sabe a senha, resete-a
4. Atualize o `.env` com a senha correta

**IMPORTANTE**: A connection string do Supabase vem com `[SENHA]` como placeholder. Você DEVE substituir pela senha real!

#### ❌ Erro: "database does not exist" ou "3D000"

**Causa**: Nome do banco incorreto

**Solução**: O nome do banco geralmente é `postgres`. Verifique na connection string.

#### ❌ Erro: "Connection timeout"

**Causa**: Timeout na conexão

**Soluções**:
1. Tente usar Connection Pooler (porta 6543)
2. Verifique sua conexão de internet
3. Verifique se há firewall bloqueando

### Passo 4: Verificar arquivo .env

O arquivo `.env` deve estar na pasta `server/` e conter:

```env
DATABASE_URL=postgresql://postgres:SUA_SENHA_AQUI@db.xxxxx.supabase.co:5432/postgres
JWT_SECRET=sua_chave_secreta
PORT=3001
```

**IMPORTANTE**:
- Substitua `SUA_SENHA_AQUI` pela senha real
- Não deixe `[SENHA]` na connection string
- Não use aspas na connection string

### Passo 5: Usar Connection Pooler (Recomendado)

O Connection Pooler do Supabase é mais estável e recomendado:

1. No Supabase Dashboard → Settings → Database
2. Role até "Connection pooling"
3. Selecione "Session mode"
4. Copie a connection string (terá formato diferente, com porta 6543)
5. Cole no `.env` como `DATABASE_URL`

**Exemplo de Connection Pooler**:
```
postgresql://postgres.xxxxx:[SENHA]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

### Passo 6: Verificar logs detalhados

Execute o servidor e observe as mensagens:

```bash
npm run dev
```

As mensagens vão mostrar:
- Se o `.env` foi carregado
- Qual host está tentando conectar
- Qual porta está usando
- Se detectou Supabase
- O erro exato

### Passo 7: Testar com psql (opcional)

Se você tem `psql` instalado, pode testar diretamente:

```bash
psql "postgresql://postgres:SUA_SENHA@db.xxxxx.supabase.co:5432/postgres"
```

Se funcionar no `psql`, o problema está no código. Se não funcionar, o problema está na connection string.

## 📋 Checklist Rápido

- [ ] Arquivo `.env` existe na pasta `server/`
- [ ] `DATABASE_URL` está configurado no `.env`
- [ ] Senha foi substituída (não tem `[SENHA]`)
- [ ] Connection string está no formato correto
- [ ] `npm run check-env` passa sem erros
- [ ] `npm run test-connection` conecta com sucesso

## 🆘 Ainda não funciona?

1. Execute `npm run test-connection` e copie a mensagem de erro completa
2. Verifique os logs do Supabase (Dashboard → Logs)
3. Tente criar um novo projeto no Supabase e usar a connection string dele
4. Verifique se há firewall ou proxy bloqueando

## 📖 Documentação

- `CONFIGURAR_SUPABASE.md` - Guia completo de configuração
- `LEIA-ME-PRIMEIRO.md` - Início rápido

