import { IChatbotNodeRepository } from '../../domain/repositories/IChatbotNodeRepository';
import { IChatbotEdgeRepository } from '../../domain/repositories/IChatbotEdgeRepository';
import { IChatbotFlowRepository } from '../../domain/repositories/IChatbotFlowRepository';
import { 
  InsertChatbotNode, 
  SelectChatbotNode, 
  UpdateChatbotNode,
  InsertChatbotEdge,
  SelectChatbotEdge
} from '../../../../../shared/schema-chatbot';

export interface CreateNodeRequest {
  flowId: string;
  category: string;
  type: string;
  title: string;
  description?: string;
  position: { x: number; y: number };
  config?: any;
  isStart?: boolean;
  isEnd?: boolean;
}

export interface UpdateNodeRequest {
  nodeId: string;
  updates: {
    title?: string;
    description?: string;
    position?: { x: number; y: number };
    config?: any;
    isEnabled?: boolean;
  };
}

export interface CreateEdgeRequest {
  flowId: string;
  fromNodeId: string;
  toNodeId: string;
  label?: string;
  condition?: string;
  kind?: 'conditional' | 'success' | 'default' | 'error' | 'timeout';
  order?: number;
}

export class ManageFlowNodesUseCase {
  constructor(
    private nodeRepository: IChatbotNodeRepository,
    private edgeRepository: IChatbotEdgeRepository,
    private flowRepository: IChatbotFlowRepository
  ) {}

  async createNode(request: CreateNodeRequest): Promise<SelectChatbotNode> {
    // Validate flow exists
    const flow = await this.flowRepository.findById(request.flowId);
    if (!flow) {
      throw new Error('Flow not found');
    }

    const nodeData: InsertChatbotNode = {
      flowId: request.flowId,
      category: request.category as any,
      type: request.type,
      title: request.title,
      description: request.description || null,
      position: request.position,
      config: request.config || {},
      isStart: request.isStart || false,
      isEnd: request.isEnd || false,
      isEnabled: true
    };

    return await this.nodeRepository.create(nodeData);
  }

  async updateNode(request: UpdateNodeRequest): Promise<SelectChatbotNode | null> {
    const updateData: UpdateChatbotNode = request.updates;
    return await this.nodeRepository.update(request.nodeId, updateData);
  }

  async deleteNode(nodeId: string): Promise<boolean> {
    // Delete all edges connected to this node first
    await this.edgeRepository.deleteByNode(nodeId);
    
    // Then delete the node
    return await this.nodeRepository.delete(nodeId);
  }

  async createEdge(request: CreateEdgeRequest): Promise<SelectChatbotEdge> {
    // Validate connection
    const validation = await this.edgeRepository.validateConnection(
      request.fromNodeId, 
      request.toNodeId
    );
    
    if (!validation.isValid) {
      throw new Error(`Invalid connection: ${validation.reason}`);
    }

    const edgeData: InsertChatbotEdge = {
      flowId: request.flowId,
      fromNodeId: request.fromNodeId,
      toNodeId: request.toNodeId,
      label: request.label || null,
      condition: request.condition || null,
      kind: request.kind || 'default',
      order: request.order || 0,
      isEnabled: true
    };

    return await this.edgeRepository.create(edgeData);
  }

  async deleteEdge(edgeId: string): Promise<boolean> {
    return await this.edgeRepository.delete(edgeId);
  }

  async getFlowStructure(flowId: string): Promise<{
    nodes: SelectChatbotNode[];
    edges: SelectChatbotEdge[];
  }> {
    const [nodes, edges] = await Promise.all([
      this.nodeRepository.findByFlow(flowId),
      this.edgeRepository.findByFlow(flowId)
    ]);

    return { nodes, edges };
  }

  async validateFlowStructure(flowId: string): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    // Validate nodes structure
    const nodeValidation = await this.nodeRepository.validateFlowStructure(flowId);
    
    // Check for cycles
    const cycleValidation = await this.edgeRepository.detectCycles(flowId);
    
    const errors = [...nodeValidation.errors];
    const warnings = [...nodeValidation.warnings];
    
    if (cycleValidation.hasCycles) {
      errors.push(`Flow contains cycles: ${cycleValidation.cycles.map(cycle => cycle.join(' -> ')).join(', ')}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  async updateNodePositions(updates: { id: string; position: { x: number; y: number } }[]): Promise<boolean> {
    return await this.nodeRepository.updatePositions(updates);
  }
}