# 🔧 Corrigir Timeout de Conexão no Railway

## ❌ Erro

```
KnexTimeoutError: Knex: Timeout acquiring a connection. The pool is probably full.
```

## ⚠️ SOLUÇÃO PRINCIPAL: Usar Connection Pooler do Supabase

**O problema mais comum é usar a conexão direta (porta 5432) em vez do Connection Pooler (porta 6543).**

👉 **Veja `USAR_SUPABASE_POOLER.md` para instruções detalhadas!**

### Resumo Rápido:
1. No Supabase Dashboard: **Settings** → **Database** → **Connection Pooling**
2. Copie a connection string do **Pooler** (porta **6543**)
3. No Railway: Atualize `DATABASE_URL` com a connection string do Pooler
4. Pronto! 🎉

---

## ✅ Correções Aplicadas no Código

### 1. Aumento de Timeouts
- `acquireTimeoutMillis`: 120s → **180s (3 minutos)**
- `createTimeoutMillis`: 60s → **90s (1.5 minutos)**
- `acquireConnectionTimeout`: 120s → **180s (3 minutos)**

### 2. Melhorias no Pool
- Pool mínimo: `0` para Supabase (evita conexões desnecessárias)
- Pool máximo: `1` para Supabase (limita conexões simultâneas)
- `createRetryIntervalMillis`: 500ms → **2000ms (2 segundos)**
- Adicionado `destroyTimeoutMillis`: **5000ms**

### 3. Retry Logic Melhorada
- Tentativas aumentadas: 3 → **5 tentativas**
- Backoff exponencial: 5s, 10s, 15s, 20s (máximo)
- Limpeza de conexões órfãs entre tentativas
- Logs mais detalhados para debug

### 4. SSL para Supabase
- Garantido que Supabase sempre usa SSL
- Parse correto da connection string
- Timeout de conexão TCP: **30s**

---

## 🔍 Verificar se Está Funcionando

### 1. Verificar Variáveis no Railway

No Railway (Backend), vá em **Variables** e verifique:

```
DATABASE_URL=postgresql://user:password@host:port/database
```

**⚠️ IMPORTANTE:**
- Se for Supabase, a URL deve conter `supabase` ou `supabase.co`
- A URL deve estar completa e correta

### 2. Verificar Logs

Após o deploy, os logs devem mostrar:

```
🔗 Configurando conexão Supabase: [hostname]
🔄 Tentando conectar ao banco de dados... (tentativa 1)
✅ Database connected successfully
✅ Database migrations completed
🚀 Server running on port 3001
```

### 3. Se Ainda Der Timeout

#### Opção A: Verificar Limites do Supabase

O Supabase tem limites de conexões simultâneas:
- **Free tier**: ~60 conexões
- **Pro tier**: ~200 conexões

Se você tem múltiplas instâncias do backend rodando, pode estar excedendo o limite.

**Solução:**
1. Verifique quantas instâncias estão rodando no Railway
2. Reduza o número de instâncias se necessário
3. Ou atualize o plano do Supabase

#### Opção B: Verificar Connection String

1. No Supabase Dashboard:
   - Vá em **Settings** → **Database**
   - Copie a **Connection String** (URI mode)
   - Deve começar com: `postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres`

2. No Railway:
   - Vá em **Variables**
   - Atualize `DATABASE_URL` com a connection string completa
   - **IMPORTANTE:** Use a connection string do **Pooler** (porta 6543), não a direta (porta 5432)

#### Opção C: Usar Connection Pooler do Supabase

O Supabase oferece um **Connection Pooler** que gerencia melhor as conexões:

1. No Supabase Dashboard:
   - Vá em **Settings** → **Database**
   - Use a **Connection String** do **Pooler** (porta **6543**)
   - Não use a connection string direta (porta 5432)

2. A connection string do pooler deve ser algo como:
   ```
   postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true
   ```

#### Opção D: Aumentar Timeouts Ainda Mais 

Se o problema persistir, você pode aumentar os timeouts no código:

Edite `server/src/database/connection.ts`:

```typescript
const poolConfig = {
  min: isSupabase ? 0 : 2,
  max: isSupabase ? 1 : 10,
  acquireTimeoutMillis: 300000, // 5 minutos
  createTimeoutMillis: 180000, // 3 minutos
  // ... resto
};
```

---

## 📋 Checklist

- [ ] `DATABASE_URL` configurada no Railway
- [ ] Connection string do Supabase está correta
- [ ] Usando connection string do **Pooler** (porta 6543) se disponível
- [ ] Logs mostram tentativas de conexão
- [ ] Conexão bem-sucedida após algumas tentativas
- [ ] Migrations executadas com sucesso
- [ ] Servidor iniciado sem erros

---

## 🐛 Troubleshooting Avançado

### Erro: "Connection ended unexpectedly"

**Causa:** Supabase está fechando conexões inativas muito rapidamente.

**Solução:**
1. Verifique se está usando o **Connection Pooler** (porta 6543)
2. Reduza `idleTimeoutMillis` para `10000` (10 segundos)
3. Aumente `reapIntervalMillis` para `5000` (5 segundos)

### Erro: "Too many connections"

**Causa:** Múltiplas instâncias do backend criando muitas conexões.

**Solução:**
1. No Railway, verifique quantas instâncias estão rodando
2. Configure para usar apenas **1 instância** no início
3. Ou atualize o plano do Supabase

### Erro: "SSL required"

**Causa:** Connection string não está configurando SSL corretamente.

**Solução:**
1. Verifique se a connection string contém `supabase`
2. O código detecta automaticamente e adiciona SSL
3. Se não funcionar, use connection string com parâmetros SSL:
   ```
   postgresql://...?sslmode=require
   ```

---

## ✅ Após Corrigir

1. Faça commit e push das alterações
2. O Railway fará deploy automático
3. Monitore os logs para ver se a conexão é bem-sucedida
4. Se ainda houver problemas, verifique os logs detalhados

---

## 📚 Recursos

- [Supabase Connection Pooling](https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooler)
- [Knex Connection Pool](https://knexjs.org/guide/#pool)
- [Railway Logs](https://docs.railway.app/develop/logs)

