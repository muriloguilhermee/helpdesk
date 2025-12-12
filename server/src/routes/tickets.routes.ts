import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import {
  getAllTicketsController,
  getTicketByIdController,
  createTicketController,
  updateTicketController,
  deleteTicketController,
  addCommentController,
  addInteractionController,
} from '../controllers/tickets.controller.js';

const router = Router();

// Log de inicialização das rotas
console.log('📋 Registrando rotas de tickets...');
console.log('   - GET /api/tickets');
console.log('   - GET /api/tickets/pending');
console.log('   - POST /api/tickets');
console.log('   - POST /api/tickets/:id/comments');
console.log('   - POST /api/tickets/:id/interactions');
console.log('   - GET /api/tickets/:id');
console.log('   - PUT /api/tickets/:id');
console.log('   - DELETE /api/tickets/:id');

// All routes require authentication
router.use(authenticate);

// Get all tickets
router.get('/', getAllTicketsController);

// Get ticket by ID
router.get('/pending', async (req, res) => {
  // This will be handled by filtering in the service
  return getAllTicketsController(req as any, res);
});

// Create ticket
router.post('/', createTicketController);

// Add comment (deve vir antes de /:id para evitar conflito)
router.post('/:id/comments', addCommentController);

// Add interaction (deve vir antes de /:id para evitar conflito)
router.post('/:id/interactions', addInteractionController);

// Get ticket by ID
router.get('/:id', getTicketByIdController);

// Update ticket
router.put('/:id', updateTicketController);

// Delete ticket (admin only)
router.delete('/:id', authorize('admin'), deleteTicketController);

export default router;

