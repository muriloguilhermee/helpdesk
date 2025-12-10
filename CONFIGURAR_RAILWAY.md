# ⚡ Configuração Rápida - Railway

## ❌ Erro Atual
```
Database configuration is required. Please set DATABASE_URL or DB_HOST in .env file.
```

## ✅ Solução: Configurar Variáveis de Ambiente

### Passo 1: Acesse o Railway
1. Vá para https://railway.app
2. Faça login
3. Selecione seu projeto
4. Clique no serviço do **Backend**

### Passo 2: Adicione as Variáveis

Clique em **"Variables"** → **"+ New Variable"** e adicione:

#### 1. DATABASE_URL (OBRIGATÓRIA)
```
Nome: DATABASE_URL
Valor: postgresql://postgres:Eloah@210818@db.dqyfctgvjcyyqrqotskw.supabase.co:5432/postgres
```

**⚠️ IMPORTANTE:** Use a URL completa do seu Supabase. Se sua senha tem caracteres especiais, pode precisar codificar:
- `@` → `%40`
- `#` → `%23`
- `$` → `%24`

#### 2. JWT_SECRET (OBRIGATÓRIA)
```
Nome: JWT_SECRET
Valor: [GERE_UMA_CHAVE_FORTE]
```

Gere uma chave executando:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

#### 3. NODE_ENV
```
Nome: NODE_ENV
Valor: production
```

#### 4. PORT (Opcional)
```
Nome: PORT
Valor: 3001
```

### Passo 3: Reinicie o Serviço

Após adicionar as variáveis, o Railway reinicia automaticamente. Aguarde alguns segundos e verifique os logs.

---

## 🔍 Verificar se Funcionou

1. Vá em **"Deployments"** → **"View Logs"**
2. Procure por: `✅ Database connected successfully`
3. Se aparecer, está funcionando! 🎉

---

## 🐛 Ainda com Erro?

### Problema: Senha com caracteres especiais

Se sua senha do Supabase tem `@`, `#`, `$`, etc., você precisa codificar na URL:

**Exemplo:**
- Senha: `Senha@123#`
- Codificada: `Senha%40123%23`
- URL completa: `postgresql://postgres:Senha%40123%23@db.xxx.supabase.co:5432/postgres`

### Problema: URL incorreta

1. Acesse o Supabase
2. Vá em **Settings** → **Database**
3. Copie a **Connection String** (URI)
4. Substitua `[YOUR-PASSWORD]` pela senha real
5. Cole no Railway

---

## 📝 Checklist

- [ ] `DATABASE_URL` adicionada com URL completa do Supabase
- [ ] `JWT_SECRET` adicionada com chave forte
- [ ] `NODE_ENV` adicionada como `production`
- [ ] Serviço reiniciado
- [ ] Logs mostram conexão bem-sucedida

---

## 💡 Dica

**Nunca** commite o arquivo `.env` no Git! As variáveis devem estar apenas no Railway.

