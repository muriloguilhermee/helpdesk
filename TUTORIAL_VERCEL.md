# 🚀 Tutorial Completo - Deploy Frontend no Vercel

## 📋 Pré-requisitos

- ✅ Conta no Vercel (gratuita)
- ✅ Código no GitHub
- ✅ Backend já deployado no Railway (ou outra plataforma)
- ✅ URL do backend anotada

---

## 🎯 Passo a Passo Completo

### Passo 1: Criar Conta no Vercel

1. Acesse: **https://vercel.com**
2. Clique em **"Sign Up"** (Cadastrar)
3. Escolha **"Continue with GitHub"**
4. Autorize o Vercel a acessar seus repositórios

---

### Passo 2: Importar Projeto

1. No dashboard do Vercel, clique em **"Add New..."** → **"Project"**
2. Você verá uma lista dos seus repositórios do GitHub
3. **Selecione o repositório** `helpdesk` (ou o nome do seu projeto)
4. Clique em **"Import"**

---

### Passo 3: Configurar o Projeto

O Vercel detectará automaticamente que é um projeto Vite. Configure:

#### Framework Preset
- **Framework Preset**: `Vite` (deve estar selecionado automaticamente)

#### Build Settings
- **Root Directory**: `/` (deixe vazio ou `/`)
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install` (deixe padrão)

#### Environment Variables (Variáveis de Ambiente)
Clique em **"Environment Variables"** e adicione:

```
Key: VITE_API_URL
Value: https://sua-url-backend.railway.app
```

**⚠️ IMPORTANTE:**
- Substitua `https://sua-url-backend.railway.app` pela URL real do seu backend
- **DEVE começar com `https://`** (não `//` ou `http://`)
- Para encontrar a URL do backend, veja `COMO_ENCONTRAR_URL_RAILWAY.md`
- **Exemplo correto:** `https://helpdesk-production-f7dc.up.railway.app`
- **Exemplo incorreto:** `//helpdesk-production-f7dc.up.railway.app` ❌

---

### Passo 4: Deploy

1. Clique em **"Deploy"**
2. Aguarde o build (geralmente 1-2 minutos)
3. Você verá o progresso em tempo real

---

### Passo 5: Verificar Deploy

Após o deploy:

1. Você verá uma mensagem: **"Congratulations! Your project has been deployed."**
2. Clique na **URL gerada** (ex: `https://helpdesk.vercel.app`)
3. Teste se o site carrega
4. Teste se consegue fazer login

---

## 🔧 Configurações Avançadas (Opcional)

### Domínio Personalizado

1. No projeto no Vercel, vá em **"Settings"** → **"Domains"**
2. Adicione seu domínio (ex: `helpdesk.seudominio.com`)
3. Siga as instruções para configurar DNS

### Variáveis de Ambiente Adicionais

Se precisar de mais variáveis:

1. Vá em **"Settings"** → **"Environment Variables"**
2. Adicione novas variáveis:
   - `VITE_SUPABASE_URL` (se usar)
   - `VITE_SUPABASE_ANON_KEY` (se usar)

### Deploy Automático

Por padrão, o Vercel faz deploy automático quando você faz push no GitHub:
- ✅ Push na branch `main` → Deploy em produção
- ✅ Push em outras branches → Deploy de preview

---

## 🔍 Verificar se Está Funcionando

### 1. Teste Básico
- ✅ Site carrega sem erros
- ✅ Console do navegador sem erros (F12)
- ✅ Página de login aparece

### 2. Teste de Conexão com Backend
- ✅ Tente fazer login
- ✅ Verifique se as requisições estão indo para o backend correto
- ✅ Abra o DevTools (F12) → Network → Veja as requisições

### 3. Se Não Conectar
- ✅ Verifique se `VITE_API_URL` está correto
- ✅ Verifique se o backend está rodando
- ✅ Verifique CORS no backend (deve incluir a URL do Vercel)

---

## 🐛 Troubleshooting

### Erro: "Failed to build"

**Causa:** Erros de TypeScript ou build

**Solução:**
1. Teste localmente: `npm run build`
2. Corrija os erros
3. Faça commit e push
4. O Vercel fará novo deploy automaticamente

### Erro: "API not found" ou "Network Error"

**Causa:** `VITE_API_URL` incorreto ou backend não está rodando

**Solução:**
1. Verifique se `VITE_API_URL` está correto no Vercel
2. Verifique se o backend está rodando (teste `/health`)
3. Verifique CORS no backend

### Erro: "CORS policy"

**Causa:** Backend não permite requisições do Vercel

**Solução:**
1. No Railway (backend), adicione/atualize variável:
   ```
   CORS_ORIGIN=https://seu-projeto.vercel.app
   ```
2. Reinicie o backend

### Site em Branco

**Causa:** Erro no JavaScript ou build falhou

**Solução:**
1. Abra o console do navegador (F12)
2. Veja os erros
3. Verifique os logs do deploy no Vercel
4. Corrija e faça novo deploy

---

## 📝 Checklist de Deploy

- [ ] Conta criada no Vercel
- [ ] Projeto importado do GitHub
- [ ] Framework detectado como Vite
- [ ] Build Command: `npm run build`
- [ ] Output Directory: `dist`
- [ ] Variável `VITE_API_URL` configurada
- [ ] Deploy executado com sucesso
- [ ] Site acessível pela URL do Vercel
- [ ] Login funciona
- [ ] Backend conecta corretamente

---

## 🔄 Atualizar CORS no Backend

Após fazer deploy no Vercel:

1. **Anote a URL do Vercel** (ex: `https://helpdesk.vercel.app`)

2. **No Railway (Backend):**
   - Vá em **Variables**
   - Atualize `CORS_ORIGIN`:
     ```
     CORS_ORIGIN=https://helpdesk.vercel.app
     ```
   - Ou adicione múltiplas URLs:
     ```
     CORS_ORIGIN=https://helpdesk.vercel.app,http://localhost:5173
     ```

3. **Reinicie o backend** (Railway reinicia automaticamente)

---

## 💡 Dicas

### Deploy Automático
- ✅ Toda vez que você faz `git push`, o Vercel faz deploy automaticamente
- ✅ Muito útil para desenvolvimento contínuo

### Preview Deployments
- ✅ Cada Pull Request gera uma URL de preview
- ✅ Teste antes de fazer merge

### Logs
- ✅ Vercel mostra logs do build e runtime
- ✅ Útil para debugar problemas

### Performance
- ✅ Vercel otimiza automaticamente
- ✅ CDN global (sites rápidos em qualquer lugar)
- ✅ Cache inteligente

---

## 🎉 Pronto!

Seu frontend está no ar! 🚀

**URL do Frontend:** `https://seu-projeto.vercel.app`

**Próximos Passos:**
1. Teste todas as funcionalidades
2. Configure domínio personalizado (opcional)
3. Compartilhe com sua equipe!

---

## 📚 Recursos

- [Documentação Vercel](https://vercel.com/docs)
- [Vite + Vercel](https://vercel.com/guides/deploying-vite-with-vercel)
- [Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)

