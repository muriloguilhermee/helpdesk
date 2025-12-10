# 🎨 Deploy do Frontend no Railway

## ⚠️ Não aparece "Static Site"?

O Railway pode ter mudado a interface. Aqui estão as alternativas:

## Opção 1: Usar "Empty Project" (Recomendado)

1. No projeto Railway, clique em **"New"** → **"Empty Project"**
2. Configure:
   - **Name**: `helpdesk-frontend`
   - **Source**: Selecione seu repositório GitHub
3. Após criar, vá em **"Settings"** → **"Build & Deploy"**
4. Configure:
   - **Root Directory**: `/` (raiz do projeto)
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npx serve -s dist -l 3000`
   - **Output Directory**: `dist`

5. Em **"Variables"**, adicione:
   ```
   VITE_API_URL=https://sua-url-backend.railway.app
   ```

## Opção 2: Usar Nixpacks (Automático)

1. Clique em **"New"** → **"GitHub Repo"**
2. Selecione seu repositório
3. Railway detectará automaticamente que é um projeto Vite
4. Configure as variáveis de ambiente:
   ```
   VITE_API_URL=https://sua-url-backend.railway.app
   ```
5. Railway fará o build automaticamente

## Opção 3: Usar Dockerfile (Mais Controle)

Crie um `Dockerfile` na raiz do projeto:

```dockerfile
# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine
WORKDIR /app
RUN npm install -g serve
COPY --from=builder /app/dist ./dist
EXPOSE 3000
CMD ["serve", "-s", "dist", "-l", "3000"]
```

Depois:
1. No Railway, clique em **"New"** → **"GitHub Repo"**
2. Selecione seu repositório
3. Railway detectará o Dockerfile automaticamente
4. Configure a variável:
   ```
   VITE_API_URL=https://sua-url-backend.railway.app
   ```

## Opção 4: Usar Vercel (Mais Fácil para Frontend) ⭐

Se o Railway não tiver a opção Static Site, considere usar **Vercel** para o frontend:

1. Acesse https://vercel.com
2. Faça login com GitHub
3. Clique em **"Add New"** → **"Project"**
4. Importe seu repositório
5. Configure:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
6. Adicione variável de ambiente:
   ```
   VITE_API_URL=https://sua-url-backend.railway.app
   ```
7. Clique em **"Deploy"**

**Vantagens do Vercel:**
- ✅ Otimizado para frontend
- ✅ Deploy automático
- ✅ CDN global
- ✅ Gratuito
- ✅ Mais fácil de configurar

## Opção 5: Configurar como Serviço Node.js

Se nenhuma das opções acima funcionar:

1. Crie um arquivo `server.js` na raiz do projeto:

```javascript
import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Servir arquivos estáticos
app.use(express.static(join(__dirname, 'dist')));

// Todas as rotas vão para index.html (SPA)
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Frontend rodando na porta ${PORT}`);
});
```

2. Adicione ao `package.json`:
```json
{
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "express": "^4.18.2"
  }
}
```

3. No Railway:
   - **New** → **GitHub Repo**
   - Selecione seu repositório
   - Railway detectará automaticamente
   - Configure variáveis de ambiente

## 📋 Checklist

- [ ] Frontend deployado e acessível
- [ ] `VITE_API_URL` configurada com URL do backend
- [ ] Build executado com sucesso
- [ ] Página carrega sem erros
- [ ] API conecta corretamente

## 🐛 Troubleshooting

### Build falha
- Verifique se `npm run build` funciona localmente
- Veja os logs no Railway para erros específicos

### Página em branco
- Verifique se `dist` foi gerado
- Verifique se o `index.html` está em `dist`
- Verifique os logs do servidor

### API não conecta
- Verifique se `VITE_API_URL` está correto
- Verifique se o backend está rodando
- Verifique CORS no backend

## 💡 Recomendação

**Para frontend React/Vite, use Vercel!** É mais fácil e otimizado para isso.

**Para backend, continue usando Railway.**

