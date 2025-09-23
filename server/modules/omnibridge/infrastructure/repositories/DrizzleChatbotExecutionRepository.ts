import { IChatbotExecutionRepository } from '../../domain/repositories/IChatbotExecutionRepository';
import { 
  SelectChatbotExecution, 
  InsertChatbotExecution,
  chatbotExecutions,
  chatbotBots
} from '../../../../../shared/schema-chatbot';
import { db } from '../../../../../shared/schema';
import { eq, and, gte, lte, desc, count, avg, sql } from 'drizzle-orm';

export class DrizzleChatbotExecutionRepository implements IChatbotExecutionRepository {
  async create(execution: InsertChatbotExecution): Promise<SelectChatbotExecution> {
    const [createdExecution] = await db.insert(chatbotExecutions).values(execution).returning();
    return createdExecution as SelectChatbotExecution;
  }

  async findById(id: string): Promise<SelectChatbotExecution | null> {
    const [execution] = await db
      .select()
      .from(chatbotExecutions)
      .where(eq(chatbotExecutions.id, id))
      .limit(1);
    
    return (execution as SelectChatbotExecution) || null;
  }

  async findByBot(botId: string, limit: number = 100, offset: number = 0): Promise<SelectChatbotExecution[]> {
    const executions = await db
      .select()
      .from(chatbotExecutions)
      .where(eq(chatbotExecutions.botId, botId))
      .orderBy(desc(chatbotExecutions.startedAt))
      .limit(limit)
      .offset(offset);
    
    return executions as SelectChatbotExecution[];
  }

  async findByTenant(tenantId: string, limit: number = 100, offset: number = 0): Promise<SelectChatbotExecution[]> {
    const executions = await db
      .select()
      .from(chatbotExecutions)
      .where(eq(chatbotExecutions.tenantId, tenantId))
      .orderBy(desc(chatbotExecutions.startedAt))
      .limit(limit)
      .offset(offset);
    
    return executions as SelectChatbotExecution[];
  }

  async update(id: string, updates: Partial<SelectChatbotExecution>): Promise<SelectChatbotExecution | null> {
    const [updatedExecution] = await db
      .update(chatbotExecutions)
      .set(updates)
      .where(eq(chatbotExecutions.id, id))
      .returning();
    
    return (updatedExecution as SelectChatbotExecution) || null;
  }

  async startExecution(execution: InsertChatbotExecution): Promise<SelectChatbotExecution> {
    const executionData: InsertChatbotExecution = {
      ...execution,
      status: 'running',
      startedAt: new Date(),
      context: execution.context || {},
      metrics: execution.metrics || {},
      nodeTrace: execution.nodeTrace || []
    };

    return await this.create(executionData);
  }

  async updateStatus(id: string, status: string, error?: string): Promise<boolean> {
    const updateData: any = { status };
    
    if (status === 'completed' || status === 'failed' || status === 'timeout' || status === 'cancelled') {
      updateData.endedAt = new Date();
    }
    
    if (error) {
      updateData.error = error;
    }

    const result = await db
      .update(chatbotExecutions)
      .set(updateData)
      .where(eq(chatbotExecutions.id, id));
    
    return (result.rowCount || 0) > 0;
  }

  async completeExecution(id: string, endedAt: Date, metrics?: any): Promise<boolean> {
    const updateData: any = {
      status: 'completed',
      endedAt
    };

    if (metrics) {
      updateData.metrics = metrics;
    }

    const result = await db
      .update(chatbotExecutions)
      .set(updateData)
      .where(eq(chatbotExecutions.id, id));
    
    return (result.rowCount || 0) > 0;
  }

  async failExecution(id: string, error: string): Promise<boolean> {
    const result = await db
      .update(chatbotExecutions)
      .set({
        status: 'failed',
        endedAt: new Date(),
        error
      })
      .where(eq(chatbotExecutions.id, id));
    
    return (result.rowCount || 0) > 0;
  }

