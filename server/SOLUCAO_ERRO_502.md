# 🔴 Solução: Erro 502 (Bad Gateway)

## ⚠️ PROBLEMA IDENTIFICADO

O erro **502 (Bad Gateway)** significa que:
- ❌ O servidor não está rodando, OU
- ❌ O servidor está crashando ao iniciar, OU
- ❌ O banco de dados não está conectando

**Isso é diferente de CORS!** O servidor precisa estar funcionando primeiro.

## 🔍 DIAGNÓSTICO PASSO A PASSO

### 1. Verificar Logs do Railway

1. Acesse: https://railway.app
2. Seu projeto → **Deployments**
3. Clique no último deploy → **View Logs**
4. Procure por:
   - ❌ Erros de conexão com banco
   - ❌ Erros de inicialização
   - ❌ `Failed to start server`
   - ❌ `Database connection error`

### 2. Verificar Variáveis de Ambiente

Railway Dashboard → **Variables** → Verifique:

- ✅ `DATABASE_URL` - Connection string do Supabase
- ✅ `JWT_SECRET` - Chave secreta para JWT
- ✅ `CORS_ORIGIN` - Origin permitida
- ✅ `NODE_ENV` - Deve ser `production` (ou não configurado)

### 3. Verificar se o Banco Conecta

O servidor **só inicia se o banco conectar**. Se o banco não conectar, o servidor não inicia.

**Nos logs você deve ver:**
```
✅ Database connected successfully!
✅ Database migrations completed
✅ Database initialized successfully
🚀 Server running on port 8080
```

**Se aparecer:**
```
❌ Database connection error
❌ Failed to start server
```
→ O problema é a conexão com o banco!

## 🔧 SOLUÇÕES

### Solução 1: Verificar DATABASE_URL

1. Railway Dashboard → Variables
2. Verifique `DATABASE_URL`:
   ```
   postgresql://postgres:[SENHA]@db.xxxxx.supabase.co:5432/postgres
   ```
   - ✅ Deve ter a senha real (não `[SENHA]`)
   - ✅ Deve usar porta 5432 ou 6543 (pooler)
   - ✅ Deve estar completo

### Solução 2: Testar Conexão com Banco

Execute localmente (se tiver acesso):
```bash
cd server
npm run test-connection
```

Se der erro, o problema é a connection string.

### Solução 3: Verificar Logs de Erro

Nos logs do Railway, procure por:

**Erro de autenticação:**
```
28P01: password authentication failed
```
→ Senha incorreta na `DATABASE_URL`

**Erro de conexão:**
```
ECONNREFUSED
```
→ Host/porta incorretos ou firewall bloqueando

**Erro de banco não encontrado:**
```
3D000: database does not exist
```
→ Nome do banco incorreto

**Erro de SSL:**
```
SSL connection required
```
→ Falta configuração SSL na connection string

### Solução 4: Verificar se o Servidor Está Rodando

1. Railway Dashboard → Deployments
2. Verifique o status:
   - ✅ **Running** = Servidor está rodando
   - ❌ **Failed** = Servidor falhou ao iniciar
   - ⏸️ **Stopped** = Servidor parado

### Solução 5: Forçar Novo Deploy

1. Railway Dashboard → Deployments
2. Clique em **"New Deploy"**
3. Aguarde completar
4. Verifique os logs

## 📋 CHECKLIST DE DIAGNÓSTICO

- [ ] Logs do Railway verificados
- [ ] `DATABASE_URL` configurada corretamente
- [ ] `JWT_SECRET` configurada
- [ ] `CORS_ORIGIN` configurada
- [ ] Logs mostram "Database connected successfully"
- [ ] Logs mostram "Server running on port 8080"
- [ ] Status do deploy é "Running"
- [ ] Health check funciona: `/health`

## 🚨 SE O BANCO NÃO CONECTAR

### Verificar Connection String

1. Supabase Dashboard → Settings → Database
2. Connection string → URI
3. Copie a connection string completa
4. **IMPORTANTE:** Substitua `[YOUR-PASSWORD]` pela senha real
5. Cole no Railway → Variables → `DATABASE_URL`

### Usar Connection Pooler (Recomendado)

Para Supabase, use o **Connection Pooler** (porta 6543):
```
postgresql://postgres.xxxxx:[SENHA]@aws-0-us-west-2.pooler.supabase.com:6543/postgres
```

### Testar Connection String

Execute no terminal:
```bash
cd server
npm run test-connection
```

Se funcionar, a connection string está correta.

## 💡 PRÓXIMOS PASSOS

1. **Verifique os logs do Railway** - Isso vai mostrar o erro exato
2. **Verifique `DATABASE_URL`** - Deve ter senha real
3. **Teste a conexão** - Use `npm run test-connection`
4. **Force novo deploy** - Se necessário

## 📖 DOCUMENTAÇÃO RELACIONADA

- `server/CONFIGURAR_SUPABASE.md` - Como configurar Supabase
- `server/TROUBLESHOOTING.md` - Solução de problemas gerais
- `server/SOLUCAO-ERRO-SCRAM.md` - Erro de autenticação
- `server/SOLUCAO-ERRO-XX000.md` - Erro de banco reiniciando

**O erro 502 precisa ser resolvido ANTES de resolver o CORS!**

