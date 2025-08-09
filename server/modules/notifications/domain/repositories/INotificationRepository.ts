
export interface INotificationRepository {
  create(notification: any): Promise<any>;
  findById(id: string): Promise<any | null>;
  findByUserId(userId: string): Promise<any[]>;
  markAsRead(id: string): Promise<void>;
  delete(id: string): Promise<void>;
}
