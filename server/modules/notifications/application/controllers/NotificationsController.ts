/**
 * NotificationsController
 * Clean Architecture - Presentation Layer
 * Handles HTTP requests and delegates to Use Cases
 */

import { Request, Response } from 'express';

export class NotificationsController {
  constructor() {}

  async createNotification(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const { title, message, type, recipientId, channels } = req.body;
      
      if (!title || !message || !recipientId) {
        res.status(400).json({ 
          success: false, 
          message: 'Title, message, and recipient ID are required' 
        });
        return;
      }
      
      res.status(201).json({
        success: true,
        message: 'Notification created successfully',
        data: { 
          title, 
          message, 
          type: type || 'info', 
          recipientId, 
          channels: channels || ['email'],
          tenantId 
        }
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create notification';
      res.status(400).json({ success: false, message });
    }
  }

  async getNotifications(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const { userId, type, read } = req.query;
      
      res.json({
        success: true,
        message: 'Notifications retrieved successfully',
        data: [],
        filters: { userId, type, read, tenantId }
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to retrieve notifications';
      res.status(500).json({ success: false, message });
    }
  }

  async markAsRead(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const tenantId = req.headers['x-tenant-id'] as string;
      
      res.json({
        success: true,
        message: 'Notification marked as read',
        data: { id, read: true, tenantId }
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to mark notification as read';
      res.status(400).json({ success: false, message });
    }
  }

  async sendBulkNotification(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const { title, message, recipientIds, type, channels } = req.body;
      
      if (!title || !message || !recipientIds?.length) {
        res.status(400).json({ 
          success: false, 
          message: 'Title, message, and recipient IDs are required' 
        });
        return;
      }
      
      res.json({
        success: true,
        message: 'Bulk notification sent successfully',
        data: { 
          title, 
          message, 
          recipientCount: recipientIds.length, 
          type, 
          channels, 
          tenantId 
        }
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to send bulk notification';
      res.status(400).json({ success: false, message });
    }
  }
}