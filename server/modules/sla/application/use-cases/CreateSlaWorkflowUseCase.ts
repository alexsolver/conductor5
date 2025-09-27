// ✅ 1QA.MD COMPLIANCE: CREATE SLA WORKFLOW USE CASE
// Application layer business logic for workflow creation

import { ISlaWorkflowRepository, CreateSlaWorkflowDTO } from '../../domain/repositories/ISlaWorkflowRepository';
import { SlaWorkflowDomainService } from '../../domain/services/SlaWorkflowDomainService';
import { SlaWorkflow } from '../../domain/entities/SlaWorkflow';

export class CreateSlaWorkflowUseCase {
  constructor(
    private slaWorkflowRepository: ISlaWorkflowRepository,
    private slaWorkflowDomainService: SlaWorkflowDomainService
  ) {}

  async execute(data: CreateSlaWorkflowDTO): Promise<SlaWorkflow> {
    // Validate input data
    if (!data.tenantId) {
      throw new Error('Tenant ID is required');
    }

    // Validate required fields
    if (!data.name?.trim()) {
      throw new Error('Workflow name is required');
    }

    // Check for duplicate name
    const existingWorkflow = await this.slaWorkflowRepository.findByName(data.name.trim(), data.tenantId);
    if (existingWorkflow) {
      throw new Error(`A workflow with the name "${data.name.trim()}" already exists. Please choose a different name.`);
    }

    if (!data.triggers || data.triggers.length === 0) {
      throw new Error('At least one trigger is required');
    }

    if (!data.actions || data.actions.length === 0) {
      throw new Error('At least one action is required');
    }

    // Normalize actions structure and add missing properties
    const normalizedActions = data.actions.map((action, index) => ({
      ...action,
      id: action.id || `action_${Date.now()}_${index}`,
      parameters: action.parameters || action.config || {},
      order: action.order || index + 1
    }));

    // Normalize triggers structure
    const normalizedTriggers = data.triggers.map((trigger, index) => ({
      id: trigger.id || `trigger_${Date.now()}_${index}`,
      type: trigger.type,
      conditions: trigger.conditions || [],
      schedule: trigger.schedule
    }));

    // Create the workflow
    const workflow = await this.slaWorkflowRepository.create({
      tenantId: data.tenantId,
      name: data.name.trim(),
      description: data.description?.trim() || '',
      isActive: data.isActive ?? true,
      triggers: normalizedTriggers,
      actions: normalizedActions,
      metadata: data.metadata || {}
    });

    // Validate workflow configuration using domain service
    const validation = this.slaWorkflowDomainService.validateWorkflowConfiguration(workflow);
    if (!validation.isValid) {
      // If validation fails, we should delete the created workflow and throw error
      await this.slaWorkflowRepository.delete(workflow.id, workflow.tenantId);
      throw new Error(`Workflow validation failed: ${validation.errors.join(', ')}`);
    }

    return workflow;
  }
}