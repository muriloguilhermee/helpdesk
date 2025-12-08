# 🗄️ Configuração PostgreSQL - Sem Quebrar o Local

## ✅ Como Funciona

O sistema **detecta automaticamente** qual banco usar:

- **Sem variáveis de ambiente** → Usa IndexedDB (local, como está agora)
- **Com variáveis configuradas** → Usa PostgreSQL/Supabase (produção)

**Nada quebra!** O código local continua funcionando normalmente.

---

## 🚀 Configurar PostgreSQL (Opcional)

### Passo 1: Criar Projeto Supabase

1. Acesse https://supabase.com
2. Crie uma conta (gratuita)
3. Clique em "New Project"
4. Preencha:
   - **Name**: helpdesk-db
   - **Database Password**: (anote!)
   - **Region**: Escolha a mais próxima
5. Aguarde 2-3 minutos

### Passo 2: Executar Schema SQL

1. No Supabase, vá em **SQL Editor**
2. Clique em **New Query**
3. Execute o SQL abaixo:

```sql
-- Tabela de Usuários
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'technician', 'client')),
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Filas
CREATE TABLE queues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Chamados
CREATE TABLE tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(500) NOT NULL,
  description TEXT NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'aberto',
  priority VARCHAR(50) NOT NULL DEFAULT 'media',
  category VARCHAR(50) NOT NULL,
  created_by UUID NOT NULL REFERENCES users(id),
  assigned_to UUID REFERENCES users(id),
  queue_id UUID REFERENCES queues(id),
  service_type VARCHAR(255),
  total_value DECIMAL(10, 2),
  integration_value DECIMAL(10, 2),
  client_id UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Interações
CREATE TABLE interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  content TEXT NOT NULL,
  author_id UUID REFERENCES users(id),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Arquivos
CREATE TABLE ticket_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
  interaction_id UUID REFERENCES interactions(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  size BIGINT NOT NULL,
  type VARCHAR(100),
  data_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_created_by ON tickets(created_by);
CREATE INDEX idx_interactions_ticket_id ON interactions(ticket_id);
```

### Passo 3: Obter Credenciais

1. No Supabase, vá em **Settings** → **API**
2. Copie:
   - **Project URL** (ex: `https://xxxxx.supabase.co`)
   - **anon public** key

### Passo 4: Configurar Localmente (Opcional)

Para testar PostgreSQL localmente:

1. Crie arquivo `.env.local` na raiz do projeto:
```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon-key
```

2. Reinicie o servidor:
```bash
npm run dev
```

3. Verifique no console do navegador:
   - Deve aparecer: "✅ Usando PostgreSQL/Supabase"
   - Se não aparecer: "📦 Usando IndexedDB (modo local)"

---

## 🌐 Deploy em Produção

### Vercel (Recomendado)

1. **Instalar Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Login:**
   ```bash
   vercel login
   ```

3. **Deploy:**
   ```bash
   vercel
   ```

4. **Adicionar variáveis de ambiente:**
   - No dashboard Vercel: **Settings** → **Environment Variables**
   - Adicione:
     - `VITE_SUPABASE_URL`
     - `VITE_SUPABASE_ANON_KEY`

5. **Deploy produção:**
   ```bash
   vercel --prod
   ```

**URL:** `https://seu-projeto.vercel.app`

### Railway

1. Conecte seu repositório GitHub
2. Adicione variáveis de ambiente:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Deploy automático!

### Outras Plataformas

- **Render**: Adicione variáveis em Environment
- **Netlify**: Adicione variáveis em Site settings
- **Docker**: Use `-e` para passar variáveis

---

## 🧪 Testar

### Modo Local (IndexedDB)
```bash
# Sem .env.local → usa IndexedDB
npm run dev
```

### Modo PostgreSQL
```bash
# Com .env.local configurado → usa PostgreSQL
npm run dev
```

### Verificar qual banco está sendo usado

Abra o console do navegador (F12):
- `✅ Usando PostgreSQL/Supabase` → PostgreSQL
- `📦 Usando IndexedDB (modo local)` → IndexedDB

---

## 🔄 Migração de Dados (Opcional)

Se quiser migrar dados do IndexedDB para PostgreSQL:

1. Configure `.env.local` com credenciais Supabase
2. Abra o console do navegador
3. Execute:
```javascript
// Carregar script de migração
import('./utils/migrateToPostgres').then(m => m.migrateToPostgres())
```

---

## ❓ FAQ

**P: Vai quebrar meu código local?**
R: Não! Sem variáveis de ambiente, continua usando IndexedDB normalmente.

**P: Preciso instalar algo extra?**
R: Não. O Supabase é carregado dinamicamente apenas quando necessário.

**P: Posso usar os dois ao mesmo tempo?**
R: Não. O sistema escolhe automaticamente: PostgreSQL se configurado, senão IndexedDB.

**P: Como desabilitar PostgreSQL?**
R: Remova ou comente as variáveis em `.env.local`

---

## 📚 Próximos Passos

1. ✅ Teste local continua funcionando
2. ✅ Configure Supabase (opcional)
3. ✅ Teste com PostgreSQL localmente (opcional)
4. ✅ Faça deploy em produção
5. ✅ Configure variáveis de ambiente na plataforma

**Tudo funciona automaticamente!** 🎉

