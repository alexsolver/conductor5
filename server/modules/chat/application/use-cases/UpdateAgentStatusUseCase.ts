/**
 * UPDATE AGENT STATUS USE CASE
 * Application Layer - Change agent availability status
 */

import { v4 as uuidv4 } from 'uuid';
import { AgentStatus, AgentStatusType } from '../../domain/entities/AgentStatus';
import { IAgentStatusRepository } from '../../domain/repositories/IAgentStatusRepository';

export interface UpdateAgentStatusRequest {
  tenantId: string;
  userId: string;
  status: AgentStatusType;
  maxConcurrentChats?: number;
}

export class UpdateAgentStatusUseCase {
  constructor(private agentStatusRepository: IAgentStatusRepository) {}

  async execute(request: UpdateAgentStatusRequest): Promise<AgentStatus> {
    // Try to find existing status
    let agentStatus = await this.agentStatusRepository.findByUserId(
      request.userId,
      request.tenantId
    );

    if (!agentStatus) {
      // Create new status
      agentStatus = {
        id: uuidv4(),
        tenantId: request.tenantId,
        userId: request.userId,
        status: request.status,
        currentChatsCount: 0,
        maxConcurrentChats: request.maxConcurrentChats || 3,
        lastStatusChange: new Date(),
        lastActivityAt: new Date(),
        metadata: {},
        updatedAt: new Date(),
      };

      return await this.agentStatusRepository.create(agentStatus);
    }

    // Update existing status
    const updateData: Partial<AgentStatus> = {
      status: request.status,
      lastStatusChange: new Date(),
      lastActivityAt: new Date(),
      updatedAt: new Date(),
    };

    if (request.maxConcurrentChats !== undefined) {
      updateData.maxConcurrentChats = request.maxConcurrentChats;
    }

    return await this.agentStatusRepository.update(
      request.userId,
      request.tenantId,
      updateData
    );
  }
}
