// ✅ 1QA.MD COMPLIANCE: NOTIFICATION CONTROLLER
// Application layer - HTTP handlers for notification management

import { Request, Response } from 'express';
import { CreateNotificationUseCase } from '../use-cases/CreateNotificationUseCase';
import { SendNotificationUseCase } from '../use-cases/SendNotificationUseCase';
import { DrizzleNotificationRepository } from '../../infrastructure/repositories/DrizzleNotificationRepository';
import { DrizzleNotificationPreferenceRepository } from '../../infrastructure/repositories/DrizzleNotificationPreferenceRepository';
import { NotificationChannelService } from '../../infrastructure/services/NotificationChannelService';

export class NotificationController {
  private createNotificationUseCase: CreateNotificationUseCase;
  private sendNotificationUseCase: SendNotificationUseCase;
  private notificationRepository: DrizzleNotificationRepository;

  constructor() {
    this.notificationRepository = new DrizzleNotificationRepository();
    const preferenceRepository = new DrizzleNotificationPreferenceRepository();
    const channelService = new NotificationChannelService();
    
    this.createNotificationUseCase = new CreateNotificationUseCase(
      this.notificationRepository,
      preferenceRepository
    );
    
    this.sendNotificationUseCase = new SendNotificationUseCase(
      this.notificationRepository,
      channelService
    );
  }

