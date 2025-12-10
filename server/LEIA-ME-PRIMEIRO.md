# ⚠️ IMPORTANTE: Configure o Banco de Dados Antes de Usar

O servidor precisa da **Connection String do PostgreSQL** do Supabase para funcionar.

## 🚀 Início Rápido

### 1. Obter Connection String do Supabase

1. Acesse: https://app.supabase.com
2. Selecione seu projeto
3. Vá em: **Settings** → **Database** → **Connection string**
4. Selecione: **URI**
5. Copie a connection string (algo como: `postgresql://postgres:[SENHA]@db.xxxxx.supabase.co:5432/postgres`)

### 2. Criar arquivo `.env`

Na pasta `server/`, crie um arquivo `.env` com:

```env
DATABASE_URL=postgresql://postgres:SUA_SENHA_AQUI@db.xxxxx.supabase.co:5432/postgres
JWT_SECRET=sua_chave_secreta_aqui
PORT=3001
```

⚠️ **IMPORTANTE**: Substitua `[SENHA]` ou `SUA_SENHA_AQUI` pela senha real do banco!

### 3. Verificar configuração

```bash
cd server
npm run check-env
```

### 4. Iniciar servidor

```bash
npm run dev
```

## 📖 Documentação Completa

Veja `CONFIGURAR_SUPABASE.md` para instruções detalhadas.

## ❌ Erro: "Database configuration is required"

Isso significa que o arquivo `.env` não existe ou não está configurado corretamente.

**Solução**: Siga os passos acima para criar e configurar o `.env`.

