# 🌐 Configurar Frontend no Vercel para Conectar ao Railway

## 🔍 Problema Identificado

O servidor está rodando no Railway, mas o frontend não está configurado para se conectar a ele.

## ✅ Solução

### Passo 1: Obter URL do Servidor Railway

1. Acesse: https://railway.app
2. Seu projeto → Seu serviço
3. Clique em **"Settings"** → **"Networking"**
4. Copie a URL do domínio (algo como: `seu-projeto.up.railway.app`)
5. A URL completa da API será: `https://seu-projeto.up.railway.app/api`

### Passo 2: Configurar Variável no Vercel

1. Acesse: https://vercel.com
2. Seu projeto → **"Settings"** → **"Environment Variables"**
3. Clique em **"+ Add New"**
4. Configure:
   - **Name**: `VITE_API_URL`
   - **Value**: `https://seu-projeto.up.railway.app/api`
   - **Environments**: Selecione **Production**, **Preview** e **Development**
5. Clique em **"Save"**

### Passo 3: Fazer Redeploy do Frontend

1. No Vercel Dashboard → Seu projeto
2. Clique em **"Deployments"**
3. Clique nos **3 pontos** do deployment mais recente
4. Selecione **"Redeploy"**
5. Aguarde o deploy completar

### Passo 4: Verificar CORS no Railway

No Railway, verifique se `CORS_ORIGIN` está correto:

1. Railway Dashboard → Seu serviço → **Variables**
2. Verifique `CORS_ORIGIN`
3. Deve ser: `https://helpdesk-psi-seven.vercel.app` (SEM barra no final)
4. Se tiver barra `/` no final, remova e faça redeploy

## 🔧 Correção Automática do CORS

O código já foi ajustado para remover barras no final automaticamente, mas é melhor configurar corretamente.

## ✅ Verificar se Funcionou

1. Acesse o frontend: https://helpdesk-psi-seven.vercel.app
2. Tente fazer login
3. Verifique o console do navegador (F12)
4. Não deve aparecer erros de conexão

## 🐛 Se Ainda Não Funcionar

### Verificar no Console do Navegador

1. Abra o DevTools (F12)
2. Vá em **Console**
3. Procure por erros relacionados a:
   - `Failed to fetch`
   - `NetworkError`
   - `CORS`

### Verificar Variável no Vercel

1. Vercel Dashboard → Settings → Environment Variables
2. Verifique se `VITE_API_URL` está configurada
3. Verifique se o valor está correto (com `/api` no final)

### Testar URL do Servidor

Abra no navegador:
```
https://seu-projeto.up.railway.app/health
```

Deve retornar:
```json
{"status":"ok","timestamp":"...","database":"connected"}
```

## 📋 Checklist

- [ ] URL do Railway copiada
- [ ] `VITE_API_URL` configurada no Vercel
- [ ] Valor: `https://seu-projeto.up.railway.app/api` (com `/api`)
- [ ] Frontend redeployado no Vercel
- [ ] `CORS_ORIGIN` no Railway sem barra no final
- [ ] Servidor Railway está rodando (verificar logs)
- [ ] Health check funciona: `/health`

## 🔗 Links Úteis

- Vercel Dashboard: https://vercel.com
- Railway Dashboard: https://railway.app

