# 🚀 Deploy Completo - Supabase

Guia passo a passo para fazer deploy do sistema Helpdesk no Supabase.

## 📋 Pré-requisitos

- Conta no Supabase (gratuita): https://supabase.com
- Node.js 18+ instalado
- Git (opcional)

---

## 🎯 Passo 1: Criar Projeto no Supabase (5 minutos)

### 1.1. Criar Conta e Projeto

1. Acesse: **https://supabase.com**
2. Clique em **"Start your project"** ou **"Sign In"**
3. Faça login com GitHub, Google ou email
4. Clique em **"New Project"**
5. Preencha os dados:
   - **Name**: `helpdesk-eva` (ou outro nome)
   - **Database Password**: Crie uma senha forte (⚠️ **ANOTE ESSA SENHA!**)
   - **Region**: Escolha a mais próxima (ex: `South America (São Paulo)`)
   - **Pricing Plan**: Free (gratuito)
6. Clique em **"Create new project"**
7. Aguarde 2-3 minutos enquanto o projeto é criado ⏳

### 1.2. Obter Credenciais

1. No dashboard do Supabase, vá em **Settings** (⚙️) → **API**
2. Copie e anote:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public** key: `eyJhbGc...` (chave longa)
3. Vá em **Settings** → **Database**
4. Role até **Connection string**
5. Escolha **URI** e copie a connection string:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
   ```
   ⚠️ **Substitua `[YOUR-PASSWORD]` pela senha que você criou!**

---

## 🗄️ Passo 2: Configurar Banco de Dados (3 minutos)

### 2.1. Executar Schema SQL

1. No Supabase, vá em **SQL Editor** (menu lateral)
2. Clique em **"New query"**
3. Abra o arquivo `schema.sql` do projeto
4. **Cole TODO o conteúdo** no editor SQL
5. Clique em **"Run"** (ou pressione `Ctrl+Enter` / `F5`)
6. Deve aparecer: ✅ **Success. No rows returned**

### 2.2. Verificar Tabelas Criadas

1. Vá em **Table Editor** (menu lateral)
2. Você deve ver as tabelas:
   - ✅ `users`
   - ✅ `queues`
   - ✅ `tickets`
   - ✅ `comments`
   - ✅ `interactions`
   - ✅ `ticket_files`

---

## ⚙️ Passo 3: Configurar Backend (5 minutos)

### 3.1. Criar Arquivo .env

1. Na pasta `server/`, crie o arquivo `.env`:
   ```bash
   cd server
   cp .env.template .env
   ```

2. Edite o arquivo `.env` e preencha:

```env
# Porta do servidor
PORT=3001

# Connection String do Supabase (substitua [YOUR-PASSWORD])
DATABASE_URL=postgresql://postgres:SuaSenhaAqui@db.xxxxx.supabase.co:5432/postgres

# JWT Secret (gere uma chave forte)
# No terminal: openssl rand -base64 32
JWT_SECRET=Eloah@210818

# CORS - URL do frontend (ajuste se necessário)
CORS_ORIGIN=http://localhost:5173

# Ambiente
NODE_ENV=development
```

### 3.2. Instalar Dependências e Testar

```bash
cd server
npm install
npm run build
npm run seed  # Cria usuário admin
npm run dev   # Inicia servidor
```

**Verifique no console:**
```
✅ Database connected successfully
✅ Created users table
✅ Created tickets table
✅ Database migrations completed
✅ Admin user created
```

### 3.3. Testar API

Abra no navegador: `http://localhost:3001/api/health` (se tiver rota de health)

Ou teste login:
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"muriloguilherme@evacloudd.com","password":"Eloah@210818"}'
```

---

## 🎨 Passo 4: Configurar Frontend (3 minutos)

### 4.1. Criar Arquivo .env.local

1. Na **raiz do projeto** (não na pasta server), crie `.env.local`:

```env
# URL do Supabase
VITE_SUPABASE_URL=https://xxxxx.supabase.co

# Chave pública do Supabase
VITE_SUPABASE_ANON_KEY=eyJhbGc...sua_chave_aqui

# URL da API Backend
VITE_API_URL=http://localhost:3001/api
```

### 4.2. Instalar Dependências e Testar

```bash
# Na raiz do projeto
npm install
npm run dev
```

**Verifique no console do navegador (F12):**
```
✅ Usando PostgreSQL/Supabase
```

---

## 🧪 Passo 5: Testar Sistema Completo

### 5.1. Testar Login

**⚠️ IMPORTANTE**: Certifique-se de que o backend está rodando antes de fazer login!

1. **Inicie o backend** (em um terminal separado):
   ```bash
   cd server
   npm run dev
   ```
   Você deve ver: `Server running on port 3001`

2. **Inicie o frontend** (em outro terminal):
   ```bash
   npm run dev
   ```

3. Acesse: `http://localhost:5173`
4. Faça login com:
   - **Email**: `muriloguilherme@evacloudd.com`
   - **Senha**: `Eloah@210818`

**Se aparecer erro de login:**
- Verifique se o backend está rodando na porta 3001
- Verifique se o arquivo `.env` (ou `env.local`) tem `VITE_API_URL=http://localhost:3001/api`
- Verifique se o usuário admin foi criado no banco (execute o seed: `cd server && npm run seed`)

### 5.2. Verificar Dados no Supabase

1. No Supabase, vá em **Table Editor** → **users**
2. Você deve ver o usuário admin criado
3. Crie um ticket pelo sistema
4. Verifique em **Table Editor** → **tickets** se o ticket foi criado

