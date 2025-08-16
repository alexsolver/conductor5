// Application Controller - HTTP handling
import { Request, Response } from 'express';
import { GetUserNotificationPreferencesUseCase } from '../use-cases/GetUserNotificationPreferencesUseCase';
import { UpdateUserNotificationPreferencesUseCase, UpdateUserNotificationPreferencesRequest } from '../use-cases/UpdateUserNotificationPreferencesUseCase';

export class UserNotificationPreferencesController {
  constructor(
    private readonly getUserPreferencesUseCase: GetUserNotificationPreferencesUseCase,
    private readonly updateUserPreferencesUseCase: UpdateUserNotificationPreferencesUseCase
  ) {}

  async getPreferences(req: any, res: Response): Promise<void> {
    try {
      // Debug middleware JWT auth integration
      console.log(`[GET-USER-NOTIFICATION-PREFERENCES] Auth debug:`, {
        hasUser: !!req.user,
        userKeys: req.user ? Object.keys(req.user) : [],
        userId: req.user?.id,
        tenantId: req.user?.tenantId,
        params: req.params
      });

      const userId = req.user?.id || req.params.userId;
      const tenantId = req.user?.tenantId || req.headers['x-tenant-id'] as string;

      if (!userId) {
        console.error('[GET-USER-NOTIFICATION-PREFERENCES] User ID missing');
        res.status(400).json({
          success: false,
          error: 'User ID is required'
        });
        return;
      }

      if (!tenantId) {
        console.error('[GET-USER-NOTIFICATION-PREFERENCES] Tenant ID missing');
        res.status(400).json({
          success: false,
          error: 'Tenant ID is required'
        });
        return;
      }

      console.log(`[GET-USER-NOTIFICATION-PREFERENCES] Getting preferences for user ${userId} in tenant ${tenantId}`);

      const preferences = await this.getUserPreferencesUseCase.execute(userId, tenantId);

      res.json({
        success: true,
        data: {
          id: preferences.getId(),
          userId: preferences.getUserId(),
          tenantId: preferences.getTenantId(),
          preferences: preferences.getPreferences(),
          createdAt: preferences.getCreatedAt(),
          updatedAt: preferences.getUpdatedAt()
        }
      });
    } catch (error) {
      console.error('[GET-USER-NOTIFICATION-PREFERENCES] Error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  }

  async updatePreferences(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id || req.params.userId;
      const tenantId = (req as any).user?.tenantId || req.headers['x-tenant-id'] as string;

      if (!userId) {
        res.status(400).json({
          success: false,
          error: 'User ID is required'
        });
        return;
      }

      if (!tenantId) {
        res.status(400).json({
          success: false,
          error: 'Tenant ID is required'
        });
        return;
      }

      const request: UpdateUserNotificationPreferencesRequest = {
        userId,
        tenantId,
        preferences: req.body
      };

      const updatedPreferences = await this.updateUserPreferencesUseCase.execute(request);

      res.json({
        success: true,
        message: 'Notification preferences updated successfully',
        data: {
          id: updatedPreferences.getId(),
          userId: updatedPreferences.getUserId(),
          tenantId: updatedPreferences.getTenantId(),
          preferences: updatedPreferences.getPreferences(),
          createdAt: updatedPreferences.getCreatedAt(),
          updatedAt: updatedPreferences.getUpdatedAt()
        }
      });
    } catch (error) {
      console.error('Error updating user notification preferences:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  }
}