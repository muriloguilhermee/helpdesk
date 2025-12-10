# 🚂 Configuração Railway - Helpdesk

## 📁 Estrutura de Arquivos

- **`server/railway.json`** - Configuração para o BACKEND
- **`railway-frontend.json`** - Configuração para o FRONTEND (opcional)
- **`.nvmrc`** - Node 20 (detectado automaticamente)
- **`server/.nvmrc`** - Node 20 para servidor

## 🔧 Configuração no Railway 

### Backend

1. **Root Directory**: `server`
2. **Build Command**: `npm install && npm run build`
3. **Start Command**: `npm start`
4. **Variáveis:**
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `NODE_ENV=production`
   - `CORS_ORIGIN`

### Frontend

1. **Root Directory**: `/` (raiz, NÃO `/server`)
2. **Build Command**: `npm install && npm run build`
3. **Start Command**: `npm start`
4. **Variáveis:**
   - `VITE_API_URL`

**⚠️ IMPORTANTE:** Frontend e Backend devem estar em **serviços separados**!

---

## 🐛 Problemas Comuns

### Frontend rodando código do servidor
- ✅ Verifique Root Directory = `/` (não `/server`)
- ✅ Verifique Start Command = `npm start` (não `cd server && npm start`)

### Node 18 em vez de Node 20
- ✅ Verifique se `.nvmrc` existe com `20`
- ✅ Ou configure manualmente no Railway Settings

### Variáveis não encontradas
- ✅ Verifique se estão configuradas no serviço correto
- ✅ Backend: `DATABASE_URL`, `JWT_SECRET`
- ✅ Frontend: `VITE_API_URL`

