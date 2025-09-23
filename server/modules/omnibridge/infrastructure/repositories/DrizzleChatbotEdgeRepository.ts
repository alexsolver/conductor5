import { IChatbotEdgeRepository } from '../../domain/repositories/IChatbotEdgeRepository';
import { 
  SelectChatbotEdge, 
  InsertChatbotEdge, 
  UpdateChatbotEdge,
  chatbotEdges,
  chatbotNodes
} from '../../../../../shared/schema-chatbot';
import { db } from '../../../../../shared/schema';
import { eq, and, or, inArray, asc } from 'drizzle-orm';

export class DrizzleChatbotEdgeRepository implements IChatbotEdgeRepository {
  async create(edge: InsertChatbotEdge): Promise<SelectChatbotEdge> {
    const [createdEdge] = await db.insert(chatbotEdges).values(edge).returning();
    return createdEdge as SelectChatbotEdge;
  }

  async createMany(edges: InsertChatbotEdge[]): Promise<SelectChatbotEdge[]> {
    const createdEdges = await db.insert(chatbotEdges).values(edges).returning();
    return createdEdges as SelectChatbotEdge[];
  }

  async findById(id: string): Promise<SelectChatbotEdge | null> {
    const [edge] = await db
      .select()
      .from(chatbotEdges)
      .where(eq(chatbotEdges.id, id))
      .limit(1);
    
    return (edge as SelectChatbotEdge) || null;
  }

  async findByFlow(flowId: string): Promise<SelectChatbotEdge[]> {
    const edges = await db
      .select()
      .from(chatbotEdges)
      .where(eq(chatbotEdges.flowId, flowId))
      .orderBy(asc(chatbotEdges.order));
    
    return edges as SelectChatbotEdge[];
  }

  async findByNode(nodeId: string): Promise<{
    incoming: SelectChatbotEdge[];
    outgoing: SelectChatbotEdge[];
  }> {
    const [incoming, outgoing] = await Promise.all([
      db.select().from(chatbotEdges).where(eq(chatbotEdges.toNodeId, nodeId)),
      db.select().from(chatbotEdges).where(eq(chatbotEdges.fromNodeId, nodeId))
    ]);

    return {
      incoming: incoming as SelectChatbotEdge[],
      outgoing: outgoing as SelectChatbotEdge[]
    };
  }

  async update(id: string, updates: UpdateChatbotEdge): Promise<SelectChatbotEdge | null> {
    const [updatedEdge] = await db
      .update(chatbotEdges)
      .set(updates)
      .where(eq(chatbotEdges.id, id))
      .returning();
    
    return (updatedEdge as SelectChatbotEdge) || null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await db
      .delete(chatbotEdges)
      .where(eq(chatbotEdges.id, id));
    
    return (result.rowCount || 0) > 0;
  }

  async deleteByFlow(flowId: string): Promise<boolean> {
    const result = await db
      .delete(chatbotEdges)
      .where(eq(chatbotEdges.flowId, flowId));
    
    return (result.rowCount || 0) > 0;
  }

  async deleteByNode(nodeId: string): Promise<boolean> {
    const result = await db
      .delete(chatbotEdges)
      .where(or(
        eq(chatbotEdges.fromNodeId, nodeId),
        eq(chatbotEdges.toNodeId, nodeId)
      ));
    
    return (result.rowCount || 0) > 0;
  }

  async findFromNode(fromNodeId: string): Promise<SelectChatbotEdge[]> {
    const edges = await db
      .select()
      .from(chatbotEdges)
      .where(eq(chatbotEdges.fromNodeId, fromNodeId))
      .orderBy(asc(chatbotEdges.order));
    
    return edges as SelectChatbotEdge[];
  }

  async findToNode(toNodeId: string): Promise<SelectChatbotEdge[]> {
    const edges = await db
      .select()
      .from(chatbotEdges)
      .where(eq(chatbotEdges.toNodeId, toNodeId))
      .orderBy(asc(chatbotEdges.order));
    
    return edges as SelectChatbotEdge[];
  }

  async findByKind(flowId: string, kind: string): Promise<SelectChatbotEdge[]> {
    const edges = await db
      .select()
      .from(chatbotEdges)
      .where(and(
        eq(chatbotEdges.flowId, flowId),
        eq(chatbotEdges.kind, kind as any)
      ));
    
    return edges as SelectChatbotEdge[];
  }

