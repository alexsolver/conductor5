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
import { db, pool } from '../../../../../shared/schema';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '../../../../../shared/schema';
import { eq, and, desc, max, count, avg, sql } from 'drizzle-orm';

export class DrizzleChatbotFlowRepository implements IChatbotFlowRepository {
  // ✅ Get tenant-specific database instance
  private async getTenantDb(tenantId: string) {
    const schemaName = this.getSchemaName(tenantId);
    const tenantPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      options: `-c search_path=${schemaName}`,
      ssl: false,
    });
    return drizzle({ client: tenantPool, schema });
  }

  // ✅ Get tenant schema name
  private getSchemaName(tenantId: string): string {
    if (!tenantId) {
      throw new Error('TenantId is required but was undefined');
    }
    return `tenant_${tenantId.replace(/-/g, '_')}`;
  }
  async create(flow: InsertChatbotFlow & { id?: string, tenantId: string }): Promise<SelectChatbotFlow> {
    console.log('💾 [REPOSITORY] Creating flow with data:', { 
      customId: flow.id, 
      botId: flow.botId, 
      name: flow.name,
      isActive: flow.isActive,
      tenantId: flow.tenantId,
      hasCustomId: !!flow.id
    });
    
    try {
      // Get tenant-specific database connection
      const tenantDb = await this.getTenantDb(flow.tenantId);
      
      // ✅ CRITICAL: Verify bot exists in tenant schema before creating flow
      const { chatbotBots } = await import('../../../../../shared/schema-chatbot');
      const [existingBot] = await tenantDb
        .select()
        .from(chatbotBots)
        .where(eq(chatbotBots.id, flow.botId))
        .limit(1);
      
      if (!existingBot) {
        console.error('❌ [REPOSITORY] Bot not found in tenant schema:', {
          botId: flow.botId,
          tenantId: flow.tenantId,
          schema: this.getSchemaName(flow.tenantId)
        });
        throw new Error(`Bot with ID ${flow.botId} not found in tenant ${flow.tenantId}`);
      }
      
      console.log('✅ [REPOSITORY] Bot validation successful:', {
        botId: existingBot.id,
        botName: existingBot.name,
        tenantId: flow.tenantId
      });
      
      // Remove tenantId from flow data as it's not part of the table schema
      const { tenantId: _, ...flowData } = flow;
      
      // Ensure we have all required fields
      const flowToInsert = {
        ...flowData,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // If custom ID is provided, use it explicitly
      if (flow.id) {
        flowToInsert.id = flow.id;
        console.log('🆔 [REPOSITORY] Using custom ID for flow creation:', flow.id);
      }
      
      console.log('🔧 [REPOSITORY] Using tenant database for schema:', this.getSchemaName(flow.tenantId));
      console.log('🔧 [REPOSITORY] Flow data to insert:', flowToInsert);
      
      const [createdFlow] = await tenantDb.insert(chatbotFlows).values(flowToInsert).returning();
      console.log('✅ [REPOSITORY] Flow created successfully in tenant schema:', {
        id: createdFlow.id,
        name: createdFlow.name,
        botId: createdFlow.botId,
        isActive: createdFlow.isActive,
        tenantId: flow.tenantId
      });
      return createdFlow as SelectChatbotFlow;
    } catch (error) {
      console.error('❌ [REPOSITORY] Error creating flow:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        errorStack: error instanceof Error ? error.stack : undefined,
        flowData: flow,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }

  async findById(id: string, tenantId?: string): Promise<SelectChatbotFlow | null> {
    try {
      if (!tenantId) {
        // Fallback to main database if tenantId not provided
        const [flow] = await db
          .select()
          .from(chatbotFlows)
          .where(eq(chatbotFlows.id, id))
          .limit(1);
        return flow || null;
      }

      console.log('🔍 [REPOSITORY] findById:', { id, tenantId, schema: this.getSchemaName(tenantId) });
      
      const tenantDb = await this.getTenantDb(tenantId);
      const [flow] = await tenantDb
        .select()
        .from(chatbotFlows)
        .where(eq(chatbotFlows.id, id))
        .limit(1);
      
      if (flow) {
        console.log('✅ [REPOSITORY] Flow found:', {
          id: flow.id,
          name: flow.name,
          botId: flow.botId,
          isActive: flow.isActive
        });
      } else {
        console.log('❌ [REPOSITORY] Flow not found:', id);
      }
      
      return flow || null;
    } catch (error) {
      console.error('❌ [REPOSITORY] Error in findById:', error);
      return null;
    }
  }

  async findByBot(botId: string, tenantId: string): Promise<SelectChatbotFlow[]> {
    const tenantDb = await this.getTenantDb(tenantId);
    return await tenantDb
      .select()
      .from(chatbotFlows)
      .where(eq(chatbotFlows.botId, botId))
      .orderBy(desc(chatbotFlows.createdAt));
  }

  async findActiveByBot(botId: string, tenantId: string): Promise<SelectChatbotFlow | null> {
    const tenantDb = await this.getTenantDb(tenantId);
    const [activeFlow] = await tenantDb
      .select()
      .from(chatbotFlows)
      .where(and(
        eq(chatbotFlows.botId, botId),
        eq(chatbotFlows.isActive, true)
      ))
      .limit(1);
    
    return activeFlow || null;
  }

  async update(id: string, updates: UpdateChatbotFlow, tenantId: string): Promise<SelectChatbotFlow | null> {
    const tenantDb = await this.getTenantDb(tenantId);
    const [updatedFlow] = await tenantDb
      .update(chatbotFlows)
      .set(updates)
      .where(eq(chatbotFlows.id, id))
      .returning();
    
    return updatedFlow || null;
  }

  async delete(id: string, tenantId: string): Promise<boolean> {
    const tenantDb = await this.getTenantDb(tenantId);
    const result = await tenantDb
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
      .orderBy(desc(chatbotFlows.createdAt))
      .limit(1);
    
    return latestFlow || null;
  }

  async getAllVersions(botId: string): Promise<SelectChatbotFlow[]> {
    return await db
      .select()
      .from(chatbotFlows)
      .where(eq(chatbotFlows.botId, botId))
      .orderBy(desc(chatbotFlows.createdAt));
  }

  async findWithNodes(id: string, tenantId: string): Promise<ChatbotFlowWithNodes | null> {
    console.log('🔍 [REPOSITORY] findWithNodes:', { id, tenantId });
    
    const flow = await this.findById(id, tenantId);
    if (!flow) {
      console.log('❌ [REPOSITORY] Flow not found for findWithNodes:', id);
      return null;
    }

    try {
      const tenantDb = await this.getTenantDb(tenantId);
      
      // Perform parallel queries for better performance
      const [nodesResult, edgesResult, variablesResult] = await Promise.allSettled([
        tenantDb.select().from(chatbotNodes).where(eq(chatbotNodes.flowId, id)),
        tenantDb.select().from(chatbotEdges).where(eq(chatbotEdges.flowId, id)),
        tenantDb.select().from(chatbotVariables).where(eq(chatbotVariables.flowId, id))
      ]);

      // Extract results with error handling
      const nodes = nodesResult.status === 'fulfilled' ? nodesResult.value : [];
      const edges = edgesResult.status === 'fulfilled' ? edgesResult.value : [];
      const variables = variablesResult.status === 'fulfilled' ? variablesResult.value : [];

      // Log any errors
      if (nodesResult.status === 'rejected') {
        console.warn('⚠️ [REPOSITORY] Error fetching nodes:', nodesResult.reason);
      }
      if (edgesResult.status === 'rejected') {
        console.warn('⚠️ [REPOSITORY] Error fetching edges:', edgesResult.reason);
      }
      if (variablesResult.status === 'rejected') {
        console.warn('⚠️ [REPOSITORY] Error fetching variables:', variablesResult.reason);
      }

      console.log('✅ [REPOSITORY] Retrieved complete flow data:', {
        flowId: id,
        flowName: flow.name,
        nodeCount: nodes.length,
        edgeCount: edges.length,
        variableCount: variables.length,
        tenantId,
        schema: this.getSchemaName(tenantId)
      });

      // Ensure we always return valid arrays
      return {
        ...flow,
        nodes: Array.isArray(nodes) ? nodes : [],
        edges: Array.isArray(edges) ? edges : [],
        variables: Array.isArray(variables) ? variables : []
      };
    } catch (error) {
      console.error('❌ [REPOSITORY] Critical error in findWithNodes:', error);
      
      // Return flow with empty arrays as fallback
      return {
        ...flow,
        nodes: [],
        edges: [],
        variables: []
      };
    }
  }

  async findActiveWithNodes(botId: string, tenantId: string): Promise<ChatbotFlowWithNodes | null> {
    const activeFlow = await this.findActiveByBot(botId, tenantId);
    if (!activeFlow) return null;

    return await this.findWithNodes(activeFlow.id, tenantId);
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

  async saveCompleteFlow(flowId: string, nodes: any[], edges: any[], tenantId: string): Promise<boolean> {
    const startTime = Date.now();
    try {
      console.log('💾 [REPOSITORY] [saveCompleteFlow] Starting complete flow save:', { 
        flowId, 
        nodeCount: nodes.length, 
        edgeCount: edges.length,
        tenantId,
        timestamp: new Date().toISOString()
      });
      
      // Verify flow exists first
      const existingFlow = await this.findById(flowId, tenantId);
      if (!existingFlow) {
        console.error('❌ [REPOSITORY] [saveCompleteFlow] Flow not found:', {
          flowId,
          tenantId,
          searchAttempted: true,
          timestamp: new Date().toISOString()
        });
        throw new Error(`Flow with ID ${flowId} not found`);
      }

      console.log('✅ [REPOSITORY] [saveCompleteFlow] Flow exists, proceeding with save:', {
        flowId: existingFlow.id,
        flowName: existingFlow.name,
        botId: existingFlow.botId,
        isActive: existingFlow.isActive,
        version: existingFlow.version
      });

      // Get tenant-specific database connection
      const tenantDb = await this.getTenantDb(tenantId);
      
      // Start transaction to save nodes and edges
      const result = await tenantDb.transaction(async (tx) => {
        try {
          // Clear existing nodes and edges
          console.log('🗑️ [REPOSITORY] Clearing existing nodes and edges for flow:', flowId);
          const deletedNodes = await tx.delete(chatbotNodes).where(eq(chatbotNodes.flowId, flowId));
          const deletedEdges = await tx.delete(chatbotEdges).where(eq(chatbotEdges.flowId, flowId));
          
          console.log('🗑️ [REPOSITORY] Deletion results:', { 
            deletedNodes: deletedNodes.rowCount || 0, 
            deletedEdges: deletedEdges.rowCount || 0 
          });

          // Insert new nodes if any
          if (nodes && nodes.length > 0) {
            const nodesToInsert = nodes.map(node => {
              const nodeData = {
                id: node.id || `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                flowId,
                category: (node.category || node.data?.category || 'action') as any,
                type: node.type || node.data?.type || 'default',
                title: node.data?.label || node.label || node.title || node.data?.title || 'Untitled Node',
                description: node.data?.description || node.description || null,
                position: node.position || { x: 0, y: 0 },
                config: node.data || node.config || {},
                isStart: Boolean(node.isStart || node.data?.isStart || false),
                isEnd: Boolean(node.isEnd || node.data?.isEnd || false),
                isEnabled: Boolean(node.isEnabled !== undefined ? node.isEnabled : (node.data?.isEnabled !== undefined ? node.data.isEnabled : true)),
                createdAt: new Date(),
                updatedAt: new Date()
              };
              
              console.log('💾 [REPOSITORY] Node to insert:', {
                id: nodeData.id,
                category: nodeData.category,
                type: nodeData.type,
                title: nodeData.title
              });
              
              return nodeData;
            });
            
            console.log('💾 [REPOSITORY] Inserting nodes:', nodesToInsert.length);
            const insertedNodes = await tx.insert(chatbotNodes).values(nodesToInsert).returning();
            console.log('✅ [REPOSITORY] Nodes inserted successfully:', insertedNodes.length);
          }

          // Insert new edges if any
          if (edges && edges.length > 0) {
            const edgesToInsert = edges.map(edge => {
              const edgeData = {
                id: edge.id || `edge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                flowId,
                fromNodeId: edge.source || edge.sourceNodeId || edge.fromNodeId,
                toNodeId: edge.target || edge.targetNodeId || edge.toNodeId,
                label: edge.label || edge.data?.label || null,
                condition: edge.data?.condition || edge.condition || null,
                kind: (edge.kind || edge.data?.kind || 'default') as any,
                order: edge.order || edge.data?.order || 0,
                isEnabled: Boolean(edge.isEnabled !== undefined ? edge.isEnabled : (edge.data?.isEnabled !== undefined ? edge.data.isEnabled : true)),
                createdAt: new Date()
              };
              
              console.log('💾 [REPOSITORY] Edge to insert:', {
                id: edgeData.id,
                from: edgeData.fromNodeId,
                to: edgeData.toNodeId,
                kind: edgeData.kind
              });
              
              return edgeData;
            });
            
            console.log('💾 [REPOSITORY] Inserting edges:', edgesToInsert.length);
            const insertedEdges = await tx.insert(chatbotEdges).values(edgesToInsert).returning();
            console.log('✅ [REPOSITORY] Edges inserted successfully:', insertedEdges.length);
          }

          // Update the flow's updatedAt timestamp
          const updatedFlow = await tx.update(chatbotFlows)
            .set({ updatedAt: new Date() })
            .where(eq(chatbotFlows.id, flowId))
            .returning();
          
          console.log('✅ [REPOSITORY] Flow timestamp updated:', updatedFlow.length > 0);
          
          return true;
        } catch (txError) {
          console.error('❌ [REPOSITORY] Transaction error:', txError);
          throw txError;
        }
      });

      console.log('✅ [REPOSITORY] Complete flow saved successfully with transaction result:', result);
      return result;
    } catch (error) {
      console.error('❌ [REPOSITORY] Error saving complete flow:', error);
      console.error('❌ [REPOSITORY] Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        flowId,
        nodeCount: nodes?.length || 0,
        edgeCount: edges?.length || 0,
        errorType: typeof error,
        errorConstructor: error?.constructor?.name
      });
      return false;
    }
  }
}