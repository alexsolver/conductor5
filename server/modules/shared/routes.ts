import { Router } from 'express';
import { SharedController } from './application/controllers/SharedController';

const router = Router();
const sharedController = new SharedController();

// Usar controller
router.get('/health', sharedController.health.bind(sharedController));

export default router;