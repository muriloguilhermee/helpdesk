# 🚀 Guia de Deploy - Supabase

## ⚡ Deploy Rápido (10 minutos)

### 1. Criar Projeto Supabase

1. Acesse: https://supabase.com
2. Crie projeto gratuito
3. Anote: **Project URL** e **anon key**

### 2. Executar Schema SQL

1. No Supabase → **SQL Editor**
2. Cole o conteúdo de `schema.sql`
3. Execute (F5)

### 3. Configurar Variáveis

**Frontend** (`.env.local` na raiz):
```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
VITE_API_URL=http://localhost:3001/api
```

**Backend** (`server/.env`):
```env
DATABASE_URL=postgresql://postgres:senha@db.xxxxx.supabase.co:5432/postgres
JWT_SECRET=sua_chave_secreta_forte
CORS_ORIGIN=http://localhost:5173
PORT=3001
```

### 4. Executar Deploy

```bash
# Verificar configuração
npm run deploy:check

# Fazer deploy
npm run deploy:supabase
```

### 5. Testar

```bash
# Backend
cd server
npm run dev

# Frontend (outro terminal)
npm run dev
```

**Login:**
- Email: `muriloguilherme@evacloudd.com`
- Senha: `Eloah@210818`

---

## 📚 Documentação Completa

Veja `DEPLOY_SUPABASE.md` para guia completo passo a passo.

---

## ✅ Checklist

- [ ] Projeto Supabase criado
- [ ] Schema SQL executado
- [ ] `.env.local` configurado
- [ ] `server/.env` configurado
- [ ] Dependências instaladas
- [ ] Build executado
- [ ] Seed executado
- [ ] Sistema testado

---

**Pronto para produção! 🎉**

