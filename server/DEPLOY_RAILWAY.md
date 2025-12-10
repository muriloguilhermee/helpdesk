# 🚀 Deploy no Railway - Guia Completo

## 📋 Pré-requisitos

1. Conta no Railway: https://railway.app
2. Projeto Supabase configurado
3. Connection string do Supabase pronta

## 🔧 Passo 1: Preparar o Código

### 1.1 Verificar se o código está pronto

```bash
cd server
npm run build
```

Se compilar sem erros, está pronto!

## 🚂 Passo 2: Criar Projeto no Railway

### 2.1 Criar novo projeto

1. Acesse: https://railway.app
2. Clique em **"New Project"**
3. Selecione **"Deploy from GitHub repo"** (recomendado) ou **"Empty Project"**

### 2.2 Se usar GitHub:

1. Conecte seu repositório GitHub
2. Selecione o repositório do helpdesk
3. Railway vai detectar automaticamente que é um projeto Node.js

### 2.3 Se usar "Empty Project":

1. Clique em **"Empty Project"**
2. Clique em **"+ New"** → **"GitHub Repo"**
3. Selecione seu repositório

## ⚙️ Passo 3: Configurar o Serviço

### 3.1 Configurar Root Directory

Se o servidor está na pasta `server/`:

1. No Railway Dashboard → Seu serviço
2. Clique em **"Settings"**
3. Em **"Root Directory"**, digite: `server`
4. Salve

### 3.2 Configurar Build Command

1. Em **"Settings"** → **"Build Command"**
2. Deixe vazio (o Railway vai usar o `nixpacks.toml`)

### 3.3 Configurar Start Command

1. Em **"Settings"** → **"Start Command"**
2. Deve ser: `npm start` (já está no `railway.json`)

## 🔐 Passo 4: Configurar Variáveis de Ambiente

### 4.1 Adicionar variáveis obrigatórias

No Railway Dashboard → Seu serviço → **"Variables"** → **"+ New Variable"**

Adicione estas variáveis:

```env
# Connection String do Supabase (OBRIGATÓRIO)
DATABASE_URL=postgresql://postgres.xxxxx:[SENHA]@aws-0-us-east-1.pooler.supabase.com:6543/postgres

# JWT Secret (OBRIGATÓRIO - gere uma chave segura)
JWT_SECRET=sua_chave_secreta_super_segura_aqui_mude_em_producao

# Porta (opcional - Railway define automaticamente)
PORT=3001

# CORS Origin (OBRIGATÓRIO - URL do seu frontend)
CORS_ORIGIN=https://seu-frontend.vercel.app
# ou
CORS_ORIGIN=https://seu-dominio.com

# Ambiente
NODE_ENV=production
```

### 4.2 Obter Connection String do Supabase

1. Acesse: https://app.supabase.com
2. Seu projeto → **Settings** → **Database**
3. Role até **"Connection pooling"**
4. Selecione **"Session mode"**
5. Copie a connection string
6. **IMPORTANTE**: Substitua `[SENHA]` pela senha real do banco
7. Cole no Railway como `DATABASE_URL`

### 4.3 Gerar JWT Secret

Gere uma chave segura:

```bash
# No terminal
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Ou use um gerador online: https://randomkeygen.com

### 4.4 Configurar CORS Origin

**IMPORTANTE**: Configure a URL do seu frontend:

- Se o frontend está no Vercel: `https://seu-projeto.vercel.app`
- Se está em outro lugar: a URL completa do frontend
- Para desenvolvimento local: `http://localhost:5173`

**Múltiplas origens** (se necessário):
```env
CORS_ORIGIN=https://seu-frontend.vercel.app,https://outro-dominio.com
```

## 🚀 Passo 5: Fazer Deploy

### 5.1 Deploy automático (se conectou GitHub)

1. Faça commit e push das alterações
2. O Railway vai fazer deploy automaticamente
3. Acompanhe os logs em **"Deployments"**

### 5.2 Deploy manual

