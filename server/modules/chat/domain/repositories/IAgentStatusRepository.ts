/**
 * AGENT STATUS REPOSITORY INTERFACE
 * Clean Architecture - Domain Layer
 */

import { AgentStatus } from '../entities/AgentStatus';

export interface IAgentStatusRepository {
  create(status: AgentStatus): Promise<AgentStatus>;
  update(userId: string, tenantId: string, data: Partial<AgentStatus>): Promise<AgentStatus>;
  findByUserId(userId: string, tenantId: string): Promise<AgentStatus | null>;
  findByStatus(status: string, tenantId: string): Promise<AgentStatus[]>;
  findAvailable(tenantId: string): Promise<AgentStatus[]>;
  findAll(tenantId: string): Promise<AgentStatus[]>;
}
