# 🔧 Corrigir Erro no Vercel

## ❌ Erro Atual

```
Environment Variable "VITE_API_URL" references Secret "vite_api_url", which does not exist.
```

**O problema está no arquivo `vercel.json` do seu projeto!**

## ✅ Solução

### Problema: `vercel.json` referenciando Secret

O arquivo `vercel.json` na raiz do projeto tem esta linha:
```json
"env": {
  "VITE_API_URL": "@vite_api_url"
}
```

O `@` no início indica que é uma referência a um Secret do Vercel, não um valor literal. Isso está causando o erro.

## 🔧 Como Corrigir

### ✅ Solução: Remover a seção `env` do `vercel.json`

O arquivo `vercel.json` já foi corrigido! A seção `env` que referenciava o Secret foi removida.

**O que foi feito:**
- ❌ Removido: `"env": { "VITE_API_URL": "@vite_api_url" }`
- ✅ Agora o Vercel usa as variáveis configuradas na interface do projeto

### Próximos Passos:

1. **Faça commit e push das alterações:**
   ```bash
   git add vercel.json
   git commit -m "fix: remove secret reference from vercel.json"
   git push
   ```

2. **O Vercel fará deploy automático** e o erro deve desaparecer!

3. **Verifique se a variável está configurada na interface:**
   - Vá em **Settings** → **Environment Variables**
   - Certifique-se de que `VITE_API_URL` está configurada com o valor:
     ```
     https://helpdesk-production-f7dc.up.railway.app
     ```

---

## 🔧 Soluções Alternativas (se ainda houver problemas)

### Solução 1: Deletar e Recriar a Variável

1. No Vercel, vá em **"Settings"** → **"Environment Variables"**
2. Encontre `VITE_API_URL`
3. Clique nos **três pontos** `...` → **"Delete"**
4. Confirme a exclusão
5. Clique em **"+ Add More"** (ou **"Add New"**)
6. Adicione novamente:
   - **Key**: `VITE_API_URL`
   - **Value**: `https://helpdesk-production-f7dc.up.railway.app`
   - **⚠️ IMPORTANTE:** Digite o valor diretamente, não copie/cole de outro lugar
7. Clique em **"Save"**

### Solução 2: Verificar Secrets

1. Vá em **"Settings"** → **"Secrets"**
2. Procure por qualquer secret com nome similar a `vite_api_url` ou `VITE_API_URL`
3. Se encontrar, **delete-o**
4. Volte para **"Environment Variables"** e recrie a variável

### Solução 3: Limpar Cache e Recriar

1. Delete a variável `VITE_API_URL`
2. Aguarde alguns segundos
3. Adicione novamente com o valor completo:
   ```
   https://helpdesk-production-f7dc.up.railway.app
   ```
4. Certifique-se de que não há espaços extras antes ou depois
5. Salve

### Passo Final: Fazer Novo Deploy

1. Vá em **"Deployments"**
2. Clique nos **três pontos** `...` do deployment mais recente
3. Selecione **"Redeploy"**
4. Ou faça um novo commit e push (deploy automático)

---

## 📋 Formato Correto

### ✅ Correto
```
Key: VITE_API_URL
Value: https://helpdesk-production-f7dc.up.railway.app
```

### ❌ Incorreto
```
Key: VITE_API_URL
Value: //helpdesk-production-f7dc.up.railway.app  ← Sem https://
```

---

## 🔍 Verificar se Está Correto

1. **Settings** → **Environment Variables**
2. Verifique se `VITE_API_URL` tem:
   - ✅ Começa com `https://`
   - ✅ URL completa do backend
   - ✅ Sem barras extras no final

---

## 🔍 Verificar se Está Funcionando

Após recriar a variável:

1. O erro vermelho deve desaparecer
2. O valor deve aparecer mascarado como `********` (normal no Vercel)
3. Ao clicar no ícone de olho 👁️, deve mostrar a URL completa

## 🐛 Se o Erro Ainda Persistir

### Verificar Sintaxe Especial

O Vercel pode interpretar certos caracteres como referência a secrets. Certifique-se de que:

- ✅ Não há `@` no início do valor
- ✅ Não há chaves `{}` ao redor do valor
- ✅ Não há `$` no início (a menos que seja intencional)
- ✅ O valor é uma string literal simples

### Usar Interface de Edição

1. **NÃO** copie/cole o valor de outro lugar
2. **DIGITE** o valor manualmente no campo
3. Isso evita caracteres invisíveis que podem causar problemas

### Verificar em Diferentes Ambientes

1. Verifique se a variável está configurada para **"All Environments"**
2. Ou configure separadamente para Production, Preview e Development
3. Certifique-se de que o valor está correto em todos

---

## ✅ Após Corrigir

1. Faça um novo deploy
2. Teste o site
3. Deve funcionar! 🎉

