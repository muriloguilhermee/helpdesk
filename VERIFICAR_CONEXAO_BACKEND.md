# 🔍 Verificar Conexão com Backend

## ❌ Problema

Frontend está funcionando, mas não está puxando informações do banco de dados do Supabase.

## ✅ Checklist de Verificação

### 1. Verificar Variável `VITE_API_URL` no Vercel

1. No Vercel Dashboard:
   - Vá em **Settings** → **Environment Variables**
   - Verifique se `VITE_API_URL` está configurada
   - O valor deve ser a URL do backend no Railway
   - Exemplo: `https://helpdesk-backend-production.up.railway.app`

2. **⚠️ IMPORTANTE:**
   - A URL deve começar com `https://`
   - Não deve ter barra `/` no final
   - Deve ser a URL completa do backend

### 2. Verificar se o Backend Está Rodando

1. Teste a URL do backend diretamente:
   - Abra no navegador: `https://sua-url-backend.railway.app/health`
   - Deve retornar: `{"status":"ok"}`

2. Se não funcionar:
   - Verifique os logs do Railway
   - Verifique se o backend está rodando
   - Verifique se as variáveis de ambiente estão configuradas

### 3. Verificar CORS no Backend

No Railway (Backend), verifique a variável `CORS_ORIGIN`:

1. Vá em **Variables**
2. Verifique se `CORS_ORIGIN` está configurada
3. Deve conter a URL do Vercel:
   ```
   CORS_ORIGIN=https://seu-projeto.vercel.app
   ```
4. Ou múltiplas URLs:
   ```
   CORS_ORIGIN=https://seu-projeto.vercel.app,http://localhost:5173
   ```

### 4. Verificar Console do Navegador

1. Abra o site no navegador
2. Pressione **F12** para abrir o DevTools
3. Vá na aba **Console**
4. Procure por erros como:
   - `Failed to fetch`
   - `CORS policy`
   - `Network Error`
   - `404 Not Found`

5. Vá na aba **Network**
6. Tente fazer login ou carregar dados
7. Veja se as requisições estão sendo feitas
8. Verifique se estão indo para a URL correta do backend

---

## 🔧 Soluções

### Solução 1: Atualizar `VITE_API_URL` no Vercel

1. No Vercel:
   - **Settings** → **Environment Variables**
   - Encontre `VITE_API_URL`
   - Edite e coloque a URL correta do backend
   - Formato: `https://sua-url-backend.railway.app`
   - **NÃO** coloque `/api` no final (o código já adiciona)

2. Faça um novo deploy:
   - Vá em **Deployments**
   - Clique em **"Redeploy"**

### Solução 2: Atualizar CORS no Backend

1. No Railway (Backend):
   - Vá em **Variables**
   - Encontre ou crie `CORS_ORIGIN`
   - Adicione a URL do Vercel:
     ```
     https://seu-projeto.vercel.app
     ```
   - Salve (Railway reinicia automaticamente)

### Solução 3: Verificar URL do Backend

1. No Railway:
   - Vá no serviço do **Backend**
   - A URL aparece na página principal
   - Ou em **Settings** → **Domains**
   - **Copie a URL completa**

2. Teste no navegador:
   - `https://sua-url-backend.railway.app/health`
   - Deve retornar: `{"status":"ok"}`

3. Se não funcionar:
   - Verifique os logs do Railway
   - Verifique se o backend está rodando
   - Verifique se o banco de dados está conectado

---

## 🔍 Debug no Console

Abra o console do navegador (F12) e execute:

```javascript
console.log('API URL:', import.meta.env.VITE_API_URL);
```

Deve mostrar a URL do backend configurada no Vercel.

---

## 📋 Checklist Completo

- [ ] `VITE_API_URL` configurada no Vercel
- [ ] URL do backend está correta (sem `/api` no final)
- [ ] Backend está rodando no Railway
- [ ] `/health` do backend retorna `{"status":"ok"}`
- [ ] `CORS_ORIGIN` configurado no Railway com URL do Vercel
- [ ] Console do navegador não mostra erros de CORS
- [ ] Requisições na aba Network estão indo para o backend correto
- [ ] Backend está conectado ao Supabase (verificar logs do Railway)

---

## 🐛 Erros Comuns

### Erro: "Failed to fetch"
- **Causa:** Backend não está acessível ou CORS não configurado
- **Solução:** Verificar URL do backend e CORS

### Erro: "CORS policy"
- **Causa:** `CORS_ORIGIN` não inclui a URL do Vercel
- **Solução:** Adicionar URL do Vercel em `CORS_ORIGIN` no Railway

### Erro: "404 Not Found"
- **Causa:** URL do backend incorreta ou rota não existe
- **Solução:** Verificar `VITE_API_URL` e rotas do backend

### Erro: "Network Error"
- **Causa:** Backend não está rodando ou URL incorreta
- **Solução:** Verificar se backend está rodando no Railway

---

## ✅ Após Corrigir

1. Limpe o cache do navegador (Ctrl+Shift+R)
2. Tente fazer login novamente
3. Verifique se os dados estão sendo carregados
4. Verifique o console para erros

