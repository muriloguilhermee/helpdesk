# 🆓 Opções Gratuitas de Banco de Dados

Este guia mostra todas as opções **100% gratuitas** para hospedar seu banco de dados PostgreSQL.

## 🎯 Opções Recomendadas

### 1. **Supabase** ⭐ (Mais Fácil)

**Limite gratuito:**
- 500 MB de banco de dados
- 2 GB de bandwidth
- 50.000 usuários ativos por mês
- API REST automática
- Dashboard completo

**Como configurar:**

1. Acesse https://supabase.com
2. Crie uma conta (gratuita)
3. Clique em "New Project"
4. Preencha:
   - **Name**: helpdesk-db
   - **Database Password**: (anote bem!)
   - **Region**: Escolha a mais próxima (ex: South America)
5. Aguarde 2-3 minutos

6. **Pegar credenciais:**
   - Vá em **Settings** → **API**
   - Copie:
     - `Project URL` → `VITE_SUPABASE_URL`
     - `anon public` key → `VITE_SUPABASE_ANON_KEY`

7. **Executar schema:**
   - Vá em **SQL Editor**
   - Cole o conteúdo de `schema.sql`
   - Clique em **Run**

8. **Configurar frontend:**
   Crie `.env.local` na raiz do projeto:
   ```env
   VITE_SUPABASE_URL=https://seu-projeto.supabase.co
   VITE_SUPABASE_ANON_KEY=sua-chave-anon-key
   ```

9. **Configurar backend:**
   Edite `server/.env`:
   ```env
   DB_HOST=db.seu-projeto.supabase.co
   DB_PORT=5432
   DB_NAME=postgres
   DB_USER=postgres
   DB_PASSWORD=sua-senha-do-passo-4
   ```

**✅ Vantagens:**
- Mais fácil de configurar
- Dashboard visual
- API REST automática
- Real-time subscriptions
- Storage para arquivos

---

### 2. **Neon** ⚡ (Serverless)

**Limite gratuito:**
- 3 GB de banco de dados
- Sem limite de conexões
- Auto-suspend após inatividade
- Backups automáticos

**Como configurar:**

1. Acesse https://neon.tech
2. Crie uma conta (GitHub/Google)
3. Clique em "Create Project"
4. Preencha:
   - **Name**: helpdesk
   - **Region**: Escolha a mais próxima
5. Aguarde criação (30 segundos)

6. **Pegar connection string:**
   - Vá em **Dashboard** → **Connection Details**
   - Copie a **Connection String**

7. **Configurar backend:**
   Edite `server/.env`:
   ```env
   # Use a connection string completa ou separe:
   DB_HOST=ep-xxx-xxx.region.neon.tech
   DB_PORT=5432
   DB_NAME=neondb
   DB_USER=neondb_owner
   DB_PASSWORD=sua-senha
   ```

8. **Executar migrations:**
   ```bash
   cd server
   npm run migrate
   npm run seed
   ```

**✅ Vantagens:**
- Serverless (paga só pelo uso)
- Auto-suspend (economiza recursos)
- Backups automáticos
- Muito rápido

---

### 3. **Railway** 🚂

**Limite gratuito:**
- $5 de crédito grátis por mês
- PostgreSQL incluído
- Deploy automático

**Como configurar:**

1. Acesse https://railway.app
2. Crie uma conta (GitHub)
3. Clique em "New Project"
4. Clique em "Add Database" → "PostgreSQL"
5. Aguarde criação

6. **Pegar credenciais:**
   - Clique no banco criado
   - Vá em **Variables**
   - Copie:
     - `PGHOST`
     - `PGPORT`
     - `PGDATABASE`
     - `PGUSER`
     - `PGPASSWORD`

7. **Configurar backend:**
   Edite `server/.env`:
   ```env
   DB_HOST=${PGHOST}
   DB_PORT=${PGPORT}
   DB_NAME=${PGDATABASE}
   DB_USER=${PGUSER}
   DB_PASSWORD=${PGPASSWORD}
   ```

**✅ Vantagens:**
- $5 grátis por mês
- Deploy fácil
- Integração com GitHub

---

### 4. **Render** 🎨

**Limite gratuito:**
- PostgreSQL gratuito (com limitações)
- Auto-suspend após inatividade
- Backups manuais

**Como configurar:**

1. Acesse https://render.com
2. Crie uma conta (GitHub/Google)
3. Clique em "New" → "PostgreSQL"
4. Preencha:
   - **Name**: helpdesk-db
   - **Database**: helpdesk
   - **User**: helpdesk_user
   - **Region**: Escolha a mais próxima
5. Aguarde criação (2-3 minutos)

6. **Pegar credenciais:**
   - Vá em **Dashboard** → Seu banco
   - Copie:
     - **Internal Database URL** (para backend)
     - **External Database URL** (para ferramentas externas)

7. **Configurar backend:**
   Use a connection string ou separe:
   ```env
   DB_HOST=dpg-xxx-xxx.region.render.com
   DB_PORT=5432
   DB_NAME=helpdesk
   DB_USER=helpdesk_user
   DB_PASSWORD=sua-senha
   ```

