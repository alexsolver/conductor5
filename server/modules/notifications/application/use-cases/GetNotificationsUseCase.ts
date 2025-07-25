
/**
 * Get Notifications Use Case
 * Clean Architecture - Application Layer
 */

import { Notification } from '../../domain/entities/Notification';
import { INotificationRepository } from '../../domain/ports/INotificationRepository';

export interface GetNotificationsRequest {
  tenantId: string;
  userId?: string;
  status?: string;
  type?: string;
  severity?: string;
  limit?: number;
  offset?: number;
}

export interface GetNotificationsResponse {
  notifications: Notification[];
  total: number;
  unreadCount: number;
}

export class GetNotificationsUseCase {
  constructor(private notificationRepository: INotificationRepository) {}

  async execute(request: GetNotificationsRequest): Promise<GetNotificationsResponse> {
    let notifications: Notification[];

    if (request.userId) {
      notifications = await this.notificationRepository.findByUserId(
        request.userId,
        request.tenantId,
        request.limit,
        request.offset
      );
    } else if (request.status) {
      notifications = await this.notificationRepository.findByStatus(
        request.status,
        request.tenantId
      );
    } else if (request.type) {
      notifications = await this.notificationRepository.findByType(
        request.type,
        request.tenantId
      );
    } else if (request.severity) {
      notifications = await this.notificationRepository.findBySeverity(
        request.severity,
        request.tenantId
      );
    } else {
      throw new Error('At least one filter parameter is required');
    }

    const total = request.userId 
      ? await this.notificationRepository.countByUser(request.userId, request.tenantId)
      : notifications.length;

    const unreadCount = request.userId
      ? await this.notificationRepository.countUnreadByUser(request.userId, request.tenantId)
      : 0;

    return {
      notifications,
      total,
      unreadCount
    };
  }
}
