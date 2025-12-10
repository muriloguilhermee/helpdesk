# ⚡ Deploy Rápido no Vercel - 5 Minutos

## 🚀 Passo a Passo Rápido

### 1. Acesse o Vercel
👉 https://vercel.com

### 2. Faça Login
- Clique em **"Sign Up"**
- Escolha **"Continue with GitHub"**
- Autorize o acesso

### 3. Importe o Projeto
- Clique em **"Add New..."** → **"Project"**
- Selecione seu repositório `helpdesk`
- Clique em **"Import"**

### 4. Configure (Vercel detecta automaticamente)
- ✅ **Framework**: Vite (já detectado)
- ✅ **Build Command**: `npm run build` (já configurado)
- ✅ **Output Directory**: `dist` (já configurado)

### 5. Adicione Variável de Ambiente
- Clique em **"Environment Variables"**
- Adicione:
  ```
  Key: VITE_API_URL
  Value: https://sua-url-backend.railway.app
  ```
  ⚠️ **IMPORTANTE:**
  - Substitua pela URL real do seu backend
  - **DEVE começar com `https://`** (não `//`)
  - Exemplo: `https://helpdesk-production-f7dc.up.railway.app`

### 6. Deploy!
- Clique em **"Deploy"**
- Aguarde 1-2 minutos
- Pronto! 🎉

---

## 🔧 Após o Deploy

### Atualizar CORS no Backend

1. **Anote a URL do Vercel** (ex: `https://helpdesk-abc123.vercel.app`)

2. **No Railway (Backend):**
   - **Variables** → Atualize `CORS_ORIGIN`:
     ```
     https://helpdesk-abc123.vercel.app
     ```

3. **Pronto!** Backend e frontend conectados! ✅

---

## ✅ Verificar

1. Acesse a URL do Vercel
2. Teste fazer login
3. Se funcionar, está tudo certo! 🎉

---

## 🐛 Problemas?

### Site não carrega
- Verifique os logs no Vercel
- Veja se o build foi bem-sucedido

### API não conecta
- Verifique `VITE_API_URL` no Vercel
- Verifique `CORS_ORIGIN` no Railway
- Teste a URL do backend diretamente

---

## 💡 Dica

O Vercel faz deploy automático a cada `git push`! 🚀

