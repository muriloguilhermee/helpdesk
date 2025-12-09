import { initializeDatabase, getDatabase } from './connection.js';
import { hashPassword } from '../services/auth.service.js';

const seed = async () => {
  try {
    console.log('🌱 Iniciando seed do banco de dados...');
    await initializeDatabase();
    const db = getDatabase();

    // Check if admin user exists
    const adminExists = await db('users')
      .where({ email: 'muriloguilherme@evacloudd.com' })
      .first();

    if (!adminExists) {
      console.log('📝 Criando usuário administrador...');
      const hashedPassword = await hashPassword('Eloah@210818');
      await db('users').insert({
        email: 'muriloguilherme@evacloudd.com',
        name: 'Murilo Guilherme',
        password: hashedPassword,
        role: 'admin',
      });
      console.log('✅ Usuário admin criado com sucesso!');
      console.log('   Email: muriloguilherme@evacloudd.com');
      console.log('   Senha: Eloah@210818');
    } else {
      console.log('ℹ️  Usuário admin já existe');
    }

    // Criar algumas filas padrão
    const queues = [
      { name: 'Suporte Técnico', description: 'Fila para chamados de suporte técnico' },
      { name: 'Financeiro', description: 'Fila para questões financeiras' },
      { name: 'Integração', description: 'Fila para integrações com ERP' },
    ];

    for (const queue of queues) {
      const exists = await db('queues').where({ name: queue.name }).first();
      if (!exists) {
        await db('queues').insert(queue);
        console.log(`✅ Fila "${queue.name}" criada`);
      }
    }

    console.log('');
    console.log('✅ Seed do banco de dados concluído com sucesso!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro no seed:', error);
    process.exit(1);
  }
};

seed();

