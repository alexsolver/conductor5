import { eq, and } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '../database/schema';
import { IAiAgentRepository } from '../../domain/repositories/IAiAgentRepository';
import { AIAgent, AIAction, InterviewSession } from '../../domain/entities/AiAgent';
import { randomUUID } from 'crypto';

export class DrizzleAiAgentRepository implements IAiAgentRepository {
  
  private async getTenantDb(tenantId: string) {
    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
    const tenantPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      options: `-c search_path=${schemaName}`,
      ssl: false,
    });
    return drizzle({ client: tenantPool, schema });
  }

  async createAgent(agent: Omit<AIAgent, 'id' | 'createdAt' | 'updatedAt'>): Promise<AIAgent> {
    const tenantDb = await this.getTenantDb(agent.tenantId);
    const id = randomUUID();
    const now = new Date();
    
    const result = await tenantDb.insert(schema.omnibridgeAiAgents).values({
      id,
      tenantId: agent.tenantId,
      name: agent.name,
      description: agent.description,
      configPrompt: agent.configPrompt,
      allowedFormIds: agent.allowedFormIds,
      isActive: agent.isActive,
      createdBy: agent.createdBy,
      createdAt: now,
      updatedAt: now
    }).returning();

    return result[0] as AIAgent;
  }

  async findAgentById(id: string, tenantId: string): Promise<AIAgent | null> {
    const tenantDb = await this.getTenantDb(tenantId);
    const result = await tenantDb.select()
      .from(schema.omnibridgeAiAgents)
      .where(and(
        eq(schema.omnibridgeAiAgents.id, id),
        eq(schema.omnibridgeAiAgents.tenantId, tenantId)
      ))
      .limit(1);

    return result.length > 0 ? (result[0] as AIAgent) : null;
  }

  async findAgentsByTenant(tenantId: string): Promise<AIAgent[]> {
    const tenantDb = await this.getTenantDb(tenantId);
    const result = await tenantDb.select()
      .from(schema.omnibridgeAiAgents)
      .where(eq(schema.omnibridgeAiAgents.tenantId, tenantId))
      .orderBy(schema.omnibridgeAiAgents.name);

    return result as AIAgent[];
  }

  async updateAgent(id: string, tenantId: string, updates: Partial<AIAgent>): Promise<AIAgent> {
    const tenantDb = await this.getTenantDb(tenantId);
    const result = await tenantDb.update(schema.omnibridgeAiAgents)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(
        eq(schema.omnibridgeAiAgents.id, id),
        eq(schema.omnibridgeAiAgents.tenantId, tenantId)
      ))
      .returning();

    return result[0] as AIAgent;
  }

  async deleteAgent(id: string, tenantId: string): Promise<boolean> {
    const tenantDb = await this.getTenantDb(tenantId);
    const result = await tenantDb.delete(schema.omnibridgeAiAgents)
      .where(and(
        eq(schema.omnibridgeAiAgents.id, id),
        eq(schema.omnibridgeAiAgents.tenantId, tenantId)
      ))
      .returning();

    return result.length > 0;
  }

  async createAction(action: Omit<AIAction, 'id' | 'createdAt' | 'updatedAt'>): Promise<AIAction> {
    const tenantDb = await this.getTenantDb(action.tenantId);
    const id = randomUUID();
    const now = new Date();
    
    const result = await tenantDb.insert(schema.omnibridgeAiActions).values({
      id,
      tenantId: action.tenantId,
      agentId: action.agentId,
      type: action.type,
      config: action.config,
      executionCount: 0,
      createdAt: now,
      updatedAt: now
    }).returning();

    return result[0] as AIAction;
  }

  async findActionsByAgent(agentId: string, tenantId: string): Promise<AIAction[]> {
    const tenantDb = await this.getTenantDb(tenantId);
    const result = await tenantDb.select()
      .from(schema.omnibridgeAiActions)
      .where(and(
        eq(schema.omnibridgeAiActions.agentId, agentId),
        eq(schema.omnibridgeAiActions.tenantId, tenantId)
      ));

    return result as AIAction[];
  }

  async findActionById(id: string, tenantId: string): Promise<AIAction | null> {
    const tenantDb = await this.getTenantDb(tenantId);
    const result = await tenantDb.select()
      .from(schema.omnibridgeAiActions)
      .where(and(
        eq(schema.omnibridgeAiActions.id, id),
        eq(schema.omnibridgeAiActions.tenantId, tenantId)
      ))
      .limit(1);

    return result.length > 0 ? (result[0] as AIAction) : null;
  }

  async updateAction(id: string, tenantId: string, updates: Partial<AIAction>): Promise<AIAction> {
    const tenantDb = await this.getTenantDb(tenantId);
    const result = await tenantDb.update(schema.omnibridgeAiActions)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(
        eq(schema.omnibridgeAiActions.id, id),
        eq(schema.omnibridgeAiActions.tenantId, tenantId)
      ))
      .returning();

    return result[0] as AIAction;
  }

  async deleteAction(id: string, tenantId: string): Promise<boolean> {
    const tenantDb = await this.getTenantDb(tenantId);
    const result = await tenantDb.delete(schema.omnibridgeAiActions)
      .where(and(
        eq(schema.omnibridgeAiActions.id, id),
        eq(schema.omnibridgeAiActions.tenantId, tenantId)
      ))
      .returning();

    return result.length > 0;
  }

  async createSession(session: Omit<InterviewSession, 'id' | 'createdAt' | 'updatedAt'>): Promise<InterviewSession> {
    throw new Error('Interview sessions will be stored in-memory for now');
  }

  async findSessionById(id: string, tenantId: string): Promise<InterviewSession | null> {
    throw new Error('Interview sessions will be stored in-memory for now');
  }

  async findActiveSession(userId: string, channelId: string, tenantId: string): Promise<InterviewSession | null> {
    throw new Error('Interview sessions will be stored in-memory for now');
  }

  async updateSession(id: string, tenantId: string, updates: Partial<InterviewSession>): Promise<InterviewSession> {
    throw new Error('Interview sessions will be stored in-memory for now');
  }

  async completeSession(id: string, tenantId: string): Promise<InterviewSession> {
    throw new Error('Interview sessions will be stored in-memory for now');
  }
}
