
import { IChannelRepository } from '../../domain/repositories/IChannelRepository';

export class ToggleChannelUseCase {
  constructor(private channelRepository: IChannelRepository) {}

  async execute(channelId: string, tenantId: string, isEnabled: boolean): Promise<boolean> {
    if (!tenantId) {
      throw new Error('Tenant ID is required');
    }

    if (!channelId) {
      throw new Error('Channel ID is required');
    }

    // Verificar se o canal existe
    const channel = await this.channelRepository.findById(channelId, tenantId);
    if (!channel) {
      throw new Error('Channel not found');
    }

    // Atualizar status
    return await this.channelRepository.toggleStatus(channelId, tenantId, isEnabled);
  }
}
