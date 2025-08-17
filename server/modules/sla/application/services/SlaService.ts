// ✅ 1QA.MD COMPLIANCE: SLA APPLICATION SERVICE
// Clean Architecture application service for SLA operations

import { SlaRepository, SlaComplianceStats, SlaPerformanceMetrics } from '../../domain/repositories/SlaRepository';
import { SlaDefinition, SlaInstance, SlaEvent, SlaViolation } from '../../domain/entities/SlaDefinition';

export class SlaService {
  constructor(private slaRepository: SlaRepository) {}

  // ===== SLA DEFINITIONS =====
  
  async createSlaDefinition(slaData: Omit<SlaDefinition, 'id' | 'createdAt' | 'updatedAt'>): Promise<SlaDefinition> {
    // Validate business rules
    this.validateSlaDefinition(slaData);
    
    return await this.slaRepository.createSlaDefinition(slaData);
  }

  async getSlaDefinitions(tenantId: string): Promise<SlaDefinition[]> {
    return await this.slaRepository.getSlaDefinitionsByTenant(tenantId);
  }

  async getSlaDefinitionById(id: string, tenantId: string): Promise<SlaDefinition | null> {
    return await this.slaRepository.getSlaDefinitionById(id, tenantId);
  }

  async updateSlaDefinition(
    id: string, 
    tenantId: string, 
    updates: Partial<SlaDefinition>
  ): Promise<SlaDefinition | null> {
    if (updates.name || updates.applicationRules) {
      this.validateSlaDefinition(updates as any);
    }
    
    return await this.slaRepository.updateSlaDefinition(id, tenantId, {
      ...updates,
      updatedAt: new Date()
    });
  }

  async deleteSlaDefinition(id: string, tenantId: string): Promise<boolean> {
    // Check if SLA has active instances
    const instances = await this.slaRepository.getSlaInstancesByDefinition(id, tenantId);
    const activeInstances = instances.filter(i => i.status === 'running' || i.status === 'paused');
    
    if (activeInstances.length > 0) {
      throw new Error('Cannot delete SLA definition with active instances');
    }
    
    return await this.slaRepository.deleteSlaDefinition(id, tenantId);
  }

  // ===== SLA INSTANCES =====

  async startSlaForTicket(
    ticketId: string, 
    tenantId: string, 
    ticketData: any
  ): Promise<SlaInstance[]> {
    const slaDefinitions = await this.slaRepository.getSlaDefinitionsByTenant(tenantId);
    const applicableSlas = slaDefinitions.filter(sla => 
      sla.isActive && this.isRuleMatch(sla.applicationRules, ticketData)
    );

    const instances: SlaInstance[] = [];
    
    for (const sla of applicableSlas) {
      // Create instance for each applicable metric
      if (sla.responseTimeMinutes) {
        const instance = await this.createSlaInstance(sla, ticketId, 'response_time');
        instances.push(instance);
      }
      
      if (sla.resolutionTimeMinutes) {
        const instance = await this.createSlaInstance(sla, ticketId, 'resolution_time');
        instances.push(instance);
      }
      
      if (sla.updateTimeMinutes) {
        const instance = await this.createSlaInstance(sla, ticketId, 'update_time');
        instances.push(instance);
      }
      
      if (sla.idleTimeMinutes) {
        const instance = await this.createSlaInstance(sla, ticketId, 'idle_time');
        instances.push(instance);
      }
    }

    return instances;
  }

  async pauseSlaInstance(instanceId: string, tenantId: string, reason?: string): Promise<SlaInstance | null> {
    const instance = await this.slaRepository.getSlaInstanceById(instanceId, tenantId);
    if (!instance || instance.status !== 'running') {
      return null;
    }

    const now = new Date();
    const elapsedSinceStart = this.calculateElapsedMinutes(instance.startedAt, now);
    const newRemainingMinutes = Math.max(0, instance.targetMinutes - elapsedSinceStart);

    const updatedInstance = await this.slaRepository.updateSlaInstance(instanceId, tenantId, {
      status: 'paused',
      pausedAt: now,
      elapsedMinutes: elapsedSinceStart,
      remainingMinutes: newRemainingMinutes,
      updatedAt: now
    });

    // Log event
    await this.slaRepository.createSlaEvent({
      tenantId,
      slaInstanceId: instanceId,
      ticketId: instance.ticketId,
      eventType: 'paused',
      eventReason: reason,
      previousStatus: 'running',
      newStatus: 'paused',
      elapsedMinutesAtEvent: elapsedSinceStart,
      remainingMinutesAtEvent: newRemainingMinutes,
      triggeredBy: 'system',
      eventData: { reason }
    });

    return updatedInstance;
  }

