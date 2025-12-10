#!/usr/bin/env node

/**
 * Script para testar conexão com o banco de dados
 * Mostra erros detalhados para diagnóstico
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import pg from 'pg';
const { Client } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = join(__dirname, '..', '.env');

console.log('🔍 Testando conexão com o banco de dados...\n');

// Carregar .env
dotenv.config({ path: envPath });

// Verificar se DATABASE_URL existe
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL não encontrado!');
  console.error(`   Verifique se o arquivo .env existe em: ${envPath}`);
  console.error('   E se contém: DATABASE_URL=postgresql://...\n');
  process.exit(1);
}

const dbUrl = process.env.DATABASE_URL;
console.log('📋 Connection String encontrada');
console.log(`   Host: ${new URL(dbUrl).hostname}`);
console.log(`   Port: ${new URL(dbUrl).port || '5432'}`);
console.log(`   Database: ${new URL(dbUrl).pathname.slice(1)}\n`);

// Parse da connection string
let config;
try {
  const url = new URL(dbUrl);
  const isSupabase = url.hostname.includes('supabase');
  
  config = {
    host: url.hostname,
    port: parseInt(url.port || '5432'),
    user: url.username,
    password: url.password,
    database: url.pathname.slice(1),
    ssl: isSupabase ? { rejectUnauthorized: false } : false,
    connectionTimeoutMillis: 10000,
  };
  
  console.log('✅ Connection string parseada com sucesso');
  console.log(`   É Supabase: ${isSupabase ? 'Sim' : 'Não'}`);
  console.log(`   SSL: ${config.ssl ? 'Habilitado' : 'Desabilitado'}\n`);
} catch (error) {
  console.error('❌ Erro ao parsear DATABASE_URL:', error.message);
  console.error('   Verifique se a connection string está no formato correto:');
  console.error('   postgresql://user:password@host:port/database\n');
  process.exit(1);
}

// Verificar se senha está configurada
if (!config.password || config.password === '[SENHA]') {
  console.error('❌ Senha não configurada ou ainda é placeholder!');
  console.error('   A connection string contém [SENHA] - você precisa substituir pela senha real');
  console.error('   Obtenha a senha em: Supabase Dashboard → Settings → Database → Database password\n');
  process.exit(1);
}

// Tentar conectar
console.log('🔄 Tentando conectar...\n');

const client = new Client(config);

client.on('error', (err) => {
  console.error('❌ Erro na conexão:', err.message);
  console.error('   Code:', err.code);
  console.error('   Detail:', err.detail || 'N/A');
  console.error('   Hint:', err.hint || 'N/A');
});

client.connect()
  .then(() => {
    console.log('✅ Conexão estabelecida com sucesso!\n');
    
    // Testar query simples
    return client.query('SELECT version()');
  })
  .then((result) => {
    console.log('✅ Query de teste executada com sucesso');
    console.log(`   PostgreSQL Version: ${result.rows[0].version.split(' ')[0]} ${result.rows[0].version.split(' ')[1]}\n`);
    
    // Verificar se tabelas existem
    return client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
  })
  .then((result) => {
    if (result.rows.length > 0) {
      console.log('📊 Tabelas encontradas no banco:');
      result.rows.forEach(row => {
        console.log(`   - ${row.table_name}`);
      });
    } else {
      console.log('⚠️  Nenhuma tabela encontrada no banco');
      console.log('   Execute as migrations: npm run migrate');
    }
    console.log('');
    
    // Fechar conexão
    return client.end();
  })
  .then(() => {
    console.log('✅ Teste concluído com sucesso!');
    console.log('   O servidor deve conseguir conectar normalmente.\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ ERRO ao conectar ao banco de dados:\n');
    console.error('   Mensagem:', error.message);
    console.error('   Code:', error.code || 'N/A');
    console.error('   Detail:', error.detail || 'N/A');
    console.error('   Hint:', error.hint || 'N/A');
    console.error('   Errno:', error.errno || 'N/A');
    console.error('   Syscall:', error.syscall || 'N/A');
    console.error('   Address:', error.address || 'N/A');
    console.error('   Port:', error.port || 'N/A');
    
    // Mostrar todas as propriedades do erro para debug
    console.error('\n📋 Todas as propriedades do erro:');
    Object.keys(error).forEach(key => {
      if (key !== 'stack') {
        console.error(`   ${key}:`, error[key]);
      }
    });
    
    // Mostrar stack trace se disponível
    if (error.stack) {
      console.error('\n📚 Stack trace:');
      console.error(error.stack);
    }
    
    // Diagnóstico baseado no erro
    console.error('\n💡 Diagnóstico:\n');
    
    const errorMsg = (error.message || '').toLowerCase();
    const errorCode = error.code || '';
    
    if (errorCode === 'ECONNREFUSED' || errorMsg.includes('connection refused') || errorMsg.includes('econnrefused')) {
      console.error('   ❌ Conexão recusada - possíveis causas:');
      console.error('      1. Host ou porta incorretos na connection string');
      console.error('      2. Firewall bloqueando a conexão');
      console.error('      3. Banco de dados não está acessível');
      console.error('      4. IP não está na whitelist do Supabase');
      console.error('');
      console.error('   💡 Soluções:');
      console.error('      - Verifique se o host está correto (deve ser db.xxxxx.supabase.co)');
      console.error('      - Tente usar Connection Pooler:');
      console.error('        * No Supabase: Settings → Database → Connection pooling');
      console.error('        * Selecione "Session mode" e copie a connection string (porta 6543)');
      console.error('      - Verifique se há firewall bloqueando');
      console.error('      - No Supabase: Settings → Database → verifique Network Restrictions');
    } else if (errorCode === '28P01' || errorMsg.includes('password') || errorMsg.includes('authentication')) {
      console.error('   ❌ Autenticação falhou - possíveis causas:');
      console.error('      1. Senha incorreta na connection string');
      console.error('      2. Usuário incorreto (deve ser "postgres")');
      console.error('      3. Connection string ainda contém [SENHA] como placeholder');
      console.error('      4. Senha com caracteres especiais não escapados');
      console.error('');
      console.error('   💡 Soluções:');
      console.error('      - Verifique a senha em: Supabase Dashboard → Settings → Database → Database password');
      console.error('      - Se necessário, resete a senha do banco');
      console.error('      - IMPORTANTE: Substitua [SENHA] pela senha real (sem colchetes)');
      console.error('      - Se a senha tiver caracteres especiais, pode precisar URL-encode');
      console.error('      - Execute: npm run verify-env (para verificar o .env)');
    } else if (errorCode === '3D000' || errorMsg.includes('database') || errorMsg.includes('does not exist')) {
      console.error('   ❌ Banco de dados não encontrado');
      console.error('      - Verifique se o nome do banco está correto (geralmente "postgres")');
      console.error('      - Na connection string, após a porta, deve ter /postgres');
    } else if (errorMsg.includes('ssl') || errorMsg.includes('certificate') || errorMsg.includes('tls')) {
      console.error('   ❌ Erro de SSL/TLS');
      console.error('      - Para Supabase, SSL é obrigatório');
      console.error('      - Verifique se a connection string está correta');
      console.error('      - Tente usar Connection Pooler (geralmente resolve problemas de SSL)');
    } else if (errorMsg.includes('timeout') || errorCode === 'ETIMEDOUT') {
      console.error('   ❌ Timeout na conexão');
      console.error('      - O banco pode estar sobrecarregado');
      console.error('      - Tente usar Connection Pooler (porta 6543)');
      console.error('      - Verifique sua conexão de internet');
      console.error('      - Aguarde alguns minutos e tente novamente');
    } else if (errorMsg.includes('getaddrinfo') || errorMsg.includes('dns') || errorCode === 'ENOTFOUND') {
      console.error('   ❌ Host não encontrado (DNS)');
      console.error('      - Verifique se o hostname está correto');
      console.error('      - Verifique sua conexão de internet');
      console.error('      - O host deve ser algo como: db.xxxxx.supabase.co');
    } else if (errorCode === 'XX000' || errorMsg.includes('shutdown') || errorMsg.includes('db_termination') || errorMsg.includes('termination')) {
      console.error('   ❌ Erro: Banco de dados foi encerrado ou está reiniciando');
      console.error('');
      console.error('   🔍 Este erro indica:');
      console.error('      1. O banco de dados Supabase está sendo reiniciado');
      console.error('      2. Muitas conexões simultâneas (limite excedido)');
      console.error('      3. Timeout de conexão');
      console.error('      4. Problema temporário no Supabase');
      console.error('');
      console.error('   💡 SOLUÇÕES:');
      console.error('');
      console.error('   ✅ Solução 1: Aguardar e tentar novamente');
      console.error('      - Este é geralmente um problema temporário');
      console.error('      - Aguarde 1-2 minutos');
      console.error('      - Execute novamente: npm run test-connection');
      console.error('');
      console.error('   ✅ Solução 2: Verificar status do projeto Supabase');
      console.error('      - Acesse: https://app.supabase.com');
      console.error('      - Verifique se o projeto está ativo');
      console.error('      - Verifique se há notificações de manutenção');
      console.error('      - Verifique os logs do projeto');
      console.error('');
      console.error('   ✅ Solução 3: Reduzir conexões simultâneas');
      console.error('      - O pooler pode estar sobrecarregado');
      console.error('      - Aguarde alguns minutos entre tentativas');
      console.error('      - Tente usar conexão direta (porta 5432) ao invés de pooler');
      console.error('');
      console.error('   ✅ Solução 4: Usar conexão direta (sem pooler)');
      console.error('      1. No Supabase → Settings → Database');
      console.error('      2. Em "Connection string", selecione "URI" (não "Session mode")');
      console.error('      3. Copie a connection string (porta 5432)');
      console.error('      4. Use no .env como DATABASE_URL');
      console.error('      5. Substitua [SENHA] pela senha real');
      console.error('');
      console.error('   ✅ Solução 5: Verificar limites do plano Supabase');
      console.error('      - Planos gratuitos têm limites de conexões');
      console.error('      - Verifique se não excedeu o limite');
      console.error('      - Considere fazer upgrade do plano se necessário');
    } else if (errorMsg.includes('sasl') || errorMsg.includes('scram') || errorMsg.includes('server signature')) {
      console.error('   ❌ Erro de autenticação SCRAM - "server signature is missing"');
      console.error('');
      console.error('   🔍 Este erro geralmente indica:');
      console.error('      1. Senha incorreta na connection string');
      console.error('      2. Senha com caracteres especiais não codificados (URL-encoded)');
      console.error('      3. Connection string mal formatada');
      console.error('      4. Problema com a codificação da senha');
      console.error('');
      console.error('   💡 SOLUÇÕES (tente nesta ordem):');
      console.error('');
      console.error('   ✅ Solução 1: Resetar senha do banco');
      console.error('      1. No Supabase Dashboard → Settings → Database');
      console.error('      2. Role até "Database password"');
      console.error('      3. Clique em "Reset database password"');
      console.error('      4. Copie a NOVA senha gerada');
      console.error('      5. No arquivo .env, substitua a senha na connection string');
      console.error('      6. Se a senha tiver caracteres especiais, use URL-encode:');
      console.error('         - @ → %40');
      console.error('         - # → %23');
      console.error('         - $ → %24');
      console.error('         - & → %26');
      console.error('         - + → %2B');
      console.error('         - = → %3D');
      console.error('         - Espaço → %20 ou +');
      console.error('');
      console.error('   ✅ Solução 2: Verificar formato da connection string');
      console.error('      Formato correto:');
      console.error('      postgresql://postgres.xxxxx:SENHA@host:6543/postgres');
      console.error('');
      console.error('      ❌ ERRADO: postgresql://postgres.xxxxx:[SENHA]@host:6543/postgres');
      console.error('      ❌ ERRADO: postgresql://postgres.xxxxx:"senha"@host:6543/postgres');
      console.error('      ✅ CORRETO: postgresql://postgres.xxxxx:MinhaSenha123@host:6543/postgres');
      console.error('');
      console.error('   ✅ Solução 3: Usar connection string direta (sem pooler)');
      console.error('      Às vezes o pooler tem problemas. Tente a conexão direta:');
      console.error('      1. No Supabase → Settings → Database');
      console.error('      2. Em "Connection string", selecione "URI" (não "Session mode")');
      console.error('      3. Copie a connection string (porta 5432)');
      console.error('      4. Use no .env');
      console.error('');
      console.error('   ✅ Solução 4: Verificar se está usando a connection string correta');
      console.error('      - Connection Pooler usa: postgres.xxxxx (com ponto)');
      console.error('      - Conexão direta usa: postgres (sem ponto)');
      console.error('      - Verifique se está usando o usuário correto');
    } else {
      console.error('   ❌ Erro desconhecido');
      console.error('');
      console.error('   📋 Informações coletadas:');
      console.error(`      - Code: ${errorCode || 'N/A'}`);
      console.error(`      - Message: ${error.message || 'N/A'}`);
      console.error(`      - Errno: ${error.errno || 'N/A'}`);
      console.error('');
      console.error('   💡 Soluções gerais:');
      console.error('      1. Verifique se a connection string está correta');
      console.error('      2. Tente usar Connection Pooler (porta 6543)');
      console.error('      3. Verifique os logs do Supabase Dashboard');
      console.error('      4. Execute: npm run verify-env (para verificar configuração)');
      console.error('      5. Verifique se o projeto Supabase está ativo');
      console.error('      6. Tente criar um novo projeto no Supabase e usar a connection string dele');
    }
    
    console.error('');
    console.error('📖 Para mais ajuda, veja: server/TROUBLESHOOTING.md');
    console.error('');
    process.exit(1);
  });

