# 🔧 Corrigir Erro "nvm: command not found" no Railway

## ❌ Erro

```
/bin/bash: line 1: nvm: command not found
```

## ✅ Solução Aplicada

### 1. Criado `nixpacks.toml`

Criado arquivo `server/nixpacks.toml` para configurar Node.js diretamente sem usar `nvm`:

```toml
[phases.setup]
nixPkgs = ["nodejs_20", "npm"]

[phases.install]
cmds = ["npm ci"]

[phases.build]
cmds = ["npm run build"]

[start]
cmd = "npm start"
```

### 2. Atualizado `railway.json`

Atualizado para usar o `nixpacks.toml`:

```json
{
  "build": {
    "builder": "NIXPACKS",
    "nixpacksConfigPath": "server/nixpacks.toml"
  }
}
```

---

## 📋 Próximos Passos

1. **Faça commit e push:**
   ```bash
   git add server/nixpacks.toml server/railway.json
   git commit -m "fix: configure Node.js via nixpacks.toml instead of nvm"
   git push
   ```

2. **O Railway fará deploy automático** e o erro deve desaparecer!

---

## 🔍 Como Funciona

- **Nixpacks** detecta automaticamente Node.js através do `nixpacks.toml`
- Não precisa de `nvm` - usa pacotes Nix diretamente
- Mais confiável e rápido

---

## ✅ Após Corrigir

O Railway deve:
1. Detectar Node.js 20 automaticamente
2. Instalar dependências com `npm ci`
3. Compilar TypeScript com `npm run build`
4. Iniciar o servidor com `npm start`

---

## 🐛 Se Ainda Der Erro

### Verificar Configuração no Railway

1. No Railway Dashboard:
   - Vá no serviço do **Backend**
   - Vá em **Settings** → **Build & Deploy**
   - Verifique se **Root Directory** está como: `server`
   - Verifique se **Build Command** está vazio (usa nixpacks.toml)
   - Verifique se **Start Command** está como: `npm start`

### Verificar Variáveis de Ambiente

Certifique-se de que estas variáveis estão configuradas:
- `DATABASE_URL` (obrigatória)
- `JWT_SECRET` (obrigatória)
- `NODE_ENV=production`
- `PORT=3001` (opcional)
- `CORS_ORIGIN` (URL do frontend)

---

## 📚 Referências

- [Nixpacks Documentation](https://nixpacks.com/docs)
- [Railway Build Configuration](https://docs.railway.app/develop/builds)

