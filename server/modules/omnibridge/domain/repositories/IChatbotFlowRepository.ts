import { 
  SelectChatbotFlow, 
  InsertChatbotFlow, 
  UpdateChatbotFlow,
  ChatbotFlowWithNodes
} from '../../../../../shared/schema-chatbot';

export interface IChatbotFlowRepository {
  // Basic CRUD operations
  create(flow: InsertChatbotFlow): Promise<SelectChatbotFlow>;
  findById(id: string): Promise<SelectChatbotFlow | null>;
  findByBot(botId: string): Promise<SelectChatbotFlow[]>;
  findActiveByBot(botId: string): Promise<SelectChatbotFlow | null>;
  update(id: string, updates: UpdateChatbotFlow): Promise<SelectChatbotFlow | null>;
  delete(id: string): Promise<boolean>;
  
  // Version management
  createVersion(flowId: string, version: number): Promise<SelectChatbotFlow>;
  activateVersion(flowId: string): Promise<boolean>;
  deactivateVersion(flowId: string): Promise<boolean>;
  getLatestVersion(botId: string): Promise<SelectChatbotFlow | null>;
  getAllVersions(botId: string): Promise<SelectChatbotFlow[]>;
  
  // Complete flow with nodes and edges
  findWithNodes(id: string): Promise<ChatbotFlowWithNodes | null>;
  findActiveWithNodes(botId: string): Promise<ChatbotFlowWithNodes | null>;
  
  // Publishing
  publish(id: string): Promise<boolean>;
  unpublish(id: string): Promise<boolean>;
  
  // Statistics
  getFlowStats(id: string): Promise<{
    executionCount: number;
    successRate: number;
    averageDuration: number;
    lastExecuted?: Date;
  }>;
}