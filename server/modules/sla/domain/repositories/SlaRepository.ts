// ✅ 1QA.MD COMPLIANCE: SLA REPOSITORY INTERFACE
// Clean Architecture domain repository interface

import { SlaDefinition, SlaInstance, SlaEvent, SlaViolation } from '../entities/SlaDefinition';

export interface SlaRepository {
  // SLA Definitions
  createSlaDefinition(sla: Omit<SlaDefinition, 'id' | 'createdAt' | 'updatedAt'>): Promise<SlaDefinition>;
  getSlaDefinitionById(id: string, tenantId: string): Promise<SlaDefinition | null>;
  getSlaDefinitionsByTenant(tenantId: string): Promise<SlaDefinition[]>;
  updateSlaDefinition(id: string, tenantId: string, updates: Partial<SlaDefinition>): Promise<SlaDefinition | null>;
  deleteSlaDefinition(id: string, tenantId: string): Promise<boolean>;

  // SLA Instances
  createSlaInstance(instance: Omit<SlaInstance, 'id' | 'createdAt' | 'updatedAt'>): Promise<SlaInstance>;
  getSlaInstanceById(id: string, tenantId: string): Promise<SlaInstance | null>;
  getSlaInstancesByTicket(ticketId: string, tenantId: string): Promise<SlaInstance[]>;
  getSlaInstancesByDefinition(slaDefinitionId: string, tenantId: string): Promise<SlaInstance[]>;
  updateSlaInstance(id: string, tenantId: string, updates: Partial<SlaInstance>): Promise<SlaInstance | null>;
  getActiveSlaInstances(tenantId: string): Promise<SlaInstance[]>;
  getBreachedSlaInstances(tenantId: string): Promise<SlaInstance[]>;

  // SLA Events
  createSlaEvent(event: Omit<SlaEvent, 'id' | 'createdAt'>): Promise<SlaEvent>;
  getSlaEventsByInstance(slaInstanceId: string, tenantId: string): Promise<SlaEvent[]>;
  getSlaEventsByTicket(ticketId: string, tenantId: string): Promise<SlaEvent[]>;

  // SLA Violations
  createSlaViolation(violation: Omit<SlaViolation, 'id' | 'createdAt' | 'updatedAt'>): Promise<SlaViolation>;
  getSlaViolationById(id: string, tenantId: string): Promise<SlaViolation | null>;
  getSlaViolationsByTicket(ticketId: string, tenantId: string): Promise<SlaViolation[]>;
  getSlaViolationsByDefinition(slaDefinitionId: string, tenantId: string): Promise<SlaViolation[]>;
  updateSlaViolation(id: string, tenantId: string, updates: Partial<SlaViolation>): Promise<SlaViolation | null>;
  getUnresolvedViolations(tenantId: string): Promise<SlaViolation[]>;

  // Analytics & Reporting
  getSlaComplianceStats(tenantId: string, startDate?: Date, endDate?: Date): Promise<SlaComplianceStats>;
  getSlaPerformanceMetrics(tenantId: string, slaDefinitionId?: string): Promise<SlaPerformanceMetrics>;
  getViolationTrends(tenantId: string, period: 'daily' | 'weekly' | 'monthly'): Promise<ViolationTrend[]>;

  // SLA Workflows
  createSlaWorkflow(workflowData: any): Promise<any>;
  getSlaWorkflowsByTenant(tenantId: string): Promise<any[]>;
  getSlaWorkflowById(id: string, tenantId: string): Promise<any | null>;
  updateSlaWorkflow(id: string, tenantId: string, updates: any): Promise<any | null>;
  deleteSlaWorkflow(id: string, tenantId: string): Promise<boolean>;
}

export interface SlaComplianceStats {
  totalTickets: number;
  slaMetTickets: number;
  slaViolatedTickets: number;
  compliancePercentage: number;
  avgResponseTimeMinutes: number;
  avgResolutionTimeMinutes: number;
  avgIdleTimeMinutes: number;
  totalEscalations: number;
  escalationRate: number;
}

export interface SlaPerformanceMetrics {
  slaDefinitionId: string;
  slaName: string;
  totalInstances: number;
  metInstances: number;
  violatedInstances: number;
  complianceRate: number;
  avgResponseTime: number;
  avgResolutionTime: number;
  avgIdleTime: number;
  escalationCount: number;
}

export interface ViolationTrend {
  period: string;
  totalViolations: number;
  responseTimeViolations: number;
  resolutionTimeViolations: number;
  idleTimeViolations: number;
  complianceRate: number;
}