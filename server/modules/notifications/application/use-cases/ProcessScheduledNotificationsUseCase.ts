
/**
 * Process Scheduled Notifications Use Case
 * Clean Architecture - Application Layer
 */

import { INotificationRepository } from '../../domain/ports/INotificationRepository';
import { INotificationService } from '../../domain/ports/INotificationService';

export class ProcessScheduledNotificationsUseCase {
  constructor(
    private notificationRepository: INotificationRepository,
    private notificationService: INotificationService
  ) {}

  async execute(tenantId: string): Promise<{ processed: number; failed: number }> {
    const pendingNotifications = await this.notificationRepository.findPendingNotifications(tenantId);
    
    let processed = 0;
    let failed = 0;

    for (const notification of pendingNotifications) {
      if (notification.canBeSent()) {
        try {
          const sent = await this.notificationService.sendNotification(notification);
          
          if (sent) {
            const sentNotification = notification.markAsSent();
            await this.notificationRepository.update(sentNotification);
            processed++;
          } else {
            const failedNotification = notification.markAsFailed('Failed to send');
            await this.notificationRepository.update(failedNotification);
            failed++;
          }
        } catch (error) {
          const failedNotification = notification.markAsFailed((error as Error).message);
          await this.notificationRepository.update(failedNotification);
          failed++;
        }
      }
    }

    return { processed, failed };
  }
}
