# 🔧 Corrigir Builder no Railway

## ⚠️ PROBLEMA IDENTIFICADO

O servidor está iniciando corretamente, mas as requisições retornam 502. 

**Nas imagens, vejo que o Builder está configurado como "Dockerfile", mas deveria ser "NIXPACKS".**

## 🔧 SOLUÇÃO

### 1. Verificar Builder no Railway

1. Railway Dashboard → Settings → **Build**
2. Verifique o **Builder**:
   - ❌ Se estiver como "Dockerfile" → Mude para "NIXPACKS"
   - ✅ Deve estar como "NIXPACKS"

### 2. Verificar se Há Dockerfile

Se você NÃO tem um Dockerfile na raiz do projeto:
- O Railway pode estar tentando usar Dockerfile que não existe
- Isso causa problemas de build/deploy

**Solução:** Configure o Builder como "NIXPACKS" explicitamente.

### 3. Verificar Deploy Logs Quando Requisição Chega

Após o servidor iniciar, faça uma requisição do frontend e observe os **Deploy Logs**:

**Se aparecer:**
```
📥 OPTIONS /api/tickets recebido
🔍 OPTIONS ABSOLUTO recebido - Origin: https://helpdesk-psi-seven.vercel.app
```
→ O servidor está recebendo requisições

**Se NÃO aparecer nada:**
→ O servidor não está recebendo requisições
→ Problema de roteamento do Railway

### 4. Verificar se o Servidor Está Escutando na Porta Correta

Nos Deploy Logs, você deve ver:
```
🚀 Server running on port 8080
🔗 Server listening on: http://0.0.0.0:8080
```

**Se aparecer erro de porta:**
```
❌ Port 8080 is already in use
```
→ Problema de configuração

## 📋 CHECKLIST

- [ ] Builder configurado como "NIXPACKS" (não Dockerfile)
- [ ] Root Directory: `server`
- [ ] Start Command: `npm start`
- [ ] Servidor mostra "Server ready to accept connections"
- [ ] Deploy Logs mostram requisições chegando quando você acessa o frontend
- [ ] Não há erros após servidor iniciar

## 🚨 TESTE CRÍTICO

1. **Acesse o frontend:** https://helpdesk-psi-seven.vercel.app
2. **Observe os Deploy Logs** (não HTTP Logs) em tempo real
3. **Procure por:**
   - `📥 OPTIONS ... recebido` - Se aparecer, o servidor está recebendo
   - `🔍 OPTIONS ABSOLUTO recebido` - Se aparecer, o handler está funcionando
   - Erros - Se aparecer, me envie o erro completo

**Se NÃO aparecer NADA nos Deploy Logs quando você acessa o frontend:**
- O Railway não está roteando requisições para o servidor
- Pode ser problema de Builder ou configuração

## 💡 PRÓXIMOS PASSOS

1. **Mude o Builder para NIXPACKS** (se estiver como Dockerfile)
2. **Faça um novo deploy**
3. **Teste o frontend e observe os Deploy Logs**
4. **Me envie o que aparece nos logs** quando uma requisição chega

**O servidor está iniciando, mas precisa receber as requisições!**


