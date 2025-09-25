import { AiAgent, AiAgentPersonality, AiAgentConversationConfig, AiAgentConfig } from '../../domain/entities/AiAgent';
import { IAiAgentRepository } from '../../domain/repositories/IAiAgentRepository';

export interface CreateAiAgentRequest {
  tenantId: string;
  name: string;
  description: string;
  personality: AiAgentPersonality;
  channels: string[];
  enabledActions: string[];
  conversationConfig: AiAgentConversationConfig;
  aiConfig: AiAgentConfig;
  priority?: number;
}

export interface CreateAiAgentResponse {
  success: boolean;
  agent?: AiAgent;
  error?: string;
}

export class CreateAiAgentUseCase {
  constructor(private agentRepository: IAiAgentRepository) {}

  async execute(request: CreateAiAgentRequest): Promise<CreateAiAgentResponse> {
    try {
      console.log(`🤖 [CreateAiAgent] Creating agent "${request.name}" for tenant: ${request.tenantId}`);

      // Validar dados de entrada
      const validation = this.validateRequest(request);
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.error
        };
      }

      // Gerar ID único para o agente
      const agentId = `agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Criar entidade do agente
      const agent = new AiAgent(
        agentId,
        request.tenantId,
        request.name,
        request.description,
        request.personality,
        request.channels,
        request.enabledActions,
        request.conversationConfig,
        request.aiConfig,
        true, // isActive
        request.priority || 1
      );

      // Salvar no repositório
      const savedAgent = await this.agentRepository.create(agent);

      console.log(`✅ [CreateAiAgent] Agent "${request.name}" created successfully with ID: ${agentId}`);

      return {
        success: true,
        agent: savedAgent
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
      return { isValid: false, error: 'Tenant ID is required' };
    }

    if (!request.name || request.name.trim().length === 0) {
      return { isValid: false, error: 'Agent name is required' };
    }

    if (request.name.length > 255) {
      return { isValid: false, error: 'Agent name must be less than 255 characters' };
    }

    if (!request.channels || request.channels.length === 0) {
      return { isValid: false, error: 'At least one channel must be specified' };
    }

    if (!request.enabledActions || request.enabledActions.length === 0) {
      return { isValid: false, error: 'At least one action must be enabled' };
    }

    // Validar canais suportados
    const supportedChannels = ['email', 'whatsapp', 'telegram', 'slack', 'sms'];
    const invalidChannels = request.channels.filter(channel => !supportedChannels.includes(channel));
    if (invalidChannels.length > 0) {
      return { isValid: false, error: `Unsupported channels: ${invalidChannels.join(', ')}` };
    }

    // Validar ações suportadas
    const supportedActions = [
      'send_notification', 'create_ticket', 'send_auto_reply', 'forward_message',
      'assign_agent', 'add_tags', 'escalate', 'archive', 'mark_priority', 'webhook_call'
    ];
    const invalidActions = request.enabledActions.filter(action => !supportedActions.includes(action));
    if (invalidActions.length > 0) {
      return { isValid: false, error: `Unsupported actions: ${invalidActions.join(', ')}` };
    }

    return { isValid: true };
  }
}