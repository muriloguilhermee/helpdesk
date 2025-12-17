# Deploy no Firebase (sem perder funcionalidades)

## Visão geral (recomendado)
Para **não perder nenhuma funcionalidade** do Helpdesk (regras, filas, anexos base64, RBAC, relatórios, financeiro), a migração mais segura é:

- **Frontend**: Firebase Hosting (Vite SPA)
- **Backend**: manter o `server/` (Express) e hospedar no **Cloud Run** (GCP) ou **Cloud Functions 2ª geração**  
- **Banco**: migrar o Postgres do Supabase para **Cloud SQL for PostgreSQL**

Essa abordagem mantém a mesma API e o mesmo modelo relacional (tickets, comentários, arquivos, financeiro).

> Alternativa (não recomendada para “não perder nada”): reescrever para Firestore/Auth/Storage. Isso é uma refatoração grande.

---

## 1) Frontend no Firebase Hosting

### Pré-requisitos
- Node 20+
- Firebase CLI:

```bash
npm i -g firebase-tools
firebase login
```

### Inicializar o Hosting
Na raiz do projeto:

```bash
firebase init hosting
```

Escolhas recomendadas:
- **Use an existing project** (ou crie um)
- **Public directory**: `dist`
- **Configure as a single-page app**: **Yes**
- **Set up automatic builds and deploys with GitHub**: opcional

O repositório já inclui `firebase.json` com rewrite para SPA.

### Variáveis de ambiente (Vite)
No Firebase Hosting, você **não** “define env” do Vite em runtime. Você precisa:
- Buildar com as variáveis **no momento do build**
- Ou usar `.env.production` no CI

O frontend usa:
- `VITE_API_URL` → URL do seu backend (Cloud Run)

### Build e deploy

```bash
npm ci
npm run build
firebase deploy --only hosting
```

---

## 2) Backend Express no Cloud Run (GCP)

### Por que Cloud Run
É o caminho mais simples para manter o `server/` como está (Express + Knex + JWT).

### Passos (alto nível)
1. Crie um projeto no GCP (pode ser o mesmo do Firebase).
2. Ative APIs:
   - Cloud Run
   - Artifact Registry
   - Cloud SQL Admin
3. Crie uma instância **Cloud SQL Postgres**
4. Configure o backend com:
   - `DATABASE_URL` apontando para o Cloud SQL (via Cloud SQL Auth Proxy / conexão privada)
   - `JWT_SECRET`
   - `CORS_ORIGIN` com o domínio do Firebase Hosting

> Se você quiser, eu preparo um `Dockerfile` e um guia de deploy pro Cloud Run específico para esse repo.

---

## 3) Migração do Banco (Supabase → Cloud SQL Postgres)

### Importante
O Supabase usa Postgres. Então a migração é **pg_dump/pg_restore** (seguro e padrão).

### 3.1) Exportar do Supabase
Pegue a connection string do Supabase (Settings → Database → Connection string).

Exemplo:

```bash
export SOURCE_URL="postgresql://postgres:senha@db.xxxxx.supabase.co:5432/postgres"
pg_dump --no-owner --no-privileges --format=custom --file=supabase.dump "$SOURCE_URL"
```

Se você usa o pooler do Supabase (porta 6543) e der erro, use a porta 5432 direta.

### 3.2) Criar Cloud SQL (Postgres)
No GCP:
- Cloud SQL → Create instance → PostgreSQL
- Defina usuário/senha
- Crie o database (ex.: `helpdesk`)

### 3.3) Importar no Cloud SQL
Opção A (recomendado): usar `pg_restore` via Cloud SQL Auth Proxy.

1) Rode o proxy e conecte localmente ao Cloud SQL.

2) Restaure:

```bash
export TARGET_URL="postgresql://postgres:senha@127.0.0.1:5432/helpdesk"
pg_restore --no-owner --no-privileges --clean --if-exists --dbname="$TARGET_URL" supabase.dump
```

### 3.4) Validar
Conferir tabelas e contagens:

```sql
select count(*) from users;
select count(*) from tickets;
select count(*) from comments;
select count(*) from ticket_files;
select count(*) from financial_tickets;
```

---

## 4) O que muda no sistema

- O frontend deixa de usar Vercel e passa a usar Firebase Hosting.
- O backend deixa de usar Render/Railway e passa a usar Cloud Run (recomendado).
- O banco deixa de ser Supabase Postgres e passa a ser Cloud SQL Postgres.

Na prática, você só atualiza:
- `VITE_API_URL` (frontend)
- `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGIN` (backend)

---

## Próximo passo
Me diga qual opção você quer para o backend:
- **A)** Cloud Run (recomendado)
- **B)** Cloud Functions (2ª gen) com Express

E me diga se o banco atual está no **Supabase Postgres** mesmo (e se tem arquivos grandes em base64), que eu adapto o plano pra evitar custos/performance ruins.


