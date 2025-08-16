// Application Layer - Controller following 1qa.md Clean Architecture
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
      // Extract authenticated user data following 1qa.md patterns
      const userId = req.user?.id;
      const tenantId = req.user?.tenantId;

      console.log(`[USER-NOTIFICATION-PREFERENCES-CONTROLLER] GET request - User: ${userId}, Tenant: ${tenantId}`);

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
      console.error('[USER-NOTIFICATION-PREFERENCES-CONTROLLER] Error getting preferences:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  }

  async updatePreferences(req: any, res: Response): Promise<void> {
    try {
      // Extract authenticated user data following 1qa.md patterns
      const userId = req.user?.id;
      const tenantId = req.user?.tenantId;
      const preferences = req.body;

      console.log(`[USER-NOTIFICATION-PREFERENCES-CONTROLLER] PUT request - User: ${userId}, Tenant: ${tenantId}`);

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

      const updateRequest: UpdateUserNotificationPreferencesRequest = {
        userId,
        tenantId,
        preferences
      };

      const updatedPreferences = await this.updateUserPreferencesUseCase.execute(updateRequest);

      res.json({
        success: true,
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
      console.error('[USER-NOTIFICATION-PREFERENCES-CONTROLLER] Error updating preferences:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  }
}