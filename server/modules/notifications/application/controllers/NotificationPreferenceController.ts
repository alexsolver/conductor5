
/**
 * NotificationPreference Controller
 * Clean Architecture - Application Layer
 */

import { Request, Response } from 'express';
import { INotificationPreferenceRepository } from '../../domain/ports/INotificationPreferenceRepository';
import { NotificationPreference } from '../../domain/entities/NotificationPreference';
import { IIdGenerator } from '../../../shared/domain/ports/IIdGenerator';

export class NotificationPreferenceController {
  constructor(
    private preferenceRepository: INotificationPreferenceRepository,
    private idGenerator: IIdGenerator
  ) {}

  async getPreferences(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const userId = req.user?.id;

      if (!tenantId || !userId) {
        res.status(400).json({ error: 'Tenant ID and User ID are required' });
        return;
      }

      const preferences = await this.preferenceRepository.findByUserId(userId, tenantId);

      res.json({
        success: true,
        data: preferences.map(p => ({
          id: p.getId(),
          notificationType: p.getNotificationType(),
          channels: p.getChannels(),
          enabled: p.isEnabled(),
          scheduleSettings: p.getScheduleSettings(),
          filters: p.getFilters(),
          createdAt: p.getCreatedAt(),
          updatedAt: p.getUpdatedAt()
        }))
      });
    } catch (error) {
      console.error('Error getting notification preferences:', error);
      res.status(500).json({
        error: 'Failed to get notification preferences',
        details: (error as Error).message
      });
    }
  }

  async createPreference(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const userId = req.user?.id;

      if (!tenantId || !userId) {
        res.status(400).json({ error: 'Tenant ID and User ID are required' });
        return;
      }

      const preferenceData = {
        tenantId,
        userId,
        notificationType: req.body.notificationType,
        channels: req.body.channels || ['in_app'],
        enabled: req.body.enabled !== undefined ? req.body.enabled : true,
        scheduleSettings: req.body.scheduleSettings || {},
        filters: req.body.filters || {}
      };

      const preference = NotificationPreference.create(preferenceData, this.idGenerator);
      await this.preferenceRepository.save(preference);

      res.status(201).json({
        success: true,
        data: {
          id: preference.getId(),
          notificationType: preference.getNotificationType(),
          channels: preference.getChannels(),
          enabled: preference.isEnabled(),
          scheduleSettings: preference.getScheduleSettings(),
          filters: preference.getFilters()
        },
        message: 'Notification preference created successfully'
      });
    } catch (error) {
      console.error('Error creating notification preference:', error);
      res.status(500).json({
        error: 'Failed to create notification preference',
        details: (error as Error).message
      });
    }
  }

  async updatePreference(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const { id } = req.params;

      if (!tenantId) {
        res.status(400).json({ error: 'Tenant ID is required' });
        return;
      }

      const existingPreference = await this.preferenceRepository.findById(id, tenantId);
      if (!existingPreference) {
        res.status(404).json({ error: 'Notification preference not found' });
        return;
      }

      let updatedPreference = existingPreference;

      // Update channels if provided
      if (req.body.channels !== undefined) {
        updatedPreference = updatedPreference.updateChannels(req.body.channels);
      }

      // Update enabled status if provided
      if (req.body.enabled !== undefined) {
        updatedPreference = updatedPreference.updateEnabled(req.body.enabled);
      }

      // Update schedule settings if provided
      if (req.body.scheduleSettings !== undefined) {
        updatedPreference = updatedPreference.updateScheduleSettings(req.body.scheduleSettings);
      }

      // Update filters if provided
      if (req.body.filters !== undefined) {
        updatedPreference = updatedPreference.updateFilters(req.body.filters);
      }

      await this.preferenceRepository.update(updatedPreference);

      res.json({
        success: true,
        data: {
          id: updatedPreference.getId(),
          notificationType: updatedPreference.getNotificationType(),
          channels: updatedPreference.getChannels(),
          enabled: updatedPreference.isEnabled(),
          scheduleSettings: updatedPreference.getScheduleSettings(),
          filters: updatedPreference.getFilters()
        },
        message: 'Notification preference updated successfully'
      });
    } catch (error) {
      console.error('Error updating notification preference:', error);
      res.status(500).json({
        error: 'Failed to update notification preference',
        details: (error as Error).message
      });
    }
  }

  async deletePreference(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const { id } = req.params;

      if (!tenantId) {
        res.status(400).json({ error: 'Tenant ID is required' });
        return;
      }

      const preference = await this.preferenceRepository.findById(id, tenantId);
      if (!preference) {
        res.status(404).json({ error: 'Notification preference not found' });
        return;
      }

      await this.preferenceRepository.delete(id, tenantId);

      res.json({
        success: true,
        message: 'Notification preference deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting notification preference:', error);
      res.status(500).json({
        error: 'Failed to delete notification preference',
        details: (error as Error).message
      });
    }
  }
}
import { Request, Response } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../../../../db';
import { notificationPreferences } from '../../../../../shared/schema-master';

export class NotificationPreferenceController {
  static async getPreferences(req: Request, res: Response) {
    try {
      const { tenantId } = req.user as any;
      const { userId } = req.params;

      const preferences = await db
        .select()
        .from(notificationPreferences)
        .where(eq(notificationPreferences.tenantId, tenantId))
        .where(eq(notificationPreferences.userId, userId));

      res.json(preferences);
    } catch (error) {
      console.error('Error fetching notification preferences:', error);
      res.status(500).json({ error: 'Failed to fetch notification preferences' });
    }
  }

  static async updatePreferences(req: Request, res: Response) {
    try {
      const { tenantId } = req.user as any;
      const { userId } = req.params;
      const { notificationType, channels, enabled, scheduleSettings, filters } = req.body;

      const updatedPreference = await db
        .update(notificationPreferences)
        .set({
          channels,
          enabled,
          scheduleSettings,
          filters,
          updatedAt: new Date()
        })
        .where(eq(notificationPreferences.tenantId, tenantId))
        .where(eq(notificationPreferences.userId, userId))
        .where(eq(notificationPreferences.notificationType, notificationType))
        .returning();

      res.json(updatedPreference[0]);
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      res.status(500).json({ error: 'Failed to update notification preferences' });
    }
  }

  static async createPreference(req: Request, res: Response) {
    try {
      const { tenantId } = req.user as any;
      const { userId, notificationType, channels, enabled, scheduleSettings, filters } = req.body;

      const newPreference = await db
        .insert(notificationPreferences)
        .values({
          id: crypto.randomUUID(),
          tenantId,
          userId,
          notificationType,
          channels: channels || ['in_app'],
          enabled: enabled !== undefined ? enabled : true,
          scheduleSettings: scheduleSettings || {},
          filters: filters || {}
        })
        .returning();

      res.status(201).json(newPreference[0]);
    } catch (error) {
      console.error('Error creating notification preference:', error);
      res.status(500).json({ error: 'Failed to create notification preference' });
    }
  }
}
