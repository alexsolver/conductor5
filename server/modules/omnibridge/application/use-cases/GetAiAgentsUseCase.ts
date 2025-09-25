import { AiAgent } from '../../domain/entities/AiAgent';
import { IAiAgentRepository } from '../../domain/repositories/IAiAgentRepository';

export interface GetAiAgentsRequest {
  tenantId: string;
  channelType?: string;
}

export interface GetAiAgentsResponse {
  success: boolean;
  agents?: AiAgent[];
  error?: string;
}

export class GetAiAgentsUseCase {
  constructor(private agentRepository: IAiAgentRepository) {}

  async execute(request: GetAiAgentsRequest): Promise<GetAiAgentsResponse> {
    try {
      console.log(`🤖 [GetAiAgents] Fetching agents for tenant: ${request.tenantId}`);

      let agents: AiAgent[];

      if (request.channelType) {
        agents = await this.agentRepository.findByChannel(request.channelType, request.tenantId);
        console.log(`📋 [GetAiAgents] Found ${agents.length} agents for channel: ${request.channelType}`);
      } else {
        agents = await this.agentRepository.findByTenantId(request.tenantId);
        console.log(`📋 [GetAiAgents] Found ${agents.length} total agents`);
      }

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