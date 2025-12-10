# 🚀 Solução Rápida - Erro de Conexão

## ⚡ Passos Imediatos

### 1. Execute o teste de conexão melhorado

```bash
cd server
npm run test-connection
```

Agora o script mostra **muito mais informações** sobre o erro, incluindo:
- Código do erro
- Mensagem completa
- Stack trace
- Todas as propriedades do erro

### 2. Baseado no erro, siga a solução:

#### 🔴 Se aparecer "ECONNREFUSED" ou "Connection refused"

**Problema**: Conexão recusada pelo servidor

**Solução Rápida**:
1. Use **Connection Pooler** ao invés de conexão direta
2. No Supabase Dashboard:
   - Settings → Database
   - Role até "Connection pooling"
   - Selecione "Session mode"
   - Copie a connection string (terá porta 6543)
3. Cole no `.env` como `DATABASE_URL`

**Exemplo de Connection Pooler**:
```
postgresql://postgres.xxxxx:[SENHA]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

#### 🔴 Se aparecer "28P01" ou "password authentication failed"

**Problema**: Senha incorreta

**Solução Rápida**:
1. No Supabase Dashboard → Settings → Database
2. Role até "Database password"
3. Se não sabe a senha, clique em "Reset database password"
4. Copie a nova senha
5. No arquivo `.env`, substitua `[SENHA]` pela senha real
6. **IMPORTANTE**: Não deixe `[SENHA]` na connection string!

#### 🔴 Se aparecer "timeout" ou "ETIMEDOUT"

**Problema**: Timeout na conexão

**Solução Rápida**:
1. Use Connection Pooler (porta 6543)
2. Aguarde alguns minutos e tente novamente
3. Verifique sua conexão de internet

#### 🔴 Se aparecer "ENOTFOUND" ou "getaddrinfo"

**Problema**: Host não encontrado

**Solução Rápida**:
1. Verifique se o hostname está correto
2. Deve ser algo como: `db.xxxxx.supabase.co`
3. Verifique sua conexão de internet

#### 🔴 Se aparecer "Erro desconhecido"

**Solução Rápida**:
1. Copie **TODA** a saída do `npm run test-connection`
2. Verifique especialmente:
   - O "Code" do erro
   - A "Mensagem" completa
   - O "Stack trace"
3. Tente usar Connection Pooler (sempre resolve muitos problemas)

## 🎯 Solução Mais Comum

**90% dos problemas são resolvidos usando Connection Pooler:**

1. Acesse: https://app.supabase.com
2. Seu projeto → Settings → Database
3. Role até "Connection pooling"
4. Selecione "Session mode"
5. Copie a connection string (porta 6543)
6. Cole no `server/.env`:
   ```env
   DATABASE_URL=postgresql://postgres.xxxxx:[SENHA]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
   ```
7. **Substitua [SENHA] pela senha real**
8. Execute: `npm run test-connection`

## ✅ Verificar se funcionou

Após corrigir, execute:

```bash
npm run test-connection
```

Você deve ver:
```
✅ Conexão estabelecida com sucesso!
✅ Query de teste executada com sucesso
✅ Teste concluído com sucesso!
```

## 🆘 Ainda não funciona?

1. Execute `npm run verify-env` (verifica o .env)
2. Execute `npm run test-connection` (testa conexão)
3. Copie **TODA** a saída e me envie
4. Verifique os logs do Supabase Dashboard

## 📖 Documentação Completa

- `TROUBLESHOOTING.md` - Guia completo de troubleshooting
- `CONFIGURAR_SUPABASE.md` - Configuração passo a passo

