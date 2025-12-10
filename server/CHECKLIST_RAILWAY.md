# ✅ Checklist - Deploy no Railway

## 🔧 Antes de Fazer Deploy

- [ ] Servidor conecta localmente (`npm run test-connection` passa)
- [ ] Código compila sem erros (`npm run build` funciona)
- [ ] Connection string do Supabase está pronta (sem `[SENHA]`)

## 🚂 No Railway Dashboard

### 1. Criar/Configurar Projeto
- [ ] Projeto criado no Railway
- [ ] Repositório GitHub conectado (ou código enviado)
- [ ] Root Directory configurado como `server` (se aplicável)

### 2. Variáveis de Ambiente (OBRIGATÓRIAS)
- [ ] `DATABASE_URL` - Connection string do Supabase (sem `[SENHA]`)
- [ ] `JWT_SECRET` - Chave secreta gerada
- [ ] `CORS_ORIGIN` - URL do frontend (ex: `https://seu-frontend.vercel.app`)
- [ ] `NODE_ENV=production` (opcional, mas recomendado)

### 3. Deploy
- [ ] Deploy iniciado
- [ ] Logs mostram "✅ Database connected successfully"
- [ ] Logs mostram "🚀 Server running on port XXXX"
- [ ] Health check funciona: `https://seu-projeto.up.railway.app/health`

## 🌐 No Frontend

- [ ] Variável `VITE_API_URL` configurada
- [ ] Valor: `https://seu-projeto.up.railway.app/api`
- [ ] Frontend redeployado após adicionar variável

## ✅ Testes Finais

- [ ] Health check responde: `/health`
- [ ] Frontend consegue fazer login
- [ ] Frontend consegue listar usuários
- [ ] Frontend consegue criar tickets
- [ ] Sem erros de CORS no console do navegador

## 🐛 Se algo não funcionar

1. **Servidor não inicia**: Verifique logs no Railway
2. **Erro de banco**: Verifique `DATABASE_URL` no Railway
3. **Erro de CORS**: Verifique `CORS_ORIGIN` no Railway
4. **Frontend não conecta**: Verifique `VITE_API_URL` no frontend

## 📖 Documentação Completa

Veja `DEPLOY_RAILWAY.md` para instruções detalhadas.