### 5.3. Testar Criação de Usuários

**IMPORTANTE**: Para criar usuários no Supabase, o backend deve estar rodando!

1. Certifique-se de que o backend está rodando (`npm run dev` na pasta `server`)
2. No sistema, vá em **Usuários** → **Novo Usuário**
3. Preencha os dados e crie o usuário
4. Verifique no Supabase **Table Editor** → **users** se o usuário foi criado
5. A senha será hasheada automaticamente pelo backend

**Nota**: Se o backend não estiver rodando, o sistema tentará salvar localmente (IndexedDB), mas isso não funcionará com Supabase porque o schema exige senha hasheada.

---

## 🚀 Passo 6: Deploy em Produção

### Opção A: Deploy Frontend (Vercel/Netlify - Recomendado)

#### Vercel (Mais fácil)

1. Acesse: **https://vercel.com**
2. Faça login com GitHub
3. Clique em **"Add New Project"**
4. Conecte seu repositório GitHub
5. Configure:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Environment Variables**:
     ```
     VITE_SUPABASE_URL=https://xxxxx.supabase.co
     VITE_SUPABASE_ANON_KEY=eyJhbGc...
     VITE_API_URL=https://sua-api.com/api
     ```
6. Clique em **"Deploy"**

#### Netlify

1. Acesse: **https://netlify.com**
2. Faça login
3. Arraste a pasta `dist/` (após build) ou conecte GitHub
4. Configure as mesmas variáveis de ambiente

### Opção B: Deploy Backend (Railway/Render - Recomendado)

#### Railway (Mais fácil)

1. Acesse: **https://railway.app**
2. Faça login com GitHub
3. Clique em **"New Project"** → **"Deploy from GitHub repo"**
4. Selecione seu repositório
5. Configure:
   - **Root Directory**: `server`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Environment Variables**:
     ```
     PORT=3001
     DATABASE_URL=postgresql://...
     JWT_SECRET=...
     CORS_ORIGIN=https://seu-frontend.vercel.app
     NODE_ENV=production
     ```
6. Railway fornecerá uma URL: `https://seu-projeto.railway.app`

#### Render

1. Acesse: **https://render.com**
2. Faça login
3. Clique em **"New"** → **"Web Service"**
4. Conecte GitHub e selecione o repositório
5. Configure similar ao Railway

### Opção C: Deploy Completo (HostGator/VPS)

Veja o guia: `docs/DEPLOY_HOSTGATOR.md`

---

## ✅ Checklist de Deploy

### Banco de Dados
- [ ] Projeto criado no Supabase
- [ ] Schema SQL executado com sucesso
- [ ] Tabelas criadas e visíveis
- [ ] Usuário admin criado (via seed)

### Backend
- [ ] Arquivo `.env` configurado
- [ ] Dependências instaladas
- [ ] Build executado com sucesso
- [ ] Servidor inicia sem erros
- [ ] Conexão com banco funcionando
- [ ] API respondendo

### Frontend
- [ ] Arquivo `.env.local` configurado
- [ ] Dependências instaladas
- [ ] Build executado com sucesso
- [ ] Conexão com Supabase funcionando
- [ ] Login funcionando

### Produção
- [ ] Frontend deployado (Vercel/Netlify)
- [ ] Backend deployado (Railway/Render)
- [ ] Variáveis de ambiente configuradas
- [ ] SSL/HTTPS ativado
- [ ] CORS configurado corretamente
- [ ] Testes em produção realizados

---

## 🔧 Troubleshooting

### Erro: "Connection refused"

**Causa**: Senha incorreta ou connection string errada

**Solução**:
1. Verifique a senha no `.env`
2. Use a connection string completa do Supabase
3. Teste a conexão:
   ```bash
   psql "postgresql://postgres:senha@db.xxxxx.supabase.co:5432/postgres"
   ```

### Erro: "Table already exists"

**Causa**: Schema já foi executado antes

**Solução**: Normal! Pode ignorar ou deletar as tabelas e executar novamente.

### Erro: "Authentication failed"

**Causa**: Credenciais incorretas

**Solução**:
1. Verifique usuário e senha
2. Use a connection string completa
3. Verifique se o projeto está ativo no Supabase

### Frontend não conecta ao Supabase

**Causa**: Variáveis de ambiente não configuradas

**Solução**:
1. Verifique se `.env.local` existe na raiz
2. Reinicie o servidor de desenvolvimento
3. Verifique no console do navegador se as variáveis estão carregadas

### API não responde

**Causa**: Backend não está rodando ou CORS bloqueado

**Solução**:
1. Verifique se o backend está rodando
2. Verifique a URL no `VITE_API_URL`
3. Verifique CORS no backend

---

## 📝 Próximos Passos Após Deploy

1. ✅ **Alterar senha do admin** (recomendado)
2. ✅ **Configurar domínio personalizado** (opcional)
3. ✅ **Configurar backup automático** no Supabase
4. ✅ **Monitorar uso** (Supabase tem limites no plano gratuito)
5. ✅ **Configurar notificações por email** (futuro)

---

## 🎉 Pronto!

Seu sistema está deployado e funcionando! 🚀

**Credenciais padrão:**
- Email: `muriloguilherme@evacloudd.com`
- Senha: `Eloah@210818`

**⚠️ IMPORTANTE**: Altere a senha após o primeiro login em produção!

---

## 📞 Precisa de Ajuda?

- **Supabase Docs**: https://supabase.com/docs
- **Vercel Docs**: https://vercel.com/docs
- **Railway Docs**: https://docs.railway.app

