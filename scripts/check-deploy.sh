#!/bin/bash

# Script para verificar se tudo está pronto para deploy
# Execute: bash scripts/check-deploy.sh

echo "🔍 Verificando configuração para deploy..."
echo ""

ERRORS=0

# Verificar Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não encontrado"
    ERRORS=$((ERRORS + 1))
else
    NODE_VERSION=$(node -v)
    echo "✅ Node.js: $NODE_VERSION"
fi

# Verificar npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm não encontrado"
    ERRORS=$((ERRORS + 1))
else
    NPM_VERSION=$(npm -v)
    echo "✅ npm: $NPM_VERSION"
fi

echo ""

# Verificar arquivos de configuração
echo "📁 Verificando arquivos de configuração..."

if [ -f ".env.local" ]; then
    echo "✅ .env.local encontrado"

    # Verificar variáveis
    if grep -q "VITE_SUPABASE_URL=https://" .env.local; then
        echo "✅ VITE_SUPABASE_URL configurado"
    else
        echo "⚠️  VITE_SUPABASE_URL não configurado corretamente"
        ERRORS=$((ERRORS + 1))
    fi

    if grep -q "VITE_SUPABASE_ANON_KEY=eyJ" .env.local; then
        echo "✅ VITE_SUPABASE_ANON_KEY configurado"
    else
        echo "⚠️  VITE_SUPABASE_ANON_KEY não configurado corretamente"
        ERRORS=$((ERRORS + 1))
    fi
else
    echo "❌ .env.local não encontrado"
    ERRORS=$((ERRORS + 1))
fi

if [ -f "server/.env" ]; then
    echo "✅ server/.env encontrado"

    # Verificar variáveis
    if grep -q "DATABASE_URL=postgresql://" server/.env; then
        echo "✅ DATABASE_URL configurado"
    else
        echo "⚠️  DATABASE_URL não configurado corretamente"
        ERRORS=$((ERRORS + 1))
    fi

    if grep -q "JWT_SECRET=" server/.env && ! grep -q "JWT_SECRET=sua_chave" server/.env; then
        echo "✅ JWT_SECRET configurado"
    else
        echo "⚠️  JWT_SECRET não configurado ou ainda é o template"
        ERRORS=$((ERRORS + 1))
    fi
else
    echo "❌ server/.env não encontrado"
    ERRORS=$((ERRORS + 1))
fi

echo ""

# Verificar dependências
echo "📦 Verificando dependências..."

if [ -d "node_modules" ]; then
    echo "✅ node_modules (frontend) encontrado"
else
    echo "⚠️  node_modules (frontend) não encontrado - execute: npm install"
    ERRORS=$((ERRORS + 1))
fi

if [ -d "server/node_modules" ]; then
    echo "✅ node_modules (backend) encontrado"
else
    echo "⚠️  node_modules (backend) não encontrado - execute: cd server && npm install"
    ERRORS=$((ERRORS + 1))
fi

echo ""

# Verificar schema.sql
if [ -f "schema.sql" ]; then
    echo "✅ schema.sql encontrado"
else
    echo "❌ schema.sql não encontrado"
    ERRORS=$((ERRORS + 1))
fi

echo ""

# Resultado
if [ $ERRORS -eq 0 ]; then
    echo "✅ Tudo pronto para deploy!"
    echo ""
    echo "📝 Próximos passos:"
    echo "1. Execute o schema.sql no Supabase SQL Editor"
    echo "2. Execute: bash scripts/deploy-supabase.sh"
    echo "3. Siga o guia DEPLOY_SUPABASE.md"
else
    echo "❌ Encontrados $ERRORS problema(s)"
    echo ""
    echo "📝 Corrija os problemas acima antes de fazer deploy"
fi

