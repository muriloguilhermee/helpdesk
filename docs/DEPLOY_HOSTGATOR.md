# Guia de Deploy - HostGator

Este guia explica como fazer o deploy do sistema Helpdesk na HostGator.

## 📋 Pré-requisitos

1. Conta na HostGator com acesso SSH
2. Node.js habilitado no cPanel (geralmente Node.js 18+)
3. Banco de dados PostgreSQL (pode usar Supabase gratuito ou PostgreSQL da HostGator)
4. Domínio configurado na HostGator

## 🚀 Passo a Passo

### 1. Preparação Local

#### 1.1. Build do Frontend

No seu computador, execute:

```bash
# Instalar dependências
npm install

# Fazer build do frontend
npm run build
```

Isso criará a pasta `dist/` com os arquivos estáticos.

#### 1.2. Build do Backend

```bash
cd server
npm install
npm run build
```

Isso criará a pasta `server/dist/` com o código compilado.

### 2. Configuração do Banco de Dados

#### Opção A: Usar Supabase (Recomendado - Gratuito)

1. Acesse [supabase.com](https://supabase.com)
2. Crie um projeto gratuito
3. Copie a `DATABASE_URL` e as credenciais
4. Use essas credenciais no arquivo `.env` do servidor

#### Opção B: PostgreSQL da HostGator

1. Acesse o cPanel da HostGator
2. Crie um banco PostgreSQL
3. Anote as credenciais (host, database, user, password)

### 3. Upload dos Arquivos

#### 3.1. Estrutura de Pastas no Servidor

Crie a seguinte estrutura no servidor via FTP ou File Manager:

```
/home/seu_usuario/
├── public_html/              # Frontend (arquivos estáticos)
│   ├── index.html
│   ├── assets/
│   └── ...
├── helpdesk-api/             # Backend
│   ├── dist/
│   ├── package.json
│   ├── .env
│   └── node_modules/
└── helpdesk-source/          # Código fonte (opcional)
```

#### 3.2. Upload via FTP

1. Conecte-se via FTP (FileZilla, WinSCP, etc.)
2. Faça upload dos arquivos:

**Frontend:**
- Upload da pasta `dist/` → `public_html/`
- Renomeie `dist` para o nome do seu domínio ou mantenha como está

**Backend:**
- Upload da pasta `server/dist/` → `helpdesk-api/dist/`
- Upload do `server/package.json` → `helpdesk-api/package.json`
- Crie o arquivo `.env` em `helpdesk-api/`

### 4. Configuração do Backend

#### 4.1. Arquivo .env

Crie o arquivo `.env` em `helpdesk-api/.env`:

```env
# Porta (HostGator geralmente usa 3001 ou porta aleatória)
PORT=3001

# Banco de Dados
DATABASE_URL=postgresql://usuario:senha@host:5432/database
# OU se usar variáveis separadas:
DB_HOST=seu_host
DB_PORT=5432
DB_USER=seu_usuario
DB_PASSWORD=sua_senha
DB_NAME=nome_do_banco

# JWT Secret (gere uma string aleatória forte)
JWT_SECRET=sua_chave_secreta_muito_forte_aqui

# CORS - URL do seu site
CORS_ORIGIN=https://seudominio.com.br

# Ambiente
NODE_ENV=production
```

#### 4.2. Instalar Dependências do Backend

Via SSH, acesse o servidor e execute:

```bash
cd ~/helpdesk-api
npm install --production
```

### 5. Configuração do Node.js no cPanel

1. Acesse o cPanel da HostGator
2. Procure por "Node.js" ou "Node.js Selector"
3. Crie uma nova aplicação:
   - **Node.js Version**: 18.x ou 20.x
   - **Application Mode**: Production
   - **Application Root**: `helpdesk-api`
   - **Application URL**: `/api` (ou deixe vazio se usar subdomínio)
   - **Application Startup File**: `dist/index.js`
   - **Environment Variables**: Adicione as variáveis do `.env`

4. Clique em "Create"

### 6. Configuração do Frontend

#### 6.1. Arquivo .env do Frontend

Crie o arquivo `.env` na raiz do projeto (antes do build):

```env
VITE_API_URL=https://seudominio.com.br/api
# OU se usar subdomínio:
# VITE_API_URL=https://api.seudominio.com.br
```

Depois faça o build novamente:

```bash
npm run build
```

#### 6.2. Upload do Frontend

1. Faça upload da pasta `dist/` para `public_html/`
2. Certifique-se de que o `index.html` está na raiz de `public_html/`

#### 6.3. Arquivo .htaccess (Opcional - para SPA)

Crie um arquivo `.htaccess` em `public_html/`:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

### 7. Executar Migrações do Banco

Via SSH:

```bash
cd ~/helpdesk-api
node dist/database/migrate.js
# OU se tiver script seed:
node dist/database/seed.js
```

Ou execute o SQL diretamente no banco via phpPgAdmin ou pgAdmin.

### 8. Configuração de Domínio/Subdomínio

#### Opção A: API em Subdomínio (Recomendado)

1. No cPanel, crie um subdomínio: `api.seudominio.com.br`
2. Aponte para a pasta `helpdesk-api`
3. Configure o Node.js para esse subdomínio

#### Opção B: API em Rota

1. Configure o Node.js na rota `/api`
2. Atualize o `VITE_API_URL` para `https://seudominio.com.br/api`

### 9. Configuração de SSL

1. No cPanel, procure por "SSL/TLS Status"
2. Ative SSL gratuito (Let's Encrypt) para seu domínio
3. Force HTTPS redirecionando HTTP para HTTPS

### 10. Testar o Deploy

1. Acesse: `https://seudominio.com.br`
2. Verifique se o frontend carrega
3. Teste o login
4. Verifique se a API está respondendo: `https://seudominio.com.br/api/health` (se tiver rota de health)

## 🔧 Troubleshooting

### Erro: "Cannot find module"

**Solução:**
```bash
cd ~/helpdesk-api
rm -rf node_modules
npm install --production
```

### Erro: "Port already in use"

**Solução:**
- Verifique qual porta o Node.js está usando no cPanel
- Atualize o `.env` com a porta correta

### Erro: "Database connection failed"

**Solução:**
- Verifique as credenciais do banco no `.env`
- Teste a conexão via SSH:
```bash
psql -h seu_host -U seu_usuario -d nome_do_banco
```

### Frontend não carrega

**Solução:**
- Verifique se os arquivos estão em `public_html/`
- Verifique permissões (755 para pastas, 644 para arquivos)
- Verifique o `.htaccess`

### API não responde

**Solução:**
- Verifique se o Node.js está rodando no cPanel
- Verifique os logs no cPanel → Node.js → View Logs
- Verifique o arquivo `.env`

## 📝 Checklist Final

- [ ] Frontend buildado e enviado para `public_html/`
- [ ] Backend buildado e enviado para `helpdesk-api/`
- [ ] Dependências instaladas (`npm install --production`)
- [ ] Arquivo `.env` configurado corretamente
- [ ] Node.js configurado no cPanel
- [ ] Banco de dados criado e migrado
- [ ] SSL ativado
- [ ] Domínio/subdomínio configurado
- [ ] Testes realizados

## 🔐 Segurança

1. **Nunca commite o arquivo `.env`** no Git
2. Use senhas fortes para JWT_SECRET
3. Ative rate limiting (já configurado no código)
4. Mantenha as dependências atualizadas
5. Use HTTPS sempre

## 📞 Suporte HostGator

Se tiver problemas específicos da HostGator:
- Chat ao vivo no cPanel
- Ticket de suporte
- Documentação: https://www.hostgator.com.br/ajuda

## 🎯 Alternativa: Deploy Simplificado

Se a HostGator não suportar Node.js adequadamente, considere:

1. **Frontend**: Netlify, Vercel, ou GitHub Pages (gratuito)
2. **Backend**: Railway, Render, ou Heroku (têm planos gratuitos)
3. **Banco**: Supabase (gratuito)

Veja o arquivo `DEPLOY_SIMPLES.md` para mais detalhes.

