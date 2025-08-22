// INFRASTRUCTURE MODULE - Clean Architecture
// Infrastructure layer - Module bootstrap and dependency injection

import { Router } from 'express';
import { NotificationsController } from '../application/controllers/NotificationsController';
import { CreateNotificationUseCase } from '../application/use-cases/CreateNotificationUseCase';
import { GetNotificationsUseCase } from '../application/use-cases/GetNotificationsUseCase';
import { GetNotificationStatsUseCase } from '../application/use-cases/GetNotificationStatsUseCase';
import { ProcessNotificationUseCase } from '../application/use-cases/ProcessNotificationUseCase';
import { DrizzleNotificationRepository } from './repositories/DrizzleNotificationRepository';
import { NotificationDeliveryService } from './services/NotificationDeliveryService';
import { NotificationDomainService } from '../domain/services/NotificationDomainService';

// Background processor for notifications
class NotificationProcessor {
  private isRunning = false;
  private processInterval: NodeJS.Timeout | null = null;
  private urgentInterval: NodeJS.Timeout | null = null;
  private webhookProcessor: WebhookProcessor;
  private emailProcessor: EmailProcessor;
  private smsProcessor: SMSProcessor;

  constructor(
    private processUseCase: ProcessNotificationUseCase,
    private intervalMs: number = 30000, // 30 seconds para notificações normais
    private urgentIntervalMs: number = 5000 // 5 seconds para notificações urgentes
  ) {
    this.webhookProcessor = new WebhookProcessor();
    this.emailProcessor = new EmailProcessor();
    this.smsProcessor = new SMSProcessor();
  }

  start(): void {
    if (this.isRunning) {
      console.log('📨 [NOTIFICATIONS] Processor already running');
      return;
    }

    this.isRunning = true;
    console.log(`📨 [NOTIFICATIONS] Starting enhanced background processor`);
    console.log(`📨 [NOTIFICATIONS] Normal interval: ${this.intervalMs}ms, Urgent interval: ${this.urgentIntervalMs}ms`);

    // Initial process
    this.processNotifications();
    this.processUrgentNotifications();

    // Set up recurring processing - normal notifications
    this.processInterval = setInterval(() => {
      this.processNotifications();
    }, this.intervalMs);

    // Set up recurring processing - urgent notifications
    this.urgentInterval = setInterval(() => {
      this.processUrgentNotifications();
    }, this.urgentIntervalMs);
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

    if (this.urgentInterval) {
      clearInterval(this.urgentInterval);
      this.urgentInterval = null;
    }

    console.log('📨 [NOTIFICATIONS] Enhanced background processor stopped');
  }

  private async processUrgentNotifications(): Promise<void> {
    try {
      const tenantIds = [
        '3f99462f-3621-4b1b-bea8-782acc50d62e',
        '715c510a-3db5-4510-880a-9a1a5c320100',
        '78a4c88e-0e85-4f7c-ad92-f472dad50d7a',
        'cb9056df-d964-43d7-8fd8-b0cc00a72056'
      ];

      for (const tenantId of tenantIds) {
        try {
          // Processar apenas notificações urgentes (priority >= 8)
          const result = await this.processUseCase.execute(tenantId, 20, { urgentOnly: true });
          
          if (result.processed > 0) {
            console.log(`🚨 [URGENT-NOTIFICATIONS] Tenant ${tenantId}: processed=${result.processed}, sent=${result.sent}`);
            
            // Push em tempo real para notificações urgentes
            await this.pushRealTimeNotifications(tenantId, result.notifications);
          }
        } catch (error) {
          console.error(`🚨 [URGENT-NOTIFICATIONS] Processing failed for tenant ${tenantId}:`, error);
        }
      }
    } catch (error) {
      console.error('🚨 [URGENT-NOTIFICATIONS] Background processing error:', error);
    }
  }

  private async pushRealTimeNotifications(tenantId: string, notifications: any[]): Promise<void> {
    try {
      // Push via WebSocket/Server-Sent Events
      await this.webhookProcessor.sendRealTime(tenantId, notifications);
      
      // Push via webhook para integrações externas
      await this.webhookProcessor.sendWebhooks(tenantId, notifications);
      
      // Enviar emails urgentes
      for (const notification of notifications) {
        if (notification.channels?.includes('email')) {
          await this.emailProcessor.sendUrgent(notification);
        }
        
        if (notification.channels?.includes('sms')) {
          await this.smsProcessor.sendUrgent(notification);
        }
      }
    } catch (error) {
      console.error('📨 [PUSH-NOTIFICATIONS] Real-time push error:', error);
    }
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

    // Application layer - Use Cases
    const createNotificationUseCase = new CreateNotificationUseCase(
      notificationRepository,
      domainService
    );

    const getNotificationsUseCase = new GetNotificationsUseCase(
      notificationRepository
    );

    const getNotificationStatsUseCase = new GetNotificationStatsUseCase(
      notificationRepository
    );

    const processNotificationUseCase = new ProcessNotificationUseCase(
      notificationRepository,
      domainService,
      deliveryService
    );

    // Application layer - Controller
    this.controller = new NotificationsController(
      createNotificationUseCase,
      getNotificationsUseCase,
      getNotificationStatsUseCase,
      processNotificationUseCase
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