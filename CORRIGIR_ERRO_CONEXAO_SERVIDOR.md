# 🔧 Corrigir Erro "Erro ao conectar com o servidor"

## ❌ Erro

```
Erro ao conectar com o servidor. Verifique se o backend está rodando.
```

## 🔍 Possíveis Causas

### 1. Backend não está rodando no Railway ⭐ (Mais Comum)

### 2. `VITE_API_URL` não configurada ou incorreta no Vercel

### 3. CORS não configurado no backend

### 4. Backend está com timeout ou erro

---

## ✅ Soluções Passo a Passo

### 1. Verificar se o Backend Está Rodando

1. **No Railway Dashboard:**
   - Vá no serviço do **Backend**
   - Vá em **Deployments**
   - Verifique o status:
     - ✅ **Active** = Backend está rodando
     - ❌ **Failed** = Backend não está rodando

2. **Teste a URL do Backend:**
   - Abra no navegador: `https://sua-url-backend.railway.app/health`
   - Deve retornar: `{"status":"ok","timestamp":"..."}`
   - Se não funcionar, o backend não está rodando

3. **Verificar Logs:**
   - No Railway, vá em **Deployments** → **View Logs**
   - Procure por erros
   - Procure por: `✅ Database connected successfully`
   - Se não aparecer, o backend não conectou ao banco

---

### 2. Verificar `VITE_API_URL` no Vercel

1. **No Vercel Dashboard:**
   - Vá em **Settings** → **Environment Variables**
   - Encontre `VITE_API_URL`
   - **Verifique o valor:**
     - ✅ Deve ser: `https://sua-url-backend.railway.app`
     - ❌ **NÃO** deve ter `/api` no final
     - ❌ **NÃO** deve ter barra `/` no final
     - ✅ Deve começar com `https://`

2. **Se estiver incorreto:**
   - Edite e corrija
   - Faça um **Redeploy** no Vercel

---

### 3. Verificar CORS no Backend

1. **No Railway (Backend):**
   - Vá em **Variables**
   - Encontre `CORS_ORIGIN`
   - **Deve conter a URL do Vercel:**
     ```
     https://seu-projeto.vercel.app
     ```
   - Ou múltiplas URLs:
     ```
     https://seu-projeto.vercel.app,http://localhost:5173
     ```

2. **Se não estiver configurado:**
   - Adicione a variável `CORS_ORIGIN`
   - Coloque a URL do Vercel
   - Railway reinicia automaticamente

---

### 4. Verificar Console do Navegador

1. **Abra o site no navegador**
2. **Pressione F12** para abrir DevTools
3. **Vá na aba Console:**
   - Procure por erros
   - Erros comuns:
     - `Failed to fetch` → Backend não acessível ou CORS
     - `CORS policy` → CORS não configurado
     - `404 Not Found` → URL incorreta
     - `Network Error` → Backend não está rodando

4. **Vá na aba Network:**
   - Tente fazer login ou carregar dados
   - Veja se as requisições estão sendo feitas
   - Verifique o status:
     - `200` = OK
     - `404` = Não encontrado
     - `500` = Erro no servidor
     - `CORS Error` = CORS não configurado

5. **Execute no Console:**
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

2. **Verificar Variáveis:**
   - `DATABASE_URL` deve estar configurada
   - Deve ser a connection string do Supabase
   - Para Supabase, use o **Connection Pooler** (porta 6543)

---

## 🔄 Solução Rápida

### Se o erro aparece "às vezes":

1. **Backend pode estar reiniciando:**
   - Railway pode estar reiniciando o serviço
   - Aguarde alguns segundos e tente novamente

2. **Timeout de conexão:**
   - O backend pode estar demorando para responder
   - Verifique os logs do Railway

3. **Cache do navegador:**
   - Limpe o cache: `Ctrl+Shift+R` (Windows) ou `Cmd+Shift+R` (Mac)
   - Tente em modo anônimo

---

## 📋 Checklist Completo

- [ ] Backend está rodando no Railway (status Active)
- [ ] `/health` do backend retorna `{"status":"ok"}`
- [ ] `VITE_API_URL` configurada no Vercel (sem `/api` no final)
- [ ] `CORS_ORIGIN` configurado no Railway com URL do Vercel
- [ ] Backend conectado ao Supabase (verificar logs)
- [ ] Console do navegador não mostra erros de CORS
- [ ] Requisições na aba Network estão indo para o backend correto
- [ ] `DATABASE_URL` configurada no Railway

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

### Erro aparece "às vezes"
- **Causa:** Backend pode estar reiniciando ou timeout
- **Solução:** 
  1. Aguardar alguns segundos
  2. Verificar logs do Railway
  3. Limpar cache do navegador

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

- `CORRIGIR_CONEXAO_BACKEND.md` - Guia detalhado de conexão
- `VERIFICAR_CONEXAO_BACKEND.md` - Checklist de verificação
- `COMO_ENCONTRAR_URL_RAILWAY.md` - Como encontrar URL do backend

