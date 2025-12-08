# 🚀 Deploy Simples - 5 Minutos

## Opção 1: Vercel (Mais Rápido) ⭐

```bash
# 1. Instalar Vercel CLI
npm install -g vercel

# 2. Login
vercel login

# 3. Deploy
vercel

# 4. Quando perguntar sobre variáveis, adicione:
#    VITE_SUPABASE_URL = https://seu-projeto.supabase.co
#    VITE_SUPABASE_ANON_KEY = sua-chave-aqui
```

**Pronto!** URL: `https://seu-projeto.vercel.app`

---

## Opção 2: Railway

1. Acesse https://railway.app
2. Conecte seu repositório GitHub
3. Adicione variáveis:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy automático!

---

## Opção 3: Render

1. Acesse https://render.com
2. New → Static Site
3. Conecte GitHub
4. Build: `npm install && npm run build`
5. Publish: `dist`
6. Adicione variáveis de ambiente

---

## ⚙️ Variáveis Necessárias

No deploy, adicione estas variáveis:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon-key
```

**Onde encontrar:**
- Supabase → Settings → API → Project URL e anon public key

---

## ✅ Checklist

- [ ] Projeto criado no Supabase
- [ ] Schema SQL executado
- [ ] Variáveis de ambiente configuradas
- [ ] Deploy realizado
- [ ] URL funcionando

---

**Sem variáveis = IndexedDB (local)**
**Com variáveis = PostgreSQL (produção)**

Tudo automático! 🎉