  async reorderEdges(fromNodeId: string, edgeOrders: { id: string; order: number }[]): Promise<boolean> {
    try {
      for (const { id, order } of edgeOrders) {
        await db
          .update(chatbotEdges)
          .set({ order })
          .where(and(
            eq(chatbotEdges.id, id),
            eq(chatbotEdges.fromNodeId, fromNodeId)
          ));
      }
      return true;
    } catch (error) {
      console.error('Error reordering edges:', error);
      return false;
    }
  }

  async validateConnection(fromNodeId: string, toNodeId: string): Promise<{
    isValid: boolean;
    reason?: string;
  }> {
    // Check if nodes exist
    const [fromNode, toNode] = await Promise.all([
      db.select().from(chatbotNodes).where(eq(chatbotNodes.id, fromNodeId)).limit(1),
      db.select().from(chatbotNodes).where(eq(chatbotNodes.id, toNodeId)).limit(1)
    ]);

    if (fromNode.length === 0) {
      return { isValid: false, reason: 'Source node does not exist' };
    }

    if (toNode.length === 0) {
      return { isValid: false, reason: 'Target node does not exist' };
    }

    // Check if nodes are in the same flow
    if (fromNode[0].flowId !== toNode[0].flowId) {
      return { isValid: false, reason: 'Nodes must be in the same flow' };
    }

    // Check for self-connection
    if (fromNodeId === toNodeId) {
      return { isValid: false, reason: 'Cannot connect a node to itself' };
    }

    // Check if connection already exists
    const [existingConnection] = await db
      .select()
      .from(chatbotEdges)
      .where(and(
        eq(chatbotEdges.fromNodeId, fromNodeId),
        eq(chatbotEdges.toNodeId, toNodeId)
      ))
      .limit(1);

    if (existingConnection) {
      return { isValid: false, reason: 'Connection already exists between these nodes' };
    }

    return { isValid: true };
  }

  async getNextNodes(currentNodeId: string, context?: any): Promise<SelectChatbotEdge[]> {
    // Get all outgoing edges from current node
    const edges = await db
      .select()
      .from(chatbotEdges)
      .where(and(
        eq(chatbotEdges.fromNodeId, currentNodeId),
        eq(chatbotEdges.isEnabled, true)
      ))
      .orderBy(asc(chatbotEdges.order));

    // If context is provided, we could filter by conditions here
    // For now, return all enabled edges
    return edges as SelectChatbotEdge[];
  }

  async findConditionalEdges(nodeId: string): Promise<SelectChatbotEdge[]> {
    const edges = await db
      .select()
      .from(chatbotEdges)
      .where(and(
        eq(chatbotEdges.fromNodeId, nodeId),
        eq(chatbotEdges.kind, 'conditional')
      ))
      .orderBy(asc(chatbotEdges.order));
    
    return edges as SelectChatbotEdge[];
  }

  async toggleEdge(id: string, isEnabled: boolean): Promise<boolean> {
    const result = await db
      .update(chatbotEdges)
      .set({ isEnabled })
      .where(eq(chatbotEdges.id, id));
    
    return (result.rowCount || 0) > 0;
  }

  async detectCycles(flowId: string): Promise<{
    hasCycles: boolean;
    cycles: string[][];
  }> {
    // Get all edges for the flow
    const edges = await this.findByFlow(flowId);
    
    // Build adjacency list
    const adjacencyList = new Map<string, string[]>();
    const nodeSet = new Set<string>();

    for (const edge of edges) {
      if (!edge.isEnabled) continue;
      
      nodeSet.add(edge.fromNodeId);
      nodeSet.add(edge.toNodeId);
      
      if (!adjacencyList.has(edge.fromNodeId)) {
        adjacencyList.set(edge.fromNodeId, []);
      }
      adjacencyList.get(edge.fromNodeId)!.push(edge.toNodeId);
    }

    // DFS to detect cycles
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const cycles: string[][] = [];

    const dfs = (nodeId: string, currentPath: string[]): void => {
      visited.add(nodeId);
      recursionStack.add(nodeId);
      currentPath.push(nodeId);

      const neighbors = adjacencyList.get(nodeId) || [];
      
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          dfs(neighbor, [...currentPath]);
        } else if (recursionStack.has(neighbor)) {
          // Found a cycle
          const cycleStart = currentPath.indexOf(neighbor);
          const cycle = currentPath.slice(cycleStart);
          cycle.push(neighbor); // Complete the cycle
          cycles.push(cycle);
        }
      }

      recursionStack.delete(nodeId);
    };

    // Check each node for cycles
    for (const nodeId of nodeSet) {
      if (!visited.has(nodeId)) {
        dfs(nodeId, []);
      }
    }

    return {
      hasCycles: cycles.length > 0,
      cycles
    };
  }
}