# 🎨 Configuração do Frontend no Railway

## ⚠️ Problema Atual

O Railway está tentando rodar o código do servidor (`server/dist/index.js`) no frontend. Isso acontece porque o `railway.json` na raiz está configurado para o backend.

## ✅ Solução: Configurar Frontend Separadamente

### Passo 1: Criar Serviço Separado para Frontend

1. No Railway, certifique-se de que o **frontend** está em um **serviço separado** do backend
2. Se não estiver, crie um novo serviço:
   - Clique em **"New"** → **"GitHub Repo"**
   - Selecione o mesmo repositório
   - Nomeie como `helpdesk-frontend`

### Passo 2: Configurar o Frontend no Railway

1. Clique no serviço do **Frontend** (não o backend!)
2. Vá em **"Settings"** → **"Build & Deploy"**
3. Configure:
   - **Root Directory**: `/` (raiz do projeto, NÃO `/server`)
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Output Directory**: `dist` (não usado, mas pode deixar)

### Passo 3: Adicionar Variável de Ambiente

1. Vá em **"Variables"** → **"+ New Variable"**
2. Adicione:
   ```
   Nome: VITE_API_URL
   Valor: https://sua-url-backend.railway.app
   ```
   (Use a URL do backend que você anotou)

### Passo 4: Verificar

Após o deploy, o frontend deve:
- ✅ Fazer build do Vite (`npm run build`)
- ✅ Rodar o `server.js` (servidor Express para servir arquivos estáticos)
- ✅ Servir os arquivos de `dist/`
- ✅ NÃO tentar rodar o código do servidor backend

---

## 🔍 Verificar se Está Correto

### Backend (Serviço Separado)
- Root Directory: `server` ou `/server`
- Build Command: `cd server && npm install && npm run build`
- Start Command: `cd server && npm start`
- Variáveis: `DATABASE_URL`, `JWT_SECRET`, etc.

### Frontend (Serviço Separado)
- Root Directory: `/` (raiz)
- Build Command: `npm install && npm run build`
- Start Command: `npm start`
- Variáveis: `VITE_API_URL`

---

## 🐛 Se Ainda Estiver Rodando o Servidor

1. **Verifique o Root Directory:**
   - Deve ser `/` (raiz), NÃO `/server`

2. **Verifique o Start Command:**
   - Deve ser `npm start` (que roda `server.js` da raiz)
   - NÃO deve ser `cd server && npm start`

3. **Verifique se há `railway.json` na raiz:**
   - Se houver e estiver configurado para o servidor, pode estar causando conflito
   - O Railway pode estar lendo esse arquivo

---

## 💡 Dica

**Use serviços separados!**
- ✅ Backend: Um serviço
- ✅ Frontend: Outro serviço

Isso evita conflitos de configuração.










