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

  private validateSlaDefinition(data: any): void {
    // Validate required fields
    if (!data.name || data.name.trim().length === 0) {
      throw new Error('SLA name is required');
    }

    if (!data.type || !['SLA', 'OLA', 'UC'].includes(data.type)) {
      throw new Error('Invalid SLA type. Must be SLA, OLA, or UC');
    }

    // Validate time targets - check both new and legacy formats
    const hasTimeTargets = data.timeTargets && Array.isArray(data.timeTargets) && data.timeTargets.length > 0;
    const hasLegacyTargets = data.responseTimeMinutes || data.resolutionTimeMinutes || 
                            data.updateTimeMinutes || data.idleTimeMinutes;
    
    if (!hasTimeTargets && !hasLegacyTargets) {
      throw new Error('At least one time target must be specified. Example: [{"metric": "response_time", "target": 30, "unit": "minutes", "priority": "high"}]');
    }

    // Validate each time target if timeTargets array is provided
    if (hasTimeTargets) {
      data.timeTargets.forEach((target: any, index: number) => {
        if (!target.metric || typeof target.metric !== 'string') {
          throw new Error(`Time target ${index + 1}: metric is required and must be a string`);
        }
        if (!target.target || typeof target.target !== 'number' || target.target <= 0) {
          throw new Error(`Time target ${index + 1}: target must be a positive number`);
        }
        if (!target.unit || !['minutes', 'hours', 'days'].includes(target.unit)) {
          throw new Error(`Time target ${index + 1}: unit must be 'minutes', 'hours', or 'days'`);
        }
      });
    }
  }

  // ===== SLA WORKFLOWS =====

  async createSlaWorkflow(workflowData: any): Promise<any> {
    // Validate workflow data
    this.validateSlaWorkflow(workflowData);

    return await this.slaRepository.createSlaWorkflow(workflowData);
  }

  async getSlaWorkflows(tenantId: string): Promise<any[]> {
    return await this.slaRepository.getSlaWorkflowsByTenant(tenantId);
  }

  async updateSlaWorkflow(id: string, tenantId: string, updates: any): Promise<any | null> {
    if (updates.triggers || updates.actions) {
      this.validateSlaWorkflow(updates);
    }

    return await this.slaRepository.updateSlaWorkflow(id, tenantId, {
      ...updates,
      updatedAt: new Date()
    });
  }

  async deleteSlaWorkflow(id: string, tenantId: string): Promise<boolean> {
    return await this.slaRepository.deleteSlaWorkflow(id, tenantId);
  }

  private validateSlaWorkflow(workflowData: any): void {
    // Validate required fields
    if (!workflowData.name || workflowData.name.trim().length === 0) {
      throw new Error('Workflow name is required');
    }

    // Validate triggers
    if (!workflowData.triggers || !Array.isArray(workflowData.triggers) || workflowData.triggers.length === 0) {
      throw new Error('At least one trigger must be specified');
    }

    // Validate actions
    if (!workflowData.actions || !Array.isArray(workflowData.actions) || workflowData.actions.length === 0) {
      throw new Error('At least one action must be specified');
    }

    // Validate each trigger
    workflowData.triggers.forEach((trigger: any, index: number) => {
      if (!trigger.type || !['time_based', 'event_based', 'condition_based'].includes(trigger.type)) {
        throw new Error(`Invalid trigger type at index ${index}`);
      }
    });

    // Validate each action
    workflowData.actions.forEach((action: any, index: number) => {
      if (!action.type || !['notify', 'escalate', 'assign', 'update_field', 'pause_sla', 'resume_sla', 'create_task'].includes(action.type)) {
        throw new Error(`Invalid action type at index ${index}`);
      }
      if (!action.id || typeof action.id !== 'string') {
        throw new Error(`Action at index ${index} must have a valid ID`);
      }
    });
  }

  // ===== PRIVATE HELPER METHODS =====

  private async createSlaInstance(sla: SlaDefinition, ticketId: string, metricType: string): Promise<SlaInstance> {
    const targetMinutes = this.getTargetMinutesForMetric(sla, metricType);
    
    return await this.slaRepository.createSlaInstance({
      tenantId: sla.tenantId,
      slaDefinitionId: sla.id,
      ticketId,
      metricType,
      targetMinutes,
      status: 'running',
      startedAt: new Date(),
      elapsedMinutes: 0,
      remainingMinutes: targetMinutes,
      pausedMinutes: 0,
      isBreached: false
    });
  }

  private getTargetMinutesForMetric(sla: SlaDefinition, metricType: string): number {
    // This is a simplified version - you may want to implement proper time target parsing
    switch (metricType) {
      case 'response_time': return 240; // 4 hours default
      case 'resolution_time': return 1440; // 24 hours default
      case 'update_time': return 480; // 8 hours default
      case 'idle_time': return 120; // 2 hours default
      default: return 240;
    }
  }

  private isRuleMatch(applicationRules: any, ticketData: any): boolean {
    // Simplified rule matching - implement proper logic based on your rule structure
    return true; // For now, all SLAs apply to all tickets
  }

  private calculateElapsedMinutes(start: Date, end: Date): number {
    return Math.floor((end.getTime() - start.getTime()) / (1000 * 60));
  }

  private async createSlaViolation(instance: SlaInstance, totalElapsed: number): Promise<void> {
    await this.slaRepository.createSlaViolation({
      tenantId: instance.tenantId,
      slaDefinitionId: instance.slaDefinitionId,
      slaInstanceId: instance.id,
      ticketId: instance.ticketId,
      metricType: instance.metricType,
      targetMinutes: instance.targetMinutes,
      actualMinutes: totalElapsed,
      violationMinutes: totalElapsed - instance.targetMinutes,
      violationPercentage: ((totalElapsed / instance.targetMinutes) - 1) * 100,
      severity: this.calculateViolationSeverity(totalElapsed, instance.targetMinutes),
      resolved: false,
      violatedAt: new Date()
    });
  }

  private calculateViolationSeverity(actualMinutes: number, targetMinutes: number): string {
    const violationPercentage = ((actualMinutes / targetMinutes) - 1) * 100;
    
    if (violationPercentage > 100) return 'critical';
    if (violationPercentage > 50) return 'high';
    if (violationPercentage > 25) return 'medium';
    return 'low';
  }

  private validateSlaWorkflow(data: any): void {
    // Validate required fields
    if (!data.name || data.name.trim().length === 0) {
      throw new Error('Workflow name is required');
    }

    // Validate triggers
    if (!data.triggers || !Array.isArray(data.triggers) || data.triggers.length === 0) {
      throw new Error('At least one trigger must be specified');
    }

    const validTriggerTypes = [
      'sla_breach', 'sla_warning', 'sla_met', 'instance_created', 
      'instance_closed', 'escalation_triggered', 'threshold_reached'
    ];

    data.triggers.forEach((trigger: any, index: number) => {
      if (!trigger.type || !validTriggerTypes.includes(trigger.type)) {
        throw new Error(`Invalid trigger type at index ${index}. Valid types: ${validTriggerTypes.join(', ')}`);
      }
    });

    // Validate actions
    if (!data.actions || !Array.isArray(data.actions) || data.actions.length === 0) {
      throw new Error('At least one action must be specified');
    }

    const validActionTypes = [
      'send_email', 'send_notification', 'create_ticket', 'escalate', 
      'update_priority', 'assign_user', 'webhook', 'log_event', 'notify'
    ];

    data.actions.forEach((action: any, index: number) => {
      if (!action.type || !validActionTypes.includes(action.type)) {
        throw new Error(`Invalid action type at index ${index}. Valid types: ${validActionTypes.join(', ')}`);
      }

      // Validate action-specific parameters
      switch (action.type) {
        case 'send_email':
          if (!action.config || !action.config.to || !action.config.subject) {
            throw new Error(`Action at index ${index}: send_email requires 'to' and 'subject' in config`);
          }
          if (typeof action.config.to !== 'string' || typeof action.config.subject !== 'string') {
            throw new Error(`Action at index ${index}: send_email 'to' and 'subject' must be strings`);
          }
          break;

        case 'send_notification':
        case 'notify':
          if (!action.config || (!action.config.users && !action.config.groups && !action.config.recipients)) {
            throw new Error(`Action at index ${index}: ${action.type} requires 'users', 'groups', or 'recipients' in config`);
          }
          break;

        case 'create_ticket':
          if (!action.config || !action.config.subject) {
            throw new Error(`Action at index ${index}: create_ticket requires 'subject' in config`);
          }
          break;

        case 'webhook':
          if (!action.config || !action.config.url) {
            throw new Error(`Action at index ${index}: webhook requires 'url' in config`);
          }
          break;

        case 'assign_user':
          if (!action.config || !action.config.userId) {
            throw new Error(`Action at index ${index}: assign_user requires 'userId' in config`);
          }
          break;
      }
    });

    // Validate priority
    if (data.priority !== undefined) {
      if (typeof data.priority !== 'number' || data.priority < 1 || data.priority > 10) {
        throw new Error('Priority must be a number between 1 and 10');
      }
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