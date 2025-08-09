import { Router } from 'express';
import { SharedController } from './application/controllers/SharedController';

const router = Router();
const sharedController = new SharedController();

// Use controller methods instead of direct route logic
router.get('/health', sharedController.health.bind(sharedController));
router.get('/status', sharedController.status.bind(sharedController));

export default router;