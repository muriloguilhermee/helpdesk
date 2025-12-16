import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import {
  getAllUsersController,
  getUserByIdController,
  createUserController,
  updateUserController,
  deleteUserController,
} from '../controllers/users.controller.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get user by ID (deve vir antes de GET / para não capturar a rota)
router.get('/:id', getUserByIdController);

// Get all users (admin ou técnicos - para listar clientes)
// IMPORTANTE: Esta rota deve vir DEPOIS de /:id para não ser capturada
router.get('/', (req, res, next) => {
  const authReq = req as any;
  console.log('🔍 GET /users - Role do usuário:', authReq.user?.role);
  if (authReq.user?.role === 'admin' || authReq.user?.role === 'technician' || authReq.user?.role === 'technician_n2') {
    console.log('✅ Permissão concedida para listar usuários');
    return getAllUsersController(authReq, res);
  }
  console.log('❌ Acesso negado - Role:', authReq.user?.role);
  res.status(403).json({ error: 'Acesso negado' });
});

// Create user (admin ou técnico - técnicos só podem criar clientes)
router.post('/', (req, res, next) => {
  const authReq = req as any;
  console.log('🔍 POST /users - Role do usuário:', authReq.user?.role, 'Body:', req.body);
  // Admin pode criar qualquer tipo de usuário
  if (authReq.user?.role === 'admin') {
    console.log('✅ Admin criando usuário');
    return createUserController(authReq, res);
  }
  // Técnicos só podem criar clientes (role 'user')
  if (authReq.user?.role === 'technician' || authReq.user?.role === 'technician_n2') {
    console.log('✅ Técnico tentando criar cliente');
    // Verificar se está tentando criar um cliente
    if (req.body.role === 'user' || !req.body.role) {
      // Garantir que o role seja 'user' para técnicos
      req.body.role = 'user';
      console.log('✅ Permissão concedida - criando cliente');
      return createUserController(authReq, res);
    }
    console.log('❌ Técnico tentando criar usuário com role diferente de user');
    return res.status(403).json({ error: 'Técnicos só podem criar clientes' });
  }
  console.log('❌ Acesso negado - Role:', authReq.user?.role);
  res.status(403).json({ error: 'Acesso negado' });
});

// Update user (admin or self)
router.put('/:id', (req, res, next) => {
  const authReq = req as any;
  if (authReq.user?.role === 'admin' || authReq.user?.id === req.params.id) {
    return updateUserController(authReq, res);
  }
  res.status(403).json({ error: 'Acesso negado' });
});

// Delete user (admin only, cannot delete self)
router.delete('/:id', authorize('admin'), deleteUserController);

export default router;

