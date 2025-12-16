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

// Get all users (admin ou técnicos - para listar clientes)
router.get('/', (req, res, next) => {
  const authReq = req as any;
  if (authReq.user?.role === 'admin' || authReq.user?.role === 'technician' || authReq.user?.role === 'technician_n2') {
    return getAllUsersController(authReq, res);
  }
  res.status(403).json({ error: 'Acesso negado' });
});

// Get user by ID
router.get('/:id', getUserByIdController);

// Create user (admin ou técnico - técnicos só podem criar clientes)
router.post('/', (req, res, next) => {
  const authReq = req as any;
  // Admin pode criar qualquer tipo de usuário
  if (authReq.user?.role === 'admin') {
    return createUserController(authReq, res);
  }
  // Técnicos só podem criar clientes (role 'user')
  if (authReq.user?.role === 'technician' || authReq.user?.role === 'technician_n2') {
    // Verificar se está tentando criar um cliente
    if (req.body.role === 'user' || !req.body.role) {
      // Garantir que o role seja 'user' para técnicos
      req.body.role = 'user';
      return createUserController(authReq, res);
    }
    return res.status(403).json({ error: 'Técnicos só podem criar clientes' });
  }
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

