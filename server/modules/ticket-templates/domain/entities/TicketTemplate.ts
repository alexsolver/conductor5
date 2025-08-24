/**
 * Ticket Template Domain Entity
 * Clean Architecture - Domain Layer
 * 
 * @module TicketTemplateEntity
 * @created 2025-08-12 - Phase 20 Clean Architecture Implementation
 */

export interface TicketTemplate {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  category: string;
  subcategory?: string;
  companyId?: string; // null for global templates, specific companyId for company-specific templates
  departmentId?: string;
  isGlobal: boolean; // true for global templates, false for company-specific
  priority: 'low' | 'medium' | 'high' | 'urgent';
  templateType: 'standard' | 'quick' | 'escalation' | 'auto_response' | 'workflow';
  status: 'active' | 'inactive' | 'draft';
  fields: TicketTemplateField[];
  automation: TicketTemplateAutomation;
  workflow: TicketTemplateWorkflow;
  permissions: TicketTemplatePermission[];
  metadata: TicketTemplateMetadata;
  isDefault: boolean;
  isSystem: boolean;
  usageCount: number;
  lastUsed?: Date;
  tags: string[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export interface TicketTemplateField {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'email' | 'phone' | 'date' | 'datetime' | 'select' | 'multiselect' | 'checkbox' | 'radio' | 'file' | 'url';
  required: boolean;
  defaultValue?: any;
  placeholder?: string;
  helpText?: string;
  validation?: FieldValidation;
  options?: SelectOption[]; // For select/multiselect fields
  order: number;
  section?: string;
  conditional?: ConditionalLogic;
  readonly: boolean;
  hidden: boolean;
  customAttributes?: Record<string, any>;
}

export interface TicketTemplateAutomation {
  enabled: boolean;
  autoAssign?: {
    enabled: boolean;
    userId?: string;
    teamId?: string;
    rules: AutoAssignRule[];
  };
  autoTags?: {
    enabled: boolean;
    tags: string[];
    conditions?: AutomationCondition[];
  };
  autoStatus?: {
    enabled: boolean;
    status: string;
    conditions?: AutomationCondition[];
  };
  notifications?: {
    enabled: boolean;
    recipients: NotificationRecipient[];
    template?: string;
    delay?: number; // in minutes
  };
  escalation?: {
    enabled: boolean;
    rules: EscalationRule[];
  };
  sla?: {
    enabled: boolean;
    responseTime?: number; // in hours
    resolutionTime?: number; // in hours
    businessHours?: boolean;
  };
}

export interface TicketTemplateWorkflow {
  enabled: boolean;
  stages: WorkflowStage[];
  approvals?: ApprovalStep[];
  conditions?: WorkflowCondition[];
  transitions?: WorkflowTransition[];
}

export interface TicketTemplatePermission {
  id: string;
  roleId: string;
  roleName: string;
  permissions: ('view' | 'use' | 'edit' | 'delete' | 'manage')[];
  grantedBy: string;
  grantedAt: Date;
}

export interface TicketTemplateMetadata {
  version: string;
  author: string;
  lastModifiedBy: string;
  lastModifiedAt: Date;
  changeLog: TemplateChangeEntry[];
  usage: {
    totalUses: number;
    lastMonth: number;
    avgResponseTime?: number;
    avgResolutionTime?: number;
    successRate?: number;
  };
  analytics: {
    popularFields: string[];
    commonIssues: string[];
    userFeedback: UserFeedback[];
  };
  compliance: {
    gdprCompliant: boolean;
    dataRetention?: number; // in days
    auditRequired: boolean;
  };
}

export interface FieldValidation {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  customValidator?: string;
  errorMessage?: string;
}

export interface SelectOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
  color?: string;
}

export interface ConditionalLogic {
  dependsOn: string; // field name
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than' | 'is_empty' | 'is_not_empty';
  value: any;
  action: 'show' | 'hide' | 'require' | 'disable' | 'enable';
}

export interface AutoAssignRule {
  id: string;
  name: string;
  conditions: AutomationCondition[];
  assignTo: {
    type: 'user' | 'team' | 'queue';
    id: string;
    name: string;
  };
  priority: number;
  enabled: boolean;
}

export interface AutomationCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'starts_with' | 'ends_with' | 'in' | 'not_in';
  value: any;
  logicalOperator?: 'AND' | 'OR';
}

export interface NotificationRecipient {
  type: 'user' | 'team' | 'role' | 'email' | 'custom';
  id?: string;
  email?: string;
  name?: string;
}

export interface EscalationRule {
  id: string;
  name: string;
  timeThreshold: number; // in hours
  conditions?: AutomationCondition[];
  escalateTo: {
    type: 'user' | 'team' | 'manager';
    id: string;
    name: string;
  };
  actions: EscalationAction[];
  enabled: boolean;
}

