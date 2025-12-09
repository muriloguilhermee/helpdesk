import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';
import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(authenticate);

// File upload endpoint (handled by multer in ticket creation)
router.post('/upload', async (req: AuthRequest, res: Response): Promise<void> => {
  // File upload is handled in ticket creation
  res.status(501).json({ error: 'Use ticket creation endpoint with files' });
});

export default router;

