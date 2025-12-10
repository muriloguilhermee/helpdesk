# 🔧 Usar Connection Pooler do Supabase (Solução para Timeout)

## ❌ Problema

O erro de timeout acontece porque a conexão direta do Supabase (porta 5432) não é ideal para ambientes serverless como Railway.

## ✅ Solução: Usar Connection Pooler

O Supabase oferece um **Connection Pooler** (porta 6543) que gerencia melhor as conexões e é perfeito para Railway.

---

## 📋 Passo a Passo

### 1. Obter Connection String do Pooler

1. Acesse seu projeto no **Supabase Dashboard**
2. Vá em **Settings** → **Database**
3. Role até a seção **"Connection Pooling"**
4. Copie a **Connection String** (URI mode)
   - Deve ter a porta **6543** (não 5432)
   - Formato: `postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres`

### 2. Atualizar no Railway

1. No Railway, vá no serviço do **Backend**
2. Vá em **Variables**
3. Encontre `DATABASE_URL`
4. Clique nos **três pontos** `...` → **Edit**
5. **Substitua** a connection string pela do **Pooler** (porta 6543)
6. Clique em **Save**

### 3. Verificar

Após salvar, o Railway reinicia automaticamente. Verifique os logs:
- Deve aparecer: `✅ Database connected successfully`

---

## 🔍 Diferença entre as Conexões

### ❌ Conexão Direta (Porta 5432)
```
postgresql://postgres:password@db.project.supabase.co:5432/postgres
```
- Limite de conexões simultâneas
- Pode dar timeout em ambientes serverless
- Não recomendado para Railway

### ✅ Connection Pooler (Porta 6543) - RECOMENDADO
```
postgresql://postgres.project:password@aws-0-region.pooler.supabase.com:6543/postgres?pgbouncer=true
```
- Gerencia conexões automaticamente
- Melhor para ambientes serverless
- Recomendado para Railway

---

## 📝 Exemplo Completo

### Connection String do Pooler:
```
postgresql://postgres.abcdefghijklmnop:SUA_SENHA@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true
```

### No Railway:
```
Nome: DATABASE_URL
Valor: postgresql://postgres.abcdefghijklmnop:SUA_SENHA@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true
```

**⚠️ IMPORTANTE:**
- Substitua `SUA_SENHA` pela senha real do banco
- Se a senha tem caracteres especiais, codifique:
  - `@` → `%40`
  - `#` → `%23`
  - `$` → `%24`
  - `&` → `%26`

---

## 🐛 Se Ainda Der Timeout

### Verificar se Está Usando o Pooler

Nos logs do Railway, verifique se aparece:
```
🔗 Configurando conexão Supabase: aws-0-[region].pooler.supabase.com
```

Se aparecer `db.[project].supabase.co`, você ainda está usando a conexão direta.

### Verificar Porta

A connection string deve ter `:6543` (pooler), não `:5432` (direta).

### Verificar Parâmetros

Adicione `?pgbouncer=true` no final da URL para garantir que está usando o pooler.

---

## ✅ Após Configurar

1. Railway reinicia automaticamente
2. Aguarde 30-60 segundos
3. Verifique os logs
4. Deve conectar com sucesso! 🎉

---

## 📚 Recursos

- [Supabase Connection Pooling](https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooler)
- [PgBouncer Documentation](https://www.pgbouncer.org/)

