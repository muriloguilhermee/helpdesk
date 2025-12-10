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

// Get all users (admin only)
router.get('/', authorize('admin'), getAllUsersController);

// Get user by ID
router.get('/:id', getUserByIdController);

// Create user (admin only)
router.post('/', authorize('admin'), createUserController);

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

