
import { db, pool } from '../../../../db';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import { omnibridgeChatbots } from '../../../../../shared/schema';
import { IChatbotRepository } from '../../domain/repositories/IChatbotRepository';
import { Chatbot, ChatbotEntity, ChatbotWorkflowStep } from '../../domain/entities/Chatbot';

export class DrizzleChatbotRepository implements IChatbotRepository {
  // ✅ 1QA.MD: Get tenant-specific database instance
  private async getTenantDb(tenantId: string) {
    const schemaName = this.getSchemaName(tenantId);
    const tenantPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      options: `-c search_path=${schemaName}`,
      ssl: false,
    });
    return drizzle({ client: tenantPool, schema });
  }

  // ✅ 1QA.MD: Get tenant schema name
  private getSchemaName(tenantId: string): string {
    return `tenant_${tenantId.replace(/-/g, '_')}`;
  }

  async create(chatbot: Chatbot): Promise<Chatbot> {
    try {
      console.log('🔧 [DrizzleChatbotRepository] Creating chatbot:', chatbot.name);
      
      const tenantDb = await this.getTenantDb(chatbot.tenantId);
      const result = await tenantDb.insert(omnibridgeChatbots).values({
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
      const tenantDb = await this.getTenantDb(tenantId);
      const result = await tenantDb
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
      
      const tenantDb = await this.getTenantDb(tenantId);
      const result = await tenantDb
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

  async findActiveByTenant(tenantId: string): Promise<Chatbot[]> {
    try {
      console.log('🔍 [DrizzleChatbotRepository] Finding active chatbots for tenant:', tenantId);
      
      const tenantDb = await this.getTenantDb(tenantId);
      const result = await tenantDb
        .select()
        .from(omnibridgeChatbots)
        .where(and(eq(omnibridgeChatbots.tenantId, tenantId), eq(omnibridgeChatbots.isEnabled, true)));

      console.log(`✅ [DrizzleChatbotRepository] Found ${result.length} active chatbots`);
      return result.map(row => this.mapToEntity(row));
    } catch (error) {
      console.error('❌ [DrizzleChatbotRepository] Error finding active chatbots:', error);
      throw error;
    }
  }

  async findByChannel(channelId: string, tenantId: string): Promise<Chatbot[]> {
    try {
      console.log('🔍 [DrizzleChatbotRepository] Finding chatbots for channel:', channelId);
      
      const tenantDb = await this.getTenantDb(tenantId);
      const result = await tenantDb
        .select()
        .from(omnibridgeChatbots)
        .where(eq(omnibridgeChatbots.tenantId, tenantId));

      // Filter by channel in configuration
      const filtered = result.filter(row => {
        const config = row.configuration || {};
        const channels = config.channels || [];
        return channels.includes(channelId);
      });

      console.log(`✅ [DrizzleChatbotRepository] Found ${filtered.length} chatbots for channel`);
      return filtered.map(row => this.mapToEntity(row));
    } catch (error) {
      console.error('❌ [DrizzleChatbotRepository] Error finding chatbots by channel:', error);
      throw error;
    }
  }

  async toggleStatus(id: string, tenantId: string, isActive: boolean): Promise<boolean> {
    try {
      console.log('🔧 [DrizzleChatbotRepository] Toggling chatbot status:', id, isActive);
      
      const tenantDb = await this.getTenantDb(tenantId);
      const result = await tenantDb
        .update(omnibridgeChatbots)
        .set({ 
          isEnabled: isActive,
          updatedAt: new Date()
        })
        .where(and(eq(omnibridgeChatbots.id, id), eq(omnibridgeChatbots.tenantId, tenantId)))
        .returning();

      console.log('✅ [DrizzleChatbotRepository] Chatbot status toggled successfully');
      return result.length > 0;
    } catch (error) {
      console.error('❌ [DrizzleChatbotRepository] Error toggling chatbot status:', error);
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

      const tenantDb = await this.getTenantDb(tenantId);
      const result = await tenantDb
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
      
      const tenantDb = await this.getTenantDb(tenantId);
      const result = await tenantDb
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
