#!/bin/bash

# Script de Deploy para Supabase
# Execute: bash scripts/deploy-supabase.sh

echo "🚀 Iniciando deploy para Supabase..."
echo ""

# Verificar se está na raiz do projeto
if [ ! -f "package.json" ]; then
    echo "❌ Erro: Execute este script na raiz do projeto"
    exit 1
fi

# Verificar se .env.local existe
if [ ! -f ".env.local" ]; then
    echo "⚠️  Arquivo .env.local não encontrado!"
    echo "📝 Criando template..."
    cat > .env.local << EOF
# URL do Supabase
VITE_SUPABASE_URL=https://xxxxx.supabase.co

# Chave pública do Supabase
VITE_SUPABASE_ANON_KEY=eyJhbGc...

# URL da API Backend
VITE_API_URL=http://localhost:3001/api
EOF
    echo "✅ Template criado! Configure o arquivo .env.local e execute novamente."
    exit 1
fi

# Verificar se server/.env existe
if [ ! -f "server/.env" ]; then
    echo "⚠️  Arquivo server/.env não encontrado!"
    echo "📝 Criando template..."
    if [ -f "server/.env.template" ]; then
        cp server/.env.template server/.env
        echo "✅ Template criado! Configure o arquivo server/.env e execute novamente."
    else
        echo "❌ Arquivo server/.env.template não encontrado!"
    fi
    exit 1
fi

echo "✅ Arquivos de configuração encontrados"
echo ""

# Build do frontend
echo "📦 Fazendo build do frontend..."
npm install
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Erro ao fazer build do frontend"
    exit 1
fi

echo "✅ Frontend buildado com sucesso!"
echo ""

# Build do backend
echo "📦 Fazendo build do backend..."
cd server
npm install
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Erro ao fazer build do backend"
    exit 1
fi

echo "✅ Backend buildado com sucesso!"
echo ""

# Executar seed
echo "🌱 Executando seed do banco de dados..."
npm run seed

if [ $? -ne 0 ]; then
    echo "⚠️  Aviso: Erro ao executar seed (pode ser normal se já foi executado)"
fi

echo ""
echo "✅ Deploy local concluído!"
echo ""
echo "📝 Próximos passos:"
echo "1. Verifique se o schema.sql foi executado no Supabase"
echo "2. Configure as variáveis de ambiente em produção"
echo "3. Faça deploy do frontend (Vercel/Netlify)"
echo "4. Faça deploy do backend (Railway/Render)"
echo ""
echo "📚 Veja DEPLOY_SUPABASE.md para mais detalhes"

