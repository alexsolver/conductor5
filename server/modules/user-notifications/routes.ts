// Presentation Layer - Route definitions
import { Router } from 'express';
import { UserNotificationPreferencesModule } from './infrastructure/UserNotificationPreferencesModule';
import { jwtAuth } from '../../middleware/jwtAuth';

const router = Router();
const module = UserNotificationPreferencesModule.getInstance();
const controller = module.getController();

// Routes following RESTful pattern with JWT auth
router.get('/user/notification-preferences', jwtAuth, (req, res) => controller.getPreferences(req, res));
router.get('/user/:userId/notification-preferences', jwtAuth, (req, res) => controller.getPreferences(req, res));
router.put('/user/notification-preferences', jwtAuth, (req, res) => controller.updatePreferences(req, res));
router.put('/user/:userId/notification-preferences', jwtAuth, (req, res) => controller.updatePreferences(req, res));

export { router as userNotificationPreferencesRoutes };