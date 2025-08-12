/**
 * Template Hierarchy Domain Entity
 * Clean Architecture - Domain Layer
 * 
 * @module TemplateHierarchyEntity
 * @created 2025-08-12 - Phase 19 Clean Architecture Implementation
 */

export interface TemplateHierarchy {
  id: string;
  tenantId: string;
  name: string;
  category: string;
  parentTemplateId?: string;
  level: number; // 0 = root, 1 = child, 2 = grandchild, etc.
  path: string; // Full hierarchy path like "root/parent/child"
  companyId?: string;
  roleIds: string[];
  templateData: Record<string, any>;
  inheritanceRules: InheritanceRules;
  metadata: TemplateMetadata;
  children: string[]; // IDs of child templates
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface InheritanceRules {
  inheritFields: boolean;
  inheritValidations: boolean;
  inheritStyles: boolean;
  inheritPermissions: boolean;
  overrideMode: 'merge' | 'replace' | 'extend';
  lockedFields: string[]; // Fields that cannot be overridden
  requiredFields: string[]; // Fields that must be present
  allowChildCreation: boolean;
  maxDepth: number;
}

export interface TemplateMetadata {
  description?: string;
  tags: string[];
  version: string;
  author: string;
  lastModifiedBy: string;
  lastModifiedAt: Date;
  usageCount: number;
  isSystem: boolean; // System templates cannot be deleted
  permissions: TemplatePermission[];
  auditTrail: TemplateAuditEntry[];
}

export interface TemplatePermission {
  id: string;
  roleId: string;
  roleName: string;
  permissions: ('view' | 'edit' | 'delete' | 'create_child' | 'manage_permissions')[];
  grantedBy: string;
  grantedAt: Date;
}

export interface TemplateAuditEntry {
  id: string;
  action: 'created' | 'updated' | 'deleted' | 'inherited' | 'permissions_changed';
  userId: string;
  userName: string;
  changes?: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
  timestamp: Date;
  ipAddress: string;
  userAgent: string;
}

export interface TemplateStructure {
  fields: TemplateField[];
  sections: TemplateSection[];
  validations: TemplateValidation[];
  styles: TemplateStyle;
  scripts: TemplateScript[];
}

export interface TemplateField {
  id: string;
  name: string;
  type: 'text' | 'number' | 'email' | 'phone' | 'date' | 'datetime' | 'boolean' | 'select' | 'multiselect' | 'textarea' | 'file' | 'url';
  label: string;
  placeholder?: string;
  defaultValue?: any;
  required: boolean;
  readonly: boolean;
  hidden: boolean;
  order: number;
  sectionId?: string;
  validation?: FieldValidation;
  options?: SelectOption[]; // For select/multiselect fields
  inherited: boolean;
  inheritedFrom?: string; // Parent template ID
  overridable: boolean;
}

export interface TemplateSection {
  id: string;
  name: string;
  title: string;
  description?: string;
  order: number;
  collapsible: boolean;
  collapsed: boolean;
  conditional?: ConditionalLogic;
  inherited: boolean;
  inheritedFrom?: string;
}

export interface TemplateValidation {
  id: string;
  fieldId: string;
  type: 'required' | 'min' | 'max' | 'pattern' | 'custom';
  value?: any;
  message: string;
  inherited: boolean;
  inheritedFrom?: string;
}

export interface TemplateStyle {
  theme: string;
  customCss?: string;
  layout: 'single_column' | 'two_column' | 'grid' | 'tabs';
  spacing: 'compact' | 'normal' | 'spacious';
  inherited: boolean;
  inheritedFrom?: string;
}

export interface TemplateScript {
  id: string;
  name: string;
  event: 'onLoad' | 'onSubmit' | 'onChange' | 'onValidate';
  script: string;
  enabled: boolean;
  inherited: boolean;
  inheritedFrom?: string;
}

export interface FieldValidation {
  required?: boolean;
  min?: number;
  max?: number;
  pattern?: string;
  customValidator?: string;
}

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface ConditionalLogic {
  fieldId: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than';
  value: any;
  action: 'show' | 'hide' | 'require' | 'disable';
}

/**
 * Template Hierarchy Business Rules and Validations
 */
export class TemplateHierarchyDomainService {
  
