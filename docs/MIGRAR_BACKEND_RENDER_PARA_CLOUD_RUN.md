# Migração do Backend (Render → Cloud Run)

Este guia mantém seu backend **sem perder funcionalidades** (Express + JWT + Postgres + Knex).

## Pré-requisitos
- Conta Google (mesma do Firebase)
- Um projeto no Firebase já criado
- `gcloud` instalado: `https://cloud.google.com/sdk/docs/install`
- Docker Desktop instalado (Windows): `https://www.docker.com/products/docker-desktop/`

> Se você preferir não instalar Docker localmente, dá para buildar via Cloud Build (também mostro abaixo).

---

## 1) No Render (pegar variáveis do backend atual)
1. Render → seu **Web Service** do backend
2. Vá em **Environment**
3. Copie e guarde estas variáveis:
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `CORS_ORIGIN`
   - (qualquer outra que você tenha criado)

> Depois que subir no Cloud Run e estiver tudo ok, você pode desligar o serviço no Render.

---

## 2) No Google Cloud (habilitar serviços)
1. Acesse `https://console.cloud.google.com/`
2. Selecione o **mesmo Project** do Firebase
3. Ative APIs:
   - Cloud Run
   - Artifact Registry
   - Cloud Build (opcional)

---

## 3) Deploy do backend no Cloud Run
O repositório agora tem `server/Dockerfile`, pronto para Cloud Run.

### 3.1 Login e selecionar projeto
No terminal:

```bash
gcloud auth login
gcloud config set project SEU_PROJECT_ID
gcloud auth configure-docker
```

### 3.2 Criar um repositório no Artifact Registry (1x)

```bash
gcloud artifacts repositories create helpdesk-repo \
  --repository-format=docker \
  --location=us-central1
```

### 3.3 Build e push da imagem
Entre na pasta `server/` e rode:

```bash
cd server

docker build -t us-central1-docker.pkg.dev/SEU_PROJECT_ID/helpdesk-repo/helpdesk-server:latest .
docker push us-central1-docker.pkg.dev/SEU_PROJECT_ID/helpdesk-repo/helpdesk-server:latest
```

### 3.4 Criar o serviço no Cloud Run

```bash
gcloud run deploy helpdesk-server \
  --image us-central1-docker.pkg.dev/SEU_PROJECT_ID/helpdesk-repo/helpdesk-server:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars "NODE_ENV=production,PORT=8080,CORS_ORIGIN=https://SEU_SITE_FIREBASE.web.app,JWT_SECRET=SEU_JWT_SECRET,DATABASE_URL=SUA_DATABASE_URL"
```

Ao final, o Cloud Run vai mostrar uma URL, algo como:
`https://helpdesk-server-xxxxx-uc.a.run.app`

Essa é a **URL do backend** que você deve colocar no frontend (`VITE_API_URL`).

---

## 4) Testar o backend
Abra no navegador:
- `https://SUA_URL_CLOUD_RUN/health`

Se retornar JSON `status: ok`, está no ar.

Teste também:
- `https://SUA_URL_CLOUD_RUN/test-cors`

---

## 5) Atualizar o frontend (Firebase Hosting) para apontar pro novo backend
No build do frontend, defina:
- `VITE_API_URL=https://SUA_URL_CLOUD_RUN`  (sem `/api`)

Depois:

```bash
npm run build
firebase deploy --only hosting
```

---

## 6) Se você também vai tirar o banco do Supabase
Você vai trocar a variável `DATABASE_URL` do Cloud Run para apontar para o banco novo (ex.: Cloud SQL Postgres).

Quando chegar nessa etapa, eu te passo o passo a passo de Cloud SQL + migração com `pg_dump/pg_restore`.

---

## Dicas importantes
- **CORS_ORIGIN**: coloque o domínio do Firebase Hosting (ex.: `https://SEU_APP.web.app,https://SEU_APP.firebaseapp.com`)
- **PORT**: Cloud Run define `PORT`, mas o backend já suporta isso (use 8080 em produção)
- **Logs**: Cloud Run → Logs (vai aparecer tudo que hoje você via no Render)


