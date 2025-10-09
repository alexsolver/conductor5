import { IAiAgentRepository } from '../../domain/repositories/IAiAgentRepository';
import { AIAgent } from '../../domain/entities/AiAgent';

export interface UpdateAiAgentRequest {
  id: string;
  tenantId: string;
  name?: string;
  description?: string;
  configPrompt?: string;
  allowedFormIds?: string[];
  isActive?: boolean;
}

export interface UpdateAiAgentResponse {
  success: boolean;
  agent?: AIAgent;
  error?: string;
}

export class UpdateAiAgentUseCase {
  constructor(private agentRepository: IAiAgentRepository) {}

  async execute(request: UpdateAiAgentRequest): Promise<UpdateAiAgentResponse> {
    try {
      console.log(`🤖 [UpdateAiAgent] Updating agent ${request.id} for tenant: ${request.tenantId}`);

      const existing = await this.agentRepository.findAgentById(request.id, request.tenantId);
      if (!existing) {
        return {
          success: false,
          error: 'Agente não encontrado'
        };
      }

      const updates: Partial<AIAgent> = {};
      if (request.name !== undefined) updates.name = request.name;
      if (request.description !== undefined) updates.description = request.description;
      if (request.configPrompt !== undefined) updates.configPrompt = request.configPrompt;
      if (request.allowedFormIds !== undefined) updates.allowedFormIds = request.allowedFormIds;
      if (request.isActive !== undefined) updates.isActive = request.isActive;

      const agent = await this.agentRepository.updateAgent(request.id, request.tenantId, updates);

      console.log(`✅ [UpdateAiAgent] Agent ${request.id} updated successfully`);

      return {
        success: true,
        agent
      };

    } catch (error) {
      console.error('❌ [UpdateAiAgent] Error updating agent:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
}
