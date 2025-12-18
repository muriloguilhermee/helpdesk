// Script para criar usuário administrador no Cloud SQL
import dotenv from 'dotenv';
import { initializeDatabase, getDatabase } from './dist/database/connection.js';
import { hashPassword } from './dist/services/auth.service.js';

dotenv.config();

const criarAdmin = async () => {
  try {
    console.log('🌱 Conectando ao banco de dados...');
    await initializeDatabase();
    const db = getDatabase();

    // Verificar se o usuário já existe
    const adminExists = await db('users')
      .where({ email: 'muriloguilherme@evacloudd.com' })
      .first();

    if (adminExists) {
      console.log('ℹ️  Usuário admin já existe. Atualizando senha...');
      const hashedPassword = await hashPassword('Eloah@210818');
      await db('users')
        .where({ email: 'muriloguilherme@evacloudd.com' })
        .update({
          password: hashedPassword,
          role: 'admin',
          name: 'Murilo Guilherme',
        });
      console.log('✅ Senha do usuário admin atualizada!');
    } else {
      console.log('📝 Criando usuário administrador...');
      const hashedPassword = await hashPassword('Eloah@210818');
      await db('users').insert({
        email: 'muriloguilherme@evacloudd.com',
        name: 'Murilo Guilherme',
        password: hashedPassword,
        role: 'admin',
      });
      console.log('✅ Usuário admin criado com sucesso!');
    }

    console.log('');
    console.log('📋 Credenciais:');
    console.log('   Email: muriloguilherme@evacloudd.com');
    console.log('   Senha: Eloah@210818');
    console.log('   Role: admin');
    console.log('');

    await db.destroy();
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao criar usuário admin:', error);
    process.exit(1);
  }
};

criarAdmin();

