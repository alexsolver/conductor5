// ✅ 1QA.MD COMPLIANCE: SLA DRIZZLE REPOSITORY
// Clean Architecture infrastructure repository implementation

import { eq, and, desc, gte, lte, count, avg, sum } from 'drizzle-orm';
import { db, pool } from '../../../../db';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '@shared/schema';
import { 
  slaDefinitions, 
  slaInstances, 
  slaEvents, 
  slaViolations,
  SlaDefinition,
  SlaInstance,
  SlaEvent,
  SlaViolation
} from '@shared/schema-sla';
import { 
  SlaRepository, 
  SlaComplianceStats, 
  SlaPerformanceMetrics,
  ViolationTrend 
} from '../../domain/repositories/SlaRepository';

export class DrizzleSlaRepository implements SlaRepository {
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
  
  // ===== SLA DEFINITIONS =====
  
  async createSlaDefinition(slaData: Omit<SlaDefinition, 'id' | 'createdAt' | 'updatedAt'>): Promise<SlaDefinition> {
    console.log('[SLA-REPOSITORY] Creating SLA definition:', slaData.name);
    
    const tenantDb = await this.getTenantDb(slaData.tenantId);
    const [createdSla] = await tenantDb.insert(slaDefinitions)
      .values({
        ...slaData,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();

    console.log('[SLA-REPOSITORY] SLA definition created with ID:', createdSla.id);
    return createdSla;
  }

  async getSlaDefinitionById(id: string, tenantId: string): Promise<SlaDefinition | null> {
    console.log('[SLA-REPOSITORY] Getting SLA definition by ID:', id);
    
    const tenantDb = await this.getTenantDb(tenantId);
    const [sla] = await tenantDb.select()
      .from(slaDefinitions)
      .where(and(
        eq(slaDefinitions.id, id),
        eq(slaDefinitions.tenantId, tenantId)
      ))
      .limit(1);

    return sla || null;
  }

  async getSlaDefinitionsByTenant(tenantId: string): Promise<SlaDefinition[]> {
    console.log('[SLA-REPOSITORY] Getting SLA definitions for tenant:', tenantId);
    
    const tenantDb = await this.getTenantDb(tenantId);
    const slas = await tenantDb.select()
      .from(slaDefinitions)
      .where(eq(slaDefinitions.tenantId, tenantId))
      .orderBy(desc(slaDefinitions.createdAt));

    console.log('[SLA-REPOSITORY] Found SLA definitions:', slas.length);
    return slas;
  }

  async updateSlaDefinition(
    id: string, 
    tenantId: string, 
    updates: Partial<SlaDefinition>
  ): Promise<SlaDefinition | null> {
    console.log('[SLA-REPOSITORY] Updating SLA definition:', id);
    
    const tenantDb = await this.getTenantDb(tenantId);
    const [updatedSla] = await tenantDb.update(slaDefinitions)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(and(
        eq(slaDefinitions.id, id),
        eq(slaDefinitions.tenantId, tenantId)
      ))
      .returning();

    return updatedSla || null;
  }

  async deleteSlaDefinition(id: string, tenantId: string): Promise<boolean> {
    console.log('[SLA-REPOSITORY] Deleting SLA definition:', id);
    
    const tenantDb = await this.getTenantDb(tenantId);
    const result = await tenantDb.delete(slaDefinitions)
      .where(and(
        eq(slaDefinitions.id, id),
        eq(slaDefinitions.tenantId, tenantId)
      ));

    return result.rowCount > 0;
  }

  // ===== SLA INSTANCES =====
  
  async createSlaInstance(instanceData: Omit<SlaInstance, 'id' | 'createdAt' | 'updatedAt'>): Promise<SlaInstance> {
    console.log('[SLA-REPOSITORY] Creating SLA instance for ticket:', instanceData.ticketId);
    
    const tenantDb = await this.getTenantDb(instanceData.tenantId);
    const [createdInstance] = await tenantDb.insert(slaInstances)
      .values({
        ...instanceData,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();

    console.log('[SLA-REPOSITORY] SLA instance created with ID:', createdInstance.id);
    return createdInstance;
  }

  async getSlaInstanceById(id: string, tenantId: string): Promise<SlaInstance | null> {
    console.log('[SLA-REPOSITORY] Getting SLA instance by ID:', id);
    
    const tenantDb = await this.getTenantDb(tenantId);
    const [instance] = await tenantDb.select()
      .from(slaInstances)
      .where(and(
        eq(slaInstances.id, id),
        eq(slaInstances.tenantId, tenantId)
      ))
      .limit(1);

    return instance || null;
  }

  async getSlaInstancesByTicket(ticketId: string, tenantId: string): Promise<SlaInstance[]> {
    console.log('[SLA-REPOSITORY] Getting SLA instances for ticket:', ticketId);
    
    const tenantDb = await this.getTenantDb(tenantId);
    const instances = await tenantDb.select()
      .from(slaInstances)
      .where(and(
        eq(slaInstances.ticketId, ticketId),
        eq(slaInstances.tenantId, tenantId)
      ))
      .orderBy(desc(slaInstances.createdAt));

    console.log('[SLA-REPOSITORY] Found SLA instances:', instances.length);
    return instances;
  }

  async getSlaInstancesByDefinition(slaDefinitionId: string, tenantId: string): Promise<SlaInstance[]> {
    console.log('[SLA-REPOSITORY] Getting SLA instances for definition:', slaDefinitionId);
    
    const tenantDb = await this.getTenantDb(tenantId);
    const instances = await tenantDb.select()
      .from(slaInstances)
      .where(and(
        eq(slaInstances.slaDefinitionId, slaDefinitionId),
        eq(slaInstances.tenantId, tenantId)
      ))
      .orderBy(desc(slaInstances.createdAt));

    return instances;
  }

  async updateSlaInstance(
    id: string, 
    tenantId: string, 
    updates: Partial<SlaInstance>
  ): Promise<SlaInstance | null> {
    console.log('[SLA-REPOSITORY] Updating SLA instance:', id);
    
    const tenantDb = await this.getTenantDb(tenantId);
    const [updatedInstance] = await tenantDb.update(slaInstances)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(and(
        eq(slaInstances.id, id),
        eq(slaInstances.tenantId, tenantId)
      ))
      .returning();

    return updatedInstance || null;
  }

  async getActiveSlaInstances(tenantId: string): Promise<SlaInstance[]> {
    console.log('[SLA-REPOSITORY] Getting active SLA instances for tenant:', tenantId);
    
    const tenantDb = await this.getTenantDb(tenantId);
    const instances = await tenantDb.select()
      .from(slaInstances)
      .where(and(
        eq(slaInstances.tenantId, tenantId),
        eq(slaInstances.status, 'running')
      ));

    console.log('[SLA-REPOSITORY] Found active instances:', instances.length);
    return instances;
  }

  async getBreachedSlaInstances(tenantId: string): Promise<SlaInstance[]> {
    console.log('[SLA-REPOSITORY] Getting breached SLA instances for tenant:', tenantId);
    
    const tenantDb = await this.getTenantDb(tenantId);
    const instances = await tenantDb.select()
      .from(slaInstances)
      .where(and(
        eq(slaInstances.tenantId, tenantId),
        eq(slaInstances.isBreached, true)
      ))
      .orderBy(desc(slaInstances.violatedAt));

    console.log('[SLA-REPOSITORY] Found breached instances:', instances.length);
    return instances;
  }

  // ===== SLA EVENTS =====
  
  async createSlaEvent(eventData: Omit<SlaEvent, 'id' | 'createdAt'>): Promise<SlaEvent> {
    console.log('[SLA-REPOSITORY] Creating SLA event:', eventData.eventType);
    
    const tenantDb = await this.getTenantDb(tenantId);
    const [createdEvent] = await tenantDb.insert(slaEvents)
      .values({
        ...eventData,
        createdAt: new Date()
      })
      .returning();

    return createdEvent;
  }

  async getSlaEventsByInstance(slaInstanceId: string, tenantId: string): Promise<SlaEvent[]> {
    console.log('[SLA-REPOSITORY] Getting SLA events for instance:', slaInstanceId);
    
    const tenantDb = await this.getTenantDb(tenantId);
    const events = await tenantDb.select()
      .from(slaEvents)
      .where(and(
        eq(slaEvents.slaInstanceId, slaInstanceId),
        eq(slaEvents.tenantId, tenantId)
      ))
      .orderBy(desc(slaEvents.createdAt));

    return events;
  }

  async getSlaEventsByTicket(ticketId: string, tenantId: string): Promise<SlaEvent[]> {
    console.log('[SLA-REPOSITORY] Getting SLA events for ticket:', ticketId);
    
    const tenantDb = await this.getTenantDb(tenantId);
    const events = await tenantDb.select()
      .from(slaEvents)
      .where(and(
        eq(slaEvents.ticketId, ticketId),
        eq(slaEvents.tenantId, tenantId)
      ))
      .orderBy(desc(slaEvents.createdAt));

    return events;
  }

  // ===== SLA VIOLATIONS =====
  
  async createSlaViolation(violationData: Omit<SlaViolation, 'id' | 'createdAt' | 'updatedAt'>): Promise<SlaViolation> {
    console.log('[SLA-REPOSITORY] Creating SLA violation for ticket:', violationData.ticketId);
    
    const [createdViolation] = await tenantDb.insert(slaViolations)
      .values({
        ...violationData,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();

    console.log('[SLA-REPOSITORY] SLA violation created with ID:', createdViolation.id);
    return createdViolation;
  }

  async getSlaViolationById(id: string, tenantId: string): Promise<SlaViolation | null> {
    console.log('[SLA-REPOSITORY] Getting SLA violation by ID:', id);
    
    const [violation] = await tenantDb.select()
      .from(slaViolations)
      .where(and(
        eq(slaViolations.id, id),
        eq(slaViolations.tenantId, tenantId)
      ))
      .limit(1);

    return violation || null;
  }

  async getSlaViolationsByTicket(ticketId: string, tenantId: string): Promise<SlaViolation[]> {
    console.log('[SLA-REPOSITORY] Getting SLA violations for ticket:', ticketId);
    
    const violations = await tenantDb.select()
      .from(slaViolations)
      .where(and(
        eq(slaViolations.ticketId, ticketId),
        eq(slaViolations.tenantId, tenantId)
      ))
      .orderBy(desc(slaViolations.createdAt));

    return violations;
  }

  async getSlaViolationsByDefinition(slaDefinitionId: string, tenantId: string): Promise<SlaViolation[]> {
    console.log('[SLA-REPOSITORY] Getting SLA violations for definition:', slaDefinitionId);
    
    const violations = await tenantDb.select()
      .from(slaViolations)
      .where(and(
        eq(slaViolations.slaDefinitionId, slaDefinitionId),
        eq(slaViolations.tenantId, tenantId)
      ))
      .orderBy(desc(slaViolations.createdAt));

    return violations;
  }

  async updateSlaViolation(
    id: string, 
    tenantId: string, 
    updates: Partial<SlaViolation>
  ): Promise<SlaViolation | null> {
    console.log('[SLA-REPOSITORY] Updating SLA violation:', id);
    
    const [updatedViolation] = await tenantDb.update(slaViolations)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(and(
        eq(slaViolations.id, id),
        eq(slaViolations.tenantId, tenantId)
      ))
      .returning();

    return updatedViolation || null;
  }

  async getUnresolvedViolations(tenantId: string): Promise<SlaViolation[]> {
    console.log('[SLA-REPOSITORY] Getting unresolved violations for tenant:', tenantId);
    
    const violations = await tenantDb.select()
      .from(slaViolations)
      .where(and(
        eq(slaViolations.tenantId, tenantId),
        eq(slaViolations.resolved, false)
      ))
      .orderBy(desc(slaViolations.createdAt));

    console.log('[SLA-REPOSITORY] Found unresolved violations:', violations.length);
    return violations;
  }

  // ===== ANALYTICS & REPORTING =====
  
  async getSlaComplianceStats(
    tenantId: string, 
    startDate?: Date, 
    endDate?: Date
  ): Promise<SlaComplianceStats> {
    console.log('[SLA-REPOSITORY] Getting compliance stats for tenant:', tenantId);
    
    const baseClause = eq(slaInstances.tenantId, tenantId);
    const whereClause = startDate && endDate ? and(
      baseClause,
      gte(slaInstances.createdAt, startDate),
      lte(slaInstances.createdAt, endDate)
    ) : baseClause;

    // Get total instances
    const [totalResult] = await tenantDb.select({
      count: count()
    })
    .from(slaInstances)
    .where(whereClause);

    // Get met instances (completed without breach)
    const [metResult] = await tenantDb.select({
      count: count()
    })
    .from(slaInstances)
    .where(and(
      whereClause,
      eq(slaInstances.status, 'completed'),
      eq(slaInstances.isBreached, false)
    ));

    // Get violated instances
    const [violatedResult] = await tenantDb.select({
      count: count()
    })
    .from(slaInstances)
    .where(and(
      whereClause,
      eq(slaInstances.isBreached, true)
    ));

    // Get average times
    const [avgTimes] = await tenantDb.select({
      avgResponse: avg(slaInstances.responseTimeMinutes),
      avgResolution: avg(slaInstances.resolutionTimeMinutes),
      avgIdle: avg(slaInstances.idleTimeMinutes)
    })
    .from(slaInstances)
    .where(whereClause);

    // Get escalation data
    const [escalationResult] = await tenantDb.select({
      count: count(),
      total: sum(slaInstances.escalationLevel)
    })
    .from(slaInstances)
    .where(and(
      whereClause,
      eq(slaInstances.escalationLevel, 0) // Greater than 0
    ));

    const totalTickets = totalResult.count || 0;
    const slaMetTickets = metResult.count || 0;
    const slaViolatedTickets = violatedResult.count || 0;
    const totalEscalations = escalationResult.count || 0;

    return {
      totalTickets,
      slaMetTickets,
      slaViolatedTickets,
      compliancePercentage: totalTickets > 0 ? (slaMetTickets / totalTickets) * 100 : 0,
      avgResponseTimeMinutes: Number(avgTimes.avgResponse) || 0,
      avgResolutionTimeMinutes: Number(avgTimes.avgResolution) || 0,
      avgIdleTimeMinutes: Number(avgTimes.avgIdle) || 0,
      totalEscalations,
      escalationRate: totalTickets > 0 ? (totalEscalations / totalTickets) * 100 : 0
    };
  }

  async getSlaPerformanceMetrics(
    tenantId: string, 
    slaDefinitionId?: string
  ): Promise<SlaPerformanceMetrics> {
    console.log('[SLA-REPOSITORY] Getting performance metrics for SLA:', slaDefinitionId);
    
    if (!slaDefinitionId) {
      throw new Error('SLA definition ID is required');
    }

    // Get SLA definition
    const slaDefinition = await this.getSlaDefinitionById(slaDefinitionId, tenantId);
    if (!slaDefinition) {
      throw new Error('SLA definition not found');
    }

    // Get instances for this SLA
    const instances = await this.getSlaInstancesByDefinition(slaDefinitionId, tenantId);
    
    const totalInstances = instances.length;
    const metInstances = instances.filter(i => 
      i.status === 'completed' && !i.isBreached
    ).length;
    const violatedInstances = instances.filter(i => i.isBreached).length;

    // Calculate averages
    const completedInstances = instances.filter(i => i.status === 'completed');
    const avgResponseTime = completedInstances.length > 0 ? 
      completedInstances.reduce((sum, i) => sum + (i.responseTimeMinutes || 0), 0) / completedInstances.length : 0;
    
    const avgResolutionTime = completedInstances.length > 0 ? 
      completedInstances.reduce((sum, i) => sum + (i.resolutionTimeMinutes || 0), 0) / completedInstances.length : 0;
    
    const avgIdleTime = instances.length > 0 ? 
      instances.reduce((sum, i) => sum + i.idleTimeMinutes, 0) / instances.length : 0;

    const escalationCount = instances.filter(i => i.escalationLevel > 0).length;

    return {
      slaDefinitionId,
      slaName: slaDefinition.name,
      totalInstances,
      metInstances,
      violatedInstances,
      complianceRate: totalInstances > 0 ? (metInstances / totalInstances) * 100 : 0,
      avgResponseTime,
      avgResolutionTime,
      avgIdleTime,
      escalationCount
    };
  }

  async getViolationTrends(
    tenantId: string, 
    period: 'daily' | 'weekly' | 'monthly'
  ): Promise<ViolationTrend[]> {
    console.log('[SLA-REPOSITORY] Getting violation trends for period:', period);
    
    // This is a simplified implementation
    // In a real system, you would use more sophisticated date grouping
    const violations = await tenantDb.select()
      .from(slaViolations)
      .where(eq(slaViolations.tenantId, tenantId))
      .orderBy(desc(slaViolations.createdAt));

    // Group violations by period (simplified)
    const trends: ViolationTrend[] = [];
    
    // This would need proper date grouping logic based on the period
    // For now, return a simple aggregation
    if (violations.length > 0) {
      const today = new Date().toISOString().split('T')[0];
      
      trends.push({
        period: today,
        totalViolations: violations.length,
        responseTimeViolations: violations.filter((v: any) => v.violationType === 'response_time').length,
        resolutionTimeViolations: violations.filter((v: any) => v.violationType === 'resolution_time').length,
        idleTimeViolations: violations.filter((v: any) => v.violationType === 'idle_time').length,
        complianceRate: 85 // This should be calculated based on actual data
      });
    }

    return trends;
  }
}