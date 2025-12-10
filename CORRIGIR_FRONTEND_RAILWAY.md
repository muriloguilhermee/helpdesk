# 🔧 Corrigir Frontend no Railway

## ❌ Problema

O Railway está tentando rodar o código do servidor (`server/dist/index.js`) no frontend.

**Erro:** `❌ Variáveis de ambiente disponíveis: []` - Está tentando rodar o backend!

## ✅ Solução Rápida

### No Railway Dashboard:

1. **Acesse o serviço do Frontend** (não o backend!)

2. **Vá em Settings → Build & Deploy**

3. **Configure:**
   - **Root Directory**: `/` (raiz, NÃO `/server`)
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Output Directory**: `dist` (opcional)

4. **IMPORTANTE:** Certifique-se de que:
   - ❌ NÃO está usando `cd server`
   - ❌ NÃO está usando `server/package.json`
   - ✅ Está usando o `package.json` da raiz
   - ✅ Está usando `npm start` (que roda `server.js` da raiz)

5. **Adicione variável:**
   - **Variables** → **+ New Variable**
   - `VITE_API_URL=https://sua-url-backend.railway.app`

---

## 🔍 Verificar Configuração

### ✅ Backend (Serviço Separado)
```
Root Directory: server
Build Command: cd server && npm install && npm run build
Start Command: cd server && npm start
```

### ✅ Frontend (Serviço Separado)
```
Root Directory: / (raiz)
Build Command: npm install && npm run build
Start Command: npm start
```

---

## 🐛 Se Ainda Não Funcionar

### Opção 1: Deletar e Recriar o Serviço Frontend

1. Delete o serviço do frontend atual
2. Crie um novo: **"New"** → **"GitHub Repo"**
3. Configure do zero seguindo os passos acima

### Opção 2: Usar Vercel para Frontend (Mais Fácil) ⭐

1. Acesse https://vercel.com
2. **"Add New"** → **"Project"**
3. Importe seu repositório
4. Configure:
   - Framework: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. Adicione variável: `VITE_API_URL`
6. Deploy!

**Vercel é mais fácil para frontend React/Vite!**

---

## 📝 Checklist

- [ ] Frontend em serviço separado do backend
- [ ] Root Directory = `/` (raiz)
- [ ] Build Command = `npm install && npm run build`
- [ ] Start Command = `npm start`
- [ ] Variável `VITE_API_URL` configurada
- [ ] Não está usando `cd server`

---

## 💡 Dica

**Use Vercel para o frontend!** É mais simples e otimizado para React/Vite.

**Use Railway apenas para o backend.**

