// Presentation Layer - Routes following 1qa.md Clean Architecture
import { Router } from 'express';
import { UserNotificationPreferencesModule } from './infrastructure/UserNotificationPreferencesModule';
import { jwtAuth } from '../../middleware/jwtAuth';

const router = Router();
const module = UserNotificationPreferencesModule.getInstance();
const controller = module.getController();

// Routes following 1qa.md RESTful patterns with authentication middleware
router.get('/user/notification-preferences', jwtAuth, (req, res) => controller.getPreferences(req, res));
router.put('/user/notification-preferences', jwtAuth, (req, res) => controller.updatePreferences(req, res));

export { router as userNotificationPreferencesRoutes };