export interface EscalationAction {
  type: 'notify' | 'reassign' | 'change_priority' | 'add_tag' | 'change_status';
  value: any;
  delay?: number; // in minutes
}

export interface WorkflowStage {
  id: string;
  name: string;
  description?: string;
  order: number;
  required: boolean;
  autoAdvance: boolean;
  conditions?: WorkflowCondition[];
  actions?: WorkflowAction[];
  timeLimit?: number; // in hours
}

export interface ApprovalStep {
  id: string;
  name: string;
  approvers: {
    type: 'user' | 'team' | 'role';
    id: string;
    name: string;
  }[];
  required: boolean;
  order: number;
  conditions?: WorkflowCondition[];
}

export interface WorkflowCondition {
  field: string;
  operator: string;
  value: any;
  stage?: string;
}

export interface WorkflowTransition {
  from: string;
  to: string;
  conditions?: WorkflowCondition[];
  actions?: WorkflowAction[];
  automatic: boolean;
}

export interface WorkflowAction {
  type: 'notify' | 'assign' | 'tag' | 'status_change' | 'field_update' | 'webhook';
  value: any;
  delay?: number;
}

export interface TemplateChangeEntry {
  id: string;
  version: string;
  changes: string;
  changedBy: string;
  changedAt: Date;
  changeType: 'major' | 'minor' | 'patch' | 'hotfix';
}

export interface UserFeedback {
  id: string;
  userId: string;
  userName: string;
  rating: number; // 1-5
  comment?: string;
  submittedAt: Date;
}

/**
 * Ticket Template Business Rules and Validations
 */
export class TicketTemplateDomainService {
  
