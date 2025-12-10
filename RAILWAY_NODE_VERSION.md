# 🔧 Configurar Node 20 no Railway

## ⚠️ Erro: Node 18 não suporta Supabase

O Railway está usando Node 18, mas o Supabase requer Node 20+.

## ✅ Solução: Configurar Node 20

### Opção 1: Usar arquivos de configuração (Já criados) ⭐

Já criei os arquivos necessários:
- ✅ `.nvmrc` - Especifica Node 20
- ✅ `server/.nvmrc` - Especifica Node 20 para o servidor
- ✅ `nixpacks.toml` - Configuração do Nixpacks com Node 20
- ✅ `package.json` - Adicionado `engines` com Node 20

**O Railway deve detectar automaticamente!**

### Opção 2: Configurar manualmente no Railway

1. Acesse o Railway Dashboard
2. Clique no serviço do **Backend**
3. Vá em **"Settings"** → **"Build & Deploy"**
4. Em **"Build Command"**, adicione no início:
   ```bash
   nvm use 20 && cd server && npm install && npm run build
   ```
5. Ou configure a variável de ambiente:
   ```
   NODE_VERSION=20
   ```

### Opção 3: Usar Dockerfile (Mais Controle)

O `server/Dockerfile` já está configurado com Node 20:
```dockerfile
FROM node:20-alpine
```

Se o Railway não detectar automaticamente, você pode:
1. No Railway, vá em **"Settings"** → **"Build & Deploy"**
2. Selecione **"Dockerfile"** como método de build
3. Configure o **Dockerfile Path**: `server/Dockerfile`

---

## 📋 Verificar se Funcionou

Após o deploy, verifique os logs:
- Deve aparecer: `node v20.x.x`
- Não deve aparecer: `node v18.x.x`

---

## 🐛 Se Ainda Não Funcionar

1. **Force o rebuild:**
   - No Railway, vá em **"Deployments"**
   - Clique nos três pontos `...` do deployment mais recente
   - Selecione **"Redeploy"**

2. **Limpe o cache:**
   - No Railway, vá em **"Settings"** → **"Build & Deploy"**
   - Role até **"Clear Build Cache"**
   - Clique em **"Clear"**

3. **Verifique os arquivos:**
   - Certifique-se de que `.nvmrc` está na raiz
   - Certifique-se de que `nixpacks.toml` está na raiz
   - Certifique-se de que `package.json` tem `engines`

---

## 💡 Dica

O Railway usa Nixpacks por padrão, que deve detectar:
- `.nvmrc` → Usa a versão especificada
- `nixpacks.toml` → Usa a configuração customizada
- `package.json` → Usa a versão em `engines`

Todos esses arquivos já foram criados! 🎉

