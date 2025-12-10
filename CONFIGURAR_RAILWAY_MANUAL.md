# 🔧 Configurar Railway Manualmente - Passo a Passo

## ❌ Problema

O "Custom Start Command" no Deploy está usando `nvm use 20`, que não existe no Railway.

## ✅ Solução: Configurar Railway Corretamente

### 1. Configurar Build

1. No Railway Dashboard:
   - Vá no serviço do **Backend**
   - Vá em **Settings** → **Build**

2. **Builder:**
   - Deixe como **"Railpack"** (Default) ✅

3. **Custom Build Command:**
   - **DEIXE VAZIO** ✅
   - O `nixpacks.toml` cuida do build automaticamente

4. **Watch Paths:**
   - Deixe vazio ou adicione: `/server/**`

---

### 2. Configurar Deploy (IMPORTANTE) ⭐

1. No Railway Dashboard:
   - Vá em **Settings** → **Deploy**

2. **Custom Start Command:**
   - **REMOVA** o comando atual: `nvm use 20 && cd server && npm install && npm run build`
   - **SUBSTITUA** por: `npm start`
   - Ou **DEIXE VAZIO** (o `nixpacks.toml` já define)

3. **Regions:**
   - Deixe como está (US West)

4. **Teardown:**
   - Pode deixar desligado

5. **Resource Limits:**
   - Deixe como está

---

### 3. Verificar Root Directory

1. No Railway Dashboard:
   - Vá em **Settings** → **Source**

2. **Root Directory:**
   - Deve estar como: `server` ✅
   - Se não estiver, configure como `server`

---

## 📋 Configuração Correta

### Build:
- **Builder:** Railpack (Default)
- **Custom Build Command:** VAZIO
- **Metal Build Environment:** Pode deixar desligado

### Deploy:
- **Custom Start Command:** `npm start` (ou VAZIO)
- **Regions:** US West (ou sua preferência)
- **Teardown:** Desligado (ou ligado, sua escolha)

### Source:
- **Root Directory:** `server`

---

## ⚠️ IMPORTANTE

**NÃO use `nvm` no Custom Start Command!**

❌ **ERRADO:**
```
nvm use 20 && cd server && npm install && npm run build
```

✅ **CORRETO:**
```
npm start
```

Ou deixe **VAZIO** - o `nixpacks.toml` já cuida de tudo!

---

## 🔍 Por Que Isso Funciona

- **Nixpacks** detecta automaticamente Node.js através do `nixpacks.toml`
- **Root Directory** `server` faz o Railway trabalhar na pasta correta
- **npm start** executa o script do `package.json`
- **Sem `nvm`** - não precisa, o Nixpacks já instala Node.js 20

---

## ✅ Após Configurar

1. **Salve as alterações**
2. O Railway fará deploy automaticamente
3. Verifique os logs:
   - Não deve aparecer erro sobre `nvm`
   - Deve aparecer: `✅ Database connected successfully`

---

## 🐛 Se Ainda Der Erro

### Verificar Variáveis de Ambiente

Certifique-se de que estas variáveis estão configuradas:
- `DATABASE_URL` (obrigatória)
- `JWT_SECRET` (obrigatória)
- `NODE_ENV=production`
- `PORT=3001` (opcional)
- `CORS_ORIGIN` (URL do frontend)

### Verificar Logs

1. Vá em **Deployments** → **View Logs**
2. Procure por erros
3. Verifique se o build está funcionando

---

## 📚 Resumo

1. **Build:** Deixe tudo padrão (Railpack)
2. **Deploy:** Custom Start Command = `npm start` (ou vazio)
3. **Source:** Root Directory = `server`
4. **Variáveis:** Configure `DATABASE_URL`, `JWT_SECRET`, etc.

Pronto! 🎉

