import { IChatbotNodeRepository } from '../../domain/repositories/IChatbotNodeRepository';
import { 
  SelectChatbotNode, 
  InsertChatbotNode, 
  UpdateChatbotNode,
  ChatbotNodeWithForm,
  chatbotNodes,
  chatbotEdges,
  chatbotForms,
  chatbotFormFields
} from '../../../../../shared/schema-chatbot';
import { db } from '../../../../../shared/schema';
import { eq, and, inArray } from 'drizzle-orm';

export class DrizzleChatbotNodeRepository implements IChatbotNodeRepository {
  async create(node: InsertChatbotNode): Promise<SelectChatbotNode> {
    const [createdNode] = await db.insert(chatbotNodes).values(node).returning();
    return createdNode as SelectChatbotNode;
  }

  async createMany(nodes: InsertChatbotNode[]): Promise<SelectChatbotNode[]> {
    const createdNodes = await db.insert(chatbotNodes).values(nodes).returning();
    return createdNodes as SelectChatbotNode[];
  }

  async findById(id: string): Promise<SelectChatbotNode | null> {
    const [node] = await db
      .select()
      .from(chatbotNodes)
      .where(eq(chatbotNodes.id, id))
      .limit(1);
    
    return (node as SelectChatbotNode) || null;
  }

  async findByFlow(flowId: string): Promise<SelectChatbotNode[]> {
    const nodes = await db
      .select()
      .from(chatbotNodes)
      .where(eq(chatbotNodes.flowId, flowId));
    
    return nodes as SelectChatbotNode[];
  }

  async findByCategory(flowId: string, category: string): Promise<SelectChatbotNode[]> {
    const nodes = await db
      .select()
      .from(chatbotNodes)
      .where(and(
        eq(chatbotNodes.flowId, flowId),
        eq(chatbotNodes.category, category as any)
      ));
    
    return nodes as SelectChatbotNode[];
  }

  async update(id: string, updates: UpdateChatbotNode): Promise<SelectChatbotNode | null> {
    const [updatedNode] = await db
      .update(chatbotNodes)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(chatbotNodes.id, id))
      .returning();
    
    return (updatedNode as SelectChatbotNode) || null;
  }

  async updateMany(updates: { id: string; updates: UpdateChatbotNode }[]): Promise<SelectChatbotNode[]> {
    const updatedNodes: SelectChatbotNode[] = [];
    
    for (const update of updates) {
      const result = await this.update(update.id, update.updates);
      if (result) updatedNodes.push(result);
    }
    
    return updatedNodes;
  }

  async delete(id: string): Promise<boolean> {
    const result = await db
      .delete(chatbotNodes)
      .where(eq(chatbotNodes.id, id));
    
    return (result.rowCount || 0) > 0;
  }

  async deleteByFlow(flowId: string): Promise<boolean> {
    const result = await db
      .delete(chatbotNodes)
      .where(eq(chatbotNodes.flowId, flowId));
    
    return (result.rowCount || 0) > 0;
  }

  async findStartNodes(flowId: string): Promise<SelectChatbotNode[]> {
    const nodes = await db
      .select()
      .from(chatbotNodes)
      .where(and(
        eq(chatbotNodes.flowId, flowId),
        eq(chatbotNodes.isStart, true)
      ));
    
    return nodes as SelectChatbotNode[];
  }

  async findEndNodes(flowId: string): Promise<SelectChatbotNode[]> {
    const nodes = await db
      .select()
      .from(chatbotNodes)
      .where(and(
        eq(chatbotNodes.flowId, flowId),
        eq(chatbotNodes.isEnd, true)
      ));
    
    return nodes as SelectChatbotNode[];
  }

  async findNodesByType(flowId: string, type: string): Promise<SelectChatbotNode[]> {
    const nodes = await db
      .select()
      .from(chatbotNodes)
      .where(and(
        eq(chatbotNodes.flowId, flowId),
        eq(chatbotNodes.type, type)
      ));
    
    return nodes as SelectChatbotNode[];
  }

  async findWithForm(id: string): Promise<ChatbotNodeWithForm | null> {
    const node = await this.findById(id);
    if (!node) return null;

    const [form] = await db
      .select()
      .from(chatbotForms)
      .where(eq(chatbotForms.nodeId, id))
      .limit(1);

    if (!form) {
      return node as ChatbotNodeWithForm;
    }

    const fields = await db
      .select()
      .from(chatbotFormFields)
      .where(eq(chatbotFormFields.formId, form.id));

    return {
      ...node,
      form: {
        ...form,
        fields
      }
    } as ChatbotNodeWithForm;
  }

  async findConnectedNodes(nodeId: string): Promise<{
    incoming: SelectChatbotNode[];
    outgoing: SelectChatbotNode[];
  }> {
    const incomingEdges = await db
      .select()
      .from(chatbotEdges)
      .where(eq(chatbotEdges.toNodeId, nodeId));

    const outgoingEdges = await db
      .select()
      .from(chatbotEdges)
      .where(eq(chatbotEdges.fromNodeId, nodeId));

    const incomingNodeIds = incomingEdges.map(edge => edge.fromNodeId);
    const outgoingNodeIds = outgoingEdges.map(edge => edge.toNodeId);

    const [incoming, outgoing] = await Promise.all([
      incomingNodeIds.length > 0 
        ? db.select().from(chatbotNodes).where(inArray(chatbotNodes.id, incomingNodeIds))
        : [],
      outgoingNodeIds.length > 0 
        ? db.select().from(chatbotNodes).where(inArray(chatbotNodes.id, outgoingNodeIds))
        : []
    ]);

    return {
      incoming: incoming as SelectChatbotNode[],
      outgoing: outgoing as SelectChatbotNode[]
    };
  }

  async updatePosition(id: string, position: { x: number; y: number }): Promise<boolean> {
    const result = await db
      .update(chatbotNodes)
      .set({ 
        position,
        updatedAt: new Date() 
      })
      .where(eq(chatbotNodes.id, id));
    
    return (result.rowCount || 0) > 0;
  }

  async updatePositions(updates: { id: string; position: { x: number; y: number } }[]): Promise<boolean> {
    try {
      for (const update of updates) {
        await this.updatePosition(update.id, update.position);
      }
      return true;
    } catch (error) {
      console.error('Error updating positions:', error);
      return false;
    }
  }

  async toggleNode(id: string, isEnabled: boolean): Promise<boolean> {
    const result = await db
      .update(chatbotNodes)
      .set({ 
        isEnabled,
        updatedAt: new Date() 
      })
      .where(eq(chatbotNodes.id, id));
    
    return (result.rowCount || 0) > 0;
  }

  async validateFlowStructure(flowId: string): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check for start nodes
    const startNodes = await this.findStartNodes(flowId);
    if (startNodes.length === 0) {
      errors.push('Flow must have at least one start node');
    } else if (startNodes.length > 1) {
      warnings.push('Multiple start nodes detected. Only the first one will be used.');
    }

    // Check for end nodes
    const endNodes = await this.findEndNodes(flowId);
    if (endNodes.length === 0) {
      warnings.push('Flow has no end nodes. Consider adding explicit end points.');
    }

    // Check for orphaned nodes (nodes with no connections)
    const allNodes = await this.findByFlow(flowId);
    for (const node of allNodes) {
      if (!node.isStart && !node.isEnd) {
        const connections = await this.findConnectedNodes(node.id);
        if (connections.incoming.length === 0 && connections.outgoing.length === 0) {
          warnings.push(`Node "${node.title}" (${node.id}) is not connected to any other nodes`);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
}