  async updateContext(id: string, context: any): Promise<boolean> {
    const result = await db
      .update(chatbotExecutions)
      .set({ context })
      .where(eq(chatbotExecutions.id, id));
    
    return (result.rowCount || 0) > 0;
  }

  async addToNodeTrace(id: string, nodeId: string, timestamp: Date, data?: any): Promise<boolean> {
    const execution = await this.findById(id);
    if (!execution) return false;

    const currentTrace = (execution.nodeTrace as any[]) || [];
    const newTraceEntry = {
      nodeId,
      timestamp: timestamp.toISOString(),
      data: data || {}
    };

    const updatedTrace = [...currentTrace, newTraceEntry];

    const result = await db
      .update(chatbotExecutions)
      .set({ nodeTrace: updatedTrace })
      .where(eq(chatbotExecutions.id, id));
    
    return (result.rowCount || 0) > 0;
  }

  async getExecutionsByDateRange(
    tenantId: string, 
    startDate: Date, 
    endDate: Date
  ): Promise<SelectChatbotExecution[]> {
    const executions = await db
      .select()
      .from(chatbotExecutions)
      .where(and(
        eq(chatbotExecutions.tenantId, tenantId),
        gte(chatbotExecutions.startedAt, startDate),
        lte(chatbotExecutions.startedAt, endDate)
      ))
      .orderBy(desc(chatbotExecutions.startedAt));
    
    return executions as SelectChatbotExecution[];
  }

  async getExecutionStats(botId: string, period: 'day' | 'week' | 'month' = 'day'): Promise<{
    totalExecutions: number;
    successfulExecutions: number;
    failedExecutions: number;
    averageDuration: number;
    successRate: number;
  }> {
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }

    const [stats] = await db
      .select({
        totalExecutions: count(chatbotExecutions.id),
        successfulExecutions: sql<number>`COUNT(CASE WHEN ${chatbotExecutions.status} = 'completed' THEN 1 END)`,
        failedExecutions: sql<number>`COUNT(CASE WHEN ${chatbotExecutions.status} = 'failed' THEN 1 END)`,
        averageDuration: avg(sql<number>`EXTRACT(EPOCH FROM (${chatbotExecutions.endedAt} - ${chatbotExecutions.startedAt}))`)
      })
      .from(chatbotExecutions)
      .where(and(
        eq(chatbotExecutions.botId, botId),
        gte(chatbotExecutions.startedAt, startDate)
      ));

    const totalExecutions = Number(stats.totalExecutions);
    const successfulExecutions = Number(stats.successfulExecutions);
    const failedExecutions = Number(stats.failedExecutions);
    const averageDuration = Number(stats.averageDuration) || 0;
    const successRate = totalExecutions > 0 ? (successfulExecutions / totalExecutions) * 100 : 0;

