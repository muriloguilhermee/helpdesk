# ⚡ Quick Start - Deploy Supabase (5 minutos)

## 🎯 Passo a Passo Rápido

### 1️⃣ Criar Projeto Supabase (2 min)

1. Acesse: **https://supabase.com**
2. Login → **New Project**
3. Preencha:
   - Name: `helpdesk-eva`
   - Password: ⚠️ **ANOTE A SENHA!**
   - Region: `South America`
4. Aguarde criação (2-3 min)

### 2️⃣ Executar Schema SQL (1 min)

1. Supabase → **SQL Editor** → **New query**
2. Abra `schema.sql` do projeto
3. Cole tudo e execute (F5)
4. ✅ Deve aparecer: "Success"

### 3️⃣ Configurar Variáveis (1 min)

**Frontend** - Crie `.env.local` na raiz:
```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
VITE_API_URL=http://localhost:3001/api
```

**Backend** - Crie `server/.env`:
```env
DATABASE_URL=postgresql://postgres:SuaSenha@db.xxxxx.supabase.co:5432/postgres
JWT_SECRET=gerar_com_openssl_rand_base64_32
CORS_ORIGIN=http://localhost:5173
PORT=3001
```

### 4️⃣ Executar Deploy (1 min)

```bash
# Verificar configuração
npm run deploy:check

# Fazer build e seed
npm run deploy:supabase
```

### 5️⃣ Testar! 🚀

```bash
# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Frontend
npm run dev
```

**Login:**
- Email: `muriloguilherme@evacloudd.com`
- Senha: `Eloah@210818`

---

## ✅ Verificar se Funcionou

1. **Supabase** → Table Editor → `users` → Deve ter o admin
2. **Navegador** → Console (F12) → Deve aparecer: "✅ Usando PostgreSQL/Supabase"
3. **Login** → Deve funcionar normalmente

---

## 📚 Documentação Completa

Veja `DEPLOY_SUPABASE.md` para guia detalhado com deploy em produção.

---

**Pronto! 🎉**

