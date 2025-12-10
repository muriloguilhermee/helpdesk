# ✅ Checklist de Deploy

Use este checklist antes e depois do deploy para garantir que tudo está funcionando.

## 📋 Antes do Deploy

### Código
- [ ] Código está commitado no GitHub
- [ ] Não há erros de compilação
- [ ] Testes locais funcionando
- [ ] `.env` não está no Git (verifique `.gitignore`)

### Banco de Dados
- [ ] Supabase configurado e acessível
- [ ] `DATABASE_URL` anotada
- [ ] Tabelas criadas (execute `schema.sql` se necessário)
- [ ] Teste de conexão funcionando

### Variáveis de Ambiente
- [ ] `JWT_SECRET` gerada (mínimo 32 caracteres)
- [ ] `DATABASE_URL` copiada do Supabase
- [ ] `CORS_ORIGIN` preparada (URL do frontend)

---

## 🚀 Durante o Deploy

### Backend
- [ ] Serviço criado na plataforma
- [ ] Variáveis de ambiente configuradas:
  - [ ] `DATABASE_URL`
  - [ ] `JWT_SECRET`
  - [ ] `NODE_ENV=production`
  - [ ] `CORS_ORIGIN` (atualizar depois com URL do frontend)
- [ ] Build executado com sucesso
- [ ] Servidor iniciado
- [ ] URL do backend anotada

### Frontend
- [ ] Serviço criado na plataforma
- [ ] Variável `VITE_API_URL` configurada (URL do backend)
- [ ] Build executado com sucesso
- [ ] URL do frontend anotada

### Finalização
- [ ] `CORS_ORIGIN` atualizado no backend com URL do frontend
- [ ] Backend reiniciado após atualizar CORS

---

## ✅ Após o Deploy - Testes

### Acesso
- [ ] Frontend acessível pela URL
- [ ] Página carrega sem erros no console
- [ ] Backend acessível (teste `/health`)

### Autenticação
- [ ] Página de login carrega
- [ ] Login funciona
- [ ] Logout funciona
- [ ] Token JWT sendo salvo

### Funcionalidades
- [ ] Criar usuário funciona
- [ ] Editar usuário funciona
- [ ] Excluir usuário funciona
- [ ] Criar chamado funciona
- [ ] Editar chamado funciona
- [ ] Excluir chamado funciona
- [ ] Upload de arquivos funciona
- [ ] Fotos de perfil funcionam

### Banco de Dados
- [ ] Dados sendo salvos no Supabase
- [ ] Dados sendo recuperados do Supabase
- [ ] Relacionamentos funcionando (usuários, chamados, etc.)

### Performance
- [ ] Páginas carregam em tempo razoável
- [ ] Operações não demoram muito
- [ ] Sem erros no console do navegador

---

## 🔧 Troubleshooting

### Backend não inicia
- [ ] Verificar logs na plataforma
- [ ] Verificar se `DATABASE_URL` está correto
- [ ] Verificar se `npm run build` executou
- [ ] Verificar se porta está configurada

### Frontend não conecta
- [ ] Verificar `VITE_API_URL` no frontend
- [ ] Verificar `CORS_ORIGIN` no backend
- [ ] Verificar se backend está rodando
- [ ] Testar endpoint `/health` do backend

### Erro de CORS
- [ ] Adicionar URL do frontend em `CORS_ORIGIN`
- [ ] Reiniciar backend
- [ ] Verificar se URL está exata (com/sem https, com/sem barra final)

### Dados não salvam
- [ ] Verificar conexão com Supabase
- [ ] Verificar logs do backend
- [ ] Verificar se tabelas existem
- [ ] Testar conexão diretamente no Supabase

---

## 📝 Notas

**URLs importantes:**
- Backend: `___________________________`
- Frontend: `___________________________`
- Supabase: `___________________________`

**Credenciais:**
- JWT_SECRET: `___________________________` (não compartilhe!)

**Data do Deploy:** `___/___/____`

---

## 🎉 Concluído!

Se todos os itens estão marcados, seu sistema está funcionando em produção! 🚀

