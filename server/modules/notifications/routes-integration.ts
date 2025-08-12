/**
 * Notifications Integration Routes - Phase 15 Implementation
 * 
 * Dual-system integration following Clean Architecture patterns
 * Provides working endpoints for notification management system
 * 
 * @module NotificationsIntegration
 * @version 1.0.0
 * @created 2025-08-12 - Phase 15 Clean Architecture Implementation
 */

import { Router, Request, Response } from 'express';
import notificationsWorkingRoutes from './routes';

const router = Router();

/**
 * Phase 15 Status Endpoint
 * GET /status
 */
router.get('/status', (req: Request, res: Response) => {
  res.json({
    success: true,
    system: 'notifications-integration',
    architecture: 'Clean Architecture + Working Implementation',
    version: '1.0.0',
    phase: 15,
    components: {
      workingImplementation: {
        status: 'active',
        path: '/working',
        description: 'Phase 15 working implementation for notifications management'
      }
    },
    endpoints: {
      primary: [
        'GET /working/status - Phase 15 status',
        'POST /working/notifications - Create notification',
        'GET /working/notifications - List notifications',
        'PATCH /working/notifications/:id/read - Mark notification as read',
        'PATCH /working/notifications/mark-all-read - Mark all as read',
        'GET /working/notifications/stats - Get notification statistics',
        'POST /working/notifications/process-scheduled - Process scheduled notifications',
        'GET /working/notification-preferences - Get preferences',
        'POST /working/notification-preferences - Create preference',
        'PUT /working/notification-preferences/:id - Update preference',
        'DELETE /working/notification-preferences/:id - Delete preference'
      ]
    },
    features: {
      notificationManagement: true,
      preferenceManagement: true,
      notificationTypes: ['email', 'in_app', 'sms', 'webhook', 'slack'],
      statusTypes: ['pending', 'sent', 'delivered', 'failed', 'read'],
      priorityTypes: ['low', 'medium', 'high', 'urgent'],
      scheduledNotifications: true,
      automaticNotifications: true,
      userPreferences: true,
      channelPreferences: true,
      bulkNotifications: true,
      notificationStats: true,
      cleanArchitecture: true,
      multiTenancy: true,
      authentication: true,
      useCases: true,
      domainEntities: true,
      repositoryPattern: true
    },
    cleanArchitecture: {
      domainLayer: {
        entities: ['Notification', 'NotificationPreference'],
        ports: ['INotificationRepository', 'INotificationPreferenceRepository', 'INotificationService']
      },
      applicationLayer: {
        controllers: ['NotificationController', 'NotificationPreferenceController'],
        useCases: ['CreateNotificationUseCase', 'GetNotificationsUseCase', 'ProcessScheduledNotificationsUseCase']
      },
      infrastructureLayer: {
        repositories: ['DrizzleNotificationRepository', 'DrizzleNotificationPreferenceRepository'],
        services: ['NotificationService', 'NotificationAutomationService']
      }
    },
    businessLogic: {
      notificationChannels: 'Support for multiple notification channels with preferences',
      userPreferences: 'Configurable per-user and per-channel preferences',
      scheduledProcessing: 'Automated scheduled notification processing',
      statusTracking: 'Complete notification lifecycle tracking',
      automationSupport: 'Automated notifications based on events and triggers'
    },
    lastUpdated: new Date().toISOString()
  });
});

/**
 * Health Check Endpoint
 * GET /health
 */
router.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    phase: 15,
    module: 'notifications',
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

// ===== WORKING PHASE 15 ROUTES (PRIMARY) =====

/**
 * Mount Phase 15 working routes as primary system
 * All routes use the Phase 15 implementation with existing Clean Architecture
 */
try {
  console.log('[NOTIFICATIONS-INTEGRATION] Mounting Phase 15 working routes at /working');
  router.use('/working', notificationsWorkingRoutes);
} catch (error) {
  console.error('[NOTIFICATIONS-INTEGRATION] Error mounting Phase 15 working routes:', error);
}

export default router;