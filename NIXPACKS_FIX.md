# 🔧 Correção do Nixpacks - Node 20

## ❌ Erro
```
error: undefined variable 'nodejs-20_x'
```

## ✅ Solução

A sintaxe correta do Nixpacks para Node 20 é `nodejs_20` (com underscore, não hífen).

### Arquivos Corrigidos

1. **`server/nixpacks.toml`** - Corrigido para usar `nodejs_20`
2. **`.nvmrc`** - Mantido (Railway também detecta isso)
3. **`package.json`** - Mantido com `engines`

### Alternativa: Usar apenas .nvmrc

Se o `nixpacks.toml` ainda der problema, você pode:

1. **Deletar** `server/nixpacks.toml`
2. **Manter** apenas `.nvmrc` e `server/.nvmrc`
3. O Railway deve detectar automaticamente

### Ou: Configurar no Railway Settings

1. No Railway, vá em **Settings** → **Build & Deploy**
2. Em **Build Command**, adicione no início:
   ```bash
   nvm use 20 &&
   ```
   Ficando:
   ```bash
   nvm use 20 && cd server && npm install && npm run build
   ```

---

## 📋 Próximos Passos

1. **Commit e Push:**
   ```bash
   git add .
   git commit -m "Fix nixpacks.toml syntax for Node 20"
   git push
   ```

2. **Ou** delete `server/nixpacks.toml` e use apenas `.nvmrc`

3. **Ou** configure manualmente no Railway Settings

---

## 💡 Recomendação

**Use apenas `.nvmrc`** - É mais simples e o Railway detecta automaticamente!









