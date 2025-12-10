# 🔧 Solução Final - Erro "nvm: command not found" no Railway

## ❌ Erro

```
/bin/bash: line 1: nvm: command not found
```

## ✅ Solução Aplicada

### 1. Removido `.nvmrc`

O Railway estava tentando usar `nvm` porque detectava o arquivo `.nvmrc`. Removido:
- `server/.nvmrc`
- `.nvmrc` (raiz)

### 2. Ajustado `nixpacks.toml`

Adicionado variável `NODE_VERSION` para garantir que Node.js 20 seja usado:

```toml
[phases.setup]
nixPkgs = ["nodejs_20", "npm"]

[phases.install]
cmds = ["npm ci"]

[phases.build]
cmds = ["npm run build"]

[start]
cmd = "npm start"

[variables]
NODE_VERSION = "20"
```

### 3. Ajustado `railway.json`

Caminho do `nixpacks.toml` ajustado para relativo (já que o Root Directory é `server`):

```json
{
  "build": {
    "builder": "NIXPACKS",
    "nixpacksConfigPath": "./nixpacks.toml"
  }
}
```

---

## 📋 Verificar Configuração no Railway

### 1. Root Directory

No Railway Dashboard:
1. Vá no serviço do **Backend**
2. Vá em **Settings** → **Build & Deploy**
3. Verifique se **Root Directory** está como: `server`
4. Se não estiver, configure como `server`

### 2. Build Command

Deixe **Build Command** vazio (o `nixpacks.toml` cuida disso).

### 3. Start Command

Configure como: `npm start`

---

## 🔍 Por Que Isso Resolve

- **Sem `.nvmrc`**: Railway não tenta usar `nvm`
- **`nixpacks.toml`**: Especifica Node.js 20 diretamente via Nix
- **Caminho relativo**: Funciona corretamente quando Root Directory é `server`

---

## ✅ Após Corrigir

1. **Faça commit e push:**
   ```bash
   git add -A
   git commit -m "fix: remove .nvmrc and use nixpacks.toml only"
   git push
   ```

2. **O Railway fará deploy automático** e o erro deve desaparecer!

3. **Verifique os logs:**
   - Não deve aparecer erro sobre `nvm`
   - Deve aparecer: `✅ Database connected successfully`

---

## 🐛 Se Ainda Der Erro

### Opção 1: Usar Dockerfile

Se o Nixpacks ainda der problema, use o Dockerfile:

1. No Railway:
   - **Settings** → **Build & Deploy**
   - Mude **Builder** para **Dockerfile**
   - O Dockerfile já está configurado em `server/Dockerfile`

### Opção 2: Verificar Root Directory

Certifique-se de que o Root Directory está como `server` no Railway.

### Opção 3: Limpar Cache

1. No Railway:
   - **Settings** → **Build & Deploy**
   - Clique em **"Clear Build Cache"**

---

## 📚 Referências

- [Railway Build Configuration](https://docs.railway.app/develop/builds)
- [Nixpacks Documentation](https://nixpacks.com/docs)