  // GET /api/notifications - List user notifications
  async getUserNotifications(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const { status, type, limit = 50, offset = 0 } = req.query;

      if (!user?.id || !user?.tenantId) {
        res.status(400).json({
          success: false,
          error: 'Tenant ID is required'
        });
        return;
      }

      const { userId, tenantId } = { userId: user.id, tenantId: user.tenantId };

      let notifications;
      if (status) {
        notifications = await this.notificationRepository.findByStatus(status as string, tenantId, Number(limit));
      } else if (type) {
        notifications = await this.notificationRepository.findByType(type as string, tenantId, Number(limit));
      } else {
        notifications = await this.notificationRepository.findByUserId(userId, tenantId, Number(limit), Number(offset));
      }

      const unreadCount = await this.notificationRepository.getUnreadCount(userId, tenantId);

      res.json({
        success: true,
        data: {
          notifications,
          unreadCount,
          pagination: {
            limit: Number(limit),
            offset: Number(offset),
            hasMore: notifications.length === Number(limit)
          }
        }
      });
    } catch (error) {
      console.error('Error fetching notifications:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch notifications'
      });
    }
  }

  // GET /api/notifications/unread - Get unread notifications
  async getUnreadNotifications(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;

      if (!user?.id || !user?.tenantId) {
        res.status(400).json({
          success: false,
          error: 'Tenant ID is required'
        });
        return;
      }

      const { userId, tenantId } = { userId: user.id, tenantId: user.tenantId };

      const notifications = await this.notificationRepository.findUnreadByUserId(userId, tenantId);
      const unreadCount = notifications.length;

      res.json({
        success: true,
        data: {
          notifications,
          unreadCount
        }
      });
    } catch (error) {
      console.error('Error fetching unread notifications:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch unread notifications'
      });
    }
  }

  // POST /api/notifications - Create new notification
  async createNotification(req: Request, res: Response): Promise<void> {
    try {
      console.log('[NOTIFICATION-CONTROLLER] Create notification request received');
      
      const user = (req as any).user;
      const {
        tenantId: bodyTenantId,
        userId: bodyUserId,
        type,
        title,
        message,
        data,
        priority,
        severity,
        channels,
        scheduledAt,
        expiresAt,
        sourceId,
        sourceType
      } = req.body;

      // ✅ 1QA.MD: Validate tenant ID from authenticated user or request body
      const tenantId = user?.tenantId || bodyTenantId;
      
      if (!tenantId) {
        console.error('[NOTIFICATION-CONTROLLER] Missing tenant ID');
        res.status(400).json({
          success: false,
          message: 'Tenant ID is required',
          error: 'Missing tenantId in request'
        });
        return;
      }

      // ✅ 1QA.MD: Validate user ID from authenticated user or request body
      const userId = user?.id || bodyUserId;
      
      if (!userId) {
        console.error('[NOTIFICATION-CONTROLLER] Missing user ID');
        res.status(400).json({
          success: false,
          message: 'User ID is required',
          error: 'Missing userId in request'
        });
        return;
      }

      // ✅ 1QA.MD: Validate required fields
      if (!title || !message) {
        console.error('[NOTIFICATION-CONTROLLER] Missing required fields:', { title: !!title, message: !!message });
        res.status(400).json({
          success: false,
          message: 'Missing required fields: tenantId, userId, title, message',
          error: 'title and message are required'
        });
        return;
      }

      console.log('[NOTIFICATION-CONTROLLER] Creating notification:', {
        tenantId,
        userId,
        type,
        title: title?.substring(0, 50)
      });

      const result = await this.createNotificationUseCase.execute({
        tenantId,
        userId,
        type: type || 'custom',
        title,
        message,
        data: data || {},
        priority: priority || severity || 'medium',
        channels: channels || ['in_app'],
        scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
        expiresAt: expiresAt ? new Date(expiresAt) : undefined,
        sourceId,
        sourceType,
        createdBy: user?.id
      });

      if (result.success) {
        console.log('[NOTIFICATION-CONTROLLER] Notification created successfully:', result.notificationId);
        res.status(201).json(result);
      } else {
        console.error('[NOTIFICATION-CONTROLLER] Failed to create notification:', result.message);
        res.status(400).json(result);
      }
    } catch (error) {
      console.error('[NOTIFICATION-CONTROLLER] Error creating notification:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create notification',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // POST /api/notifications/:id/send - Send specific notification
  async sendNotification(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const tenantId = user?.tenantId;
      const { id } = req.params;
      const { forceResend } = req.body;

      if (!tenantId) {
        res.status(400).json({
          success: false,
          error: 'Tenant ID is required'
        });
        return;
      }

      const result = await this.sendNotificationUseCase.execute({
        notificationId: id,
        tenantId,
        forceResend
      });

      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to send notification'
      });
    }
  }

  // PUT /api/notifications/:id/read - Mark notification as read
  async markAsRead(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const tenantId = user?.tenantId;
      const { id } = req.params;

      if (!tenantId) {
        res.status(400).json({
          success: false,
          error: 'Tenant ID is required'
        });
        return;
      }

      const success = await this.notificationRepository.markAsRead(id, tenantId);

      if (success) {
        res.json({
          success: true,
          message: 'Notification marked as read'
        });
      } else {
        res.status(404).json({
          success: false,
          error: 'Notification not found'
        });
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to mark notification as read'
      });
    }
  }

  // PUT /api/notifications/read-all - Mark all notifications as read
  async markAllAsRead(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const { userId, tenantId } = { userId: user?.id, tenantId: user?.tenantId };

      if (!userId || !tenantId) {
        res.status(400).json({
          success: false,
          error: 'User authentication required'
        });
        return;
      }

      const count = await this.notificationRepository.markAllAsRead(userId, tenantId);

      res.json({
        success: true,
        message: `Marked ${count} notifications as read`,
        data: { count }
      });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to mark all notifications as read'
      });
    }
  }

  // GET /api/notifications/stats - Get notification statistics
  async getNotificationStats(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const tenantId = user?.tenantId;
      const { fromDate, toDate } = req.query;

      if (!tenantId) {
        res.status(400).json({
          success: false,
          error: 'Tenant ID is required'
        });
        return;
      }

      const stats = await this.notificationRepository.getNotificationStats(
        tenantId,
        fromDate ? new Date(fromDate as string) : undefined,
        toDate ? new Date(toDate as string) : undefined
      );

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error fetching notification stats:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch notification stats'
      });
    }
  }

  // POST /api/notifications/process - Process pending notifications (admin only)
  async processNotifications(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId } = req.user || {};
      const { limit = 10 } = req.body;

      if (!tenantId) {
        res.status(400).json({
          success: false,
          error: 'Tenant ID is required'
        });
        return;
      }

      // Get pending notifications
      const pendingNotifications = await this.notificationRepository.findPendingNotifications(tenantId, limit);
      
      const results = {
        processed: 0,
        successful: 0,
        failed: 0,
        errors: [] as string[]
      };

      // Process each notification
      for (const notification of pendingNotifications) {
        try {
          const result = await this.sendNotificationUseCase.execute({
            notificationId: notification.id,
            tenantId
          });

          results.processed++;
          if (result.success) {
            results.successful++;
          } else {
            results.failed++;
            results.errors.push(`${notification.id}: ${result.message}`);
          }
        } catch (error) {
          results.processed++;
          results.failed++;
          results.errors.push(`${notification.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      res.json({
        success: true,
        message: `Processed ${results.processed} notifications`,
        data: results
      });
    } catch (error) {
      console.error('Error processing notifications:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to process notifications'
      });
    }
  }

  // DELETE /api/notifications/:id - Delete notification
  async deleteNotification(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId } = req.user || {};
      const { id } = req.params;

      if (!tenantId) {
        res.status(400).json({
          success: false,
          error: 'Tenant ID is required'
        });
        return;
      }

      const success = await this.notificationRepository.delete(id, tenantId);

      if (success) {
        res.json({
          success: true,
          message: 'Notification deleted successfully'
        });
      } else {
        res.status(404).json({
          success: false,
          error: 'Notification not found'
        });
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete notification'
      });
    }
  }
}