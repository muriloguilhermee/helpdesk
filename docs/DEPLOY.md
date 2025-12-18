# 🚀 Guia de Deploy

## Frontend (Firebase Hosting)

### 1. Build do Frontend
```bash
npm run build
```

### 2. Deploy para Firebase
```bash
firebase deploy --only hosting
```

**Pronto!** O frontend estará disponível em: `https://helpdesk-6dff8.web.app`

---

## Backend (Google Cloud Run)

### 1. Navegar para a pasta do servidor
```bash
cd server
```

### 2. Build e Push da Imagem Docker
```bash
gcloud builds submit --tag us-central1-docker.pkg.dev/helpdesk-6dff8/helpdesk-repo/helpdesk-server:latest
```

### 3. Deploy para Cloud Run
```bash
gcloud run deploy helpdesk-server \
  --image us-central1-docker.pkg.dev/helpdesk-6dff8/helpdesk-repo/helpdesk-server:latest \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --timeout 300 \
  --cpu-boost \
  --min-instances 1 \
  --set-env-vars DATABASE_URL="$DATABASE_URL" \
  --set-env-vars JWT_SECRET="$JWT_SECRET" \
  --set-env-vars CORS_ORIGIN="https://helpdesk-6dff8.web.app,https://helpdesk.evacloudd.com" \
  --set-env-vars NODE_ENV="production"
```

**Nota:** Substitua `$DATABASE_URL` e `$JWT_SECRET` pelos valores reais das suas variáveis de ambiente.

---

## ⚡ Deploy Rápido (Tudo de uma vez)

### Frontend
```bash
npm run build && firebase deploy --only hosting
```

### Backend
```bash
cd server && gcloud builds submit --tag us-central1-docker.pkg.dev/helpdesk-6dff8/helpdesk-repo/helpdesk-server:latest && gcloud run deploy helpdesk-server --image us-central1-docker.pkg.dev/helpdesk-6dff8/helpdesk-repo/helpdesk-server:latest --region us-central1 --platform managed --allow-unauthenticated --timeout 300 --cpu-boost --min-instances 1
```

---

## 📝 Verificar Deploy

### Frontend
- Acesse: https://helpdesk-6dff8.web.app
- Ou: https://helpdesk.evacloudd.com (se configurado)

### Backend
- Verifique o status no Cloud Run Console
- Teste o endpoint: `https://[SEU-BACKEND-URL]/health`

---

## 🔧 Troubleshooting

### Frontend não atualiza
- Limpe o cache do navegador (Ctrl+Shift+R)
- Verifique se o build foi bem-sucedido

### Backend não inicia
- Verifique os logs no Cloud Run Console
- Confirme que as variáveis de ambiente estão configuradas
- Verifique a conexão com o banco de dados


