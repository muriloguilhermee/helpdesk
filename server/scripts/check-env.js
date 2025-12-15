#!/usr/bin/env node

/**
 * Script para verificar se as variáveis de ambiente estão configuradas
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = join(__dirname, '..', '.env');

console.log('🔍 Verificando configuração do servidor...\n');

// Verificar se arquivo .env existe
if (!existsSync(envPath)) {
  console.error('❌ Arquivo .env não encontrado!');
  console.error(`   Esperado em: ${envPath}`);
  console.error('\n💡 SOLUÇÃO:');
  console.error('   1. Copie o arquivo env.example para .env:');
  console.error('      cp env.example .env');
  console.error('   2. Configure DATABASE_URL com a connection string do Supabase');
  console.error('   3. Veja CONFIGURAR_SUPABASE.md para instruções detalhadas\n');
  process.exit(1);
}

console.log('✅ Arquivo .env encontrado\n');

// Carregar variáveis
dotenv.config({ path: envPath });

// Verificar variáveis obrigatórias
const required = {
  DATABASE_URL: 'Connection string do PostgreSQL (Supabase)',
  JWT_SECRET: 'Chave secreta para JWT',
};

const optional = {
  PORT: 'Porta do servidor (padrão: 3001)',
  NODE_ENV: 'Ambiente (development/production)',
  CORS_ORIGIN: 'Origem permitida para CORS',
};

let hasErrors = false;

console.log('📋 Variáveis obrigatórias:');
for (const [key, description] of Object.entries(required)) {
  const value = process.env[key];
  if (!value) {
    console.error(`   ❌ ${key}: NÃO CONFIGURADO - ${description}`);
    hasErrors = true;
  } else {
    // Mascarar valores sensíveis
    let displayValue = value;
    if (key === 'DATABASE_URL') {
      try {
        const url = new URL(value);
        displayValue = `${url.protocol}//${url.username}:***@${url.hostname}:${url.port}${url.pathname}`;
      } catch {
        displayValue = '*** (formato inválido)';
      }
    } else if (key === 'JWT_SECRET') {
      displayValue = value.length > 10 ? `${value.substring(0, 10)}...` : '***';
    }
    console.log(`   ✅ ${key}: ${displayValue}`);
  }
}

console.log('\n📋 Variáveis opcionais:');
for (const [key, description] of Object.entries(optional)) {
  const value = process.env[key];
  if (value) {
    console.log(`   ✅ ${key}: ${value}`);
  } else {
    console.log(`   ⚪ ${key}: não configurado (${description})`);
  }
}

// Verificar formato do DATABASE_URL
if (process.env.DATABASE_URL) {
  console.log('\n🔍 Verificando formato do DATABASE_URL...');
  try {
    const url = new URL(process.env.DATABASE_URL);
    
    if (url.protocol !== 'postgresql:' && url.protocol !== 'postgres:') {
      console.error(`   ❌ Protocolo inválido: ${url.protocol} (esperado: postgresql:)`);
      hasErrors = true;
    } else {
      console.log(`   ✅ Protocolo: ${url.protocol}`);
    }
    
    if (!url.hostname) {
      console.error('   ❌ Hostname não encontrado');
      hasErrors = true;
    } else {
      console.log(`   ✅ Host: ${url.hostname}`);
    }
    
    if (!url.pathname || url.pathname === '/') {
      console.error('   ❌ Nome do banco de dados não encontrado');
      hasErrors = true;
    } else {
      console.log(`   ✅ Database: ${url.pathname.slice(1)}`);
    }
    
    if (url.password === '[SENHA]' || !url.password) {
      console.error('   ⚠️  ATENÇÃO: Senha não configurada ou ainda é placeholder [SENHA]');
      console.error('      Você precisa substituir [SENHA] pela senha real do banco');
      hasErrors = true;
    } else {
      console.log('   ✅ Senha configurada');
    }
    
    // Verificar se é Supabase
    if (url.hostname.includes('supabase')) {
      console.log('   ✅ Detectado: Supabase');
      if (url.port === '6543' || url.hostname.includes('pooler')) {
        console.log('   ✅ Usando Connection Pooler (recomendado)');
      } else {
        console.log('   💡 Dica: Considere usar Connection Pooler (porta 6543) para melhor performance');
      }
    }
  } catch (error) {
    console.error(`   ❌ Erro ao parsear DATABASE_URL: ${error.message}`);
    hasErrors = true;
  }
}

console.log('');

if (hasErrors) {
  console.error('❌ Configuração incompleta ou incorreta!');
  console.error('   Veja server/CONFIGURAR_SUPABASE.md para instruções\n');
  process.exit(1);
} else {
  console.log('✅ Todas as configurações estão corretas!');
  console.log('   Você pode executar: npm run dev\n');
  process.exit(0);
}


