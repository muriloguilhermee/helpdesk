# 🔍 Diagnóstico - Railway "Not Found"

## ❌ Problema: "Not Found" ao acessar /health

Este erro geralmente significa que o servidor não está rodando ou não está configurado corretamente.

## 🔍 Passo 1: Verificar Logs no Railway

1. Acesse: https://railway.app
2. Seu projeto → Seu serviço
3. Clique em **"Deployments"**
4. Clique no deployment mais recente
5. Veja os logs

### O que procurar nos logs:

✅ **Sucesso** - Deve ver:
```
✅ Database connected successfully
🚀 Server running on port XXXX
✅ Server ready to accept connections
```

❌ **Erro** - Pode ver:
```
❌ Database connection error
❌ Failed to start server
Error: ...
```

## 🔧 Passo 2: Verificar Configuração

### 2.1 Root Directory

Se o servidor está na pasta `server/`:

1. Railway Dashboard → Seu serviço → **Settings**
2. Em **"Root Directory"**, deve estar: `server`
3. Se estiver vazio ou diferente, configure como `server`

### 2.2 Variáveis de Ambiente

Verifique se TODAS estão configuradas:

1. Railway Dashboard → Seu serviço → **Variables**
2. Deve ter:
   - ✅ `DATABASE_URL` (com senha real, não `[SENHA]`)
   - ✅ `JWT_SECRET`
   - ✅ `CORS_ORIGIN`
   - ✅ `NODE_ENV=production` (opcional)

### 2.3 Build e Start Commands

1. Railway Dashboard → Seu serviço → **Settings**
2. **Build Command**: Deve estar vazio (usa `nixpacks.toml`)
3. **Start Command**: Deve ser `npm start`

## 🚨 Problemas Comuns e Soluções

### Problema 1: "Database configuration is required"

**Causa**: `DATABASE_URL` não está configurado

**Solução**:
1. Railway Dashboard → Variables
2. Adicione `DATABASE_URL` com a connection string do Supabase
3. **IMPORTANTE**: Substitua `[SENHA]` pela senha real
4. Faça redeploy

### Problema 2: "Cannot connect to database"

**Causa**: Connection string incorreta ou senha errada

**Solução**:
1. Verifique se a connection string está correta
2. Verifique se substituiu `[SENHA]` pela senha real
3. Tente usar Connection Pooler (porta 6543)
4. Teste localmente primeiro: `npm run test-connection`

### Problema 3: Servidor não compila

**Causa**: Erros de TypeScript ou dependências

**Solução**:
1. Teste localmente: `npm run build`
2. Se der erro, corrija antes de fazer deploy
3. Verifique se todas as dependências estão no `package.json`

### Problema 4: Servidor inicia mas não responde

**Causa**: Porta incorreta ou servidor não está escutando

**Solução**:
1. Railway define a porta automaticamente via `PORT`
2. O servidor já está configurado para usar `process.env.PORT`
3. Verifique os logs para ver em qual porta está rodando

### Problema 5: "Not Found" mesmo com servidor rodando

**Causa**: Domínio não está configurado ou serviço não está público

**Solução**:
1. Railway Dashboard → Seu serviço → **Settings** → **Networking**
2. Clique em **"Generate Domain"** (se ainda não tiver)
3. Use o domínio gerado (algo como: `seu-projeto.up.railway.app`)
4. Aguarde alguns minutos para propagação

## ✅ Checklist de Verificação

- [ ] Logs mostram "✅ Database connected successfully"
- [ ] Logs mostram "🚀 Server running on port XXXX"
- [ ] Não há erros nos logs
- [ ] `DATABASE_URL` está configurado (sem `[SENHA]`)
- [ ] `JWT_SECRET` está configurado
- [ ] `CORS_ORIGIN` está configurado
- [ ] Root Directory está correto (`server` se aplicável)
- [ ] Domínio foi gerado no Railway
- [ ] Aguardou alguns minutos após deploy

## 🔄 Passo 3: Fazer Redeploy

Se corrigiu algo:

1. Railway Dashboard → Seu serviço
2. Clique em **"Deploy"** → **"Redeploy"**
3. Aguarde o deploy completar
4. Verifique os logs novamente

## 🧪 Passo 4: Testar Localmente Primeiro

Antes de fazer deploy, teste localmente:

```bash
cd server

# 1. Verificar se compila
npm run build

# 2. Verificar conexão com banco
npm run test-connection

# 3. Testar servidor localmente
npm run dev
```

Se funcionar localmente, deve funcionar no Railway.

## 📋 Informações para Diagnóstico

Se ainda não funcionar, me envie:

1. **Logs do Railway** (últimas 50 linhas)
2. **Variáveis de ambiente** configuradas (sem valores sensíveis)
3. **Root Directory** configurado
4. **Resultado de** `npm run build` localmente
5. **Resultado de** `npm run test-connection` localmente

## 🔗 Links Úteis

- Railway Dashboard: https://railway.app
- Logs do Railway: Dashboard → Deployments → Clique no deployment
- Documentação Railway: https://docs.railway.app