  /**
   * Validate template hierarchy structure
   */
  static validateHierarchy(template: Partial<TemplateHierarchy>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Basic validation
    if (!template.name) errors.push('Nome do template é obrigatório');
    if (!template.category) errors.push('Categoria é obrigatória');
    if (!template.tenantId) errors.push('ID do tenant é obrigatório');
    
    // Hierarchy validation
    if (template.level !== undefined && template.level < 0) {
      errors.push('Nível da hierarquia deve ser positivo');
    }
    
    if (template.level !== undefined && template.level > 10) {
      errors.push('Nível máximo da hierarquia é 10');
    }

    // Inheritance rules validation
    if (template.inheritanceRules) {
      if (template.inheritanceRules.maxDepth < 1 || template.inheritanceRules.maxDepth > 10) {
        errors.push('Profundidade máxima deve estar entre 1 e 10');
      }
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Generate hierarchy path
   */
  static generateHierarchyPath(parentPath: string | undefined, templateName: string): string {
    if (!parentPath) return templateName;
    return `${parentPath}/${templateName}`;
  }

  /**
   * Calculate template level based on parent
   */
  static calculateLevel(parentLevel: number | undefined): number {
    return (parentLevel || 0) + 1;
  }

  /**
   * Check if template can have children
   */
  static canHaveChildren(template: TemplateHierarchy): boolean {
    return template.inheritanceRules.allowChildCreation && 
           template.level < template.inheritanceRules.maxDepth;
  }

  /**
   * Merge template data with inheritance
   */
  static mergeWithInheritance(
    parentTemplate: TemplateHierarchy | null,
    childTemplate: Partial<TemplateHierarchy>
  ): TemplateStructure {
    if (!parentTemplate) {
      return childTemplate.templateData as TemplateStructure || {
        fields: [],
        sections: [],
        validations: [],
        styles: { theme: 'default', layout: 'single_column', spacing: 'normal', inherited: false },
        scripts: []
      };
    }

    const parentStructure = parentTemplate.templateData as TemplateStructure;
    const childStructure = childTemplate.templateData as TemplateStructure || {
      fields: [],
      sections: [],
      validations: [],
      styles: { theme: 'default', layout: 'single_column', spacing: 'normal', inherited: false },
      scripts: []
    };

    const rules = childTemplate.inheritanceRules || parentTemplate.inheritanceRules;

    let mergedStructure: TemplateStructure = {
      fields: [],
      sections: [],
      validations: [],
      styles: childStructure.styles,
      scripts: []
    };

    // Merge fields
    if (rules.inheritFields) {
      const inheritedFields = parentStructure.fields.map(field => ({
        ...field,
        inherited: true,
        inheritedFrom: parentTemplate.id,
        overridable: !rules.lockedFields.includes(field.id)
      }));

      if (rules.overrideMode === 'merge') {
        // Merge child fields with inherited, child fields override
        const childFieldIds = childStructure.fields.map(f => f.id);
        const nonOverriddenFields = inheritedFields.filter(f => !childFieldIds.includes(f.id));
        mergedStructure.fields = [...nonOverriddenFields, ...childStructure.fields];
      } else if (rules.overrideMode === 'replace') {
        mergedStructure.fields = childStructure.fields.length > 0 ? childStructure.fields : inheritedFields;
      } else { // extend
        mergedStructure.fields = [...inheritedFields, ...childStructure.fields];
      }
    } else {
      mergedStructure.fields = childStructure.fields;
    }

    // Merge sections (similar logic)
    if (rules.inheritFields) {
      const inheritedSections = parentStructure.sections.map(section => ({
        ...section,
        inherited: true,
        inheritedFrom: parentTemplate.id
      }));

      if (rules.overrideMode === 'merge') {
        const childSectionIds = childStructure.sections.map(s => s.id);
        const nonOverriddenSections = inheritedSections.filter(s => !childSectionIds.includes(s.id));
        mergedStructure.sections = [...nonOverriddenSections, ...childStructure.sections];
      } else if (rules.overrideMode === 'replace') {
        mergedStructure.sections = childStructure.sections.length > 0 ? childStructure.sections : inheritedSections;
      } else {
        mergedStructure.sections = [...inheritedSections, ...childStructure.sections];
      }
    } else {
      mergedStructure.sections = childStructure.sections;
    }

    // Merge validations
    if (rules.inheritValidations) {
      const inheritedValidations = parentStructure.validations.map(validation => ({
        ...validation,
        inherited: true,
        inheritedFrom: parentTemplate.id
      }));

      mergedStructure.validations = [...inheritedValidations, ...childStructure.validations];
    } else {
      mergedStructure.validations = childStructure.validations;
    }

    // Merge styles
    if (rules.inheritStyles && parentStructure.styles) {
      mergedStructure.styles = {
        ...parentStructure.styles,
        ...childStructure.styles,
        inherited: true,
        inheritedFrom: parentTemplate.id
      };
    }

    // Merge scripts
    if (rules.inheritFields) { // Using same rule as fields for scripts
      const inheritedScripts = parentStructure.scripts.map(script => ({
        ...script,
        inherited: true,
        inheritedFrom: parentTemplate.id
      }));

      mergedStructure.scripts = [...inheritedScripts, ...childStructure.scripts];
    } else {
      mergedStructure.scripts = childStructure.scripts;
    }

    return mergedStructure;
  }

  /**
   * Check if user has permission for template action
   */
  static hasPermission(
    template: TemplateHierarchy,
    userRole: string,
    action: 'view' | 'edit' | 'delete' | 'create_child' | 'manage_permissions'
  ): boolean {
    // System admin has all permissions
    if (userRole === 'saas_admin' || userRole === 'tenant_admin') {
      return true;
    }

    // Check specific permissions
    const permission = template.metadata.permissions.find(p => p.roleName === userRole);
    return permission ? permission.permissions.includes(action) : false;
  }

  /**
   * Validate template structure integrity
   */
  static validateTemplateStructure(structure: TemplateStructure): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate field uniqueness
    const fieldIds = structure.fields.map(f => f.id);
    const duplicateFields = fieldIds.filter((id, index) => fieldIds.indexOf(id) !== index);
    if (duplicateFields.length > 0) {
      errors.push(`Campos duplicados encontrados: ${duplicateFields.join(', ')}`);
    }

    // Validate section references
    structure.fields.forEach(field => {
      if (field.sectionId && !structure.sections.find(s => s.id === field.sectionId)) {
        errors.push(`Campo '${field.name}' referencia seção inexistente: ${field.sectionId}`);
      }
    });

    // Validate validation references
    structure.validations.forEach(validation => {
      if (!structure.fields.find(f => f.id === validation.fieldId)) {
        errors.push(`Validação referencia campo inexistente: ${validation.fieldId}`);
      }
    });

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Calculate template usage statistics
   */
  static calculateUsageStats(templates: TemplateHierarchy[]): {
    totalTemplates: number;
    rootTemplates: number;
    averageDepth: number;
    mostUsedTemplate: TemplateHierarchy | null;
    templatesByCategory: Record<string, number>;
  } {
    const rootTemplates = templates.filter(t => t.level === 0);
    const totalDepth = templates.reduce((sum, t) => sum + t.level, 0);
    const averageDepth = templates.length > 0 ? totalDepth / templates.length : 0;
    
    const mostUsedTemplate = templates.reduce((max, template) => 
      (!max || template.metadata.usageCount > max.metadata.usageCount) ? template : max
    , null as TemplateHierarchy | null);

    const templatesByCategory = templates.reduce((acc, template) => {
      acc[template.category] = (acc[template.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalTemplates: templates.length,
      rootTemplates: rootTemplates.length,
      averageDepth: Math.round(averageDepth * 100) / 100,
      mostUsedTemplate,
      templatesByCategory
    };
  }
}