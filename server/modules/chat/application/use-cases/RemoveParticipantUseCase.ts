/**
 * REMOVE PARTICIPANT USE CASE
 * Application Layer - Remove participant from chat
 */

import { IChatRepository } from '../../domain/repositories/IChatRepository';

export interface RemoveParticipantRequest {
  tenantId: string;
  chatId: string;
  participantId: string;
}

export class RemoveParticipantUseCase {
  constructor(private chatRepository: IChatRepository) {}

  async execute(request: RemoveParticipantRequest): Promise<void> {
    // 1. Validate chat exists
    const chat = await this.chatRepository.findChatById(request.chatId, request.tenantId);
    if (!chat) {
      throw new Error('Chat not found');
    }

    // 2. Get participants
    const participants = await this.chatRepository.findParticipants(
      request.chatId,
      request.tenantId
    );

    const participant = participants.find(p => p.id === request.participantId);
    if (!participant) {
      throw new Error('Participant not found');
    }

    // 3. Remove participant (soft delete by setting isActive = false and leftAt)
    await this.chatRepository.removeParticipant(request.participantId, request.tenantId);

    // 4. Update chat's updatedAt
    await this.chatRepository.updateChat(chat.id, {
      updatedAt: new Date(),
    });
  }
}
