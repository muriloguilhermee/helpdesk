# 🔧 Corrigir Erro Dockerfile no Railway

## ❌ Erro

```
[5/6] COPY server/ failed to calculate checksum of ref: "/server": not found
```

## ✅ Solução

O problema é que o Railway está usando o Dockerfile, mas o contexto de build está na raiz do projeto, não na pasta `server`.

### Opção 1: Usar Nixpacks (Recomendado) ⭐

O Railway deve usar Nixpacks, não Dockerfile. Verifique:

1. **No Railway Dashboard:**
   - Vá em **Settings** → **Build**
   - **Builder** deve ser: **Railpack** (Nixpacks)
   - **Custom Build Command** deve estar **VAZIO**

2. **Se estiver usando Dockerfile:**
   - Mude para **Railpack** (Nixpacks)
   - O `nixpacks.toml` já está configurado

### Opção 2: Corrigir Dockerfile (Se Precisar Usar)

Se realmente precisar usar Dockerfile, o caminho foi corrigido:

```dockerfile
# Agora copia da raiz (contexto do build)
COPY package*.json ./
COPY . .
```

Mas **Nixpacks é mais fácil e recomendado!**

---

## 📋 Verificar Configuração no Railway

### 1. Root Directory

1. Vá em **Settings** → **Source**
2. **Root Directory** deve ser: `server` ✅

### 2. Build

1. Vá em **Settings** → **Build**
2. **Builder** deve ser: **Railpack** (Nixpacks) ✅
3. **Custom Build Command** deve estar **VAZIO** ✅

### 3. Deploy

1. Vá em **Settings** → **Deploy**
2. **Custom Start Command** deve ser: `npm start` (ou vazio) ✅

---

## ✅ Após Corrigir

1. **Faça commit e push:**
   ```bash
   git add server/Dockerfile server/railway.json
   git commit -m "fix: correct Dockerfile paths for Railway build context"
   git push
   ```

2. **No Railway:**
   - Verifique se está usando **Railpack** (Nixpacks)
   - Se não estiver, mude para Railpack
   - O deploy deve funcionar

---

## 🔍 Por Que Isso Acontece

- Railway detecta o Dockerfile e tenta usá-lo
- Mas o contexto de build está na raiz, não em `server`
- Nixpacks é mais inteligente e detecta automaticamente

---

## 💡 Recomendação

**Use Nixpacks (Railpack) em vez de Dockerfile!**

- Mais fácil de configurar
- Detecta automaticamente Node.js
- Usa o `nixpacks.toml` que já está configurado
- Menos problemas com caminhos

