
import { db } from '../../../../db';
import { eq, and } from 'drizzle-orm';
import { omnibridgeChatbots } from '../../../../../shared/schema';
import { IChatbotRepository } from '../../domain/repositories/IChatbotRepository';
import { Chatbot, ChatbotEntity, ChatbotWorkflowStep } from '../../domain/entities/Chatbot';

export class DrizzleChatbotRepository implements IChatbotRepository {
  async create(chatbot: Chatbot): Promise<Chatbot> {
    try {
      console.log('🔧 [DrizzleChatbotRepository] Creating chatbot:', chatbot.name);
      
      const result = await db.insert(omnibridgeChatbots).values({
        id: chatbot.id,
        tenantId: chatbot.tenantId,
        name: chatbot.name,
        description: chatbot.description || null,
        configuration: {
          channels: chatbot.channels,
          workflow: chatbot.workflow,
          aiConfig: chatbot.aiConfig,
          fallbackToHuman: chatbot.fallbackToHuman
        },
        isEnabled: chatbot.isActive,
        createdAt: chatbot.createdAt,
        updatedAt: chatbot.updatedAt
      }).returning();

      console.log('✅ [DrizzleChatbotRepository] Chatbot created successfully');
      return this.mapToEntity(result[0]);
    } catch (error) {
      console.error('❌ [DrizzleChatbotRepository] Error creating chatbot:', error);
      throw error;
    }
  }

  async findById(id: string, tenantId: string): Promise<Chatbot | null> {
    try {
      const result = await db
        .select()
        .from(omnibridgeChatbots)
        .where(and(eq(omnibridgeChatbots.id, id), eq(omnibridgeChatbots.tenantId, tenantId)))
        .limit(1);

      return result.length > 0 ? this.mapToEntity(result[0]) : null;
    } catch (error) {
      console.error('❌ [DrizzleChatbotRepository] Error finding chatbot:', error);
      throw error;
    }
  }

  async findByTenant(tenantId: string): Promise<Chatbot[]> {
    try {
      console.log('🔍 [DrizzleChatbotRepository] Finding chatbots for tenant:', tenantId);
      
      const result = await db
        .select()
        .from(omnibridgeChatbots)
        .where(eq(omnibridgeChatbots.tenantId, tenantId));

      console.log(`✅ [DrizzleChatbotRepository] Found ${result.length} chatbots`);
      return result.map(row => this.mapToEntity(row));
    } catch (error) {
      console.error('❌ [DrizzleChatbotRepository] Error finding chatbots:', error);
      throw error;
    }
  }

  async update(id: string, tenantId: string, updates: Partial<Chatbot>): Promise<Chatbot | null> {
    try {
      console.log('🔧 [DrizzleChatbotRepository] Updating chatbot:', id);
      
      const updateData: any = {};
      
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.isActive !== undefined) updateData.isEnabled = updates.isActive;
      if (updates.channels || updates.workflow || updates.aiConfig || updates.fallbackToHuman !== undefined) {
        const existingChatbot = await this.findById(id, tenantId);
        if (existingChatbot) {
          updateData.configuration = {
            channels: updates.channels || existingChatbot.channels,
            workflow: updates.workflow || existingChatbot.workflow,
            aiConfig: updates.aiConfig || existingChatbot.aiConfig,
            fallbackToHuman: updates.fallbackToHuman !== undefined ? updates.fallbackToHuman : existingChatbot.fallbackToHuman
          };
        }
      }
      
      updateData.updatedAt = new Date();

      const result = await db
        .update(omnibridgeChatbots)
        .set(updateData)
        .where(and(eq(omnibridgeChatbots.id, id), eq(omnibridgeChatbots.tenantId, tenantId)))
        .returning();

      console.log('✅ [DrizzleChatbotRepository] Chatbot updated successfully');
      return result.length > 0 ? this.mapToEntity(result[0]) : null;
    } catch (error) {
      console.error('❌ [DrizzleChatbotRepository] Error updating chatbot:', error);
      throw error;
    }
  }

  async delete(id: string, tenantId: string): Promise<boolean> {
    try {
      console.log('🗑️ [DrizzleChatbotRepository] Deleting chatbot:', id);
      
      const result = await db
        .delete(omnibridgeChatbots)
        .where(and(eq(omnibridgeChatbots.id, id), eq(omnibridgeChatbots.tenantId, tenantId)))
        .returning();

      console.log('✅ [DrizzleChatbotRepository] Chatbot deleted successfully');
      return result.length > 0;
    } catch (error) {
      console.error('❌ [DrizzleChatbotRepository] Error deleting chatbot:', error);
      throw error;
    }
  }

  private mapToEntity(row: any): Chatbot {
    const config = row.configuration || {};
    
    return new ChatbotEntity(
      row.id,
      row.name,
      config.channels || [],
      config.workflow || [],
      row.tenantId,
      row.description,
      row.isEnabled || false,
      config.aiConfig,
      config.fallbackToHuman !== false,
      0, // conversationCount - will be calculated separately
      0, // successRate - will be calculated separately
      new Date(row.createdAt),
      new Date(row.updatedAt)
    );
  }
}
