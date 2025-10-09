import { IAiAgentRepository } from '../../domain/repositories/IAiAgentRepository';
import { AIAgent } from '../../domain/entities/AiAgent';

export interface CreateAiAgentRequest {
  tenantId: string;
  name: string;
  description?: string;
  configPrompt: string;
  allowedFormIds?: string[];
  createdBy: string;
}

export interface CreateAiAgentResponse {
  success: boolean;
  agent?: AIAgent;
  error?: string;
}

export class CreateAiAgentUseCase {
  constructor(private agentRepository: IAiAgentRepository) {}

  async execute(request: CreateAiAgentRequest): Promise<CreateAiAgentResponse> {
    try {
      console.log(`🤖 [CreateAiAgent] Creating agent "${request.name}" for tenant: ${request.tenantId}`);

      const validation = this.validateRequest(request);
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.error
        };
      }

      const agent = await this.agentRepository.createAgent({
        tenantId: request.tenantId,
        name: request.name,
        description: request.description,
        configPrompt: request.configPrompt,
        allowedFormIds: request.allowedFormIds || [],
        isActive: true,
        createdBy: request.createdBy
      });

      console.log(`✅ [CreateAiAgent] Agent "${request.name}" created successfully with ID: ${agent.id}`);

      return {
        success: true,
        agent
      };

    } catch (error) {
      console.error('❌ [CreateAiAgent] Error creating agent:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  private validateRequest(request: CreateAiAgentRequest): { isValid: boolean; error?: string } {
    if (!request.tenantId) {
      return { isValid: false, error: 'Tenant ID é obrigatório' };
    }

    if (!request.name || request.name.trim().length === 0) {
      return { isValid: false, error: 'Nome do agente é obrigatório' };
    }

    if (request.name.length > 255) {
      return { isValid: false, error: 'Nome do agente deve ter menos de 255 caracteres' };
    }

    if (!request.configPrompt || request.configPrompt.trim().length === 0) {
      return { isValid: false, error: 'Prompt de configuração é obrigatório' };
    }

    if (!request.createdBy) {
      return { isValid: false, error: 'Criador do agente é obrigatório' };
    }

    return { isValid: true };
  }
}
