
export interface NotificationCreatedEvent {
  id: string;
  recipientId: string;
  title: string;
  message: string;
  type: string;
  createdAt: Date;
  metadata?: Record<string, any>;
}
