
import { IChannelRepository } from '../../domain/repositories/IChannelRepository';
import { ChannelEntity } from '../../domain/entities/Channel';

export class GetChannelsUseCase {
  constructor(private channelRepository: IChannelRepository) {}

  async execute(tenantId: string): Promise<ChannelEntity[]> {
    if (!tenantId) {
      throw new Error('Tenant ID is required');
    }

    return await this.channelRepository.findByTenant(tenantId);
  }
}
