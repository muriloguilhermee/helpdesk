# 🚀 Deploy Rápido - HostGator

## Resumo dos Passos

### 1. Build Local

```bash
# Frontend
npm install
npm run build

# Backend
cd server
npm install
npm run build
cd ..
```

### 2. Preparar Arquivos

**Estrutura no servidor:**
```
/home/seu_usuario/
├── public_html/          # Frontend (pasta dist/)
└── helpdesk-api/         # Backend (pasta server/dist/)
```

### 3. Upload via FTP

- **Frontend**: Upload `dist/*` → `public_html/`
- **Backend**: Upload `server/dist/*` → `helpdesk-api/dist/`
- Upload `server/package.json` → `helpdesk-api/`

### 4. Configurar no cPanel

1. **Node.js Selector**:
   - Versão: 18.x
   - Root: `helpdesk-api`
   - Startup: `dist/index.js`
   - Porta: 3001 (ou a que a HostGator fornecer)

2. **Variáveis de Ambiente** (no Node.js Selector):
   ```
   PORT=3001
   DATABASE_URL=postgresql://...
   JWT_SECRET=sua_chave_secreta
   CORS_ORIGIN=https://seudominio.com.br
   NODE_ENV=production
   ```

3. **Instalar dependências** (via SSH):
   ```bash
   cd ~/helpdesk-api
   npm install --production
   ```

4. **Criar .htaccess** em `public_html/` (veja arquivo `.htaccess` fornecido)

### 5. Banco de Dados

**Opção 1 - Supabase (Mais fácil):**
1. Crie conta em supabase.com
2. Crie projeto
3. Copie DATABASE_URL
4. Cole no .env do servidor

**Opção 2 - PostgreSQL HostGator:**
1. Crie banco no cPanel
2. Use as credenciais fornecidas

### 6. Executar Migrações

Via SSH ou execute o SQL diretamente:
```bash
cd ~/helpdesk-api
# Execute o schema.sql no banco de dados
```

### 7. Ativar SSL

No cPanel → SSL/TLS Status → Ativar Let's Encrypt

### 8. Testar

- Frontend: `https://seudominio.com.br`
- API: `https://seudominio.com.br/api` (ou subdomínio)

## ⚠️ Problemas Comuns

**Node.js não inicia:**
- Verifique logs no cPanel
- Verifique se a porta está correta
- Verifique se o arquivo `dist/index.js` existe

**Erro de módulo:**
```bash
cd ~/helpdesk-api
rm -rf node_modules
npm install --production
```

**Frontend não carrega:**
- Verifique se `index.html` está em `public_html/`
- Verifique permissões (755 pastas, 644 arquivos)

## 📞 Precisa de Ajuda?

Veja o guia completo em `docs/DEPLOY_HOSTGATOR.md`

