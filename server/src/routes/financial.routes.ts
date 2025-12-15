import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import {
  getAllFinancialTicketsController,
  getFinancialTicketByIdController,
  createFinancialTicketController,
  updateFinancialTicketController,
  deleteFinancialTicketController,
} from '../controllers/financial.controller.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get all financial tickets
router.get('/', getAllFinancialTicketsController);

// Get financial ticket by ID
router.get('/:id', getFinancialTicketByIdController);

// Create financial ticket
router.post('/', createFinancialTicketController);

// Update financial ticket
router.put('/:id', updateFinancialTicketController);

// Delete financial ticket (admin only)
router.delete('/:id', authorize('admin'), deleteFinancialTicketController);

export default router;







