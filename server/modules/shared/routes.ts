
import { Router } from 'express';

const router = Router();

// Shared routes for common functionality
router.get('/health', (req, res) => {
  res.json({ status: 'healthy', module: 'shared' });
});

export { router as sharedRoutes };
