# 🔍 Verificar Deploy Logs - Diagnóstico 502

## ⚠️ PROBLEMA CRÍTICO

Todas as requisições OPTIONS estão retornando **502 (Bad Gateway)**. Isso significa que o servidor não está respondendo às requisições.

## 🔍 DIAGNÓSTICO IMEDIATO

### 1. Verificar Deploy Logs (NÃO HTTP Logs)

**IMPORTANTE:** HTTP Logs mostram apenas as requisições que chegam. Deploy Logs mostram o que o servidor está fazendo.

1. Railway Dashboard → **Deployments**
2. Clique no último deploy
3. Aba **"Deploy Logs"** (não "HTTP Logs")
4. Procure por:

**✅ Se o servidor iniciou corretamente:**
```
🚀 Server running on port 8080
✅ Server ready to accept connections
🔗 Server listening on: http://0.0.0.0:8080
```

**❌ Se houver erros:**
```
❌ Server error: ...
❌ Uncaught Exception: ...
❌ Unhandled Rejection: ...
```

### 2. Verificar se o Servidor Está Recebendo Requisições

Nos Deploy Logs, quando uma requisição chegar, você DEVE ver:
```
📥 OPTIONS /api/tickets recebido
🔍 OPTIONS ABSOLUTO recebido - Origin: https://helpdesk-psi-seven.vercel.app
✅ OPTIONS ABSOLUTO respondido para: https://helpdesk-psi-seven.vercel.app
```

**Se NÃO aparecer `📥 OPTIONS ... recebido`:**
- O servidor não está recebendo requisições
- Pode ser problema de roteamento do Railway

**Se aparecer `📥 OPTIONS ... recebido` mas depois der erro:**
- O servidor está recebendo, mas crashando ao processar
- Me envie o erro completo!

### 3. Verificar se o Servidor Está Crashando

Após o servidor iniciar, faça uma requisição do frontend e observe os Deploy Logs:

**Se aparecer erro após a requisição:**
- O servidor está crashando
- Me envie o erro completo

**Se não aparecer nada:**
- O servidor não está recebendo requisições
- Pode ser problema de configuração do Railway

## 🔧 SOLUÇÕES

### Solução 1: Verificar Porta

Railway usa porta dinâmica. Verifique:

1. Railway Dashboard → Variables
2. **NÃO deve ter** variável `PORT` manual
3. Railway fornece `PORT` automaticamente via `process.env.PORT`

**Se você configurou PORT manualmente, REMOVA!**

### Solução 2: Verificar Root Directory

1. Railway Dashboard → Settings
2. Verifique **Root Directory**:
   - Se o código está em `server/`, configure: `server`
   - Se o código está na raiz, deixe vazio

### Solução 3: Verificar Start Command

1. Railway Dashboard → Settings
2. Verifique **Start Command**:
   - Deve ser: `npm start`
   - Ou verificar `railway.json`:
     ```json
     {
       "deploy": {
         "startCommand": "npm start"
       }
     }
     ```

### Solução 4: Verificar Build

1. Railway Dashboard → Deploy Logs
2. Procure por:
   ```
   > npm run build
   > tsc
   ```
   - Se aparecer erro de build, o problema é na compilação
   - Se não aparecer, o build não está sendo executado

### Solução 5: Testar Localmente

Para garantir que o código funciona:

```bash
cd server
npm run build
npm start
```

Depois teste:
```bash
cd server
npm run build
npm start
```

Se funcionar localmente, o problema é no Railway.

## 📋 CHECKLIST DE DIAGNÓSTICO

- [ ] Deploy Logs verificados (não HTTP Logs)
- [ ] Servidor mostra "Server ready to accept connections"
- [ ] Não há variável PORT manual no Railway
- [ ] Root Directory configurado corretamente
- [ ] Start Command está correto
- [ ] Build foi executado com sucesso
- [ ] Logs mostram requisições chegando (`📥 OPTIONS ... recebido`)
- [ ] Não há erros após servidor iniciar

## 🚨 SE O PROBLEMA PERSISTIR

### Enviar Informações

Me envie:
1. **Deploy Logs completos** (desde o início)
2. **Configuração do Railway:**
   - Root Directory
   - Start Command
   - Variáveis de ambiente (sem valores sensíveis)
3. **Se aparecer erro**, o erro completo

### Verificar Configuração do Railway

1. Railway Dashboard → Settings
2. Verifique:
   - **Root Directory:** `server` ou vazio
   - **Build Command:** `npm run build` (ou vazio se usar nixpacks)
   - **Start Command:** `npm start`

### Verificar railway.json

O arquivo `server/railway.json` deve ter:
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "nixpacksConfigPath": "./nixpacks.toml"
  },
  "deploy": {
    "startCommand": "npm start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

## 💡 PRÓXIMOS PASSOS

1. **Verifique os Deploy Logs** (não HTTP Logs)
2. **Procure por erros** após "Server ready"
3. **Verifique se aparecem logs** quando uma requisição chega
4. **Me envie os logs** se houver erros

**O problema está nos Deploy Logs, não nos HTTP Logs!**

