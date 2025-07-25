
/**
 * Create Notification Use Case
 * Clean Architecture - Application Layer
 */

import { Notification, NotificationCreateProps } from '../../domain/entities/Notification';
import { INotificationRepository } from '../../domain/ports/INotificationRepository';
import { INotificationPreferenceRepository } from '../../domain/ports/INotificationPreferenceRepository';
import { IIdGenerator } from '../../../shared/domain/ports/IIdGenerator';
import { INotificationService } from '../../domain/ports/INotificationService';

export class CreateNotificationUseCase {
  constructor(
    private notificationRepository: INotificationRepository,
    private preferenceRepository: INotificationPreferenceRepository,
    private notificationService: INotificationService,
    private idGenerator: IIdGenerator
  ) {}

  async execute(props: NotificationCreateProps): Promise<string> {
    // Check user preferences
    const userPreference = await this.preferenceRepository.findByUserAndType(
      props.userId,
      props.type,
      props.tenantId
    );

    // Create notification
    const notification = Notification.create(props, this.idGenerator);

    // Apply user preferences if they exist
    if (userPreference && !userPreference.shouldReceiveNotification(notification)) {
      // User has disabled this type of notification
      throw new Error('User has disabled this notification type');
    }

    // Filter channels based on user preferences
    if (userPreference) {
      const allowedChannels = notification.getChannels().filter(channel =>
        userPreference.getChannels().includes(channel)
      );
      
      if (allowedChannels.length === 0) {
        throw new Error('No allowed channels for this notification');
      }
    }

    // Save notification
    await this.notificationRepository.save(notification);

    // Send immediately if scheduled for now or past
    if (notification.canBeSent()) {
      try {
        const sent = await this.notificationService.sendNotification(notification);
        if (sent) {
          const updatedNotification = notification.markAsSent();
          await this.notificationRepository.update(updatedNotification);
        }
      } catch (error) {
        const failedNotification = notification.markAsFailed((error as Error).message);
        await this.notificationRepository.update(failedNotification);
      }
    }

    return notification.getId();
  }
}
