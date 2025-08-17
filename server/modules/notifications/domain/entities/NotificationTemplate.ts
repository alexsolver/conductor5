// ✅ 1QA.MD COMPLIANCE: NOTIFICATION TEMPLATE DOMAIN ENTITY
// Domain layer - Template management for multi-channel notifications

export interface NotificationTemplate {
  id: string;
  tenantId: string;
  name: string;
  type: string; // 'ticket_created', 'ticket_updated', etc.
  channel: string; // 'email', 'sms', 'slack', etc.
  subject?: string; // For email/SMS
  bodyTemplate: string; // Template with variables {{variable}}
  variables?: TemplateVariable[]; // Available template variables with descriptions
  metadata?: Record<string, any>; // Additional template configuration
  isDefault: boolean;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  updatedBy?: string;
}

export interface TemplateVariable {
  name: string; // Variable name like 'ticket_id', 'user_name'
  description: string; // Human-readable description
  type: TemplateVariableType; // Data type for validation
  required: boolean; // Whether variable is required
  defaultValue?: string; // Default value if not provided
  format?: string; // Format specification (e.g., date format)
}

export type TemplateVariableType = 
  | 'string'
  | 'number'
  | 'date'
  | 'boolean'
  | 'url'
  | 'email'
  | 'phone';

// ✅ 1QA.MD: Domain entity with template processing business logic
export class NotificationTemplateEntity implements NotificationTemplate {
  constructor(
    public id: string,
    public tenantId: string,
    public name: string,
    public type: string,
    public channel: string,
    public bodyTemplate: string,
    public isDefault: boolean,
    public sortOrder: number,
    public isActive: boolean,
    public createdAt: Date,
    public updatedAt: Date,
    public subject?: string,
    public variables?: TemplateVariable[],
    public metadata?: Record<string, any>,
    public createdBy?: string,
    public updatedBy?: string
  ) {}

  // Business logic: Process template with variables
  processTemplate(variables: Record<string, any>): ProcessedTemplate {
    const errors: string[] = [];
    let processedSubject = this.subject || '';
    let processedBody = this.bodyTemplate;

    // Validate required variables
    if (this.variables) {
      for (const templateVar of this.variables) {
        if (templateVar.required && !(templateVar.name in variables)) {
          errors.push(`Required variable '${templateVar.name}' is missing`);
        }
      }
    }

    if (errors.length > 0) {
      return {
        success: false,
        errors,
        subject: '',
        body: ''
      };
    }

    // Process variables in subject and body
    const allVariables = { ...this.getDefaultVariables(), ...variables };

    for (const [key, value] of Object.entries(allVariables)) {
      const placeholder = `{{${key}}}`;
      const stringValue = this.formatValue(key, value);
      
      processedSubject = processedSubject.replace(new RegExp(placeholder, 'g'), stringValue);
      processedBody = processedBody.replace(new RegExp(placeholder, 'g'), stringValue);
    }

    return {
      success: true,
      errors: [],
      subject: processedSubject,
      body: processedBody
    };
  }

  // Business logic: Get default values for variables
  private getDefaultVariables(): Record<string, any> {
    const defaults: Record<string, any> = {};
    
    if (this.variables) {
      for (const variable of this.variables) {
        if (variable.defaultValue !== undefined) {
          defaults[variable.name] = variable.defaultValue;
        }
      }
    }

    return defaults;
  }

  // Business logic: Format value based on variable type
  private formatValue(key: string, value: any): string {
    if (value === null || value === undefined) return '';

    const variable = this.variables?.find(v => v.name === key);
    if (!variable) return String(value);

    switch (variable.type) {
      case 'date':
        if (value instanceof Date) {
          return variable.format 
            ? this.formatDate(value, variable.format)
            : value.toLocaleDateString('pt-BR');
        }
        return String(value);
        
      case 'number':
        return typeof value === 'number' ? value.toLocaleString('pt-BR') : String(value);
        
      case 'url':
      case 'email':
      case 'phone':
      case 'string':
      default:
        return String(value);
    }
  }

  // Business logic: Format date according to specification
  private formatDate(date: Date, format: string): string {
    // Simple date formatting - in production would use date-fns or similar
    switch (format) {
      case 'short':
        return date.toLocaleDateString('pt-BR');
      case 'long':
        return date.toLocaleDateString('pt-BR', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
      case 'time':
        return date.toLocaleTimeString('pt-BR');
      case 'datetime':
        return date.toLocaleString('pt-BR');
      default:
        return date.toLocaleDateString('pt-BR');
    }
  }

  // Business logic: Validate template syntax
  validateTemplate(): TemplateValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check for unclosed placeholders
    const unclosedPattern = /\{\{[^}]*$/g;
    const unopenedPattern = /^[^{]*\}\}/g;
    
    if (unclosedPattern.test(this.bodyTemplate)) {
      errors.push('Template contains unclosed placeholders');
    }
    
    if (unopenedPattern.test(this.bodyTemplate)) {
      errors.push('Template contains unopened placeholders');
    }

    // Extract all placeholders
    const placeholderPattern = /\{\{([^}]+)\}\}/g;
    const foundPlaceholders = new Set<string>();
    let match;

    while ((match = placeholderPattern.exec(this.bodyTemplate)) !== null) {
      foundPlaceholders.add(match[1].trim());
    }

    // Check if placeholders have corresponding variables
    const definedVariables = new Set(this.variables?.map(v => v.name) || []);
    
    for (const placeholder of Array.from(foundPlaceholders)) {
      if (!definedVariables.has(placeholder)) {
        warnings.push(`Placeholder '${placeholder}' has no defined variable`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      placeholders: Array.from(foundPlaceholders)
    };
  }

  // Business logic: Update template
  updateTemplate(updates: Partial<NotificationTemplate>): void {
    Object.assign(this, updates);
    this.updatedAt = new Date();
  }
}

export interface ProcessedTemplate {
  success: boolean;
  errors: string[];
  subject: string;
  body: string;
}

export interface TemplateValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  placeholders: string[];
}