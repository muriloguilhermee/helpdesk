# 🔧 Corrigir CORS no Railway

## ❌ Problema

Erro no console:
```
Access to fetch at 'https://helpdesk-evacloudd.up.railway.app/api/users' 
from origin 'https://helpdesk-psi-seven.vercel.app' 
has been blocked by CORS policy
```

## ✅ Solução Rápida

### Passo 1: Verificar CORS_ORIGIN no Railway

1. Acesse: https://railway.app
2. Seu projeto → Seu serviço → **Variables**
3. Procure por `CORS_ORIGIN`
4. Verifique o valor

### Passo 2: Configurar Corretamente

O valor deve ser **EXATAMENTE**:
```
https://helpdesk-psi-seven.vercel.app
```

**IMPORTANTE**:
- ❌ NÃO use barra no final: `https://helpdesk-psi-seven.vercel.app/`
- ✅ Use SEM barra: `https://helpdesk-psi-seven.vercel.app`
- ❌ NÃO use `http://` (deve ser `https://`)
- ✅ Use o protocolo correto: `https://`

### Passo 3: Se Não Existir, Criar

1. Railway Dashboard → Seu serviço → **Variables**
2. Clique em **"+ New Variable"**
3. Configure:
   - **Name**: `CORS_ORIGIN`
   - **Value**: `https://helpdesk-psi-seven.vercel.app`
4. Clique em **"Add"**

### Passo 4: Fazer Redeploy

1. Railway Dashboard → Seu serviço
2. Clique em **"Deploy"** → **"Redeploy"**
3. Aguarde o deploy completar

### Passo 5: Verificar Logs

Após o redeploy, verifique os logs:

1. Railway Dashboard → Deployments → Último deployment
2. Procure por:
   ```
   🌐 CORS Origin: https://helpdesk-psi-seven.vercel.app
   ```
3. Quando uma requisição chegar, você verá:
   ```
   🔍 CORS check - Origin recebida: https://helpdesk-psi-seven.vercel.app
   ✅ CORS: Origin permitida: https://helpdesk-psi-seven.vercel.app
   ```

## 🔍 Verificar se Está Funcionando

1. Após configurar e fazer redeploy
2. Acesse o frontend: https://helpdesk-psi-seven.vercel.app
3. Abra o DevTools (F12) → Console
4. Não deve aparecer mais erros de CORS
5. As requisições devem funcionar normalmente

## 🐛 Se Ainda Não Funcionar

### Verificar se a Origin Está Correta

No console do navegador, veja qual origin está sendo enviada. Deve ser exatamente:
```
https://helpdesk-psi-seven.vercel.app
```

### Verificar Logs do Railway

Nos logs do Railway, quando uma requisição chegar, você verá:
```
🔍 CORS check - Origin recebida: https://helpdesk-psi-seven.vercel.app
🔍 CORS check - Origin normalizada: https://helpdesk-psi-seven.vercel.app
🔍 CORS check - Origins permitidas: https://helpdesk-psi-seven.vercel.app
✅ CORS: Origin permitida: https://helpdesk-psi-seven.vercel.app
```

Se aparecer:
```
❌ CORS bloqueado: ...
```

Significa que a origin não está na lista. Verifique o valor de `CORS_ORIGIN` no Railway.

## 📋 Checklist

- [ ] `CORS_ORIGIN` configurado no Railway
- [ ] Valor: `https://helpdesk-psi-seven.vercel.app` (SEM barra no final)
- [ ] Protocolo correto: `https://` (não `http://`)
- [ ] Redeploy feito no Railway
- [ ] Logs mostram "✅ CORS: Origin permitida"
- [ ] Frontend funciona sem erros de CORS

## 💡 Dica

Se você tiver múltiplos ambientes (produção, preview, etc), pode configurar múltiplas origins separadas por vírgula:

```
https://helpdesk-psi-seven.vercel.app,https://helpdesk-preview.vercel.app
```

