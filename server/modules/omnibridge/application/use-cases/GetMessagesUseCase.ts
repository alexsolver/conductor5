
import { IMessageRepository } from '../../domain/repositories/IMessageRepository';
import { MessageEntity } from '../../domain/entities/Message';

export interface GetMessagesParams {
  tenantId: string;
  limit?: number;
  offset?: number;
  channelId?: string;
  status?: string;
  priority?: string;
}

export class GetMessagesUseCase {
  constructor(private messageRepository: IMessageRepository) {}

  async execute(params: GetMessagesParams): Promise<MessageEntity[]> {
    if (!params.tenantId) {
      throw new Error('Tenant ID is required');
    }

    if (params.channelId) {
      return await this.messageRepository.findByChannel(params.channelId, params.tenantId);
    }

    if (params.status) {
      return await this.messageRepository.findByStatus(params.status, params.tenantId);
    }

    if (params.priority) {
      return await this.messageRepository.findByPriority(params.priority, params.tenantId);
    }

    return await this.messageRepository.findByTenant(
      params.tenantId,
      params.limit,
      params.offset
    );
  }
}
