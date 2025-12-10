# 🔧 Solução: Erro "SASL: SCRAM-SERVER-FINAL-MESSAGE: server signature is missing"

## 🔍 O que significa este erro?

Este erro indica um problema na autenticação SCRAM com o PostgreSQL. Geralmente acontece quando:
- A senha está incorreta
- A senha tem caracteres especiais que precisam ser codificados
- A connection string está mal formatada

## ✅ Solução Passo a Passo

### Passo 1: Resetar a senha do banco

**IMPORTANTE**: Este é o passo mais importante e resolve 90% dos casos!

1. Acesse: https://app.supabase.com
2. Selecione seu projeto
3. Vá em: **Settings** → **Database**
4. Role até: **Database password**
5. Clique em: **Reset database password**
6. **COPIE A NOVA SENHA** (você só verá ela uma vez!)

### Passo 2: Atualizar o arquivo .env

1. Abra o arquivo `server/.env`
2. Encontre a linha `DATABASE_URL`
3. **Substitua a senha** pela nova senha que você copiou

**Formato correto:**
```env
DATABASE_URL=postgresql://postgres.xxxxx:NOVA_SENHA_AQUI@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

**IMPORTANTE**:
- ❌ NÃO use `[SENHA]` ou qualquer placeholder
- ❌ NÃO use aspas na connection string
- ❌ NÃO deixe espaços antes ou depois do `=`
- ✅ Use a senha REAL que você copiou

### Passo 3: Se a senha tiver caracteres especiais

Se a senha tiver caracteres como `@`, `#`, `$`, `&`, `+`, `=`, ou espaços, você precisa codificá-los:

**Caracteres que precisam ser codificados:**
- `@` → `%40`
- `#` → `%23`
- `$` → `%24`
- `&` → `%26`
- `+` → `%2B`
- `=` → `%3D`
- Espaço → `%20` ou `+`

**Exemplo:**
```
Senha original: Minha@Senha#123
Senha codificada: Minha%40Senha%23123
```

**Ou use o script:**
```bash
node scripts/encode-password.js
```

### Passo 4: Testar a conexão

```bash
npm run test-connection
```

Se ainda der erro, vá para o Passo 5.

### Passo 5: Tentar conexão direta (sem pooler)

Às vezes o Connection Pooler tem problemas. Tente a conexão direta:

1. No Supabase Dashboard → Settings → Database
2. Em **Connection string**, selecione **URI** (não "Session mode")
3. Copie a connection string (terá porta 5432, não 6543)
4. Cole no `.env` como `DATABASE_URL`
5. **Substitua `[SENHA]` pela senha real**
6. Teste novamente: `npm run test-connection`

**Formato da conexão direta:**
```env
DATABASE_URL=postgresql://postgres:[SENHA]@db.xxxxx.supabase.co:5432/postgres
```

### Passo 6: Verificar formato da connection string

A connection string deve estar em **uma única linha**, sem quebras:

**✅ CORRETO:**
```env
DATABASE_URL=postgresql://postgres.xxxxx:senha@host:6543/postgres
```

**❌ ERRADO (com quebra de linha):**
```env
DATABASE_URL=postgresql://postgres.xxxxx:senha@
host:6543/postgres
```

**❌ ERRADO (com aspas):**
```env
DATABASE_URL="postgresql://postgres.xxxxx:senha@host:6543/postgres"
```

**❌ ERRADO (com espaços):**
```env
DATABASE_URL = postgresql://postgres.xxxxx:senha@host:6543/postgres
```

## 🔍 Verificar se está correto

Execute:
```bash
npm run verify-env
```

Isso vai mostrar se há problemas no `.env` sem expor a senha.

## 📋 Checklist

- [ ] Senha foi resetada no Supabase
- [ ] Nova senha foi copiada
- [ ] Senha foi substituída no `.env` (sem `[SENHA]`)
- [ ] Caracteres especiais foram codificados (se houver)
- [ ] Connection string está em uma única linha
- [ ] Não há aspas na connection string
- [ ] Não há espaços antes/depois do `=`
- [ ] `npm run test-connection` passa com sucesso

## 🆘 Ainda não funciona?

1. Tente criar um **novo projeto** no Supabase
2. Use a connection string do novo projeto
3. Isso elimina qualquer problema de configuração do projeto atual

## 💡 Dica Final

**90% dos problemas são resolvidos resetando a senha e usando a nova senha corretamente no `.env`.**

O erro "server signature is missing" quase sempre significa que a senha está incorreta ou mal formatada.

