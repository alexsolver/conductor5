import { IAiAgentRepository } from '../../domain/repositories/IAiAgentRepository';
import { AIAgent } from '../../domain/entities/AiAgent';

export interface GetAiAgentsRequest {
  tenantId: string;
}

export interface GetAiAgentsResponse {
  success: boolean;
  agents?: AIAgent[];
  error?: string;
}

export class GetAiAgentsUseCase {
  constructor(private agentRepository: IAiAgentRepository) {}

  async execute(request: GetAiAgentsRequest): Promise<GetAiAgentsResponse> {
    try {
      console.log(`🤖 [GetAiAgents] Fetching agents for tenant: ${request.tenantId}`);

      const agents = await this.agentRepository.findAgentsByTenant(request.tenantId);
      
      console.log(`📋 [GetAiAgents] Found ${agents.length} total agents`);

      return {
        success: true,
        agents
      };

    } catch (error) {
      console.error('❌ [GetAiAgents] Error fetching agents:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
}