  /**
   * Validate ticket template data
   */
  static validateTemplate(template: Partial<TicketTemplate>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Basic validation
    if (!template.name) errors.push('Nome do template é obrigatório');
    if (!template.category) errors.push('Categoria é obrigatória');
    if (!template.tenantId) errors.push('ID do tenant é obrigatório');
    if (!template.templateType) errors.push('Tipo do template é obrigatório');

    // Hierarchical validation
    if (template.isGlobal === undefined) errors.push('Campo isGlobal é obrigatório');
    if (template.isGlobal === false && !template.companyId) {
      errors.push('Templates específicos devem ter um companyId');
    }
    if (template.isGlobal === true && template.companyId) {
      errors.push('Templates globais não devem ter companyId');
    }

    // Name validation
    if (template.name && template.name.length < 3) {
      errors.push('Nome deve ter pelo menos 3 caracteres');
    }
    if (template.name && template.name.length > 100) {
      errors.push('Nome deve ter no máximo 100 caracteres');
    }

    // Fields validation
    if (template.fields) {
      const fieldNames = template.fields.map(f => f.name);
      const duplicateFields = fieldNames.filter((name, index) => fieldNames.indexOf(name) !== index);
      if (duplicateFields.length > 0) {
        errors.push(`Campos duplicados: ${duplicateFields.join(', ')}`);
      }

      // Validate individual fields
      template.fields.forEach((field, index) => {
        if (!field.name) errors.push(`Campo ${index + 1}: nome é obrigatório`);
        if (!field.label) errors.push(`Campo ${index + 1}: rótulo é obrigatório`);
        if (!field.type) errors.push(`Campo ${index + 1}: tipo é obrigatório`);
        
        // Validate select options
        if (['select', 'multiselect', 'radio'].includes(field.type) && (!field.options || field.options.length === 0)) {
          errors.push(`Campo ${field.name}: opções são obrigatórias para campos do tipo ${field.type}`);
        }

        // Validate field name format
        if (field.name && !/^[a-zA-Z0-9_]+$/.test(field.name)) {
          errors.push(`Campo ${field.name}: nome deve conter apenas letras, números e underscore`);
        }
      });
    }

    // Workflow validation
    if (template.workflow?.enabled && template.workflow.stages) {
      const stageNames = template.workflow.stages.map(s => s.name);
      const duplicateStages = stageNames.filter((name, index) => stageNames.indexOf(name) !== index);
      if (duplicateStages.length > 0) {
        errors.push(`Estágios duplicados no workflow: ${duplicateStages.join(', ')}`);
      }
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Calculate template complexity score
   */
  static calculateComplexityScore(template: TicketTemplate): number {
    let score = 0;
    
    // Base score for fields
    score += template.fields.length * 2;
    
    // Complexity for field types
    template.fields.forEach(field => {
      switch (field.type) {
        case 'text':
        case 'number':
          score += 1;
          break;
        case 'textarea':
        case 'email':
        case 'phone':
        case 'url':
          score += 2;
          break;
        case 'select':
        case 'radio':
          score += 3;
          break;
        case 'multiselect':
        case 'checkbox':
          score += 4;
          break;
        case 'date':
        case 'datetime':
          score += 3;
          break;
        case 'file':
          score += 5;
          break;
      }

      // Add complexity for validations
      if (field.validation) score += 2;
      if (field.conditional) score += 3;
      if (field.options && field.options.length > 5) score += 2;
    });

    // Automation complexity
    if (template.automation.enabled) {
      score += 5;
      if (template.automation.autoAssign?.enabled) score += 3;
      if (template.automation.escalation?.enabled) score += 5;
      if (template.automation.sla?.enabled) score += 3;
    }

    // Workflow complexity
    if (template.workflow.enabled) {
      score += template.workflow.stages.length * 3;
      if (template.workflow.approvals) score += template.workflow.approvals.length * 4;
      if (template.workflow.conditions) score += template.workflow.conditions.length * 2;
    }

    return Math.min(score, 100); // Cap at 100
  }

  /**
   * Generate template usage analytics
   */
  static generateUsageAnalytics(templates: TicketTemplate[]): {
    totalTemplates: number;
    activeTemplates: number;
    mostUsedTemplate: TicketTemplate | null;
    averageComplexity: number;
    templatesByCategory: Record<string, number>;
    templatesByType: Record<string, number>;
  } {
    const activeTemplates = templates.filter(t => t.status === 'active');
    const mostUsedTemplate = templates.reduce((max, template) => 
      (!max || template.usageCount > max.usageCount) ? template : max
    , null as TicketTemplate | null);

    const totalComplexity = templates.reduce((sum, template) => 
      sum + this.calculateComplexityScore(template), 0
    );
    const averageComplexity = templates.length > 0 ? 
      Math.round((totalComplexity / templates.length) * 100) / 100 : 0;

    const templatesByCategory = templates.reduce((acc, template) => {
      acc[template.category] = (acc[template.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const templatesByType = templates.reduce((acc, template) => {
      acc[template.templateType] = (acc[template.templateType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalTemplates: templates.length,
      activeTemplates: activeTemplates.length,
      mostUsedTemplate,
      averageComplexity,
      templatesByCategory,
      templatesByType
    };
  }

  /**
   * Validate template permissions for user role
   */
  static hasPermission(template: TicketTemplate, userRole: string, action: 'view' | 'use' | 'edit' | 'delete' | 'manage'): boolean {
    // System admin has all permissions
    if (userRole === 'saas_admin' || userRole === 'tenant_admin') {
      return true;
    }

    // Check specific permissions
    const permission = template.permissions.find(p => p.roleName === userRole);
    return permission ? permission.permissions.includes(action) : false;
  }

  /**
   * Check if template can be used by user
   */
  static canUseTemplate(template: TicketTemplate, userRole: string, companyId?: string): boolean {
    // Check if template is active
    if (template.status !== 'active' || !template.isActive) {
      return false;
    }

    // Check permissions
    if (!this.hasPermission(template, userRole, 'use')) {
      return false;
    }

    // Check company restriction
    if (template.companyId && companyId && template.companyId !== companyId) {
      return false;
    }

    return true;
  }

  /**
   * Calculate estimated completion time based on template complexity
   */
  static estimateCompletionTime(template: TicketTemplate): number {
    const complexityScore = this.calculateComplexityScore(template);
    const baseTime = 15; // base 15 minutes
    const complexityMultiplier = complexityScore / 20;
    
    return Math.round(baseTime + (baseTime * complexityMultiplier));
  }

  /**
   * Validate automation rules
   */
  static validateAutomationRules(automation: TicketTemplateAutomation): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (automation.autoAssign?.enabled && automation.autoAssign.rules) {
      automation.autoAssign.rules.forEach((rule, index) => {
        if (!rule.name) errors.push(`Regra de auto-atribuição ${index + 1}: nome é obrigatório`);
        if (!rule.assignTo.id) errors.push(`Regra de auto-atribuição ${index + 1}: destinatário é obrigatório`);
        if (rule.conditions.length === 0) errors.push(`Regra de auto-atribuição ${index + 1}: pelo menos uma condição é obrigatória`);
      });
    }

    if (automation.escalation?.enabled && automation.escalation.rules) {
      automation.escalation.rules.forEach((rule, index) => {
        if (!rule.name) errors.push(`Regra de escalação ${index + 1}: nome é obrigatório`);
        if (rule.timeThreshold <= 0) errors.push(`Regra de escalação ${index + 1}: tempo limite deve ser positivo`);
        if (!rule.escalateTo.id) errors.push(`Regra de escalação ${index + 1}: destinatário é obrigatório`);
      });
    }

    return { isValid: errors.length === 0, errors };
  }
}