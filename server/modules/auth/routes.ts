
import { Router } from 'express';
import { AuthController } from './application/controllers/AuthController';

const router = Router();
const authController = new AuthController();

// Clean auth routes with proper controller delegation
router.post('/login', (req, res) => authController.login(req, res));
router.post('/register', (req, res) => authController.register(req, res));
router.post('/refresh', (req, res) => authController.refreshToken(req, res));
router.get('/me', (req, res) => authController.getProfile(req, res));

export default router;
