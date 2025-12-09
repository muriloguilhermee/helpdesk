# 🚀 Guia de Configuração - Helpdesk Otimizado

Este projeto foi otimizado com backend Express, API REST, Query Builder (Knex.js) e PostgreSQL.

## 📋 Pré-requisitos

- Node.js 18+
- PostgreSQL 12+
- npm ou yarn

## 🔧 Instalação

### 1. Frontend

```bash
# Instalar dependências
npm install

# Configurar variáveis de ambiente (opcional)
cp .env.example .env
# Edite .env e configure VITE_API_URL se necessário
```

### 2. Backend

```bash
# Entrar na pasta do servidor
cd server

# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env
```

Edite `server/.env`:
```env
PORT=3001
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_NAME=helpdesk
DB_USER=postgres
DB_PASSWORD=sua_senha

JWT_SECRET=seu-jwt-secret-super-seguro
JWT_EXPIRES_IN=7d

CORS_ORIGIN=http://localhost:5173
```

### 3. Banco de Dados

```sql
-- Criar banco de dados
CREATE DATABASE helpdesk;

-- As tabelas serão criadas automaticamente na primeira execução
```

### 4. Inicializar Dados

```bash
cd server
npm run seed
```

Isso criará o usuário admin padrão:
- Email: `muriloguilherme@evacloudd.com`
- Senha: `Eloah@210818`

## 🏃 Executar o Projeto

### Terminal 1 - Backend
```bash
cd server
npm run dev
```

O servidor estará rodando em `http://localhost:3001`

### Terminal 2 - Frontend
```bash
npm run dev
```

O frontend estará rodando em `http://localhost:5173`

## 🔄 Modos de Operação

O sistema funciona em dois modos:

### 1. Modo API (Recomendado)
- Backend rodando
- Dados no PostgreSQL
- Autenticação JWT
- Melhor performance e segurança

### 2. Modo Local (Fallback)
- Backend não disponível
- Dados no IndexedDB/localStorage
- Autenticação local
- Funciona offline

O frontend detecta automaticamente qual modo usar.

## 📡 Endpoints da API

### Autenticação
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Registro

### Usuários
- `GET /api/users` - Listar (admin)
- `POST /api/users` - Criar (admin)
- `PUT /api/users/:id` - Atualizar
- `DELETE /api/users/:id` - Deletar (admin)

### Tickets
- `GET /api/tickets` - Listar
- `GET /api/tickets/:id` - Detalhes
- `POST /api/tickets` - Criar
- `PUT /api/tickets/:id` - Atualizar
- `DELETE /api/tickets/:id` - Deletar (admin)
- `POST /api/tickets/:id/comments` - Comentar

## 🎯 Features Implementadas

✅ Arquitetura modular (MVC)
✅ API REST completa
✅ Query Builder (Knex.js)
✅ Autenticação JWT
✅ Autorização por roles
✅ Validação com Zod
✅ Upload de arquivos
✅ Rate limiting
✅ Error handling
✅ CORS configurado
✅ TypeScript em todo o projeto
✅ Fallback para modo local

## 🔐 Permissões

- **Admin**: Acesso total
- **Technician**: Ver e tratar tickets
- **User**: Criar e ver próprios tickets

## 📝 Notas

- O banco de dados é criado automaticamente na primeira execução
- Os arquivos são armazenados como Base64 (para produção, considere S3)
- O sistema funciona mesmo sem o backend (modo local)