  async resumeSlaInstance(instanceId: string, tenantId: string): Promise<SlaInstance | null> {
    const instance = await this.slaRepository.getSlaInstanceById(instanceId, tenantId);
    if (!instance || instance.status !== 'paused') {
      return null;
    }

    const now = new Date();
    const pausedDuration = instance.pausedAt ? 
      this.calculateElapsedMinutes(instance.pausedAt, now) : 0;

    const updatedInstance = await this.slaRepository.updateSlaInstance(instanceId, tenantId, {
      status: 'running',
      resumedAt: now,
      pausedMinutes: instance.pausedMinutes + pausedDuration,
      updatedAt: now
    });

    // Log event
    await this.slaRepository.createSlaEvent({
      tenantId,
      slaInstanceId: instanceId,
      ticketId: instance.ticketId,
      eventType: 'resumed',
      previousStatus: 'paused',
      newStatus: 'running',
      elapsedMinutesAtEvent: instance.elapsedMinutes,
      remainingMinutesAtEvent: instance.remainingMinutes,
      triggeredBy: 'system',
      eventData: { pausedDuration }
    });

    return updatedInstance;
  }

  async completeSlaInstance(instanceId: string, tenantId: string): Promise<SlaInstance | null> {
    const instance = await this.slaRepository.getSlaInstanceById(instanceId, tenantId);
    if (!instance || instance.status === 'completed') {
      return null;
    }

    const now = new Date();
    const totalElapsed = this.calculateElapsedMinutes(instance.startedAt, now) - instance.pausedMinutes;
    const isViolated = totalElapsed > instance.targetMinutes;

    const updatedInstance = await this.slaRepository.updateSlaInstance(instanceId, tenantId, {
      status: 'completed',
      completedAt: now,
      elapsedMinutes: totalElapsed,
      remainingMinutes: 0,
      isBreached: isViolated,
      breachDurationMinutes: isViolated ? totalElapsed - instance.targetMinutes : 0,
      breachPercentage: isViolated ? ((totalElapsed / instance.targetMinutes) - 1) * 100 : 0,
      updatedAt: now
    });

    // Log completion event
    await this.slaRepository.createSlaEvent({
      tenantId,
      slaInstanceId: instanceId,
      ticketId: instance.ticketId,
      eventType: 'completed',
      previousStatus: instance.status,
      newStatus: 'completed',
      elapsedMinutesAtEvent: totalElapsed,
      remainingMinutesAtEvent: 0,
      triggeredBy: 'system',
      eventData: { isViolated, totalElapsed }
    });

    // Create violation record if breached
    if (isViolated) {
      await this.createSlaViolation(instance, totalElapsed);
    }

    return updatedInstance;
  }

  // ===== SLA MONITORING =====

  async checkSlaBreaches(tenantId: string): Promise<SlaInstance[]> {
    const activeInstances = await this.slaRepository.getActiveSlaInstances(tenantId);
    const breachedInstances: SlaInstance[] = [];
    const now = new Date();

    for (const instance of activeInstances) {
      if (instance.status === 'running') {
        const totalElapsed = this.calculateElapsedMinutes(instance.startedAt, now) - instance.pausedMinutes;
        const remainingMinutes = Math.max(0, instance.targetMinutes - totalElapsed);
        
        if (totalElapsed > instance.targetMinutes && !instance.isBreached) {
          // Mark as breached
          const violationMinutes = totalElapsed - instance.targetMinutes;
          const violationPercentage = (violationMinutes / instance.targetMinutes) * 100;

          const updatedInstance = await this.slaRepository.updateSlaInstance(instance.id, tenantId, {
            isBreached: true,
            violatedAt: now,
            breachDurationMinutes: violationMinutes,
            breachPercentage: violationPercentage,
            remainingMinutes: 0,
            updatedAt: now
          });

          if (updatedInstance) {
            breachedInstances.push(updatedInstance);
            
            // Log violation event
            await this.slaRepository.createSlaEvent({
              tenantId,
              slaInstanceId: instance.id,
              ticketId: instance.ticketId,
              eventType: 'violated',
              previousStatus: 'running',
              newStatus: 'violated',
              elapsedMinutesAtEvent: totalElapsed,
              remainingMinutesAtEvent: 0,
              triggeredBy: 'system',
              eventData: { violationMinutes, violationPercentage }
            });

            // Create violation record
            await this.createSlaViolation(instance, totalElapsed);
          }
        } else if (!instance.isBreached) {
          // Update remaining time
          await this.slaRepository.updateSlaInstance(instance.id, tenantId, {
            elapsedMinutes: totalElapsed,
            remainingMinutes,
            updatedAt: now
          });
        }
      }
    }

    return breachedInstances;
  }

  // ===== ANALYTICS =====

  async getSlaComplianceStats(
    tenantId: string, 
    startDate?: Date, 
    endDate?: Date
  ): Promise<SlaComplianceStats> {
    return await this.slaRepository.getSlaComplianceStats(tenantId, startDate, endDate);
  }

