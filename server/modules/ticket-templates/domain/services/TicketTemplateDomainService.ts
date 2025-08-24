/**
 * ✅ 1QA.MD COMPLIANCE: TICKET TEMPLATE DOMAIN SERVICE
 * Clean Architecture - Domain Layer
 * Regras de negócio e validações do domínio
 * 
 * @module TicketTemplateDomainService
 * @compliance 1qa.md - Domain Layer - Pure business rules
 */

import { TicketTemplate } from '../entities/TicketTemplate';

export class TicketTemplateDomainService {
  
  /**
   * ✅ 1QA.MD: Validação completa de templates
   */
  static validateTemplate(template: Partial<TicketTemplate>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validações obrigatórias
    if (!template.name) errors.push('Nome do template é obrigatório');
    if (!template.category) errors.push('Categoria é obrigatória');
    if (!template.tenantId) errors.push('ID do tenant é obrigatório');
    if (!template.templateType) errors.push('Tipo do template é obrigatório');

    // Validação de nome
    if (template.name && template.name.length < 3) {
      errors.push('Nome deve ter pelo menos 3 caracteres');
    }
    if (template.name && template.name.length > 100) {
      errors.push('Nome deve ter no máximo 100 caracteres');
    }

    // Validação de campos
    if (template.fields) {
      const fieldNames = template.fields.map(f => f.name);
      const duplicateFields = fieldNames.filter((name, index) => fieldNames.indexOf(name) !== index);
      if (duplicateFields.length > 0) {
        errors.push(`Campos duplicados: ${duplicateFields.join(', ')}`);
      }

      template.fields.forEach((field, index) => {
        if (!field.name) errors.push(`Campo ${index + 1}: nome é obrigatório`);
        if (!field.label) errors.push(`Campo ${index + 1}: rótulo é obrigatório`);
        if (!field.type) errors.push(`Campo ${index + 1}: tipo é obrigatório`);
        
        if (['select', 'multiselect', 'radio'].includes(field.type) && (!field.options || field.options.length === 0)) {
          errors.push(`Campo ${field.name}: opções são obrigatórias para campos do tipo ${field.type}`);
        }

        if (field.name && !/^[a-zA-Z0-9_]+$/.test(field.name)) {
          errors.push(`Campo ${field.name}: nome deve conter apenas letras, números e underscore`);
        }
      });
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * ✅ 1QA.MD: Verificar se template pode ser usado pela empresa
   */
  static canBeUsedByCompany(template: TicketTemplate, companyId: string | null): boolean {
    // Templates globais (sem companyId) podem ser usados por qualquer empresa
    if (!template.companyId) return true;
    
    // Templates específicos só podem ser usados pela empresa proprietária
    return template.companyId === companyId;
  }

  /**
   * ✅ 1QA.MD: Calcular score de complexidade do template
   */
  static calculateComplexityScore(template: TicketTemplate): number {
    let score = 0;
    
    // Score base por campo
    score += template.fields.length * 2;
    
    // Complexidade por tipo de campo
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

      if (field.validation) score += 2;
      if (field.conditional) score += 3;
      if (field.options && field.options.length > 5) score += 2;
    });

    // Complexidade de automação
    if (template.automation.enabled) {
      score += 5;
      if (template.automation.autoAssign?.enabled) score += 3;
      if (template.automation.escalation?.enabled) score += 5;
      if (template.automation.sla?.enabled) score += 3;
    }

    // Complexidade de workflow
    if (template.workflow.enabled) {
      score += template.workflow.stages.length * 3;
      if (template.workflow.approvals) score += template.workflow.approvals.length * 4;
      if (template.workflow.conditions) score += template.workflow.conditions.length * 2;
    }

    return Math.min(score, 100);
  }

  /**
   * ✅ 1QA.MD: Verificar permissões do usuário
   */
  static hasPermission(template: TicketTemplate, userRole: string, action: 'view' | 'use' | 'edit' | 'delete' | 'manage'): boolean {
    if (userRole === 'saas_admin' || userRole === 'tenant_admin') {
      return true;
    }

    const permission = template.permissions.find(p => p.roleName === userRole);
    return permission ? permission.permissions.includes(action) : false;
  }

  /**
   * ✅ 1QA.MD: Estimar tempo de completude
   */
  static estimateCompletionTime(template: TicketTemplate): number {
    const complexityScore = this.calculateComplexityScore(template);
    const baseTime = 15; // 15 minutos base
    const complexityMultiplier = complexityScore / 20;
    
    return Math.round(baseTime + (baseTime * complexityMultiplier));
  }

  /**
   * ✅ 1QA.MD: Verificar se template está saudável
   */
  static checkTemplateHealth(template: TicketTemplate): {
    status: 'healthy' | 'warning' | 'error';
    issues: Array<{
      type: 'error' | 'warning' | 'info';
      message: string;
      field?: string;
    }>;
  } {
    const issues: Array<{
      type: 'error' | 'warning' | 'info';
      message: string;
      field?: string;
    }> = [];

    // Verificar se tem campos
    if (!template.fields || template.fields.length === 0) {
      issues.push({
        type: 'warning',
        message: 'Template não possui campos definidos'
      });
    }

    // Verificar se tem campos obrigatórios
    const requiredFields = template.fields?.filter(f => f.required) || [];
    if (requiredFields.length === 0) {
      issues.push({
        type: 'warning',
        message: 'Template não possui campos obrigatórios'
      });
    }

    // Verificar uso recente
    const daysSinceLastUse = template.lastUsed ? 
      Math.floor((Date.now() - new Date(template.lastUsed).getTime()) / (1000 * 60 * 60 * 24)) : 
      999;
    
    if (daysSinceLastUse > 90) {
      issues.push({
        type: 'info',
        message: 'Template não foi usado nos últimos 90 dias'
      });
    }

    // Verificar se está ativo mas não tem descrição
    if (template.status === 'active' && !template.description) {
      issues.push({
        type: 'warning',
        message: 'Template ativo sem descrição'
      });
    }

    const errorCount = issues.filter(i => i.type === 'error').length;
    const warningCount = issues.filter(i => i.type === 'warning').length;

    let status: 'healthy' | 'warning' | 'error' = 'healthy';
    if (errorCount > 0) status = 'error';
    else if (warningCount > 0) status = 'warning';

    return { status, issues };
  }

  /**
   * ✅ 1QA.MD: Gerar analytics de uso
   */
  static generateUsageAnalytics(templates: TicketTemplate[]) {
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
}