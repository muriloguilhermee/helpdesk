import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import {
  getAllTicketsController,
  getTicketByIdController,
  createTicketController,
  updateTicketController,
  deleteTicketController,
  addCommentController,
} from '../controllers/tickets.controller.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get all tickets
router.get('/', getAllTicketsController);

// Get ticket by ID
router.get('/pending', async (req, res) => {
  // This will be handled by filtering in the service
  return getAllTicketsController(req as any, res);
});

// Get ticket by ID
router.get('/:id', getTicketByIdController);

// Create ticket
router.post('/', createTicketController);

// Update ticket
router.put('/:id', updateTicketController);

// Delete ticket (admin only)
router.delete('/:id', authorize('admin'), deleteTicketController);

// Add comment
router.post('/:id/comments', addCommentController);

export default router;

