import { 
  SelectChatbotEdge, 
  InsertChatbotEdge, 
  UpdateChatbotEdge
} from '../../../../../shared/schema-chatbot';

export interface IChatbotEdgeRepository {
  // Basic CRUD operations
  create(edge: InsertChatbotEdge): Promise<SelectChatbotEdge>;
  createMany(edges: InsertChatbotEdge[]): Promise<SelectChatbotEdge[]>;
  findById(id: string): Promise<SelectChatbotEdge | null>;
  findByFlow(flowId: string): Promise<SelectChatbotEdge[]>;
  findByNode(nodeId: string): Promise<{
    incoming: SelectChatbotEdge[];
    outgoing: SelectChatbotEdge[];
  }>;
  update(id: string, updates: UpdateChatbotEdge): Promise<SelectChatbotEdge | null>;
  delete(id: string): Promise<boolean>;
  deleteByFlow(flowId: string): Promise<boolean>;
  deleteByNode(nodeId: string): Promise<boolean>;
  
  // Edge management
  findFromNode(fromNodeId: string): Promise<SelectChatbotEdge[]>;
  findToNode(toNodeId: string): Promise<SelectChatbotEdge[]>;
  findByKind(flowId: string, kind: string): Promise<SelectChatbotEdge[]>;
  
  // Order management
  reorderEdges(fromNodeId: string, edgeOrders: { id: string; order: number }[]): Promise<boolean>;
  
  // Connection validation
  validateConnection(fromNodeId: string, toNodeId: string): Promise<{
    isValid: boolean;
    reason?: string;
  }>;
  
  // Flow traversal helpers
  getNextNodes(currentNodeId: string, context?: any): Promise<SelectChatbotEdge[]>;
  findConditionalEdges(nodeId: string): Promise<SelectChatbotEdge[]>;
  
  // Enable/disable
  toggleEdge(id: string, isEnabled: boolean): Promise<boolean>;
  
  // Cycle detection
  detectCycles(flowId: string): Promise<{
    hasCycles: boolean;
    cycles: string[][];
  }>;
}