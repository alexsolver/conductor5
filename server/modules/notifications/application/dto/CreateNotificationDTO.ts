
export interface CreateNotificationDTO {
  recipientId: string;
  title: string;
  message: string;
  type: string;
  priority?: string;
  scheduledFor?: Date;
  metadata?: Record<string, any>;
}

export interface NotificationResponseDTO {
  id: string;
  recipientId: string;
  title: string;
  message: string;
  type: string;
  priority?: string;
  isRead: boolean;
  createdAt: string;
  readAt?: string;
  metadata?: Record<string, any>;
}
