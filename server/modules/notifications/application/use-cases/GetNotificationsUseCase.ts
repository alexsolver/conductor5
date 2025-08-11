
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
    // Clean Architecture: Use Case contains only business logic, no presentation concerns
    this.validateRequest(request);

    let notifications = await this.fetchNotifications(request);
    
    const total = await this.calculateTotal(request, notifications);
    const unreadCount = await this.calculateUnreadCount(request);

    return { notifications, total, unreadCount };
  }

  private validateRequest(request: GetNotificationsRequest): void {
    if (!request.tenantId) {
      throw new Error('Tenant ID is required');
    }
    
    const hasFilter = request.userId || request.status || request.type || request.severity;
    if (!hasFilter) {
      throw new Error('At least one filter parameter is required');
    }
  }

  private async fetchNotifications(request: GetNotificationsRequest): Promise<Notification[]> {
    if (request.userId) {
      return await this.notificationRepository.findByUserId(
        request.userId, request.tenantId, request.limit, request.offset
      );
    }
    if (request.status) {
      return await this.notificationRepository.findByStatus(request.status, request.tenantId);
    }
    if (request.type) {
      return await this.notificationRepository.findByType(request.type, request.tenantId);
    }
    if (request.severity) {
      return await this.notificationRepository.findBySeverity(request.severity, request.tenantId);
    }
    return [];
  }

  private async calculateTotal(request: GetNotificationsRequest, notifications: Notification[]): Promise<number> {
    return request.userId 
      ? await this.notificationRepository.countByUser(request.userId, request.tenantId)
      : notifications.length;
  }

  private async calculateUnreadCount(request: GetNotificationsRequest): Promise<number> {
    return request.userId
      ? await this.notificationRepository.countUnreadByUser(request.userId, request.tenantId)
      : 0;
  }
}