    return {
      totalExecutions,
      successfulExecutions,
      failedExecutions,
      averageDuration,
      successRate
    };
  }

  async getBotPerformanceMetrics(tenantId: string): Promise<Array<{
    botId: string;
    botName: string;
    executions: number;
    successRate: number;
    avgDuration: number;
  }>> {
    const results = await db
      .select({
        botId: chatbotExecutions.botId,
        botName: chatbotBots.name,
        executions: count(chatbotExecutions.id),
        successfulExecutions: sql<number>`COUNT(CASE WHEN ${chatbotExecutions.status} = 'completed' THEN 1 END)`,
        avgDuration: avg(sql<number>`EXTRACT(EPOCH FROM (${chatbotExecutions.endedAt} - ${chatbotExecutions.startedAt}))`)
      })
      .from(chatbotExecutions)
      .leftJoin(chatbotBots, eq(chatbotExecutions.botId, chatbotBots.id))
      .where(eq(chatbotExecutions.tenantId, tenantId))
      .groupBy(chatbotExecutions.botId, chatbotBots.name);

    return results.map(result => ({
      botId: result.botId,
      botName: result.botName || 'Unknown Bot',
      executions: Number(result.executions),
      successRate: Number(result.executions) > 0 
        ? (Number(result.successfulExecutions) / Number(result.executions)) * 100 
        : 0,
      avgDuration: Number(result.avgDuration) || 0
    }));
  }

  async getChannelStats(tenantId: string): Promise<Array<{
    channelId: string;
    executions: number;
    successRate: number;
  }>> {
    const results = await db
      .select({
        channelId: chatbotExecutions.channelId,
        executions: count(chatbotExecutions.id),
        successfulExecutions: sql<number>`COUNT(CASE WHEN ${chatbotExecutions.status} = 'completed' THEN 1 END)`
      })
      .from(chatbotExecutions)
      .where(and(
        eq(chatbotExecutions.tenantId, tenantId),
        sql`${chatbotExecutions.channelId} IS NOT NULL`
      ))
      .groupBy(chatbotExecutions.channelId);

    return results.map(result => ({
      channelId: result.channelId || 'unknown',
      executions: Number(result.executions),
      successRate: Number(result.executions) > 0 
        ? (Number(result.successfulExecutions) / Number(result.executions)) * 100 
        : 0
    }));
  }

  async findActiveExecutions(tenantId?: string): Promise<SelectChatbotExecution[]> {
    const whereConditions: any[] = [eq(chatbotExecutions.status, 'running')];
    
    if (tenantId) {
      whereConditions.push(eq(chatbotExecutions.tenantId, tenantId));
    }

    const executions = await db
      .select()
      .from(chatbotExecutions)
      .where(and(...whereConditions))
      .orderBy(desc(chatbotExecutions.startedAt));
    
    return executions as SelectChatbotExecution[];
  }

  async findTimedOutExecutions(timeoutMinutes: number): Promise<SelectChatbotExecution[]> {
    const timeoutDate = new Date(Date.now() - timeoutMinutes * 60 * 1000);

    const executions = await db
      .select()
      .from(chatbotExecutions)
      .where(and(
        eq(chatbotExecutions.status, 'running'),
        lte(chatbotExecutions.startedAt, timeoutDate)
      ));
    
    return executions as SelectChatbotExecution[];
  }

  async cleanupOldExecutions(olderThanDays: number): Promise<number> {
    const cutoffDate = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);

    const result = await db
      .delete(chatbotExecutions)
      .where(lte(chatbotExecutions.startedAt, cutoffDate));
    
    return result.rowCount || 0;
  }

  async searchExecutions(tenantId: string, filters: {
    botId?: string;
    status?: string;
    channelId?: string;
    userId?: string;
    dateFrom?: Date;
    dateTo?: Date;
  }): Promise<SelectChatbotExecution[]> {
    const whereConditions: any[] = [eq(chatbotExecutions.tenantId, tenantId)];

    if (filters.botId) {
      whereConditions.push(eq(chatbotExecutions.botId, filters.botId));
    }

    if (filters.status) {
      whereConditions.push(eq(chatbotExecutions.status, filters.status as any));
    }

    if (filters.channelId) {
      whereConditions.push(eq(chatbotExecutions.channelId, filters.channelId));
    }

    if (filters.userId) {
      whereConditions.push(eq(chatbotExecutions.userId, filters.userId));
    }

    if (filters.dateFrom) {
      whereConditions.push(gte(chatbotExecutions.startedAt, filters.dateFrom));
    }

    if (filters.dateTo) {
      whereConditions.push(lte(chatbotExecutions.startedAt, filters.dateTo));
    }

    const executions = await db
      .select()
      .from(chatbotExecutions)
      .where(and(...whereConditions))
      .orderBy(desc(chatbotExecutions.startedAt))
      .limit(1000); // Reasonable limit for searches

    return executions as SelectChatbotExecution[];
  }
}