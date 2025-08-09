import { CreateNotificationUseCase } from '../use-cases/CreateNotificationUseCase';
import { GetNotificationsUseCase } from '../use-cases/GetNotificationsUseCase';

export interface NotificationControllerRequest {
  tenantId: string;
  type?: string;
  content?: string;
  recipientId?: string;
}

export interface NotificationControllerResponse {
  success: boolean;
  data: any;
  message?: string;
}

export class NotificationController {
  constructor(
    private readonly createNotificationUseCase: CreateNotificationUseCase,
    private readonly getNotificationsUseCase: GetNotificationsUseCase
  ) {}

  async create(request: NotificationControllerRequest): Promise<NotificationControllerResponse> {
    try {
      const result = await this.createNotificationUseCase.execute({
        tenantId: request.tenantId,
        type: request.type!,
        content: request.content!,
        recipientId: request.recipientId!
      });

      return {
        success: true,
        data: result
      };
    } catch (error) {
      throw new Error(`Failed to create notification: ${error}`);
    }
  }

  async getAll(tenantId: string): Promise<NotificationControllerResponse> {
    try {
      const result = await this.getNotificationsUseCase.execute({ tenantId });

      return {
        success: true,
        data: result
      };
    } catch (error) {
      throw new Error(`Failed to get notifications: ${error}`);
    }
  }
}