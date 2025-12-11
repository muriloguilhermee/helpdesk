import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(authenticate);

// File upload endpoint (handled by multer in ticket creation)
router.post('/upload', async (req: AuthRequest, res: Response): Promise<void> => {
  // File upload is handled in ticket creation
  res.status(501).json({ error: 'Use ticket creation endpoint with files' });
});

export default router;

