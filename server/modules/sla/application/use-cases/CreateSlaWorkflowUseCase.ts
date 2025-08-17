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

    if (!data.name?.trim()) {
      throw new Error('Workflow name is required');
    }

    if (!data.triggers || data.triggers.length === 0) {
      throw new Error('At least one trigger is required');
    }

    if (!data.actions || data.actions.length === 0) {
      throw new Error('At least one action is required');
    }

    // Create the workflow
    const workflow = await this.slaWorkflowRepository.create({
      tenantId: data.tenantId,
      name: data.name.trim(),
      description: data.description?.trim() || '',
      isActive: data.isActive ?? true,
      triggers: data.triggers,
      actions: data.actions,
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