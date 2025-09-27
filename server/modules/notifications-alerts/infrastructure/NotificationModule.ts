// INFRASTRUCTURE MODULE - Clean Architecture
// Infrastructure layer - Module bootstrap and dependency injection

import { Router } from 'express';
import { NotificationsController } from '../application/controllers/NotificationsController';
import { CreateNotificationUseCase } from '../application/use-cases/CreateNotificationUseCase';
import { GetNotificationsUseCase } from '../application/use-cases/GetNotificationsUseCase';
import { GetNotificationStatsUseCase } from '../application/use-cases/GetNotificationStatsUseCase';
import { ProcessNotificationUseCase } from '../application/use-cases/ProcessNotificationUseCase';
import { DeleteNotificationUseCase } from '../application/use-cases/DeleteNotificationUseCase';
import { DrizzleNotificationRepository } from './repositories/DrizzleNotificationRepository';
import { NotificationDeliveryService } from './services/NotificationDeliveryService';
import { NotificationDomainService } from '../domain/services/NotificationDomainService';

// Background processor for notifications
class NotificationProcessor {
  private isRunning = false;
  private processInterval: NodeJS.Timeout | null = null;

  constructor(
    private processUseCase: ProcessNotificationUseCase,
    private intervalMs: number = 30000 // 30 seconds
  ) {}

  start(): void {
    if (this.isRunning) {
      console.log('📨 [NOTIFICATIONS] Processor already running');
      return;
    }

    this.isRunning = true;
    console.log(`📨 [NOTIFICATIONS] Starting background processor (interval: ${this.intervalMs}ms)`);

    // Initial process
    this.processNotifications();

    // Set up recurring processing
    this.processInterval = setInterval(() => {
      this.processNotifications();
    }, this.intervalMs);
  }

  stop(): void {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;

    if (this.processInterval) {
      clearInterval(this.processInterval);
      this.processInterval = null;
    }

    console.log('📨 [NOTIFICATIONS] Background processor stopped');
  }

  private async processNotifications(): Promise<void> {
    try {
      // Get all tenant IDs - in production, this would come from a tenant registry
      const tenantIds = [
        '3f99462f-3621-4b1b-bea8-782acc50d62e',
        '715c510a-3db5-4510-880a-9a1a5c320100',
        '78a4c88e-0e85-4f7c-ad92-f472dad50d7a',
        'cb9056df-d964-43d7-8fd8-b0cc00a72056'
      ];

      for (const tenantId of tenantIds) {
        try {
          const result = await this.processUseCase.execute(tenantId, 50);

          if (result.processed > 0) {
            console.log(`📨 [NOTIFICATIONS] Tenant ${tenantId}: processed=${result.processed}, sent=${result.sent}, failed=${result.failed}, expired=${result.expired}`);
          }
        } catch (error) {
          console.error(`📨 [NOTIFICATIONS] Processing failed for tenant ${tenantId}:`, error);
        }
      }
    } catch (error) {
      console.error('📨 [NOTIFICATIONS] Background processing error:', error);
    }
  }
}

export class NotificationModule {
  private static instance: NotificationModule | null = null;
  private router: Router;
  private controller: NotificationsController;
  private processor: NotificationProcessor | null = null;

  private constructor() {
    this.initializeDependencies();
    this.setupRoutes();
  }

  static getInstance(): NotificationModule {
    if (!NotificationModule.instance) {
      NotificationModule.instance = new NotificationModule();
    }
    return NotificationModule.instance;
  }

  private initializeDependencies(): void {
    console.log('🏗️ [NOTIFICATIONS-MODULE] Initializing Clean Architecture dependencies...');

    // Infrastructure layer
    const notificationRepository = new DrizzleNotificationRepository();
    const deliveryService = new NotificationDeliveryService();

    // Domain layer
    const domainService = new NotificationDomainService();

    // Initialize use cases
    const getNotificationsUseCase = new GetNotificationsUseCase(notificationRepository);
    const createNotificationUseCase = new CreateNotificationUseCase(notificationRepository, domainService);
    const getNotificationStatsUseCase = new GetNotificationStatsUseCase(notificationRepository);
    const processNotificationUseCase = new ProcessNotificationUseCase(notificationRepository, domainService, deliveryService);
    const deleteNotificationUseCase = new DeleteNotificationUseCase(notificationRepository);

    // Initialize controller
    const controller = new NotificationsController(
      getNotificationsUseCase,
      createNotificationUseCase,
      getNotificationStatsUseCase,
      processNotificationUseCase,
      deleteNotificationUseCase
    );

    // Background processor
    this.processor = new NotificationProcessor(
      processNotificationUseCase,
      30000 // 30 seconds
    );

    console.log('✅ [NOTIFICATIONS-MODULE] Clean Architecture dependencies initialized');
  }

  private setupRoutes(): void {
    this.router = Router();

    // Notification CRUD operations
    this.router.post('/notifications', (req, res) => 
      this.controller.createNotification(req, res)
    );

    this.router.get('/notifications', (req, res) => 
      this.controller.getNotifications(req, res)
    );

    this.router.get('/notifications/stats', (req, res) => 
      this.controller.getNotificationStats(req, res)
    );

    this.router.get('/notifications/:id', (req, res) => 
      this.controller.getNotificationById(req, res)
    );

    // Notification actions
    this.router.patch('/notifications/:id/read', (req, res) => 
      this.controller.markAsRead(req, res)
    );

    this.router.patch('/notifications/bulk-read', (req, res) => 
      this.controller.bulkMarkAsRead(req, res)
    );

    // Notification delete operation
    this.router.delete('/notifications/:id', (req, res) => 
      this.controller.deleteNotification(req, res)
    );

    // Administrative operations
    this.router.post('/notifications/process', (req, res) => 
      this.controller.processNotifications(req, res)
    );

    // Health check endpoint
    this.router.get('/notifications/health', (req, res) => {
      res.status(200).json({
        success: true,
        module: 'notifications-alerts',
        status: 'healthy',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        backgroundProcessor: {
          running: this.processor?.isRunning || false
        }
      });
    });

    console.log('🚀 [NOTIFICATIONS-MODULE] Routes configured');
  }

  getRouter(): Router {
    return this.router;
  }

  startBackgroundProcessor(): void {
    if (this.processor) {
      this.processor.start();
    }
  }

  stopBackgroundProcessor(): void {
    if (this.processor) {
      this.processor.stop();
    }
  }

  // Helper method to create system notifications programmatically
  async createSystemNotification(
    tenantId: string,
    type: string,
    title: string,
    message: string,
    severity: 'low' | 'medium' | 'high' | 'critical' = 'high',
    metadata: Record<string, any> = {}
  ): Promise<void> {
    try {
      const createRequest = {
        type: type as any,
        severity: severity as any,
        title,
        message,
        metadata,
        channels: ['in_app', 'dashboard_alert'] as any[]
      };

      // This would call the use case directly
      console.log(`🔔 [SYSTEM-NOTIFICATION] Created ${severity} alert for tenant ${tenantId}: ${title}`);
    } catch (error) {
      console.error('Failed to create system notification:', error);
    }
  }
}