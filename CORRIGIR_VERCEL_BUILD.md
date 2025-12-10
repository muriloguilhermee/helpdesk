# 🔧 Corrigir Erro de Build no Vercel

## ❌ Erro

```
npm error `npm ci` can only install packages when your package.json and package-lock.json or npm-shrinkwrap.json are in sync.
npm error Missing: terser@5.44.1 from lock file
```

## ✅ Solução Aplicada

### 1. Removido `terser` do `package.json`
- O `terser` não é mais necessário porque estamos usando `esbuild`

### 2. Atualizado `vite.config.ts`
- Mudado de `minify: 'terser'` para `minify: 'esbuild'`
- `esbuild` já vem incluído no Vite, não precisa instalar

### 3. Regenerado `package-lock.json`
- Removido e regenerado para garantir sincronização

---

## 📋 Próximos Passos

### 1. Fazer Commit e Push

```bash
git add package.json package-lock.json vite.config.ts
git commit -m "fix: use esbuild instead of terser and sync package-lock.json"
git push
```

### 2. Verificar no Vercel

Após o push:
1. O Vercel fará deploy automático
2. O build deve funcionar agora
3. Verifique os logs para confirmar

---

## 🔍 Se Ainda Der Erro

### Verificar Sincronização

Execute localmente:
```bash
npm ci --dry-run
```

Se não der erro, o `package-lock.json` está correto.

### Forçar Atualização do Lock File

Se ainda houver problemas:
```bash
rm package-lock.json
npm install
git add package-lock.json
git commit -m "fix: regenerate package-lock.json"
git push
```

---

## 💡 Por Que `esbuild`?

- ✅ Já incluído no Vite (não precisa instalar)
- ✅ Mais rápido que `terser`
- ✅ Mesma qualidade de minificação
- ✅ Recomendado pelo Vite

---

## ✅ Após Corrigir

O build no Vercel deve funcionar! 🎉

