import { eq, and } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '../database/schema';
import { IAiAgentRepository } from '../../domain/repositories/IAiAgentRepository';
import { AIAgent, AIAction, InterviewSession } from '../../domain/entities/AiAgent';
import { randomUUID } from 'crypto';

export class DrizzleAiAgentRepository implements IAiAgentRepository {
  
  private async getDb(tenantId: string) {
    const tenantSchema = `tenant_${tenantId.replace(/-/g, '_')}`;
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      options: `-c search_path=${tenantSchema}`,
      ssl: false,
    });
    return drizzle({ client: pool, schema });
  }

  async createAgent(agent: Omit<AIAgent, 'id' | 'createdAt' | 'updatedAt'>): Promise<AIAgent> {
    const db = await this.getDb(agent.tenantId);
    const id = randomUUID();
    const now = new Date();
    
    const result = await db.insert(schema.omnibridgeAiAgents).values({
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
    const db = await this.getDb(tenantId);
    const result = await db.select()
      .from(schema.omnibridgeAiAgents)
      .where(and(
        eq(schema.omnibridgeAiAgents.id, id),
        eq(schema.omnibridgeAiAgents.tenantId, tenantId)
      ))
      .limit(1);

    return result.length > 0 ? (result[0] as AIAgent) : null;
  }

  async findAgentsByTenant(tenantId: string): Promise<AIAgent[]> {
    const db = await this.getDb(tenantId);
    const result = await db.select()
      .from(schema.omnibridgeAiAgents)
      .where(eq(schema.omnibridgeAiAgents.tenantId, tenantId))
      .orderBy(schema.omnibridgeAiAgents.name);

    return result as AIAgent[];
  }

  async updateAgent(id: string, tenantId: string, updates: Partial<AIAgent>): Promise<AIAgent> {
    const db = await this.getDb(tenantId);
    const result = await db.update(schema.omnibridgeAiAgents)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(
        eq(schema.omnibridgeAiAgents.id, id),
        eq(schema.omnibridgeAiAgents.tenantId, tenantId)
      ))
      .returning();

    return result[0] as AIAgent;
  }

  async deleteAgent(id: string, tenantId: string): Promise<boolean> {
    const db = await this.getDb(tenantId);
    const result = await db.delete(schema.omnibridgeAiAgents)
      .where(and(
        eq(schema.omnibridgeAiAgents.id, id),
        eq(schema.omnibridgeAiAgents.tenantId, tenantId)
      ))
      .returning();

    return result.length > 0;
  }

  async createAction(action: Omit<AIAction, 'id' | 'createdAt' | 'updatedAt'>): Promise<AIAction> {
    const db = await this.getDb(action.tenantId);
    const id = randomUUID();
    const now = new Date();
    
    const result = await db.insert(schema.omnibridgeAiActions).values({
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
    const db = await this.getDb(tenantId);
    const result = await db.select()
      .from(schema.omnibridgeAiActions)
      .where(and(
        eq(schema.omnibridgeAiActions.agentId, agentId),
        eq(schema.omnibridgeAiActions.tenantId, tenantId)
      ));

    return result as AIAction[];
  }

  async findActionById(id: string, tenantId: string): Promise<AIAction | null> {
    const db = await this.getDb(tenantId);
    const result = await db.select()
      .from(schema.omnibridgeAiActions)
      .where(and(
        eq(schema.omnibridgeAiActions.id, id),
        eq(schema.omnibridgeAiActions.tenantId, tenantId)
      ))
      .limit(1);

    return result.length > 0 ? (result[0] as AIAction) : null;
  }

  async updateAction(id: string, tenantId: string, updates: Partial<AIAction>): Promise<AIAction> {
    const db = await this.getDb(tenantId);
    const result = await db.update(schema.omnibridgeAiActions)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(
        eq(schema.omnibridgeAiActions.id, id),
        eq(schema.omnibridgeAiActions.tenantId, tenantId)
      ))
      .returning();

    return result[0] as AIAction;
  }

  async deleteAction(id: string, tenantId: string): Promise<boolean> {
    const db = await this.getDb(tenantId);
    const result = await db.delete(schema.omnibridgeAiActions)
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
