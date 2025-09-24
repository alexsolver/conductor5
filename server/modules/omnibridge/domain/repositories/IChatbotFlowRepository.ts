import { 
  SelectChatbotFlow, 
  InsertChatbotFlow, 
  UpdateChatbotFlow,
  ChatbotFlowWithNodes
} from '../../../../../shared/schema-chatbot';

export interface IChatbotFlowRepository {
  // Basic CRUD operations
  create(flow: InsertChatbotFlow & { tenantId: string }): Promise<SelectChatbotFlow>;
  findById(id: string, tenantId: string): Promise<SelectChatbotFlow | null>;
  findByBot(botId: string, tenantId: string): Promise<SelectChatbotFlow[]>;
  findActiveByBot(botId: string, tenantId: string): Promise<SelectChatbotFlow | null>;
  update(id: string, updates: UpdateChatbotFlow, tenantId: string): Promise<SelectChatbotFlow | null>;
  delete(id: string, tenantId: string): Promise<boolean>;
  
  // Version management
  createVersion(flowId: string, version: number, tenantId: string): Promise<SelectChatbotFlow>;
  activateVersion(flowId: string, tenantId: string): Promise<boolean>;
  deactivateVersion(flowId: string, tenantId: string): Promise<boolean>;
  getLatestVersion(botId: string, tenantId: string): Promise<SelectChatbotFlow | null>;
  getAllVersions(botId: string, tenantId: string): Promise<SelectChatbotFlow[]>;
  
  // Complete flow with nodes and edges
  findWithNodes(id: string, tenantId: string): Promise<ChatbotFlowWithNodes | null>;
  findActiveWithNodes(botId: string, tenantId: string): Promise<ChatbotFlowWithNodes | null>;
  
  // Publishing
  publish(id: string, tenantId: string): Promise<boolean>;
  unpublish(id: string, tenantId: string): Promise<boolean>;
  
  // Statistics
  getFlowStats(id: string, tenantId: string): Promise<{
    executionCount: number;
    successRate: number;
    averageDuration: number;
    lastExecuted?: Date;
  }>;

  // Complete flow management
  saveCompleteFlow(flowId: string, nodes: any[], edges: any[], tenantId: string): Promise<boolean>;
}