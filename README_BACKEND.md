# Backend Helpdesk - API REST com Express e PostgreSQL

## 🚀 Estrutura do Projeto

O backend foi criado com uma arquitetura modular e otimizada usando:

- **Express.js** - Framework web para Node.js
- **TypeScript** - Tipagem estática
- **Knex.js** - Query Builder para PostgreSQL
- **PostgreSQL** - Banco de dados relacional
- **JWT** - Autenticação por tokens
- **Zod** - Validação de schemas
- **Multer** - Upload de arquivos

## 📁 Estrutura de Pastas

```
server/
├── src/
│   ├── index.ts                 # Entry point do servidor
│   ├── database/
│   │   ├── connection.ts        # Configuração do Knex e migrations
│   │   └── seed.ts              # Script para popular dados iniciais
│   ├── middlewares/
│   │   ├── auth.middleware.ts   # Autenticação JWT e autorização
│   │   ├── errorHandler.ts      # Tratamento de erros
│   │   ├── notFoundHandler.ts   # 404 handler
│   │   └── upload.middleware.ts # Upload de arquivos
│   ├── services/
│   │   ├── auth.service.ts      # Lógica de autenticação
│   │   ├── users.service.ts     # Lógica de usuários
│   │   └── tickets.service.ts   # Lógica de tickets
│   ├── controllers/
│   │   ├── auth.controller.ts   # Controllers de autenticação
│   │   ├── users.controller.ts  # Controllers de usuários
│   │   └── tickets.controller.ts # Controllers de tickets
│   └── routes/
│       ├── auth.routes.ts       # Rotas de autenticação
│       ├── users.routes.ts      # Rotas de usuários
│       ├── tickets.routes.ts    # Rotas de tickets
│       └── files.routes.ts      # Rotas de arquivos
├── package.json
└── tsconfig.json
```

## 🔧 Instalação

1. **Instalar dependências do backend:**
```bash
cd server
npm install
```

2. **Configurar variáveis de ambiente:**
```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas configurações:
```env
PORT=3001
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_NAME=helpdesk
DB_USER=postgres
DB_PASSWORD=postgres

JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d

CORS_ORIGIN=http://localhost:5173
```

3. **Criar banco de dados PostgreSQL:**
```sql
CREATE DATABASE helpdesk;
```

4. **Executar migrations e seed:**
```bash
npm run migrate
npm run seed
```

## 🏃 Executar o Servidor

**Modo desenvolvimento:**
```bash
npm run dev
```

**Modo produção:**
```bash
npm run build
npm start
```

## 📡 API Endpoints

### Autenticação

- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Registro (opcional)

### Usuários

- `GET /api/users` - Listar usuários (admin only)
- `GET /api/users/:id` - Obter usuário por ID
- `POST /api/users` - Criar usuário (admin only)
- `PUT /api/users/:id` - Atualizar usuário
- `DELETE /api/users/:id` - Deletar usuário (admin only)

### Tickets

- `GET /api/tickets` - Listar tickets (com filtros)
- `GET /api/tickets/:id` - Obter ticket por ID
- `POST /api/tickets` - Criar ticket
- `PUT /api/tickets/:id` - Atualizar ticket
- `DELETE /api/tickets/:id` - Deletar ticket (admin only)
- `POST /api/tickets/:id/comments` - Adicionar comentário

## 🔐 Autenticação

Todas as rotas (exceto login/register) requerem autenticação via JWT:

```
Authorization: Bearer <token>
```

## 🎯 Features

- ✅ Arquitetura modular (MVC)
- ✅ Query Builder (Knex.js)
- ✅ Validação com Zod
- ✅ Autenticação JWT
- ✅ Autorização por roles
- ✅ Upload de arquivos
- ✅ Rate limiting
- ✅ Error handling
- ✅ CORS configurado
- ✅ TypeScript

## 🔄 Integração com Frontend

O frontend foi atualizado para usar a API quando disponível, com fallback para localStorage/IndexedDB quando o servidor não estiver rodando.

Configure a URL da API no frontend:
```env
VITE_API_URL=http://localhost:3001/api
```

## 📝 Notas

- O banco de dados é criado automaticamente na primeira execução
- O usuário admin padrão é criado no seed: `muriloguilherme@evacloudd.com` / `Eloah@210818`
- Os arquivos são armazenados como Base64 no banco (para produção, considere usar S3 ou similar)

