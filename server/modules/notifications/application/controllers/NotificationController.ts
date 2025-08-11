
/**
 * Notification Controller
 * Clean Architecture - Application Layer
 */

import { Request, Response } from 'express';
import { CreateNotificationUseCase } from '../use-cases/CreateNotificationUseCase';
import { GetNotificationsUseCase } from '../use-cases/GetNotificationsUseCase';
import { ProcessScheduledNotificationsUseCase } from '../use-cases/ProcessScheduledNotificationsUseCase';
import { INotificationRepository } from '../../domain/ports/INotificationRepository';

export class NotificationController {
  constructor(
    private createNotificationUseCase: CreateNotificationUseCase,
    private getNotificationsUseCase: GetNotificationsUseCase,
    private processScheduledNotificationsUseCase: ProcessScheduledNotificationsUseCase,
    private notificationRepository: INotificationRepository
  ) {}

  async createNotification(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const userId = req.user?.id;

      if (!tenantId) {
        res.status(400).json({ error: 'Tenant ID is required' });
        return;
      }

      const notificationData = {
        ...req.body,
        tenantId,
        userId: req.body.userId || userId
      };

      const notificationId = await this.createNotificationUseCase.execute(notificationData);

      res.status(201).json({
        success: true,
        notificationId,
        message: 'Notification created successfully'
      });
    } catch (error) {
      console.error('Error creating notification:', error);
      res.status(500).json({
        error: 'Failed to create notification',
        details: (error as Error).message
      });
    }
  }

  async getNotifications(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const userId = req.user?.id;

      if (!tenantId) {
        res.status(400).json({ error: 'Tenant ID is required' });
        return;
      }

      const request = {
        tenantId,
        userId: req.query.userId as string || userId,
        status: req.query.status as string,
        type: req.query.type as string,
        severity: req.query.severity as string,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
        offset: req.query.offset ? parseInt(req.query.offset as string) : 0
      };

      const result = await this.getNotificationsUseCase.execute(request);

      res.json({
        success: true,
        data: result,
        pagination: {
          limit: request.limit,
          offset: request.offset,
          total: result.total
        }
      });
    } catch (error) {
      console.error('Error getting notifications:', error);
      res.status(500).json({
        error: 'Failed to get notifications',
        details: (error as Error).message
      });
    }
  }

  async markAsRead(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const { id } = req.params;

      if (!tenantId) {
        res.status(400).json({ error: 'Tenant ID is required' });
        return;
      }

      await this.notificationRepository.markAsRead(id, tenantId);

      res.json({
        success: true,
        message: 'Notification marked as read'
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      res.status(500).json({
        error: 'Failed to mark notification as read',
        details: (error as Error).message
      });
    }
  }

  async markAllAsRead(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const userId = req.user?.id;

      if (!tenantId || !userId) {
        res.status(400).json({ error: 'Tenant ID and User ID are required' });
        return;
      }

      await this.notificationRepository.markAllAsReadForUser(userId, tenantId);

      res.json({
        success: true,
        message: 'All notifications marked as read'
      });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      res.status(500).json({
        error: 'Failed to mark all notifications as read',
        details: (error as Error).message
      });
    }
  }

  async getStats(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;

      if (!tenantId) {
        res.status(400).json({ error: 'Tenant ID is required' });
        return;
      }

      const stats = await this.notificationRepository.getNotificationStats(tenantId);

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error getting notification stats:', error);
      res.status(500).json({
        error: 'Failed to get notification stats',
        details: (error as Error).message
      });
    }
  }

  async processScheduled(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;

      if (!tenantId) {
        res.status(400).json({ error: 'Tenant ID is required' });
        return;
      }

      const result = await this.processScheduledNotificationsUseCase.execute(tenantId);

      res.json({
        success: true,
        data: result,
        message: `Processed ${result.processed} notifications, ${result.failed} failed`
      });
    } catch (error) {
      console.error('Error processing scheduled notifications:', error);
      res.status(500).json({
        error: 'Failed to process scheduled notifications',
        details: (error as Error).message
      });
    }
  }
}
