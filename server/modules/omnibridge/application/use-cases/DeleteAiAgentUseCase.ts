import { IAiAgentRepository } from '../../domain/repositories/IAiAgentRepository';

export interface DeleteAiAgentRequest {
  id: string;
  tenantId: string;
}

export interface DeleteAiAgentResponse {
  success: boolean;
  error?: string;
}

export class DeleteAiAgentUseCase {
  constructor(private agentRepository: IAiAgentRepository) {}

  async execute(request: DeleteAiAgentRequest): Promise<DeleteAiAgentResponse> {
    try {
      console.log(`🤖 [DeleteAiAgent] Deleting agent ${request.id} for tenant: ${request.tenantId}`);

      const result = await this.agentRepository.deleteAgent(request.id, request.tenantId);

      if (!result) {
        return {
          success: false,
          error: 'Agente não encontrado'
        };
      }

      console.log(`✅ [DeleteAiAgent] Agent ${request.id} deleted successfully`);

      return {
        success: true
      };

    } catch (error) {
      console.error('❌ [DeleteAiAgent] Error deleting agent:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
}
