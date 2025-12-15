# 🔍 Debug Completo - Backend não está funcionando

## ❌ Problema

- Não está buscando informações do banco de dados
- Não consegue criar chamado
- Não consegue criar usuário

## ✅ Checklist de Verificação Completo

### 1. Verificar se Backend Está Rodando ⭐ (CRÍTICO)

1. **No Railway Dashboard:**
   - Vá no serviço do **Backend**
   - Vá em **Deployments**
   - **Status deve ser:** ✅ **Active** (verde)
   - Se estiver ❌ **Failed** ou ⏸️ **Inactive**, o backend não está rodando

2. **Teste a URL do Backend:**
   - Abra no navegador: `https://sua-url-backend.railway.app/health`
   - Deve retornar: `{"status":"ok","timestamp":"..."}`
   - Se não funcionar, o backend não está rodando 

3. **Verificar Logs do Railway:**
   - Vá em **Deployments** → **View Logs**
   - Procure por:
     - ✅ `✅ Database connected successfully` = Backend conectado ao banco
     - ✅ `🚀 Server running on port 3001` = Servidor rodando
     - ❌ Erros de conexão = Backend não conectou

---

### 2. Verificar Variáveis de Ambiente no Railway

No Railway (Backend), vá em **Variables** e verifique:

#### ✅ DATABASE_URL (OBRIGATÓRIA)
```
Key: DATABASE_URL
Value: postgresql://postgres:senha@host:port/database
```
- **Para Supabase:** Use Connection Pooler (porta 6543)
- Formato: `postgresql://postgres.[project]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres`

#### ✅ JWT_SECRET (OBRIGATÓRIA)
```
Key: JWT_SECRET
Value: [chave secreta forte]
```

#### ✅ NODE_ENV
```
Key: NODE_ENV
Value: production
```

#### ✅ CORS_ORIGIN
```
Key: CORS_ORIGIN
Value: https://seu-projeto.vercel.app
```

---

### 3. Verificar `VITE_API_URL` no Vercel

1. **No Vercel Dashboard:**
   - Vá em **Settings** → **Environment Variables**
   - Encontre `VITE_API_URL`
   - **Deve ser:** `https://sua-url-backend.railway.app`
   - ❌ **NÃO** deve ter `/api` no final
   - ❌ **NÃO** deve ter barra `/` no final

2. **Teste no Console do Navegador (F12):**
   ```javascript
   console.log('API URL:', import.meta.env.VITE_API_URL);
   ```
   - Deve mostrar a URL do backend
   - Se mostrar `undefined`, a variável não está configurada

---

### 4. Verificar Console do Navegador

1. **Abra o site e pressione F12**
2. **Vá na aba Console:**
   - Procure por erros
   - Erros comuns:
     - `Failed to fetch` → Backend não acessível
     - `CORS policy` → CORS não configurado
     - `404 Not Found` → URL incorreta
     - `500 Internal Server Error` → Erro no backend

3. **Vá na aba Network:**
   - Tente criar um usuário ou chamado
   - Veja se as requisições estão sendo feitas
   - Verifique:
     - **URL:** Deve ser `https://backend.railway.app/api/...`
     - **Status:**
       - `200` = OK
       - `404` = Não encontrado
       - `500` = Erro no servidor
       - `CORS Error` = CORS não configurado

---

### 5. Verificar Backend Conectado ao Supabase

1. **No Railway (Backend):**
   - Vá em **Deployments** → **View Logs**
   - Procure por: `✅ Database connected successfully`
   - Se não aparecer, o backend não conectou ao banco

2. **Se aparecer erro de timeout:**
   - Veja `USAR_SUPABASE_POOLER.md`
   - Use Connection Pooler (porta 6543) em vez de conexão direta

---

## 🔧 Soluções Passo a Passo

### Solução 1: Backend Não Está Rodando

1. **No Railway:**
   - Vá em **Deployments**
   - Se estiver **Failed**, clique em **"Redeploy"**
   - Aguarde o deploy completar

2. **Verificar Logs:**
   - Veja se aparece: `✅ Database connected successfully`
   - Se não aparecer, verifique `DATABASE_URL`

### Solução 2: Backend Não Conecta ao Banco

1. **Verificar `DATABASE_URL`:**
   - No Railway: **Variables** → `DATABASE_URL`
   - Deve ser a connection string do Supabase
   - Para Supabase, use Connection Pooler (porta 6543)

2. **Testar Connection String:**
   - No Supabase Dashboard: **Settings** → **Database** → **Connection Pooling**
   - Copie a Connection String (URI mode)
   - Atualize no Railway

### Solução 3: CORS Não Configurado

1. **No Railway (Backend):**
   - Vá em **Variables**
   - Adicione ou atualize `CORS_ORIGIN`:
     ```
     Key: CORS_ORIGIN
     Value: https://seu-projeto.vercel.app
     ```
   - Railway reinicia automaticamente

### Solução 4: `VITE_API_URL` Incorreta

1. **No Vercel:**
   - **Settings** → **Environment Variables**
   - Encontre `VITE_API_URL`
   - Corrija para: `https://sua-url-backend.railway.app` (sem `/api`)
   - Faça **Redeploy**

---

## 🐛 Debug Avançado

### Testar Backend Diretamente

1. **Teste `/health`:**
   ```bash
   curl https://sua-url-backend.railway.app/health
   ```
   - Deve retornar: `{"status":"ok"}`

2. **Teste criar usuário:**
   ```bash
   curl -X POST https://sua-url-backend.railway.app/api/users \
     -H "Content-Type: application/json" \
     -d '{"name":"Teste","email":"teste@teste.com","password":"123456","role":"user"}'
   ```
   - Se der erro, veja a mensagem

### Verificar Logs em Tempo Real

1. **No Railway:**
   - Vá em **Deployments** → **View Logs**
   - Deixe aberto enquanto tenta criar usuário/chamado
   - Veja se aparecem erros

---

## 📋 Checklist Rápido

- [ ] Backend está rodando (status Active no Railway)
- [ ] `/health` retorna `{"status":"ok"}`
- [ ] Logs mostram `✅ Database connected successfully`
- [ ] `DATABASE_URL` configurada no Railway
- [ ] `JWT_SECRET` configurada no Railway
- [ ] `CORS_ORIGIN` configurado com URL do Vercel
- [ ] `VITE_API_URL` configurada no Vercel (sem `/api`)
- [ ] Console do navegador não mostra erros de CORS
- [ ] Requisições na aba Network estão indo para o backend correto
- [ ] Status das requisições é `200` (não `404` ou `500`)

---

## ✅ Após Verificar Tudo

1. **Limpe o cache do navegador:**
   - `Ctrl+Shift+R` (Windows) ou `Cmd+Shift+R` (Mac)

2. **Teste novamente:**
   - Tente criar um usuário
   - Tente criar um chamado
   - Verifique se os dados aparecem

3. **Se ainda não funcionar:**
   - Compartilhe os logs do Railway
   - Compartilhe os erros do console do navegador
   - Compartilhe o status das requisições na aba Network

---

## 📚 Arquivos de Referência

- `CORRIGIR_CONEXAO_BACKEND.md` - Guia de conexão
- `USAR_SUPABASE_POOLER.md` - Como usar Connection Pooler
- `VERIFICAR_CONEXAO_BACKEND.md` - Checklist de verificação







