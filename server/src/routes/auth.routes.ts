import { Router } from 'express';
import { loginController, registerController } from '../controllers/auth.controller.js';
import { getDatabase } from '../database/connection.js';
import { hashPassword } from '../services/auth.service.js';

const router = Router();

router.post('/login', loginController);
router.post('/register', registerController);

// Rota temporária para criar usuário administrador (remover após uso)
router.post('/create-admin', async (req, res) => {
  try {
    const db = getDatabase();

    // Verificar se o usuário já existe
    const adminExists = await db('users')
      .where({ email: 'muriloguilherme@evacloudd.com' })
      .first();

    if (adminExists) {
      // Atualizar senha e garantir que é admin
      const hashedPassword = await hashPassword('Eloah@210818');
      await db('users')
        .where({ email: 'muriloguilherme@evacloudd.com' })
        .update({
          password: hashedPassword,
          role: 'admin',
          name: 'Murilo Guilherme',
        });
      return res.json({
        success: true,
        message: 'Usuário admin atualizado com sucesso!'
      });
    } else {
      // Criar novo usuário admin
      const hashedPassword = await hashPassword('Eloah@210818');
      await db('users').insert({
        email: 'muriloguilherme@evacloudd.com',
        name: 'Murilo Guilherme',
        password: hashedPassword,
        role: 'admin',
      });
      return res.json({
        success: true,
        message: 'Usuário admin criado com sucesso!'
      });
    }
  } catch (error: any) {
    console.error('Erro ao criar admin:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao criar usuário admin',
      error: error.message
    });
  }
});

export default router;