**✅ Vantagens:**
- Gratuito
- Fácil de usar
- Integração com GitHub

**⚠️ Limitações:**
- Auto-suspend após 90 dias de inatividade
- Pode demorar para "acordar"

---

### 5. **ElephantSQL** 🐘

**Limite gratuito:**
- 20 MB de banco de dados
- 5 conexões simultâneas
- 1 banco por conta

**Como configurar:**

1. Acesse https://www.elephantsql.com
2. Crie uma conta
3. Clique em "Create New Instance"
4. Escolha "Tiny Turtle" (gratuito)
5. Preencha:
   - **Name**: helpdesk
   - **Region**: Escolha a mais próxima
6. Aguarde criação

7. **Pegar credenciais:**
   - Clique no banco criado
   - Vá em **Details**
   - Copie:
     - **Server**
     - **User & Default database**
     - **Password**

8. **Configurar backend:**
   Edite `server/.env`:
   ```env
   DB_HOST=xxx.elephantsql.com
   DB_PORT=5432
   DB_NAME=xxx
   DB_USER=xxx
   DB_PASSWORD=sua-senha
   ```

**✅ Vantagens:**
- Simples
- Estável
- Dashboard básico

**⚠️ Limitações:**
- Apenas 20 MB (pode ser pouco)

---

### 6. **PostgreSQL Local** 💻 (Sempre Gratuito)

**Limite:**
- Sem limites
- Totalmente gratuito
- Requer instalação

**Como configurar:**

1. **Instalar PostgreSQL:**
   - Windows: https://www.postgresql.org/download/windows/
   - Mac: `brew install postgresql`
   - Linux: `sudo apt install postgresql`

2. **Criar banco:**
   ```bash
   # Entrar no PostgreSQL
   psql -U postgres

   # Criar banco
   CREATE DATABASE helpdesk;

   # Criar usuário (opcional)
   CREATE USER helpdesk_user WITH PASSWORD 'sua_senha';
   GRANT ALL PRIVILEGES ON DATABASE helpdesk TO helpdesk_user;

   # Sair
   \q
   ```

3. **Configurar backend:**
   Edite `server/.env`:
   ```env
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=helpdesk
   DB_USER=postgres
   DB_PASSWORD=sua_senha
   ```

4. **Executar migrations:**
   ```bash
   cd server
   npm run migrate
   npm run seed
   ```

**✅ Vantagens:**
- Totalmente gratuito
- Sem limites
- Controle total
- Sem latência de rede

**⚠️ Limitações:**
- Precisa instalar
- Só funciona localmente
- Precisa manter rodando

---

## 🚀 Recomendação por Caso de Uso

### Para Desenvolvimento Local:
→ **PostgreSQL Local** ou **Supabase**

### Para Produção (Pequeno Projeto):
→ **Supabase** (mais fácil) ou **Neon** (mais recursos)

### Para Produção (Médio/Grande):
→ **Neon** ou **Railway** (com upgrade)

### Para Testes/Protótipos:
→ **ElephantSQL** ou **Render**

---

## 📝 Configuração Rápida (Supabase)

**1. Criar projeto no Supabase**

**2. Executar schema:**
```bash
# Copiar schema.sql e executar no SQL Editor do Supabase
```

**3. Configurar frontend:**
```bash
# Criar .env.local na raiz
echo "VITE_SUPABASE_URL=https://seu-projeto.supabase.co" > .env.local
echo "VITE_SUPABASE_ANON_KEY=sua-chave" >> .env.local
```

**4. Configurar backend:**
```bash
# Editar server/.env
cd server
# Pegar credenciais em Settings → Database → Connection string
```

**5. Testar:**
```bash
# Frontend
npm run dev

# Backend
cd server
npm run dev
```

---

## 🔍 Verificar Conexão

### Testar Backend:
```bash
cd server
npm run dev
# Deve aparecer: "✅ Database connected successfully"
```

### Testar Frontend:
Abra o console do navegador (F12):
- `✅ Usando PostgreSQL/Supabase` → Funcionando!
- `📦 Usando IndexedDB` → Verifique as variáveis de ambiente

---

## 💡 Dicas

1. **Sempre anote as senhas** em local seguro
2. **Use variáveis de ambiente** (nunca commite senhas)
3. **Faça backups** regularmente
4. **Monitore o uso** para não exceder limites
5. **Para produção**, considere upgrade para planos pagos

---

## ❓ Problemas Comuns

### "Connection refused"
- Verifique se o banco está rodando
- Confira host, porta e credenciais

### "Database does not exist"
- Execute as migrations primeiro
- Verifique o nome do banco

### "Authentication failed"
- Confira usuário e senha
- Verifique se o usuário tem permissões

---

## 🎯 Próximos Passos

Após configurar o banco:

1. ✅ Executar migrations
2. ✅ Executar seed (criar admin)
3. ✅ Testar login
4. ✅ Criar alguns tickets de teste
5. ✅ Verificar se tudo está funcionando

**Boa sorte! 🚀**

