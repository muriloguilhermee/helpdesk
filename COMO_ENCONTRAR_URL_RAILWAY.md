# 🔗 Como Encontrar a URL do Backend no Railway

## 📍 Onde Encontrar a URL

### Passo 1: Acesse o Railway Dashboard

1. Vá para https://railway.app
2. Faça login
3. Selecione seu projeto

### Passo 2: Encontre o Serviço do Backend

1. Você verá uma lista de serviços (ex: `helpdesk-backend`, `helpdesk-frontend`)
2. Clique no serviço do **Backend** (geralmente tem o nome do projeto + "backend" ou só o nome do projeto)

### Passo 3: Veja a URL

A URL aparece em **3 lugares**:

#### Opção A: Na Página Principal do Serviço
- Logo abaixo do nome do serviço
- Você verá algo como: `https://helpdesk-production.up.railway.app`
- Ou: `https://helpdesk-backend-production.up.railway.app`

#### Opção B: Na Aba "Settings"
1. Clique em **"Settings"** (Configurações)
2. Role até **"Domains"** (Domínios)
3. Você verá a URL pública do serviço

#### Opção C: Na Aba "Deployments"
1. Clique em **"Deployments"** (Deployments)
2. Clique no deployment mais recente
3. A URL aparece no topo ou nos logs

### Passo 4: Copie a URL

A URL será algo como:
```
https://helpdesk-production.up.railway.app
```

**⚠️ IMPORTANTE:**
- Não inclua `/api` no final
- Use apenas a URL base
- A URL pode mudar se você recriar o serviço

---

## 🎯 Exemplo Prático

Suponha que seu backend está rodando e você vê:

```
Service: helpdesk-backend
URL: https://helpdesk-backend-production-abc123.up.railway.app
```

**Use esta URL completa** para configurar o frontend:

```
VITE_API_URL=https://helpdesk-backend-production-abc123.up.railway.app
```

---

## 🔍 Verificar se o Backend Está Funcionando

1. Copie a URL do backend
2. Adicione `/health` no final
3. Abra no navegador: `https://sua-url-backend.railway.app/health`
4. Deve retornar: `{"status":"ok","timestamp":"..."}`

Se funcionar, o backend está rodando! ✅

---

## 📝 Checklist

- [ ] Backend deployado no Railway
- [ ] URL encontrada na página do serviço
- [ ] URL testada com `/health`
- [ ] URL copiada para configurar o frontend

---

## 🐛 Problemas Comuns

### Não aparece URL
- Verifique se o deploy foi concluído com sucesso
- Verifique os logs para erros
- Pode levar alguns minutos para a URL aparecer

### URL não funciona
- Verifique se o backend está rodando (veja os logs)
- Verifique se a porta está configurada corretamente
- Verifique se não há erros no código

### URL mudou
- Se você recriar o serviço, a URL muda
- Atualize a variável `VITE_API_URL` no frontend
- Atualize a variável `CORS_ORIGIN` no backend

---

## 💡 Dica

**Salve a URL em um lugar seguro!** Você vai precisar dela para:
- Configurar o frontend (`VITE_API_URL`)
- Configurar CORS no backend (`CORS_ORIGIN`)
- Testar a API manualmente

