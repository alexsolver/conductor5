import { IChatbotFlowRepository } from '../../domain/repositories/IChatbotFlowRepository';
import { 
  SelectChatbotFlow, 
  InsertChatbotFlow, 
  UpdateChatbotFlow,
  ChatbotFlowWithNodes,
  chatbotFlows,
  chatbotNodes,
  chatbotEdges,
  chatbotVariables,
  chatbotExecutions
} from '../../../../../shared/schema-chatbot';
import { db } from '../../../../../shared/schema';
import { eq, and, desc, max, count, avg, sql } from 'drizzle-orm';

export class DrizzleChatbotFlowRepository implements IChatbotFlowRepository {
  async create(flow: InsertChatbotFlow): Promise<SelectChatbotFlow> {
    const [createdFlow] = await db.insert(chatbotFlows).values(flow).returning();
    return createdFlow as SelectChatbotFlow;
  }

  async findById(id: string): Promise<SelectChatbotFlow | null> {
    const [flow] = await db
      .select()
      .from(chatbotFlows)
      .where(eq(chatbotFlows.id, id))
      .limit(1);
    
    return flow || null;
  }

  async findByBot(botId: string): Promise<SelectChatbotFlow[]> {
    return await db
      .select()
      .from(chatbotFlows)
      .where(eq(chatbotFlows.botId, botId))
      .orderBy(desc(chatbotFlows.version));
  }

  async findActiveByBot(botId: string): Promise<SelectChatbotFlow | null> {
    const [activeFlow] = await db
      .select()
      .from(chatbotFlows)
      .where(and(
        eq(chatbotFlows.botId, botId),
        eq(chatbotFlows.isActive, true)
      ))
      .limit(1);
    
    return activeFlow || null;
  }

  async update(id: string, updates: UpdateChatbotFlow): Promise<SelectChatbotFlow | null> {
    const [updatedFlow] = await db
      .update(chatbotFlows)
      .set(updates)
      .where(eq(chatbotFlows.id, id))
      .returning();
    
    return updatedFlow || null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await db
      .delete(chatbotFlows)
      .where(eq(chatbotFlows.id, id));
    
    return (result.rowCount || 0) > 0;
  }

  async createVersion(flowId: string, version: number): Promise<SelectChatbotFlow> {
    const originalFlow = await this.findById(flowId);
    if (!originalFlow) throw new Error('Flow not found');

    const [newVersion] = await db.insert(chatbotFlows).values({
      botId: originalFlow.botId,
      name: originalFlow.name,
      version,
      isActive: false,
      description: originalFlow.description,
      settings: originalFlow.settings
    }).returning();

    return newVersion;
  }

  async activateVersion(flowId: string): Promise<boolean> {
    const flow = await this.findById(flowId);
    if (!flow) return false;

    // Deactivate all other versions for this bot
    await db
      .update(chatbotFlows)
      .set({ isActive: false })
      .where(eq(chatbotFlows.botId, flow.botId));

    // Activate this version
    const result = await db
      .update(chatbotFlows)
      .set({ 
        isActive: true,
        publishedAt: new Date()
      })
      .where(eq(chatbotFlows.id, flowId));
    
    return (result.rowCount || 0) > 0;
  }

  async deactivateVersion(flowId: string): Promise<boolean> {
    const result = await db
      .update(chatbotFlows)
      .set({ isActive: false })
      .where(eq(chatbotFlows.id, flowId));
    
    return (result.rowCount || 0) > 0;
  }

  async getLatestVersion(botId: string): Promise<SelectChatbotFlow | null> {
    const [latestFlow] = await db
      .select()
      .from(chatbotFlows)
      .where(eq(chatbotFlows.botId, botId))
      .orderBy(desc(chatbotFlows.version))
      .limit(1);
    
    return latestFlow || null;
  }

  async getAllVersions(botId: string): Promise<SelectChatbotFlow[]> {
    return await db
      .select()
      .from(chatbotFlows)
      .where(eq(chatbotFlows.botId, botId))
      .orderBy(desc(chatbotFlows.version));
  }

  async findWithNodes(id: string): Promise<ChatbotFlowWithNodes | null> {
    const flow = await this.findById(id);
    if (!flow) return null;

    const [nodes, edges, variables] = await Promise.all([
      db.select().from(chatbotNodes).where(eq(chatbotNodes.flowId, id)),
      db.select().from(chatbotEdges).where(eq(chatbotEdges.flowId, id)),
      db.select().from(chatbotVariables).where(eq(chatbotVariables.flowId, id))
    ]);

    return {
      ...flow,
      nodes,
      edges,
      variables
    };
  }

  async findActiveWithNodes(botId: string): Promise<ChatbotFlowWithNodes | null> {
    const activeFlow = await this.findActiveByBot(botId);
    if (!activeFlow) return null;

    return await this.findWithNodes(activeFlow.id);
  }

  async publish(id: string): Promise<boolean> {
    const result = await db
      .update(chatbotFlows)
      .set({ publishedAt: new Date() })
      .where(eq(chatbotFlows.id, id));
    
    return (result.rowCount || 0) > 0;
  }

  async unpublish(id: string): Promise<boolean> {
    const result = await db
      .update(chatbotFlows)
      .set({ publishedAt: null })
      .where(eq(chatbotFlows.id, id));
    
    return (result.rowCount || 0) > 0;
  }

  async getFlowStats(id: string): Promise<{
    executionCount: number;
    successRate: number;
    averageDuration: number;
    lastExecuted?: Date;
  }> {
    const [stats] = await db
      .select({
        executionCount: count(chatbotExecutions.id),
        successfulExecutions: sql<number>`COUNT(CASE WHEN ${chatbotExecutions.status} = 'completed' THEN 1 END)`,
        averageDuration: avg(sql<number>`EXTRACT(EPOCH FROM (${chatbotExecutions.endedAt} - ${chatbotExecutions.startedAt}))`),
        lastExecuted: max(chatbotExecutions.startedAt)
      })
      .from(chatbotExecutions)
      .where(eq(chatbotExecutions.flowId, id));

    const executionCount = Number(stats.executionCount);
    const successfulExecutions = Number(stats.successfulExecutions);
    const successRate = executionCount > 0 ? (successfulExecutions / executionCount) * 100 : 0;
    const averageDuration = Number(stats.averageDuration) || 0;

    return {
      executionCount,
      successRate,
      averageDuration,
      lastExecuted: stats.lastExecuted || undefined
    };
  }
}