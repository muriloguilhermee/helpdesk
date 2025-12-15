#!/usr/bin/env node

/**
 * Script para verificar o conteúdo do .env sem expor senhas
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = join(__dirname, '..', '.env');

console.log('🔍 Verificando arquivo .env...\n');

if (!existsSync(envPath)) {
  console.error('❌ Arquivo .env não encontrado!');
  console.error(`   Esperado em: ${envPath}\n`);
  process.exit(1);
}

console.log(`✅ Arquivo .env encontrado em: ${envPath}\n`);

// Ler arquivo linha por linha
const content = readFileSync(envPath, 'utf-8');
const lines = content.split('\n').filter(line => line.trim() !== '' && !line.trim().startsWith('#'));

console.log(`📋 Encontradas ${lines.length} linha(s) de configuração:\n`);

lines.forEach((line, index) => {
  const trimmed = line.trim();
  
  // Mascarar valores sensíveis
  let displayLine = trimmed;
  
  if (trimmed.includes('DATABASE_URL')) {
    try {
      const url = new URL(trimmed.split('=')[1]);
      const masked = `${url.protocol}//${url.username}:***@${url.hostname}:${url.port}${url.pathname}`;
      displayLine = `DATABASE_URL=${masked}`;
    } catch {
      // Se não conseguir parsear, mascarar manualmente
      const parts = trimmed.split('=');
      if (parts.length > 1) {
        const value = parts.slice(1).join('=');
        if (value.includes('@')) {
          const [userPass, rest] = value.split('@');
          const [user, pass] = userPass.split(':');
          displayLine = `${parts[0]}=${user}:***@${rest}`;
        } else {
          displayLine = `${parts[0]}=***`;
        }
      }
    }
  } else if (trimmed.includes('JWT_SECRET') || trimmed.includes('PASSWORD') || trimmed.includes('SECRET')) {
    const parts = trimmed.split('=');
    if (parts.length > 1) {
      const value = parts[1];
      displayLine = `${parts[0]}=${value.length > 0 ? '***' : '(vazio)'}`;
    }
  }
  
  console.log(`   ${index + 1}. ${displayLine}`);
});

console.log('\n🔍 Verificando problemas comuns...\n');

// Verificar se DATABASE_URL existe
const hasDatabaseUrl = lines.some(line => line.includes('DATABASE_URL'));
if (!hasDatabaseUrl) {
  console.error('❌ DATABASE_URL não encontrado!');
  console.error('   Adicione: DATABASE_URL=postgresql://...\n');
} else {
  console.log('✅ DATABASE_URL encontrado');
  
  // Verificar se tem [SENHA] como placeholder
  const dbLine = lines.find(line => line.includes('DATABASE_URL'));
  if (dbLine && (dbLine.includes('[SENHA]') || dbLine.includes('[YOUR-PASSWORD]'))) {
    console.error('❌ PROBLEMA ENCONTRADO: Connection string ainda contém placeholder [SENHA]!');
    console.error('   Você precisa substituir [SENHA] pela senha real do banco');
    console.error('   Obtenha a senha em: Supabase Dashboard → Settings → Database\n');
  } else {
    console.log('✅ Connection string parece estar configurada (sem placeholder)');
  }
  
  // Verificar formato
  try {
    const dbValue = dbLine.split('=')[1];
    const url = new URL(dbValue);
    
    if (!url.password || url.password.length < 3) {
      console.error('❌ PROBLEMA: Senha muito curta ou ausente!');
      console.error('   Verifique se a senha está correta na connection string\n');
    } else {
      console.log('✅ Senha presente na connection string');
    }
    
    if (url.hostname.includes('supabase')) {
      console.log('✅ Detectado: Supabase');
      
      if (url.port === '6543' || url.hostname.includes('pooler')) {
        console.log('✅ Usando Connection Pooler (recomendado)');
      } else if (url.port === '5432') {
        console.log('⚠️  Usando conexão direta (considere usar Pooler na porta 6543)');
      }
    }
  } catch (error) {
    console.error(`❌ Erro ao parsear DATABASE_URL: ${error.message}`);
    console.error('   Verifique se a connection string está no formato correto\n');
  }
}

// Verificar JWT_SECRET
const hasJwtSecret = lines.some(line => line.includes('JWT_SECRET'));
if (!hasJwtSecret) {
  console.error('❌ JWT_SECRET não encontrado!');
  console.error('   Adicione: JWT_SECRET=sua_chave_secreta_aqui\n');
} else {
  console.log('✅ JWT_SECRET encontrado');
}

console.log('\n💡 Próximos passos:');
console.log('   1. Se encontrou problemas acima, corrija o arquivo .env');
console.log('   2. Execute: npm run test-connection (para testar conexão)');
console.log('   3. Execute: npm run dev (para iniciar servidor)\n');


