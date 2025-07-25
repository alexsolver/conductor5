
/**
 * Notifications Module Routes
 * Clean Architecture - Infrastructure Layer
 */

import { Router } from 'express';
import { NotificationController } from './application/controllers/NotificationController';
import { NotificationPreferenceController } from './application/controllers/NotificationPreferenceController';
import { CreateNotificationUseCase } from './application/use-cases/CreateNotificationUseCase';
import { GetNotificationsUseCase } from './application/use-cases/GetNotificationsUseCase';
import { ProcessScheduledNotificationsUseCase } from './application/use-cases/ProcessScheduledNotificationsUseCase';
import { DrizzleNotificationRepository } from './infrastructure/repositories/DrizzleNotificationRepository';
import { DrizzleNotificationPreferenceRepository } from './infrastructure/repositories/DrizzleNotificationPreferenceRepository';
import { NotificationService } from './infrastructure/services/NotificationService';
import { UuidGenerator } from '../shared/infrastructure/UuidGenerator';
import { ConsoleEmailService } from '../shared/infrastructure/services/EmailService';
import { jwtAuth } from '../../middleware/jwtAuth';
import { tenantValidator } from '../../middleware/tenantValidator';

const router = Router();

// Initialize dependencies
const notificationRepository = new DrizzleNotificationRepository();
const preferenceRepository = new DrizzleNotificationPreferenceRepository();
const emailService = new ConsoleEmailService();
const notificationService = new NotificationService(emailService);
const idGenerator = new UuidGenerator();

// Initialize use cases
const createNotificationUseCase = new CreateNotificationUseCase(
  notificationRepository,
  preferenceRepository,
  notificationService,
  idGenerator
);

const getNotificationsUseCase = new GetNotificationsUseCase(notificationRepository);

const processScheduledNotificationsUseCase = new ProcessScheduledNotificationsUseCase(
  notificationRepository,
  notificationService
);

// Initialize controllers
const notificationController = new NotificationController(
  createNotificationUseCase,
  getNotificationsUseCase,
  processScheduledNotificationsUseCase,
  notificationRepository
);

const preferenceController = new NotificationPreferenceController(
  preferenceRepository,
  idGenerator
);

// Apply middleware
router.use(jwtAuth);
router.use(tenantValidator);

// Notification routes
router.post('/notifications', (req, res) => notificationController.createNotification(req, res));
router.get('/notifications', (req, res) => notificationController.getNotifications(req, res));
router.patch('/notifications/:id/read', (req, res) => notificationController.markAsRead(req, res));
router.patch('/notifications/mark-all-read', (req, res) => notificationController.markAllAsRead(req, res));
router.get('/notifications/stats', (req, res) => notificationController.getStats(req, res));
router.post('/notifications/process-scheduled', (req, res) => notificationController.processScheduled(req, res));

// Preference routes
router.get('/notification-preferences', (req, res) => preferenceController.getPreferences(req, res));
router.post('/notification-preferences', (req, res) => preferenceController.createPreference(req, res));
router.put('/notification-preferences/:id', (req, res) => preferenceController.updatePreference(req, res));
router.delete('/notification-preferences/:id', (req, res) => preferenceController.deletePreference(req, res));

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    module: 'notifications',
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

export default router;
