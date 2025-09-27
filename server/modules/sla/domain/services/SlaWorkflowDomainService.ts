// ✅ 1QA.MD COMPLIANCE: SLA WORKFLOW DOMAIN SERVICE
// Pure business logic for workflow automation rules

import { SlaWorkflow, SlaWorkflowExecution, SlaWorkflowAction } from '../entities/SlaWorkflow';

export class SlaWorkflowDomainService {
  
  /**
   * Determines if a workflow should be triggered based on SLA events
   */
  shouldTriggerWorkflow(workflow: SlaWorkflow, eventType: string, eventData: Record<string, any>): boolean {
    if (!workflow.isActive) {
      return false;
    }

    // Check if any trigger matches the current event
    return workflow.triggers.some(trigger => {
      if (trigger.type === 'event_based') {
        return trigger.conditions.some(condition => 
          condition.field === 'event_type' && condition.value === eventType
        );
      }
      
      if (trigger.type === 'condition_based') {
        return workflow.canExecute(eventData);
      }
      
      return false;
    });
  }

  /**
   * Validates workflow configuration before execution
   */
  validateWorkflowConfiguration(workflow: SlaWorkflow): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate triggers
    if (!workflow.triggers || workflow.triggers.length === 0) {
      errors.push('Workflow must have at least one trigger');
    }

    workflow.triggers.forEach((trigger, index) => {
      if (!trigger.type || !['time_based', 'event_based', 'condition_based'].includes(trigger.type)) {
        errors.push(`Invalid trigger type at index ${index}`);
      }

      if (trigger.type === 'time_based' && !trigger.schedule) {
        errors.push(`Time-based trigger at index ${index} requires schedule configuration`);
      }

      if (trigger.conditions) {
        trigger.conditions.forEach((condition, condIndex) => {
          if (!condition.field || !condition.operator) {
            errors.push(`Invalid condition at trigger ${index}, condition ${condIndex}`);
          }
        });
      }
    });

    // Validate actions
    if (!workflow.actions || workflow.actions.length === 0) {
      errors.push('Workflow must have at least one action');
    }

    workflow.actions.forEach((action, index) => {
      if (!workflow.validateActionParameters(action)) {
        errors.push(`Invalid action parameters at index ${index}`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Calculates the priority order for workflow execution
   */
  calculateExecutionPriority(workflows: SlaWorkflow[], context: Record<string, any>): SlaWorkflow[] {
    return workflows
      .filter(workflow => workflow.canExecute(context))
      .sort((a, b) => {
        // Priority order: critical events first, then by creation date
        const aPriority = this.getEventPriority(a, context);
        const bPriority = this.getEventPriority(b, context);
        
        if (aPriority !== bPriority) {
          return bPriority - aPriority; // Higher priority first
        }
        
        return a.createdAt.getTime() - b.createdAt.getTime(); // Older workflows first
      });
  }

  private getEventPriority(workflow: SlaWorkflow, context: Record<string, any>): number {
    // Escalation workflows have highest priority
    const hasEscalationAction = workflow.actions.some(action => action.type === 'escalate');
    if (hasEscalationAction && context.sla_breach_imminent) {
      return 100;
    }

    // SLA pause/resume actions have high priority
    const hasSlaControlAction = workflow.actions.some(action => 
      action.type === 'pause_sla' || action.type === 'resume_sla'
    );
    if (hasSlaControlAction) {
      return 80;
    }

    // Notification workflows have medium priority
    const hasNotificationAction = workflow.actions.some(action => action.type === 'notify');
    if (hasNotificationAction) {
      return 60;
    }

    // Other workflows have normal priority
    return 50;
  }

  /**
   * Determines if workflow execution should be delayed
   */
  calculateExecutionDelay(action: SlaWorkflowAction, context: Record<string, any>): number {
    // Check for explicit delay in action configuration
    if (action.delay && action.delay > 0) {
      return action.delay;
    }

    // Dynamic delay based on action type and context
    switch (action.type) {
      case 'escalate':
        // Escalations might need a brief delay to allow for last-minute resolutions
        return context.urgency === 'critical' ? 0 : 5 * 60 * 1000; // 5 minutes for non-critical
      
      case 'notify':
        // Notifications can be immediate unless specified otherwise
        return 0;
      
      case 'pause_sla':
      case 'resume_sla':
        // SLA control actions should be immediate
        return 0;
      
      default:
        return 0;
    }
  }

  /**
   * Validates execution context before workflow execution
   */
  validateExecutionContext(workflow: SlaWorkflow, context: Record<string, any>): { isValid: boolean; reason?: string } {
    // Check required context fields
    const requiredFields = ['ticketId', 'tenantId'];
    for (const field of requiredFields) {
      if (!context[field]) {
        return {
          isValid: false,
          reason: `Missing required context field: ${field}`
        };
      }
    }

    // Validate tenant isolation
    if (context.tenantId !== workflow.tenantId) {
      return {
        isValid: false,
        reason: 'Tenant ID mismatch between workflow and context'
      };
    }

    // Check for circular execution prevention
    if (context.workflowExecutionChain && context.workflowExecutionChain.includes(workflow.id)) {
      return {
        isValid: false,
        reason: 'Circular workflow execution detected'
      };
    }

    return { isValid: true };
  }

  /**
   * Prepares action execution parameters
   */
  prepareActionExecution(action: SlaWorkflowAction, context: Record<string, any>): Record<string, any> {
    // Get parameters from either parameters or config property
    const baseParams = { ...(action.parameters || (action as any).config || {}) };

    // Inject context variables into action parameters
    return this.interpolateContextVariables(baseParams, context);
  }

  private interpolateContextVariables(params: Record<string, any>, context: Record<string, any>): Record<string, any> {
    const result = { ...params };

    for (const [key, value] of Object.entries(result)) {
      if (typeof value === 'string' && value.includes('{{')) {
        // Replace context variables in string format {{variable}}
        result[key] = value.replace(/\{\{(\w+)\}\}/g, (match, variable) => {
          return context[variable] || match;
        });
      }
    }

    return result;
  }

  /**
   * Determines if workflow execution should be retried on failure
   */
  shouldRetryExecution(execution: SlaWorkflowExecution, error: Error): { shouldRetry: boolean; delay?: number } {
    // Don't retry if execution was cancelled
    if (execution.status === 'cancelled') {
      return { shouldRetry: false };
    }

    // Check for transient errors that might be retryable
    const retryableErrors = [
      'NETWORK_ERROR',
      'TIMEOUT_ERROR',
      'TEMPORARY_UNAVAILABLE',
      'RATE_LIMIT_EXCEEDED'
    ];

    const isRetryable = retryableErrors.some(errType => 
      error.message.includes(errType) || error.name.includes(errType)
    );

    if (!isRetryable) {
      return { shouldRetry: false };
    }

    // Calculate retry delay with exponential backoff
    const attemptNumber = execution.executedActions.length || 1;
    const baseDelay = 5000; // 5 seconds
    const maxDelay = 300000; // 5 minutes
    
    const delay = Math.min(baseDelay * Math.pow(2, attemptNumber - 1), maxDelay);

    return {
      shouldRetry: attemptNumber <= 3, // Max 3 retries
      delay
    };
  }
}