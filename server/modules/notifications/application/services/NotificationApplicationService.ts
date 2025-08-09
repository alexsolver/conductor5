
import { CreateNotificationUseCase } from '../use-cases/CreateNotificationUseCase';
import { INotificationRepository } from '../../domain/ports/INotificationRepository';
import { CreateNotificationDTO, NotificationResponseDTO } from '../dto/CreateNotificationDTO';

export class NotificationApplicationService {
  constructor(
    private createNotificationUseCase: CreateNotificationUseCase,
    private notificationRepository: INotificationRepository
  ) {}

  async createNotification(dto: CreateNotificationDTO): Promise<NotificationResponseDTO> {
    const notification = await this.createNotificationUseCase.execute(dto);
    
    return {
      id: notification.id,
      recipientId: notification.recipientId,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      priority: notification.priority,
      isRead: notification.isRead,
      createdAt: notification.createdAt.toISOString(),
      readAt: notification.readAt?.toISOString(),
      metadata: notification.metadata
    };
  }

  async getNotificationsByRecipient(recipientId: string): Promise<NotificationResponseDTO[]> {
    const notifications = await this.notificationRepository.findByRecipientId(recipientId);
    
    return notifications.map(notification => ({
      id: notification.id,
      recipientId: notification.recipientId,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      priority: notification.priority,
      isRead: notification.isRead,
      createdAt: notification.createdAt.toISOString(),
      readAt: notification.readAt?.toISOString(),
      metadata: notification.metadata
    }));
  }
}
