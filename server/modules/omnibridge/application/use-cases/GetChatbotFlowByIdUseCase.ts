import { IChatbotFlowRepository } from '../../domain/repositories/IChatbotFlowRepository';
import { SelectChatbotFlow } from '../../../../../shared/schema-chatbot';

interface GetChatbotFlowByIdRequest {
  flowId: string;
  tenantId: string;
}

export class GetChatbotFlowByIdUseCase {
  constructor(private chatbotFlowRepository: IChatbotFlowRepository) {}

  async execute(request: GetChatbotFlowByIdRequest): Promise<SelectChatbotFlow | null> {
    const { flowId, tenantId } = request;
    
    const flow = await this.chatbotFlowRepository.findById(flowId);
    
    // SECURITY: Verify flow belongs to tenant
    if (!flow || flow.tenantId !== tenantId) {
      return null;
    }

    return flow;
  }
}