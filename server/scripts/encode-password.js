#!/usr/bin/env node

/**
 * Script para codificar senha com caracteres especiais para URL
 */

const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🔐 Codificador de Senha para Connection String\n');
console.log('Este script ajuda a codificar senhas com caracteres especiais\n');

rl.question('Digite a senha do banco de dados: ', (password) => {
  // Codificar caracteres especiais
  const encoded = encodeURIComponent(password);
  
  console.log('\n✅ Senha codificada:');
  console.log(`   ${encoded}\n`);
  
  console.log('📋 Como usar no .env:');
  console.log('');
  console.log('   DATABASE_URL=postgresql://postgres.xxxxx:' + encoded + '@host:6543/postgres');
  console.log('');
  console.log('💡 Dica: Se a senha não tiver caracteres especiais, pode usar direto sem codificar');
  console.log('');
  
  rl.close();
});

