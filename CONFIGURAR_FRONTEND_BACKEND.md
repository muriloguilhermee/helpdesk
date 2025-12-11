# 🔧 Configurar Frontend para Conectar com Backend

## 📋 Checklist de Configuração

### 1. ✅ Backend no Render
- ✅ Backend está rodando em: `https://helpdesk-67k6.onrender.com`
- ✅ Rotas configuradas: `/api/auth`, `/api/users`, `/api/tickets`, `/api/financial`

### 2. ⚙️ Configurar Variável de Ambiente no Vercel

**IMPORTANTE:** A URL deve ser a URL base do backend **SEM** o `/api` no final, pois o código já adiciona automaticamente.

#### Passos:

1. Acesse o **Vercel Dashboard**: https://vercel.com
2. Vá para o projeto do frontend
3. Clique em **Settings** → **Environment Variables**
4. Adicione ou edite a variável:

   **Nome:** `VITE_API_URL`  
   **Valor:** `https://helpdesk-67k6.onrender.com`  
   **⚠️ NÃO inclua `/api` no final!**

5. Clique em **Save**
6. **IMPORTANTE:** Faça um novo deploy para aplicar as mudanças:
   - Vá para **Deployments**
   - Clique nos 3 pontos (⋯) do último deployment
   - Selecione **Redeploy**

### 3. 🔍 Verificar Configuração

Após configurar, o frontend vai fazer requisições para:
- Login: `https://helpdesk-67k6.onrender.com/api/auth/login`
- Usuários: `https://helpdesk-67k6.onrender.com/api/users`
- Tickets: `https://helpdesk-67k6.onrender.com/api/tickets`
- Financeiro: `https://helpdesk-67k6.onrender.com/api/financial`

### 4. 🐛 Troubleshooting

#### Erro: "Rota não encontrada" (404)

**Causa:** A URL da API está incorreta ou o backend não está respondendo.

**Solução:**
1. Verifique se o backend está rodando no Render
2. Teste a URL diretamente no navegador:
   ```
   https://helpdesk-67k6.onrender.com/api/auth/login
   ```
   Deve retornar um erro de método (POST esperado), não 404.

3. Verifique a variável `VITE_API_URL` no Vercel:
   - Deve ser: `https://helpdesk-67k6.onrender.com`
   - **NÃO** deve ser: `https://helpdesk-67k6.onrender.com/api`

4. Verifique o CORS no backend:
   - A URL do frontend deve estar em `CORS_ORIGIN` no Render
   - Exemplo: `https://helpdesk-psi-seven.vercel.app`

#### Erro: "Failed to fetch" ou "NetworkError"

**Causa:** Problema de CORS ou backend offline.

**Solução:**
1. Verifique se o backend está online no Render
2. Verifique o CORS no backend (Render → Environment Variables):
   ```
   CORS_ORIGIN=https://helpdesk-psi-seven.vercel.app,http://localhost:5173
   ```

#### Erro: "Backend não configurado"

**Causa:** Variável `VITE_API_URL` não está configurada no Vercel.

**Solução:**
1. Configure `VITE_API_URL` no Vercel (veja passo 2 acima)
2. Faça um novo deploy

### 5. 📝 Variáveis de Ambiente Necessárias

#### Frontend (Vercel):
- `VITE_API_URL` = `https://helpdesk-67k6.onrender.com`

#### Backend (Render):
- `DATABASE_URL` = URL do Supabase
- `JWT_SECRET` = Secret JWT
- `CORS_ORIGIN` = `https://helpdesk-psi-seven.vercel.app,http://localhost:5173`
- `NODE_ENV` = `production`
- `PORT` = (deixar vazio, Render define automaticamente)

### 6. ✅ Teste Final

Após configurar tudo:

1. Faça login no frontend
2. Verifique o console do navegador (F12)
3. Deve ver mensagens como:
   - ✅ "Login bem-sucedido"
   - ✅ "Usuários carregados da API"
   - ✅ "Tickets carregados da API"

Se ainda houver erros, verifique os logs do backend no Render.

