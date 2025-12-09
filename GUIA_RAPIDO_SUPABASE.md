# ⚡ Guia Rápido - Supabase (5 minutos)

## 🎯 Passo a Passo

### 1. Criar Conta e Projeto (2 min)

1. Acesse: https://supabase.com
2. Clique em **"Start your project"**
3. Faça login com GitHub/Google
4. Clique em **"New Project"**
5. Preencha:
   - **Name**: `helpdesk-db`
   - **Database Password**: Crie uma senha forte (ANOTE!)
   - **Region**: Escolha a mais próxima (ex: `South America`)
6. Clique em **"Create new project"**
7. Aguarde 2-3 minutos ⏳

### 2. Pegar Credenciais (1 min)

1. No dashboard do Supabase, vá em **Settings** (⚙️) → **API**
2. Copie:
   - **Project URL** → `https://xxxxx.supabase.co`
   - **anon public** key → `eyJhbGc...` (chave longa)

### 3. Pegar Credenciais do Banco (1 min)

1. Vá em **Settings** → **Database**
2. Role até **Connection string**
3. Escolha **URI** ou **Connection pooling**
4. Copie a string completa ou anote:
   - **Host**: `db.xxxxx.supabase.co`
   - **Port**: `5432`
   - **Database**: `postgres`
   - **User**: `postgres`
   - **Password**: A senha que você criou no passo 1

### 4. Executar Schema SQL (1 min)

1. No Supabase, vá em **SQL Editor** (no menu lateral)
2. Clique em **"New query"**
3. Abra o arquivo `schema.sql` do projeto
4. Cole todo o conteúdo no editor
5. Clique em **"Run"** (ou F5)
6. Deve aparecer: ✅ **Success. No rows returned**

### 5. Configurar Frontend (30 seg)

Crie o arquivo `.env.local` na **raiz do projeto**:

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
```

### 6. Configurar Backend (30 seg)

Edite `server/.env`:

**Opção A - Connection String (mais fácil):**
```env
DATABASE_URL=postgresql://postgres:SuaSenha@db.xxxxx.supabase.co:5432/postgres
```

**Opção B - Separado:**
```env
DB_HOST=db.xxxxx.supabase.co
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=SuaSenha
```

### 7. Testar! 🚀

**Backend:**
```bash
cd server
npm run seed  # Cria usuário admin
npm run dev   # Inicia servidor
```

**Frontend:**
```bash
npm run dev
```

**Login:**
- Email: `muriloguilherme@evacloudd.com`
- Senha: `Eloah@210818`

---

## ✅ Verificar se Funcionou

### Console do Backend:
```
✅ Database connected successfully
✅ Created users table
✅ Created tickets table
✅ Database migrations completed
✅ Admin user created
```

### Console do Navegador (F12):
```
✅ Usando PostgreSQL/Supabase
```

---

## 🔧 Problemas?

### "Connection refused"
- Verifique se copiou a senha correta
- Confira se o projeto está ativo no Supabase

### "Table already exists"
- Normal! Significa que já executou o schema antes
- Pode ignorar ou deletar as tabelas e executar novamente

### "Authentication failed"
- Verifique usuário e senha
- Use a connection string completa se possível

---

## 📝 Próximos Passos

1. ✅ Testar criar um ticket
2. ✅ Testar criar um usuário
3. ✅ Verificar dados no Supabase Dashboard → Table Editor

**Pronto! Seu banco está configurado! 🎉**

