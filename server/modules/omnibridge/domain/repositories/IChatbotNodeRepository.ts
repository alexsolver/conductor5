import { 
  SelectChatbotNode, 
  InsertChatbotNode, 
  UpdateChatbotNode,
  ChatbotNodeWithForm
} from '../../../../../shared/schema-chatbot';

export interface IChatbotNodeRepository {
  // Basic CRUD operations
  create(node: InsertChatbotNode): Promise<SelectChatbotNode>;
  createMany(nodes: InsertChatbotNode[]): Promise<SelectChatbotNode[]>;
  findById(id: string): Promise<SelectChatbotNode | null>;
  findByFlow(flowId: string): Promise<SelectChatbotNode[]>;
  findByCategory(flowId: string, category: string): Promise<SelectChatbotNode[]>;
  update(id: string, updates: UpdateChatbotNode): Promise<SelectChatbotNode | null>;
  updateMany(updates: { id: string; updates: UpdateChatbotNode }[]): Promise<SelectChatbotNode[]>;
  delete(id: string): Promise<boolean>;
  deleteByFlow(flowId: string): Promise<boolean>;
  
  // Flow structure
  findStartNodes(flowId: string): Promise<SelectChatbotNode[]>;
  findEndNodes(flowId: string): Promise<SelectChatbotNode[]>;
  findNodesByType(flowId: string, type: string): Promise<SelectChatbotNode[]>;
  
  // Node relationships
  findWithForm(id: string): Promise<ChatbotNodeWithForm | null>;
  findConnectedNodes(nodeId: string): Promise<{
    incoming: SelectChatbotNode[];
    outgoing: SelectChatbotNode[];
  }>;
  
  // Position management
  updatePosition(id: string, position: { x: number; y: number }): Promise<boolean>;
  updatePositions(updates: { id: string; position: { x: number; y: number } }[]): Promise<boolean>;
  
  // Enable/disable
  toggleNode(id: string, isEnabled: boolean): Promise<boolean>;
  
  // Validation
  validateFlowStructure(flowId: string): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }>;
}