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
      console.log('✅ Admin user created');
    }

    console.log('✅ Database seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
};

seed();

