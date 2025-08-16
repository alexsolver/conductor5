// Presentation Layer - Route definitions
import { Router } from 'express';
import { UserNotificationPreferencesModule } from './infrastructure/UserNotificationPreferencesModule';

const router = Router();
const module = UserNotificationPreferencesModule.getInstance();
const controller = module.getController();

// Routes following RESTful pattern
router.get('/user/notification-preferences', (req, res) => controller.getPreferences(req, res));
router.get('/user/:userId/notification-preferences', (req, res) => controller.getPreferences(req, res));
router.put('/user/notification-preferences', (req, res) => controller.updatePreferences(req, res));
router.put('/user/:userId/notification-preferences', (req, res) => controller.updatePreferences(req, res));

export { router as userNotificationPreferencesRoutes };