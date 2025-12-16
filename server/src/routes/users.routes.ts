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
// IMPORTANTE: Rota específica deve vir ANTES de rota com parâmetro
router.get('/', (req, res, next) => {
  const authReq = req as any;
  console.log('🔍 GET /users - Usuário completo:', JSON.stringify(authReq.user));
  console.log('🔍 GET /users - Role do usuário:', authReq.user?.role);
  console.log('🔍 GET /users - Tipo do role:', typeof authReq.user?.role);

  if (!authReq.user) {
    console.log('❌ Usuário não autenticado');
    return res.status(401).json({ error: 'Não autenticado' });
  }

  // Normalizar o role (remover espaços e converter para lowercase para comparação)
  const userRole = String(authReq.user.role || '').trim().toLowerCase();
  const isAllowed = 
    userRole === 'admin' || 
    userRole === 'technician' || 
    userRole === 'technician_n2';

  console.log('🔍 GET /users - Role normalizado:', userRole);
  console.log('🔍 GET /users - Permissão:', isAllowed, 'Role original:', authReq.user?.role);

  if (isAllowed) {
    console.log('✅ Permissão concedida para listar usuários');
    return getAllUsersController(authReq, res);
  }
  console.log('❌ Acesso negado - Role:', userRole, 'Role original:', authReq.user?.role);
  res.status(403).json({ error: 'Acesso negado' });
});

// Get user by ID (deve vir DEPOIS de GET /)
router.get('/:id', getUserByIdController);

// Create user (admin ou técnico - técnicos só podem criar clientes)
router.post('/', (req, res, next) => {
  const authReq = req as any;
  console.log('🔍 POST /users - Usuário completo:', JSON.stringify(authReq.user));
  console.log('🔍 POST /users - Role do usuário:', authReq.user?.role, 'Body:', req.body);

  if (!authReq.user) {
    console.log('❌ Usuário não autenticado');
    return res.status(401).json({ error: 'Não autenticado' });
  }

  // Normalizar o role (remover espaços e converter para lowercase para comparação)
  const userRole = String(authReq.user.role || '').trim().toLowerCase();
  console.log('🔍 POST /users - Role normalizado:', userRole, 'Role original:', authReq.user?.role);

  // Admin pode criar qualquer tipo de usuário
  if (userRole === 'admin') {
    console.log('✅ Admin criando usuário');
    return createUserController(authReq, res);
  }

  // Técnicos só podem criar clientes (role 'user')
  if (userRole === 'technician' || userRole === 'technician_n2') {
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

  console.log('❌ Acesso negado - Role normalizado:', userRole, 'Role original:', authReq.user?.role);
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

