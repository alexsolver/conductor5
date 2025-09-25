// ✅ 1QA.MD COMPLIANCE: NOTIFICATION PREFERENCE CONTROLLER
// Application layer - HTTP handlers for user notification preferences

import { Request, Response } from 'express';
import { DrizzleNotificationPreferenceRepository } from '../../infrastructure/repositories/DrizzleNotificationPreferenceRepository';

export class NotificationPreferenceController {
  private preferenceRepository: DrizzleNotificationPreferenceRepository;

  constructor() {
    this.preferenceRepository = new DrizzleNotificationPreferenceRepository();
  }

  // GET /api/user/notification-preferences - Get user preferences
  async getUserPreferences(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;

      if (!user?.id || !user?.tenantId) {
        res.status(400).json({
          success: false,
          error: 'User authentication required'
        });
        return;
      }

      const { userId, tenantId } = { userId: user.id, tenantId: user.tenantId };
      
      console.log('[NOTIFICATION-PREFERENCES] Getting preferences for user:', userId, 'tenant:', tenantId);

      console.log('[USER-NOTIFICATION-PREFERENCES-CONTROLLER] GET request - User:', userId, 'Tenant:', tenantId);

      const preferences = await this.preferenceRepository.getUserPreferences(userId, tenantId);

      res.json({
        success: true,
        data: preferences
      });
    } catch (error) {
      console.error('Error fetching user notification preferences:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch notification preferences'
      });
    }
  }

  // PUT /api/user/notification-preferences - Update user preferences
  async updateUserPreferences(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const { userId, tenantId } = { userId: user?.id, tenantId: user?.tenantId };
      const { preferences, globalSettings } = req.body;

      if (!userId || !tenantId) {
        res.status(400).json({
          success: false,
          error: 'User authentication required'
        });
        return;
      }

      console.log('[USER-NOTIFICATION-PREFERENCES-CONTROLLER] PUT request - User:', userId, 'Tenant:', tenantId);

      const userPreferences = {
        userId,
        tenantId,
        preferences: preferences || {},
        globalSettings: globalSettings || {}
      };

      const success = await this.preferenceRepository.updateUserPreferences(userId, tenantId, userPreferences);

      if (success) {
        res.json({
          success: true,
          message: 'Notification preferences updated successfully'
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Failed to update notification preferences'
        });
      }
    } catch (error) {
      console.error('Error updating user notification preferences:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update notification preferences'
      });
    }
  }

  // POST /api/user/notification-preferences/reset - Reset to defaults
  async resetToDefaults(req: Request, res: Response): Promise<void> {
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

      console.log('[USER-NOTIFICATION-PREFERENCES-CONTROLLER] POST reset request - User:', userId, 'Tenant:', tenantId);

      const success = await this.preferenceRepository.resetToDefaults(userId, tenantId);

      if (success) {
        res.json({
          success: true,
          message: 'Notification preferences reset to defaults'
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Failed to reset notification preferences'
        });
      }
    } catch (error) {
      console.error('Error resetting notification preferences:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to reset notification preferences'
      });
    }
  }

  // GET /api/admin/notification-preferences/stats - Get preference statistics (admin only)
  async getPreferenceStats(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const { tenantId } = user || {};

      if (!tenantId) {
        res.status(400).json({
          success: false,
          error: 'Tenant ID is required'
        });
        return;
      }

      const stats = await this.preferenceRepository.getPreferenceStats(tenantId);

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error fetching preference stats:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch preference statistics'
      });
    }
  }

  // PUT /api/user/notification-preferences/:type - Update specific notification type preference
  async updateNotificationTypePreference(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const { userId, tenantId } = { userId: user?.id, tenantId: user?.tenantId };
      const { type } = req.params;
      const { enabled, channels, digestFrequency, quietHours } = req.body;

      if (!userId || !tenantId) {
        res.status(400).json({
          success: false,
          error: 'User authentication required'
        });
        return;
      }

      console.log('[USER-NOTIFICATION-PREFERENCES-CONTROLLER] PUT type-specific request - User:', userId, 'Type:', type);

      // Get current preferences
      const currentPreferences = await this.preferenceRepository.getUserPreferences(userId, tenantId);
      
      // Update specific notification type
      currentPreferences.preferences[type] = {
        enabled: enabled ?? currentPreferences.preferences[type]?.enabled ?? true,
        channels: channels ?? currentPreferences.preferences[type]?.channels ?? ['in_app'],
        digestFrequency: digestFrequency ?? currentPreferences.preferences[type]?.digestFrequency ?? 'immediate',
        quietHours: quietHours ?? currentPreferences.preferences[type]?.quietHours
      };

      const success = await this.preferenceRepository.updateUserPreferences(userId, tenantId, currentPreferences);

      if (success) {
        res.json({
          success: true,
          message: `Preference for ${type} updated successfully`
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Failed to update notification preference'
        });
      }
    } catch (error) {
      console.error('Error updating notification type preference:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update notification preference'
      });
    }
  }

  // GET /api/user/notification-preferences/test/:channel - Test notification channel
  async testNotificationChannel(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const { userId, tenantId } = { userId: user?.id, tenantId: user?.tenantId };
      const { channel } = req.params;

      if (!userId || !tenantId) {
        res.status(400).json({
          success: false,
          error: 'User authentication required'
        });
        return;
      }

      // This would send a test notification through the specified channel
      // For now, just return success with channel info
      const supportedChannels = ['email', 'sms', 'in_app', 'webhook', 'slack'];
      
      if (!supportedChannels.includes(channel)) {
        res.status(400).json({
          success: false,
          error: `Unsupported channel: ${channel}`
        });
        return;
      }

      res.json({
        success: true,
        message: `Test notification would be sent via ${channel}`,
        data: {
          channel,
          userId,
          testMessage: 'This is a test notification from Conductor system'
        }
      });
    } catch (error) {
      console.error('Error testing notification channel:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to test notification channel'
      });
    }
  }
}