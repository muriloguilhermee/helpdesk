# 🔧 Correções para Railway - Node 20 e package-lock.json

## ✅ Problemas Corrigidos

### 1. Node 18 → Node 20
- ✅ Criado `.nvmrc` com Node 20
- ✅ Criado `server/.nvmrc` com Node 20
- ✅ Criado `nixpacks.toml` com Node 20
- ✅ Criado `server/nixpacks.toml` com Node 20
- ✅ Adicionado `engines` em `package.json` e `server/package.json`

### 2. package-lock.json Desatualizado
- ✅ Executado `npm install` na raiz (atualizou `package-lock.json`)
- ✅ Executado `npm install` no servidor (atualizou `server/package-lock.json`)

## 📋 Próximos Passos

### 1. Commit e Push

```bash
git add .
git commit -m "Fix: Node 20 configuration and update package-lock.json"
git push
```

### 2. No Railway

O Railway deve:
- ✅ Detectar `.nvmrc` e usar Node 20
- ✅ Usar `nixpacks.toml` se disponível
- ✅ Encontrar todas as dependências no `package-lock.json`

### 3. Se Ainda Não Funcionar

**Opção A: Forçar Node 20 no Railway**

1. No Railway, vá em **Settings** → **Build & Deploy**
2. Em **Build Command**, altere para:
   ```bash
   nvm use 20 && cd server && npm install && npm run build
   ```

**Opção B: Usar Dockerfile**

1. No Railway, vá em **Settings** → **Build & Deploy**
2. Selecione **"Dockerfile"** como método
3. Configure **Dockerfile Path**: `server/Dockerfile`

O Dockerfile já está configurado com Node 20! ✅

---

## 🔍 Verificar

Após o deploy, nos logs deve aparecer:
- ✅ `node v20.x.x` (não `v18.x.x`)
- ✅ `npm ci` ou `npm install` executado com sucesso
- ✅ `npm run build` executado com sucesso

---

## 📝 Arquivos Criados/Modificados

- ✅ `.nvmrc` - Node 20
- ✅ `server/.nvmrc` - Node 20
- ✅ `nixpacks.toml` - Configuração Nixpacks
- ✅ `server/nixpacks.toml` - Configuração Nixpacks para servidor
- ✅ `package.json` - Adicionado `engines`
- ✅ `server/package.json` - Adicionado `engines`
- ✅ `package-lock.json` - Atualizado
- ✅ `server/package-lock.json` - Atualizado

---

## 💡 Dica

Se o Railway ainda usar Node 18, você pode:
1. **Deletar o serviço e recriar** (Railway detectará os novos arquivos)
2. **Ou** configurar manualmente no Railway Settings

