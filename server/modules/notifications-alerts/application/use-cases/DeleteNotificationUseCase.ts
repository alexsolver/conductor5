// ✅ 1QA.MD COMPLIANCE: DELETE NOTIFICATION USE CASE
// Application layer - Business logic for deleting notifications

import { INotificationRepository } from '../../domain/repositories/INotificationRepository';

export interface DeleteNotificationRequest {
  notificationId: string;
  tenantId: string;
  userId?: string;
}

export interface DeleteNotificationResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export class DeleteNotificationUseCase {
  constructor(
    private readonly notificationRepository: INotificationRepository
  ) {}

  async execute(request: DeleteNotificationRequest): Promise<DeleteNotificationResponse> {
    try {
      const { notificationId, tenantId, userId } = request;

      // Validate input
      if (!notificationId || !tenantId) {
        return {
          success: false,
          error: 'Notification ID and Tenant ID are required'
        };
      }

      // Check if notification exists and belongs to tenant
      const notification = await this.notificationRepository.findById(notificationId, tenantId);
      if (!notification) {
        return {
          success: false,
          error: 'Notification not found'
        };
      }

      // If userId is provided, verify ownership
      if (userId && notification.userId !== userId) {
        return {
          success: false,
          error: 'Access denied: notification belongs to different user'
        };
      }

      // Delete notification
      const deleted = await this.notificationRepository.delete(notificationId, tenantId);

      if (!deleted) {
        return {
          success: false,
          error: 'Failed to delete notification'
        };
      }

      return {
        success: true,
        message: 'Notification deleted successfully'
      };

    } catch (error) {
      console.error('Error in DeleteNotificationUseCase:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete notification'
      };
    }
  }
}