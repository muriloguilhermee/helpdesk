# 🔧 Corrigir Conexão com Backend - Frontend não puxa dados

## ❌ Problema

Frontend está funcionando no Vercel, mas não está puxando informações do banco de dados do Supabase.

## ✅ Solução Passo a Passo

### 1. Verificar `VITE_API_URL` no Vercel ⭐

**IMPORTANTE:** Esta é a causa mais comum!

1. No Vercel Dashboard:
   - Vá em **Settings** → **Environment Variables**
   - Encontre `VITE_API_URL`
   - **Verifique o valor:**
     - ✅ Deve ser: `https://sua-url-backend.railway.app`
     - ❌ **NÃO** deve ter `/api` no final
     - ❌ **NÃO** deve ter barra `/` no final
     - ✅ Deve começar com `https://`

2. **Formato Correto:**
   ```
   Key: VITE_API_URL
   Value: https://helpdesk-backend-production.up.railway.app
   ```

3. **Formato Incorreto:**
   ```
   ❌ https://helpdesk-backend-production.up.railway.app/api
   ❌ https://helpdesk-backend-production.up.railway.app/
   ❌ http://helpdesk-backend-production.up.railway.app
   ```

4. **Após corrigir:**
   - Faça um **Redeploy** no Vercel
   - Ou aguarde o deploy automático

---

### 2. Verificar se o Backend Está Rodando

1. **Encontre a URL do Backend:**
   - No Railway, vá no serviço do **Backend**
   - A URL aparece na página principal
   - Ou em **Settings** → **Domains**
   - Exemplo: `https://helpdesk-backend-production.up.railway.app`

2. **Teste se está funcionando:**
   - Abra no navegador: `https://sua-url-backend.railway.app/health`
   - Deve retornar: `{"status":"ok","timestamp":"..."}`
   - Se não funcionar, o backend não está rodando

3. **Se não funcionar:**
   - Verifique os logs do Railway
   - Verifique se o backend está conectado ao Supabase
   - Verifique se as variáveis de ambiente estão configuradas

---

### 3. Verificar CORS no Backend

**CRÍTICO:** O backend precisa permitir requisições do Vercel!

1. No Railway (Backend):
   - Vá em **Variables**
   - Encontre ou crie `CORS_ORIGIN`
   - **Adicione a URL do Vercel:**
     ```
     Key: CORS_ORIGIN
     Value: https://seu-projeto.vercel.app
     ```
   - Ou múltiplas URLs:
     ```
     Value: https://seu-projeto.vercel.app,http://localhost:5173
     ```

2. **Encontrar URL do Vercel:**
   - No Vercel Dashboard
   - A URL aparece na página do projeto
   - Exemplo: `https://helpdesk.vercel.app`

3. **Após adicionar:**
   - Railway reinicia automaticamente
   - Aguarde alguns segundos
   - Teste novamente

---

### 4. Verificar Console do Navegador

1. **Abra o site no navegador**
2. **Pressione F12** para abrir DevTools
3. **Vá na aba Console**
4. **Procure por erros:**
   - `Failed to fetch` → Backend não acessível ou CORS
   - `CORS policy` → CORS não configurado
   - `404 Not Found` → URL incorreta
   - `Network Error` → Backend não está rodando

5. **Vá na aba Network:**
   - Tente fazer login ou carregar dados
   - Veja se as requisições estão sendo feitas
   - Verifique se estão indo para a URL correta
   - Verifique o status (200 = OK, 404 = não encontrado, etc.)

6. **Execute no Console:**
   ```javascript
   console.log('API URL:', import.meta.env.VITE_API_URL);
   ```
   - Deve mostrar a URL do backend
   - Se mostrar `undefined`, a variável não está configurada

---

### 5. Verificar Backend Conectado ao Supabase

1. **No Railway (Backend):**
   - Vá em **Deployments** → **View Logs**
   - Procure por: `✅ Database connected successfully`
   - Se não aparecer, o backend não está conectado ao Supabase

2. **Verificar variáveis no Railway:**
   - `DATABASE_URL` deve estar configurada
   - Deve ser a connection string do Supabase
   - Para Supabase, use o **Connection Pooler** (porta 6543)

---

## 📋 Checklist Completo

- [ ] `VITE_API_URL` configurada no Vercel
- [ ] URL do backend está correta (sem `/api` no final)
- [ ] URL começa com `https://`
- [ ] Backend está rodando no Railway
- [ ] `/health` do backend retorna `{"status":"ok"}`
- [ ] `CORS_ORIGIN` configurado no Railway com URL do Vercel
- [ ] Console do navegador não mostra erros de CORS
- [ ] Requisições na aba Network estão indo para o backend correto
- [ ] Backend está conectado ao Supabase (verificar logs)
- [ ] `DATABASE_URL` configurada no Railway

---

## 🔍 Debug Rápido

### No Console do Navegador (F12):

```javascript
// Verificar variável de ambiente
console.log('VITE_API_URL:', import.meta.env.VITE_API_URL);

// Testar conexão com backend
fetch(import.meta.env.VITE_API_URL + '/api/health')
  .then(r => r.json())
  .then(data => console.log('Backend OK:', data))
  .catch(err => console.error('Backend ERRO:', err));
```

### Se mostrar erro:
- `undefined` → `VITE_API_URL` não configurada no Vercel
- `Failed to fetch` → Backend não acessível ou CORS
- `404` → URL incorreta

---

## 🐛 Erros Comuns e Soluções

### Erro: "Failed to fetch"
- **Causa:** Backend não está acessível ou CORS não configurado
- **Solução:**
  1. Verificar se backend está rodando
  2. Verificar `CORS_ORIGIN` no Railway
  3. Adicionar URL do Vercel em `CORS_ORIGIN`

### Erro: "CORS policy"
- **Causa:** `CORS_ORIGIN` não inclui a URL do Vercel
- **Solução:** Adicionar URL do Vercel em `CORS_ORIGIN` no Railway

### Erro: "404 Not Found"
- **Causa:** URL do backend incorreta ou rota não existe
- **Solução:**
  1. Verificar `VITE_API_URL` no Vercel
  2. Verificar se não tem `/api` no final
  3. Testar `/health` diretamente

### Erro: "Network Error"
- **Causa:** Backend não está rodando ou URL incorreta
- **Solução:**
  1. Verificar logs do Railway
  2. Verificar se backend está rodando
  3. Verificar URL do backend

### Dados não aparecem
- **Causa:** Backend não está conectado ao Supabase
- **Solução:**
  1. Verificar logs do Railway
  2. Verificar `DATABASE_URL` no Railway
  3. Verificar se Supabase está acessível

---

## ✅ Após Corrigir

1. **Limpe o cache do navegador:**
   - Pressione `Ctrl+Shift+R` (Windows) ou `Cmd+Shift+R` (Mac)

2. **Teste novamente:**
   - Tente fazer login
   - Verifique se os dados aparecem
   - Verifique o console para erros

3. **Se ainda não funcionar:**
   - Verifique os logs do Railway
   - Verifique os logs do Vercel
   - Verifique o console do navegador

---

## 📚 Arquivos de Referência

- `VERIFICAR_CONEXAO_BACKEND.md` - Guia detalhado
- `COMO_ENCONTRAR_URL_RAILWAY.md` - Como encontrar URL do backend
- `USAR_SUPABASE_POOLER.md` - Como usar Connection Pooler do Supabase

