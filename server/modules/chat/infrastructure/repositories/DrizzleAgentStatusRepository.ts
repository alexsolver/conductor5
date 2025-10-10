/**
 * DRIZZLE AGENT STATUS REPOSITORY
 * Infrastructure Layer - Drizzle ORM implementation
 */

import { getTenantDb } from '@server/db';
import { agentStatus } from '@shared/schema-chat';
import { eq, and } from 'drizzle-orm';
import { IAgentStatusRepository } from '../../domain/repositories/IAgentStatusRepository';
import { AgentStatus } from '../../domain/entities/AgentStatus';

export class DrizzleAgentStatusRepository implements IAgentStatusRepository {
  async create(status: AgentStatus): Promise<AgentStatus> {
    const db = await getTenantDb(status.tenantId);
    const [created] = await db.insert(agentStatus).values(status).returning();
    return created as AgentStatus;
  }

  async update(
    userId: string,
    tenantId: string,
    data: Partial<AgentStatus>
  ): Promise<AgentStatus> {
    const db = await getTenantDb(tenantId);
    const [updated] = await db
      .update(agentStatus)
      .set({ ...data, updatedAt: new Date() })
      .where(
        and(
          eq(agentStatus.userId, userId),
          eq(agentStatus.tenantId, tenantId)
        )
      )
      .returning();
    return updated as AgentStatus;
  }

  async findByUserId(userId: string, tenantId: string): Promise<AgentStatus | null> {
    const db = await getTenantDb(tenantId);
    const [status] = await db
      .select()
      .from(agentStatus)
      .where(
        and(
          eq(agentStatus.userId, userId),
          eq(agentStatus.tenantId, tenantId)
        )
      )
      .limit(1);
    return status as AgentStatus || null;
  }

  async findByStatus(status: string, tenantId: string): Promise<AgentStatus[]> {
    const db = await getTenantDb(tenantId);
    const statuses = await db
      .select()
      .from(agentStatus)
      .where(
        and(
          eq(agentStatus.status, status),
          eq(agentStatus.tenantId, tenantId)
        )
      );
    return statuses as AgentStatus[];
  }

  async findAvailable(tenantId: string): Promise<AgentStatus[]> {
    const db = await getTenantDb(tenantId);
    const available = await db
      .select()
      .from(agentStatus)
      .where(
        and(
          eq(agentStatus.status, 'available'),
          eq(agentStatus.tenantId, tenantId)
        )
      );
    return available as AgentStatus[];
  }

  async findAll(tenantId: string): Promise<AgentStatus[]> {
    const db = await getTenantDb(tenantId);
    const all = await db
      .select()
      .from(agentStatus)
      .where(eq(agentStatus.tenantId, tenantId));
    return all as AgentStatus[];
  }
}
