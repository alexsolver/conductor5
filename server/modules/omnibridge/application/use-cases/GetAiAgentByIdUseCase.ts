import { IAiAgentRepository } from '../../domain/repositories/IAiAgentRepository';
import { AIAgent } from '../../domain/entities/AiAgent';

export interface GetAiAgentByIdRequest {
  id: string;
  tenantId: string;
}

export interface GetAiAgentByIdResponse {
  success: boolean;
  agent?: AIAgent;
  error?: string;
}

export class GetAiAgentByIdUseCase {
  constructor(private agentRepository: IAiAgentRepository) {}

  async execute(request: GetAiAgentByIdRequest): Promise<GetAiAgentByIdResponse> {
    try {
      console.log(`🤖 [GetAiAgentById] Fetching agent ${request.id} for tenant: ${request.tenantId}`);

      const agent = await this.agentRepository.findAgentById(request.id, request.tenantId);

      if (!agent) {
        return {
          success: false,
          error: 'Agente não encontrado'
        };
      }

      console.log(`✅ [GetAiAgentById] Agent ${request.id} found`);

      return {
        success: true,
        agent
      };

    } catch (error) {
      console.error('❌ [GetAiAgentById] Error fetching agent:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
}
