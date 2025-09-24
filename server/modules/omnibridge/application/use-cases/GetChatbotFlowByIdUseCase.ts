import { IChatbotFlowRepository } from '../../domain/repositories/IChatbotFlowRepository';
import { SelectChatbotFlow } from '../../../../../shared/schema-chatbot';

interface GetChatbotFlowByIdRequest {
  flowId: string;
  tenantId: string;
}

export class GetChatbotFlowByIdUseCase {
  constructor(private chatbotFlowRepository: IChatbotFlowRepository) {}

  async execute(request: GetChatbotFlowByIdRequest): Promise<SelectChatbotFlow | null> {
    const { flowId } = request;
    
    const flow = await this.chatbotFlowRepository.findById(flowId);
    
    // Tenant isolation is handled by schema-level separation
    if (!flow) {
      return null;
    }

    return flow;
  }
}