  async getSlaPerformanceMetrics(
    tenantId: string, 
    slaDefinitionId?: string
  ): Promise<SlaPerformanceMetrics[]> {
    if (slaDefinitionId) {
      const metrics = await this.slaRepository.getSlaPerformanceMetrics(tenantId, slaDefinitionId);
      return [metrics];
    }
    
    const slaDefinitions = await this.slaRepository.getSlaDefinitionsByTenant(tenantId);
    const allMetrics: SlaPerformanceMetrics[] = [];
    
    for (const sla of slaDefinitions) {
      const metrics = await this.slaRepository.getSlaPerformanceMetrics(tenantId, sla.id);
      allMetrics.push(metrics);
    }
    
    return allMetrics;
  }

  // ===== PRIVATE METHODS =====

  private validateSlaDefinition(sla: Partial<SlaDefinition>): void {
    if (sla.name && sla.name.trim().length === 0) {
      throw new Error('SLA name is required');
    }

    if (sla.applicationRules && sla.applicationRules.length === 0) {
      throw new Error('At least one application rule is required');
    }

    if (sla.validFrom && sla.validUntil && sla.validFrom >= sla.validUntil) {
      throw new Error('Valid from date must be before valid until date');
    }

    const hasTargets = sla.responseTimeMinutes || sla.resolutionTimeMinutes || 
                      sla.updateTimeMinutes || sla.idleTimeMinutes;
    if (hasTargets === undefined) {
      throw new Error('At least one time target must be specified');
    }
  }

  private isRuleMatch(rules: any[], ticketData: any): boolean {
    if (!rules || rules.length === 0) return true;
    
    // Simple rule evaluation - can be expanded
    return rules.every(rule => {
      const fieldValue = ticketData[rule.field];
      
      switch (rule.operator) {
        case 'equals':
          return fieldValue === rule.value;
        case 'not_equals':
          return fieldValue !== rule.value;
        case 'in':
          return Array.isArray(rule.value) && rule.value.includes(fieldValue);
        case 'not_in':
          return Array.isArray(rule.value) && !rule.value.includes(fieldValue);
        default:
          return true;
      }
    });
  }

  private async createSlaInstance(
    sla: SlaDefinition, 
    ticketId: string, 
    metricType: 'response_time' | 'resolution_time' | 'update_time' | 'idle_time'
  ): Promise<SlaInstance> {
    const now = new Date();
    let targetMinutes = 0;

    switch (metricType) {
      case 'response_time':
        targetMinutes = sla.responseTimeMinutes || 0;
        break;
      case 'resolution_time':
        targetMinutes = sla.resolutionTimeMinutes || 0;
        break;
      case 'update_time':
        targetMinutes = sla.updateTimeMinutes || 0;
        break;
      case 'idle_time':
        targetMinutes = sla.idleTimeMinutes || 0;
        break;
    }

    const instance = await this.slaRepository.createSlaInstance({
      tenantId: sla.tenantId,
      slaDefinitionId: sla.id,
      ticketId,
      startedAt: now,
      status: 'running',
      currentMetric: metricType,
      elapsedMinutes: 0,
      pausedMinutes: 0,
      targetMinutes,
      remainingMinutes: targetMinutes,
      idleTimeMinutes: 0,
      isBreached: false,
      breachDurationMinutes: 0,
      breachPercentage: 0,
      escalationLevel: 0,
      automationTriggered: false,
      automationActions: []
    });

    // Log start event
    await this.slaRepository.createSlaEvent({
      tenantId: sla.tenantId,
      slaInstanceId: instance.id,
      ticketId,
      eventType: 'started',
      newStatus: 'running',
      elapsedMinutesAtEvent: 0,
      remainingMinutesAtEvent: targetMinutes,
      triggeredBy: 'system',
      eventData: { metricType, targetMinutes }
    });

    return instance;
  }

  private async createSlaViolation(
    instance: SlaInstance, 
    actualMinutes: number
  ): Promise<SlaViolation> {
    const violationMinutes = actualMinutes - instance.targetMinutes;
    const violationPercentage = (violationMinutes / instance.targetMinutes) * 100;

    return await this.slaRepository.createSlaViolation({
      tenantId: instance.tenantId,
      slaInstanceId: instance.id,
      ticketId: instance.ticketId,
      slaDefinitionId: instance.slaDefinitionId,
      violationType: instance.currentMetric,
      targetMinutes: instance.targetMinutes,
      actualMinutes,
      violationMinutes,
      violationPercentage,
      severityLevel: violationPercentage > 50 ? 'high' : 'medium',
      acknowledged: false,
      resolved: false
    });
  }

  private calculateElapsedMinutes(startTime: Date, endTime: Date): number {
    return Math.floor((endTime.getTime() - startTime.getTime()) / (1000 * 60));
  }
}