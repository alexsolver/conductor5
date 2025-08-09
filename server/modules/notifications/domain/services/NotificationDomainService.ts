
import { Notification } from '../entities/Notification';

export class NotificationDomainService {
  validateNotificationData(title: string, message: string, recipientId: string): boolean {
    return title.trim().length > 0 && 
           message.trim().length > 0 && 
           recipientId.trim().length > 0;
  }

  isValidNotificationType(type: string): boolean {
    const validTypes = ['info', 'warning', 'error', 'success', 'urgent'];
    return validTypes.includes(type.toLowerCase());
  }

  shouldSendImmediately(type: string, priority?: string): boolean {
    return type === 'urgent' || priority === 'high';
  }
}
