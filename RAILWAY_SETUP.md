# 🚂 Configuração do Railway - Helpdesk

## ⚠️ Erro: Database configuration is required

Se você está vendo este erro, significa que as variáveis de ambiente não foram configuradas no Railway.

## 📋 Passo a Passo para Configurar

### 1. Acesse o Railway Dashboard

1. Vá para [railway.app](https://railway.app)
2. Faça login
3. Selecione seu projeto

### 2. Configure as Variáveis de Ambiente

1. Clique no serviço do **Backend** (helpdesk-backend)
2. Vá na aba **"Variables"** (Variáveis)
3. Clique em **"+ New Variable"** (Nova Variável)

### 3. Adicione as Variáveis Obrigatórias

Adicione estas variáveis **uma por uma**:

#### ✅ DATABASE_URL (OBRIGATÓRIA)
```
Nome: DATABASE_URL
Valor: postgresql://postgres:[SUA_SENHA]@db.[PROJETO].supabase.co:5432/postgres
```

**Como obter:**
1. Acesse seu projeto no Supabase
2. Vá em **Settings** → **Database**
3. Copie a **Connection String** (URI)
4. Substitua `[YOUR-PASSWORD]` pela senha do seu banco
5. Cole no Railway

**Exemplo:**
```
postgresql://postgres:Eloah@210818@db.dqyfctgvjcyyqrqotskw.supabase.co:5432/postgres
```

#### ✅ JWT_SECRET (OBRIGATÓRIA)
```
Nome: JWT_SECRET
Valor: [GERE_UMA_CHAVE_SECRETA_FORTE]
```

**Como gerar:**
Execute no terminal:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Ou use um gerador online: https://randomkeygen.com/

**Exemplo:**
```
a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
```

#### ✅ NODE_ENV
```
Nome: NODE_ENV
Valor: production
```

#### ✅ PORT (Opcional - Railway define automaticamente)
```
Nome: PORT
Valor: 3001
```

#### ✅ CORS_ORIGIN (Configure depois do frontend)
```
Nome: CORS_ORIGIN
Valor: https://seu-frontend.railway.app
```

**Importante:** Configure esta variável **depois** de fazer o deploy do frontend e obter a URL.

---

## 🔍 Verificar se Está Configurado

Após adicionar as variáveis:

1. **Verifique** se todas as variáveis aparecem na lista
2. **Reinicie** o serviço (Railway reinicia automaticamente)
3. **Veja os logs** para confirmar que conectou ao banco

---

## 🐛 Troubleshooting

### Erro persiste após configurar

1. **Verifique se a variável está escrita corretamente:**
   - `DATABASE_URL` (não `DATABASE_URI` ou `DB_URL`)
   - Sem espaços extras
   - Valor completo copiado do Supabase

2. **Verifique a senha no DATABASE_URL:**
   - A senha pode ter caracteres especiais que precisam ser codificados
   - Se a senha tem `@`, `#`, `$`, etc., pode precisar usar URL encoding
   - Exemplo: `@` vira `%40`

3. **Teste a conexão:**
   - Copie o `DATABASE_URL` completo
   - Teste em um cliente PostgreSQL (pgAdmin, DBeaver, etc.)
   - Se não conectar, o problema está na URL

4. **Verifique os logs:**
   - Clique em **"Deployments"** → **"View Logs"**
   - Procure por mensagens de erro específicas

---

## 📝 Checklist Rápido

- [ ] `DATABASE_URL` configurada com URL completa do Supabase
- [ ] `JWT_SECRET` configurada com chave forte
- [ ] `NODE_ENV` configurada como `production`
- [ ] Serviço reiniciado após adicionar variáveis
- [ ] Logs mostram conexão bem-sucedida

---

## 💡 Dica

**Nunca commite** o arquivo `.env` no Git! As variáveis devem ser configuradas apenas no Railway.

---

## 🆘 Ainda com Problemas?

1. Verifique se o Supabase está acessível
2. Verifique se a senha do banco está correta
3. Verifique se o firewall do Supabase permite conexões externas
4. Veja os logs completos no Railway para mais detalhes

