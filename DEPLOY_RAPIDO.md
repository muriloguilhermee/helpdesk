# 🚀 Deploy Rápido - Helpdesk

## Opção 1: Railway (Mais Fácil - Recomendado) ⭐

### Backend

1. Acesse: https://railway.app
2. Faça login com GitHub
3. Clique em **"New Project"** → **"Deploy from GitHub repo"**
4. Selecione seu repositório do GitHub
5. Railway detectará automaticamente a pasta `server`
6. **⚠️ IMPORTANTE:** Vá em **"Variables"** → **"+ New Variable"** e adicione **UMA POR UMA**:

   **DATABASE_URL** (OBRIGATÓRIA):
   ```
   Nome: DATABASE_URL
   Valor: postgresql://postgres:[SUA_SENHA]@db.[PROJETO].supabase.co:5432/postgres
   ```
   - Obtenha no Supabase: Settings → Database → Connection String (URI)
   - Substitua `[YOUR-PASSWORD]` pela senha real
   - Se a senha tem caracteres especiais (@, #, $), codifique: @ → %40

   **JWT_SECRET** (OBRIGATÓRIA):
   ```
   Nome: JWT_SECRET
   Valor: [GERE_UMA_CHAVE_FORTE]
   ```
   - Gere com: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

   **NODE_ENV**:
   ```
   Nome: NODE_ENV
   Valor: production
   ```

   **PORT** (Opcional):
   ```
   Nome: PORT
   Valor: 3001
   ```

7. Aguarde o Railway reiniciar automaticamente
8. Verifique os logs - deve aparecer: `✅ Database connected successfully`
9. **📌 IMPORTANTE:** Anote a URL do backend:
   - A URL aparece na página principal do serviço
   - Ou em **Settings** → **Domains**
   - Exemplo: `https://helpdesk-backend-production.up.railway.app`
   - **Copie esta URL completa!** Você vai precisar dela para o frontend

**📖 Veja CONFIGURAR_RAILWAY.md para instruções detalhadas**

### Frontend - Usar Vercel (Recomendado) ⭐

**Vercel é mais fácil e otimizado para React/Vite!**

1. Acesse: **https://vercel.com**
2. Faça login com GitHub
3. Clique em **"Add New..."** → **"Project"**
4. Selecione seu repositório `helpdesk`
5. Clique em **"Import"**
6. O Vercel detecta automaticamente:
   - ✅ Framework: Vite
   - ✅ Build Command: `npm run build`
   - ✅ Output Directory: `dist`
7. **Adicione variável de ambiente:**
   - Clique em **"Environment Variables"**
   - Adicione:
     ```
     Nome: VITE_API_URL
     Valor: https://sua-url-backend.railway.app
     ```
     ⚠️ **Substitua pela URL real do seu backend!**
8. Clique em **"Deploy"**
9. Aguarde 1-2 minutos
10. **Pronto!** Anote a URL do Vercel (ex: `https://helpdesk.vercel.app`)

**📖 Veja TUTORIAL_VERCEL.md para tutorial completo**

#### Atualizar CORS no Backend

Após fazer deploy no Vercel:

1. No Railway (Backend), vá em **Variables**
2. Atualize `CORS_ORIGIN` com a URL do Vercel:
   ```
   CORS_ORIGIN=https://seu-projeto.vercel.app
   ```
3. Backend reinicia automaticamente
4. Pronto! Frontend e backend conectados! ✅

### Finalizar

1. Volte ao serviço do **Backend**
2. Atualize a variável `CORS_ORIGIN` com a URL do frontend:
   ```
   CORS_ORIGIN=https://sua-url-frontend.railway.app
   ```
3. Pronto! Seu sistema está no ar! 🎉

---

## Opção 2: Render (Gratuito)

### Backend

1. Acesse: https://render.com
2. Faça login com GitHub
3. Clique em **"New"** → **"Web Service"**
4. Conecte seu repositório
5. Configure:
   - **Name**: `helpdesk-backend`
   - **Environment**: `Node`
   - **Build Command**: `cd server && npm install && npm run build`
   - **Start Command**: `cd server && npm start`
   - **Root Directory**: `server`
6. Adicione as mesmas variáveis de ambiente do Railway
7. Clique em **"Create Web Service"**

### Frontend

1. Clique em **"New"** → **"Static Site"**
2. Conecte o repositório
3. Configure:
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
4. Adicione `VITE_API_URL` com a URL do backend
5. Clique em **"Create Static Site"**

---

## ✅ Checklist de Deploy

- [ ] Código está no GitHub
- [ ] Banco Supabase configurado e funcionando
- [ ] Backend deployado e rodando
- [ ] Frontend deployado e rodando
- [ ] `CORS_ORIGIN` configurado no backend
- [ ] `VITE_API_URL` configurado no frontend
- [ ] Testado login e criação de usuários
- [ ] Testado criação de chamados

---

## 🔧 Variáveis de Ambiente Necessárias

### Backend
```
DATABASE_URL=postgresql://...
JWT_SECRET=chave_secreta_forte
NODE_ENV=production
CORS_ORIGIN=https://seu-frontend.com
PORT=3001
```

### Frontend
```
VITE_API_URL=https://seu-backend.com
```

---

## 🐛 Problemas Comuns

**Backend não inicia:**
- Verifique se `DATABASE_URL` está correto
- Veja os logs na plataforma

**Frontend não conecta:**
- Verifique se `VITE_API_URL` está correto
- Verifique se `CORS_ORIGIN` no backend inclui a URL do frontend

**Erro de CORS:**
- Adicione a URL do frontend em `CORS_ORIGIN` do backend
- Reinicie o backend

---

## 💰 Custos

- **Railway**: $5/mês após plano gratuito (500 horas)
- **Render**: Gratuito (pode "adormecer" após 15min)
- **Vercel**: Gratuito para projetos pessoais

---

## 📞 Precisa de Ajuda?

1. Verifique os logs na plataforma
2. Teste localmente primeiro
3. Verifique se todas as variáveis estão configuradas

