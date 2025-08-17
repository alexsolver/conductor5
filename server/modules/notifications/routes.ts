// ✅ 1QA.MD COMPLIANCE: NOTIFICATION ROUTES
// Infrastructure layer - Express route definitions for notifications module

import { Router } from 'express';
import { NotificationController } from './application/controllers/NotificationController';
import { NotificationPreferenceController } from './application/controllers/NotificationPreferenceController';
import { jwtAuth } from '../../middleware/jwtAuth';

const router = Router();

// Initialize controllers
const notificationController = new NotificationController();
const preferenceController = new NotificationPreferenceController();

// ============================================================================
// NOTIFICATION ROUTES
// ============================================================================

// User notification endpoints (protected)
router.get('/notifications', jwtAuth, (req, res) => notificationController.getUserNotifications(req, res));
router.get('/notifications/unread', jwtAuth, (req, res) => notificationController.getUnreadNotifications(req, res));
router.get('/notifications/stats', jwtAuth, (req, res) => notificationController.getNotificationStats(req, res));

// Notification management (protected)
router.post('/notifications', jwtAuth, (req, res) => notificationController.createNotification(req, res));
router.post('/notifications/:id/send', jwtAuth, (req, res) => notificationController.sendNotification(req, res));
router.put('/notifications/:id/read', jwtAuth, (req, res) => notificationController.markAsRead(req, res));
router.put('/notifications/read-all', jwtAuth, (req, res) => notificationController.markAllAsRead(req, res));
router.delete('/notifications/:id', jwtAuth, (req, res) => notificationController.deleteNotification(req, res));

// Administrative endpoints
router.post('/notifications/process', (req, res) => notificationController.processNotifications(req, res));

// ============================================================================
// NOTIFICATION PREFERENCE ROUTES
// ============================================================================

// User preference endpoints (protected)
router.get('/user/notification-preferences', jwtAuth, (req, res) => preferenceController.getUserPreferences(req, res));
router.put('/user/notification-preferences', jwtAuth, (req, res) => preferenceController.updateUserPreferences(req, res));
router.post('/user/notification-preferences/reset', jwtAuth, (req, res) => preferenceController.resetToDefaults(req, res));
router.put('/user/notification-preferences/:type', jwtAuth, (req, res) => preferenceController.updateNotificationTypePreference(req, res));

// Testing endpoints
router.get('/user/notification-preferences/test/:channel', (req, res) => preferenceController.testNotificationChannel(req, res));

// Administrative preference endpoints
router.get('/admin/notification-preferences/stats', (req, res) => preferenceController.getPreferenceStats(req, res));

export default router;