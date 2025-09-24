import { IChatbotBotRepository } from '../../domain/repositories/IChatbotBotRepository';
import { 
  SelectChatbotBot, 
  InsertChatbotBot, 
  UpdateChatbotBot,
  ChatbotBotWithFlows,
  chatbotBots,
  chatbotFlows,
  chatbotNodes,
  chatbotEdges,
  chatbotVariables,
  chatbotBotChannels
} from '../../../../../shared/schema-chatbot';
import { db } from '../../../../../shared/schema';
import { eq, and, desc } from 'drizzle-orm';

export class DrizzleChatbotBotRepository implements IChatbotBotRepository {
  async create(bot: InsertChatbotBot): Promise<SelectChatbotBot> {
    const [createdBot] = await db.insert(chatbotBots).values(bot).returning();
    return createdBot;
  }

  async findById(id: string, tenantId: string): Promise<SelectChatbotBot | null> {
    const [bot] = await db
      .select()
      .from(chatbotBots)
      .where(and(eq(chatbotBots.id, id), eq(chatbotBots.tenantId, tenantId)))
      .limit(1);
    
    return bot || null;
  }

  async findByTenant(tenantId: string): Promise<SelectChatbotBot[]> {
    return await db
      .select()
      .from(chatbotBots)
      .where(eq(chatbotBots.tenantId, tenantId))
      .orderBy(desc(chatbotBots.createdAt));
  }

  async findActiveByTenant(tenantId: string): Promise<SelectChatbotBot[]> {
    return await db
      .select()
      .from(chatbotBots)
      .where(and(
        eq(chatbotBots.tenantId, tenantId),
        eq(chatbotBots.isEnabled, true)
      ))
      .orderBy(desc(chatbotBots.createdAt));
  }

  async update(id: string, tenantId: string, updates: UpdateChatbotBot): Promise<SelectChatbotBot | null> {
    const [updatedBot] = await db
      .update(chatbotBots)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(and(eq(chatbotBots.id, id), eq(chatbotBots.tenantId, tenantId)))
      .returning();
    
    return updatedBot || null;
  }

  async delete(id: string, tenantId: string): Promise<boolean> {
    const result = await db
      .delete(chatbotBots)
      .where(and(eq(chatbotBots.id, id), eq(chatbotBots.tenantId, tenantId)));
    
    return (result.rowCount || 0) > 0;
  }

  async toggleStatus(id: string, tenantId: string, isEnabled: boolean): Promise<boolean> {
    const result = await db
      .update(chatbotBots)
      .set({
        isEnabled,
        updatedAt: new Date()
      })
      .where(and(eq(chatbotBots.id, id), eq(chatbotBots.tenantId, tenantId)));
    
    return (result.rowCount || 0) > 0;
  }

  async bindToChannel(botId: string, channelId: string, routingRules: any = {}, priority: number = 0): Promise<boolean> {
    try {
      await db.insert(chatbotBotChannels).values({
        botId,
        channelId,
        routingRules,
        priority,
        isEnabled: true
      });
      return true;
    } catch (error) {
      console.error('Error binding bot to channel:', error);
      return false;
    }
  }

  async unbindFromChannel(botId: string, channelId: string): Promise<boolean> {
    const result = await db
      .delete(chatbotBotChannels)
      .where(and(
        eq(chatbotBotChannels.botId, botId),
        eq(chatbotBotChannels.channelId, channelId)
      ));
    
    return (result.rowCount || 0) > 0;
  }

  async findByChannel(channelId: string, tenantId?: string): Promise<SelectChatbotBot[]> {
    const whereConditions = [
      eq(chatbotBotChannels.channelId, channelId),
      eq(chatbotBotChannels.isEnabled, true),
      eq(chatbotBots.isEnabled, true)
    ];

    // CRITICAL SECURITY: Always filter by tenant when provided
    if (tenantId) {
      whereConditions.push(eq(chatbotBots.tenantId, tenantId));
    }

    return await db
      .select({
        id: chatbotBots.id,
        tenantId: chatbotBots.tenantId,
        name: chatbotBots.name,
        description: chatbotBots.description,
        isEnabled: chatbotBots.isEnabled,
        defaultLanguage: chatbotBots.defaultLanguage,
        fallbackToHuman: chatbotBots.fallbackToHuman,
        timeout: chatbotBots.timeout,
        maxRetries: chatbotBots.maxRetries,
        createdAt: chatbotBots.createdAt,
        updatedAt: chatbotBots.updatedAt
      })
      .from(chatbotBots)
      .leftJoin(chatbotBotChannels, eq(chatbotBots.id, chatbotBotChannels.botId))
      .where(and(...whereConditions))
      .orderBy(desc(chatbotBotChannels.priority));
  }

  async findWithFlows(id: string, tenantId: string): Promise<ChatbotBotWithFlows | null> {
    const bot = await this.findById(id, tenantId);
    if (!bot) return null;

    const flows = await db
      .select()
      .from(chatbotFlows)
      .where(eq(chatbotFlows.botId, id))
      .orderBy(desc(chatbotFlows.version));

    const flowsWithNodes = await Promise.all(
      flows.map(async (flow) => {
        const [nodes, edges, variables] = await Promise.all([
          db.select().from(chatbotNodes).where(eq(chatbotNodes.flowId, flow.id)),
          db.select().from(chatbotEdges).where(eq(chatbotEdges.flowId, flow.id)),
          db.select().from(chatbotVariables).where(eq(chatbotVariables.flowId, flow.id))
        ]);

        return {
          ...flow,
          nodes,
          edges,
          variables
        };
      })
    );

    const channels = await db
      .select()
      .from(chatbotBotChannels)
      .where(eq(chatbotBotChannels.botId, id));

    return {
      ...bot,
      flows: flowsWithNodes as any, // Type assertion for settings field
      channels: channels as any // Type assertion for routingRules field
    };
  }

  async findBotsWithActiveFlows(tenantId: string): Promise<ChatbotBotWithFlows[]> {
    const bots = await this.findActiveByTenant(tenantId);
    
    return await Promise.all(
      bots.map(async (bot) => {
        const result = await this.findWithFlows(bot.id, tenantId);
        return result!;
      })
    );
  }

  async updateConversationCount(id: string, increment: number): Promise<void> {
    // This would require adding a conversationCount field to the bot table
    // For now, we'll track this in execution metrics
    console.log(`Updating conversation count for bot ${id} by ${increment}`);
  }

  async updateSuccessRate(id: string, successRate: number): Promise<void> {
    // This would require adding a successRate field to the bot table
    // For now, we'll calculate this from execution statistics
    console.log(`Updating success rate for bot ${id} to ${successRate}`);
  }
}