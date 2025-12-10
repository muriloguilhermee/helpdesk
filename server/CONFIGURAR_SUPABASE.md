# 🔧 Como Configurar o Supabase no Servidor

O servidor precisa da **Connection String do PostgreSQL** do Supabase, que é diferente da URL da API.

## 📋 Passo a Passo

### 1. Obter a Connection String do Supabase

1. Acesse o [Dashboard do Supabase](https://app.supabase.com)
2. Selecione seu projeto
3. Vá em **Settings** → **Database**
4. Role até a seção **Connection string**
5. Selecione **URI** (não "Session mode" ou "Transaction mode")
6. Copie a connection string que aparece, algo como:
   ```
   postgresql://postgres:[SENHA]@db.xxxxx.supabase.co:5432/postgres
   ```

### 2. Criar arquivo `.env` no servidor

1. Na pasta `server/`, crie um arquivo chamado `.env`
2. Adicione as seguintes variáveis:

```env
# Porta do servidor
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173

# Connection String do PostgreSQL do Supabase (OBRIGATÓRIO)
# IMPORTANTE: Substitua [SENHA] pela senha real do seu banco
DATABASE_URL=postgresql://postgres:[SENHA]@db.xxxxx.supabase.co:5432/postgres

# JWT Secret (OBRIGATÓRIO - Gere uma chave segura)
JWT_SECRET=sua_chave_secreta_aqui_mude_em_producao
```

### 3. Substituir a senha na connection string

⚠️ **IMPORTANTE**: A connection string do Supabase vem com `[SENHA]` como placeholder. Você precisa:

1. Ir em **Settings** → **Database** → **Database password**
2. Se você não sabe a senha, pode resetá-la
3. Substituir `[SENHA]` na connection string pela senha real

**Exemplo:**
```
# Antes (com placeholder)
DATABASE_URL=postgresql://postgres:[SENHA]@db.xxxxx.supabase.co:5432/postgres

# Depois (com senha real)
DATABASE_URL=postgresql://postgres:MinhaSenha123@db.xxxxx.supabase.co:5432/postgres
```

### 4. Usar Connection Pooler (Recomendado para produção)

Para melhor performance, use o **Connection Pooler** do Supabase:

1. No Dashboard do Supabase, vá em **Settings** → **Database**
2. Role até **Connection pooling**
3. Selecione **Session mode** ou **Transaction mode**    
4. Copie a connection string (ela terá porta `6543` ou `5432`)

**Exemplo com Pooler:**
```env
DATABASE_URL=postgresql://postgres.xxxxx:[SENHA]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

### 5. Testar a conexão

Após configurar o `.env`, execute:

```bash
cd server
npm run dev
```

Você deve ver:
```
✅ Database connected successfully
✅ Database migrations completed
🚀 Server running on port 3001
```

## 🔍 Verificar se está funcionando

1. O servidor deve iniciar sem erros
2. Você deve ver mensagens de sucesso no console
3. Tente criar um usuário pela interface - deve salvar no banco

## ❌ Problemas Comuns

### Erro: "Database configuration is required"
- **Causa**: Arquivo `.env` não existe ou `DATABASE_URL` não está configurado
- **Solução**: Crie o arquivo `.env` na pasta `server/` com `DATABASE_URL`

### Erro: "ECONNREFUSED"
- **Causa**: Connection string incorreta ou senha errada
- **Solução**: 
  - Verifique se a senha na connection string está correta
  - Verifique se o projeto Supabase está ativo
  - Tente usar o Connection Pooler (porta 6543)

### Erro: "password authentication failed"
- **Causa**: Senha incorreta na connection string
- **Solução**: 
  - Verifique a senha do banco em Settings → Database → Database password
  - Se necessário, resete a senha e atualize a connection string

### Usuário criado mas não aparece no banco
- **Causa**: Pode ser problema de conexão ou transação não commitada
- **Solução**: 
  - Verifique os logs do servidor
  - Verifique se há erros no console
  - Tente recarregar a lista de usuários

## 📝 Notas Importantes

1. **Nunca commite o arquivo `.env`** - ele contém senhas
2. O arquivo `.env` já está no `.gitignore`
3. Para produção, configure as variáveis de ambiente na plataforma de deploy (Railway, Vercel, etc)
4. A connection string do Supabase é diferente da URL da API (`VITE_SUPABASE_URL`)

## 🔗 Links Úteis

- [Documentação do Supabase - Connection String](https://supabase.com/docs/guides/database/connecting-to-postgres)
- [Connection Pooling do Supabase](https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooler)

