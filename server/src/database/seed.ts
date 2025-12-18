import { initializeDatabase, getDatabase } from './connection.js';
import { hashPassword } from '../services/auth.service.js';

const seed = async () => {
  try {
    
    await initializeDatabase();
    const db = getDatabase();

    // Check if admin user exists
    const adminExists = await db('users')
      .where({ email: 'muriloguilherme@evacloudd.com' })
      .first();

    if (!adminExists) {
      
      const hashedPassword = await hashPassword('Eloah@210818');
      await db('users').insert({
        email: 'muriloguilherme@evacloudd.com',
        name: 'Murilo Guilherme',
        password: hashedPassword,
        role: 'admin',
      });
      
      
      
    } else {
      
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
        
      }
    }

    
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro no seed:', error);
    process.exit(1);
  }
};

seed();

