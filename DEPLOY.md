# 🚀 Guia de Deploy - Helpdesk

Este guia mostra como hospedar o sistema Helpdesk em plataformas de cloud.

## 📋 Pré-requisitos

- Conta no Supabase (banco de dados já configurado)
- Conta em uma plataforma de hospedagem (Railway, Render, Vercel, etc.)
- Git configurado

## 🎯 Opções de Hospedagem

### 1. Railway (Recomendado - Mais Fácil) ⭐

Railway é a opção mais simples e rápida para deploy.

#### Backend (Server)

1. Acesse [railway.app](https://railway.app) e faça login com GitHub
2. Clique em "New Project" → "Deploy from GitHub repo"
3. Selecione seu repositório
4. Railway detectará automaticamente o diretório `server`
5. Configure as variáveis de ambiente:
   - `DATABASE_URL` - URL do Supabase (já configurada)
   - `JWT_SECRET` - Gere uma chave secreta forte
   - `PORT` - Deixe Railway definir automaticamente
   - `NODE_ENV=production`
   - `CORS_ORIGIN` - URL do frontend (configure depois)

6. Railway executará automaticamente:
   - `npm install` na pasta `server`
   - `npm run build`
   - `npm start`

#### Frontend

1. No Railway, crie um novo serviço
2. Selecione "Static Site"
3. Configure:
   - **Build Command**: `npm install && npm run build`
   - **Output Directory**: `dist`
   - **Root Directory**: `/` (raiz do projeto)

4. Configure variáveis de ambiente:
   - `VITE_API_URL` - URL do backend (ex: `https://seu-backend.railway.app`)

5. Railway fará o deploy automaticamente

**Custo**: Plano gratuito disponível, depois $5/mês

---

### 2. Render (Gratuito com Limitações)

#### Backend

1. Acesse [render.com](https://render.com) e faça login
2. Clique em "New" → "Web Service"
3. Conecte seu repositório GitHub
4. Configure:
   - **Name**: `helpdesk-backend`
   - **Environment**: `Node`
   - **Build Command**: `cd server && npm install && npm run build`
   - **Start Command**: `cd server && npm start`
   - **Root Directory**: `server`

5. Configure variáveis de ambiente:
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `NODE_ENV=production`
   - `CORS_ORIGIN`

#### Frontend

1. Clique em "New" → "Static Site"
2. Conecte seu repositório
3. Configure:
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`

4. Configure variáveis de ambiente:
   - `VITE_API_URL` - URL do backend

**Custo**: Gratuito (pode "adormecer" após 15min de inatividade)

---

### 3. Vercel (Excelente para Frontend)

#### Frontend

1. Acesse [vercel.com](https://vercel.com) e faça login
2. Importe seu repositório
3. Configure:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

4. Configure variáveis de ambiente:
   - `VITE_API_URL`

#### Backend (Serverless Functions)

Vercel também suporta serverless functions, mas para um backend Express completo, Railway ou Render são melhores.

**Custo**: Gratuito para projetos pessoais

---

## 🔧 Configuração das Variáveis de Ambiente

### Backend (.env)

```env
# Produção
NODE_ENV=production
PORT=3001

# Banco de Dados (Supabase)
DATABASE_URL=postgresql://postgres:[SENHA]@db.[PROJETO].supabase.co:5432/postgres

# JWT
JWT_SECRET=uma_chave_secreta_muito_forte_e_aleatoria_aqui

# CORS - URL do frontend em produção
CORS_ORIGIN=https://seu-frontend.railway.app
```

### Frontend (.env)

```env
# URL da API Backend
VITE_API_URL=https://seu-backend.railway.app
```

## 📝 Passo a Passo Completo (Railway)

### 1. Preparar o Código

Certifique-se de que:
- ✅ O código está no GitHub
- ✅ O banco de dados Supabase está configurado
- ✅ As variáveis de ambiente estão documentadas

### 2. Deploy do Backend

1. Acesse [railway.app](https://railway.app)
2. "New Project" → "Deploy from GitHub repo"
3. Selecione seu repositório
4. Railway detectará o `server/package.json`
5. Adicione as variáveis de ambiente:
   ```
   DATABASE_URL=postgresql://...
   JWT_SECRET=sua_chave_secreta
   NODE_ENV=production
   CORS_ORIGIN=https://seu-frontend.railway.app
   ```
6. Railway fará o deploy automaticamente
7. Anote a URL gerada (ex: `https://helpdesk-backend.railway.app`)

### 3. Deploy do Frontend

1. No mesmo projeto Railway, clique em "New" → "Static Site"
2. Configure:
   - **Root Directory**: `/` (raiz)
   - **Build Command**: `npm install && npm run build`
   - **Output Directory**: `dist`
3. Adicione variável de ambiente:
   ```
   VITE_API_URL=https://helpdesk-backend.railway.app
   ```
4. Railway fará o build e deploy
5. Anote a URL do frontend

### 4. Atualizar CORS

1. Volte ao serviço do backend
2. Atualize `CORS_ORIGIN` com a URL do frontend
3. O backend será reiniciado automaticamente

## 🔒 Segurança

- ✅ Use `JWT_SECRET` forte (mínimo 32 caracteres aleatórios)
- ✅ Nunca commite arquivos `.env` no Git
- ✅ Use HTTPS em produção
- ✅ Configure rate limiting (já implementado)
- ✅ Use Helmet (já implementado)

## 🧪 Testar o Deploy

1. Acesse a URL do frontend
2. Tente fazer login
3. Verifique se os dados estão sendo salvos no Supabase
4. Teste criar/editar usuários e chamados

## 🐛 Troubleshooting

### Backend não inicia
- Verifique se `DATABASE_URL` está correto
- Verifique os logs no Railway/Render
- Certifique-se de que `npm run build` executou com sucesso

### Frontend não conecta ao backend
- Verifique se `VITE_API_URL` está correto
- Verifique se `CORS_ORIGIN` no backend inclui a URL do frontend
- Verifique se o backend está rodando

### Erro de CORS
- Adicione a URL do frontend em `CORS_ORIGIN` no backend
- Reinicie o backend após alterar variáveis

## 📚 Recursos

- [Railway Docs](https://docs.railway.app)
- [Render Docs](https://render.com/docs)
- [Vercel Docs](https://vercel.com/docs)

## 💡 Dicas

1. **Use Railway** para começar rápido
2. **Configure domínio personalizado** depois (opcional)
3. **Monitore os logs** regularmente
4. **Faça backup** do banco de dados Supabase
5. **Use variáveis de ambiente** para todas as configurações sensíveis