1. No Railway Dashboard → Seu serviço
2. Clique em **"Deploy"** → **"Redeploy"**

### 5.3 Verificar logs

1. Clique em **"Deployments"**
2. Clique no deployment mais recente
3. Veja os logs para verificar se iniciou corretamente

## 🔍 Passo 6: Verificar se está funcionando

### 6.1 Obter URL do servidor

1. No Railway Dashboard → Seu serviço
2. Clique em **"Settings"** → **"Networking"**
3. Clique em **"Generate Domain"** (se ainda não tiver)
4. Copie a URL (algo como: `seu-projeto.up.railway.app`)

### 6.2 Testar health check

Abra no navegador ou use curl:

```
https://seu-projeto.up.railway.app/health
```

Deve retornar:
```json
{"status":"ok","timestamp":"2025-12-10T..."}
```

### 6.3 Testar API

```bash
curl https://seu-projeto.up.railway.app/api/users
```

## 🌐 Passo 7: Configurar Frontend

### 7.1 Adicionar variável de ambiente no frontend

No seu frontend (Vercel, Netlify, etc), adicione:

```env
VITE_API_URL=https://seu-projeto.up.railway.app/api
```

### 7.2 Se usar Vercel

1. Acesse: https://vercel.com
2. Seu projeto → **Settings** → **Environment Variables**
3. Adicione:
   - **Name**: `VITE_API_URL`
   - **Value**: `https://seu-projeto.up.railway.app/api`
4. Faça redeploy do frontend

### 7.3 Verificar no código

O frontend já está configurado para usar `VITE_API_URL`:

```typescript
// src/services/api.ts
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
```

## ✅ Passo 8: Verificar tudo

### Checklist

- [ ] Servidor está rodando no Railway
- [ ] Health check responde: `/health`
- [ ] Variáveis de ambiente configuradas no Railway
- [ ] `DATABASE_URL` está correto (sem `[SENHA]`)
- [ ] `JWT_SECRET` está configurado
- [ ] `CORS_ORIGIN` aponta para o frontend
- [ ] Frontend tem `VITE_API_URL` configurado
- [ ] Frontend foi redeployado após adicionar `VITE_API_URL`

## 🐛 Troubleshooting

### Erro: "Database configuration is required"

**Solução**: Verifique se `DATABASE_URL` está configurado no Railway

### Erro: "Cannot connect to database"

**Solução**: 
1. Verifique se a connection string está correta
2. Verifique se substituiu `[SENHA]` pela senha real
3. Tente usar Connection Pooler (porta 6543)

### Erro: CORS bloqueado

**Solução**: 
1. Verifique se `CORS_ORIGIN` está correto no Railway
2. Deve ser a URL exata do frontend (com https://)
3. Faça redeploy do servidor após alterar

### Servidor não inicia

**Solução**:
1. Verifique os logs no Railway
2. Verifique se `npm run build` funciona localmente
3. Verifique se todas as variáveis estão configuradas

### Frontend não conecta

**Solução**:
1. Verifique se `VITE_API_URL` está configurado no frontend
2. Verifique se a URL está correta (com `/api` no final)
3. Verifique se o servidor está rodando (teste `/health`)
4. Verifique CORS no servidor

## 📝 Comandos Úteis

### Ver logs no Railway

No Railway Dashboard → Seu serviço → **"Deployments"** → Clique no deployment → Veja os logs

### Fazer redeploy

Railway Dashboard → Seu serviço → **"Deploy"** → **"Redeploy"**

### Ver variáveis de ambiente

Railway Dashboard → Seu serviço → **"Variables"**

## 🔗 Links Úteis

- Railway Dashboard: https://railway.app
- Documentação Railway: https://docs.railway.app
- Supabase Dashboard: https://app.supabase.com

## 💡 Dicas

1. **Sempre use Connection Pooler** do Supabase (porta 6543) em produção
2. **Nunca commite** variáveis de ambiente no código
3. **Use domínio customizado** no Railway para produção
4. **Monitore os logs** regularmente
5. **Configure alertas** no Railway para erros

