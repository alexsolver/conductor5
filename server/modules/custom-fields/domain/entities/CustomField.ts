/**
 * CustomField Domain Entity - Phase 12 Implementation
 * 
 * Representa um campo personalizado no domínio do sistema Conductor
 * Entidade pura sem dependências externas
 * 
 * @module CustomFieldEntity
 * @version 1.0.0
 * @created 2025-08-12 - Phase 12 Clean Architecture Implementation
 */

export interface CustomField {
  id: string;
  tenantId: string;
  moduleType: string;
  fieldName: string;
  fieldType: 'text' | 'number' | 'email' | 'phone' | 'date' | 'datetime' | 'boolean' | 'select' | 'multiselect' | 'textarea' | 'file' | 'url';
  fieldLabel: string;
  isRequired: boolean;
  validationRules?: Record<string, any>;
  fieldOptions?: string[];
  displayOrder: number;
  isActive: boolean;
  defaultValue?: string;
  placeholder?: string;
  helpText?: string;
  fieldGroup?: string;
  conditionalLogic?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  updatedBy?: string;
}

// Alias for backwards compatibility
export type CustomFieldMetadata = CustomField;

export class CustomFieldEntity {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public moduleType: string,
    public fieldName: string,
    public fieldType: 'text' | 'number' | 'email' | 'phone' | 'date' | 'datetime' | 'boolean' | 'select' | 'multiselect' | 'textarea' | 'file' | 'url',
    public fieldLabel: string,
    public isRequired: boolean = false,
    public validationRules: Record<string, any> | null = null,
    public fieldOptions: string[] | null = null,
    public displayOrder: number = 0,
    public isActive: boolean = true,
    public defaultValue: string | null = null,
    public placeholder: string | null = null,
    public helpText: string | null = null,
    public fieldGroup: string | null = null,
    public conditionalLogic: Record<string, any> | null = null,
    public readonly createdAt: Date = new Date(),
    public updatedAt: Date = new Date(),
    public readonly createdBy: string | null = null,
    public updatedBy: string | null = null
  ) {
    this.validateTenantId();
    this.validateModuleType();
    this.validateFieldName();
    this.validateFieldType();
    this.validateFieldLabel();
    this.validateDisplayOrder();
    this.validateFieldOptions();
  }

  private validateTenantId(): void {
    if (!this.tenantId || this.tenantId.trim().length === 0) {
      throw new Error('Tenant ID é obrigatório');
    }
  }

  private validateModuleType(): void {
    if (!this.moduleType || this.moduleType.trim().length === 0) {
      throw new Error('Tipo de módulo é obrigatório');
    }
    
    const validModuleTypes = [
      'tickets', 'customers', 'users', 'companies', 'locations', 
      'beneficiaries', 'inventory', 'teams', 'projects', 'contacts'
    ];
    
    if (!validModuleTypes.includes(this.moduleType)) {
      throw new Error(`Tipo de módulo inválido. Deve ser um de: ${validModuleTypes.join(', ')}`);
    }
  }

  private validateFieldName(): void {
    if (!this.fieldName || this.fieldName.trim().length === 0) {
      throw new Error('Nome do campo é obrigatório');
    }
    
    // Field name should be valid identifier
    const fieldNameRegex = /^[a-zA-Z][a-zA-Z0-9_]*$/;
    if (!fieldNameRegex.test(this.fieldName)) {
      throw new Error('Nome do campo deve ser um identificador válido (letras, números e underscore)');
    }
    
    if (this.fieldName.length > 50) {
      throw new Error('Nome do campo deve ter no máximo 50 caracteres');
    }
  }

  private validateFieldType(): void {
    const validTypes = [
      'text', 'number', 'email', 'phone', 'date', 'datetime', 
      'boolean', 'select', 'multiselect', 'textarea', 'file', 'url'
    ];
    
    if (!validTypes.includes(this.fieldType)) {
      throw new Error(`Tipo de campo inválido. Deve ser um de: ${validTypes.join(', ')}`);
    }
  }

  private validateFieldLabel(): void {
    if (!this.fieldLabel || this.fieldLabel.trim().length === 0) {
      throw new Error('Label do campo é obrigatório');
    }
    
    if (this.fieldLabel.length > 100) {
      throw new Error('Label do campo deve ter no máximo 100 caracteres');
    }
  }

  private validateDisplayOrder(): void {
    if (this.displayOrder < 0) {
      throw new Error('Ordem de exibição não pode ser negativa');
    }
  }

  private validateFieldOptions(): void {
    if ((this.fieldType === 'select' || this.fieldType === 'multiselect') && 
        (!this.fieldOptions || this.fieldOptions.length === 0)) {
      throw new Error('Campos do tipo select/multiselect devem ter opções definidas');
    }
  }

  updateFieldName(newFieldName: string, updatedBy?: string): void {
    this.fieldName = newFieldName;
    this.validateFieldName();
    this.updatedAt = new Date();
    if (updatedBy) this.updatedBy = updatedBy;
  }

  updateFieldLabel(newFieldLabel: string, updatedBy?: string): void {
    this.fieldLabel = newFieldLabel;
    this.validateFieldLabel();
    this.updatedAt = new Date();
    if (updatedBy) this.updatedBy = updatedBy;
  }

  updateFieldType(newFieldType: CustomFieldEntity['fieldType'], updatedBy?: string): void {
    this.fieldType = newFieldType;
    this.validateFieldType();
    this.validateFieldOptions();
    this.updatedAt = new Date();
    if (updatedBy) this.updatedBy = updatedBy;
  }

  updateRequired(isRequired: boolean, updatedBy?: string): void {
    this.isRequired = isRequired;
    this.updatedAt = new Date();
    if (updatedBy) this.updatedBy = updatedBy;
  }

  updateValidationRules(validationRules: Record<string, any> | null, updatedBy?: string): void {
    this.validationRules = validationRules;
    this.updatedAt = new Date();
    if (updatedBy) this.updatedBy = updatedBy;
  }

  updateFieldOptions(fieldOptions: string[] | null, updatedBy?: string): void {
    this.fieldOptions = fieldOptions;
    this.validateFieldOptions();
    this.updatedAt = new Date();
    if (updatedBy) this.updatedBy = updatedBy;
  }

  updateDisplayOrder(displayOrder: number, updatedBy?: string): void {
    this.displayOrder = displayOrder;
    this.validateDisplayOrder();
    this.updatedAt = new Date();
    if (updatedBy) this.updatedBy = updatedBy;
  }

  updateDefaultValue(defaultValue: string | null, updatedBy?: string): void {
    this.defaultValue = defaultValue;
    this.updatedAt = new Date();
    if (updatedBy) this.updatedBy = updatedBy;
  }

  updatePlaceholder(placeholder: string | null, updatedBy?: string): void {
    this.placeholder = placeholder;
    this.updatedAt = new Date();
    if (updatedBy) this.updatedBy = updatedBy;
  }

  updateHelpText(helpText: string | null, updatedBy?: string): void {
    this.helpText = helpText;
    this.updatedAt = new Date();
    if (updatedBy) this.updatedBy = updatedBy;
  }

  updateFieldGroup(fieldGroup: string | null, updatedBy?: string): void {
    this.fieldGroup = fieldGroup;
    this.updatedAt = new Date();
    if (updatedBy) this.updatedBy = updatedBy;
  }

  updateConditionalLogic(conditionalLogic: Record<string, any> | null, updatedBy?: string): void {
    this.conditionalLogic = conditionalLogic;
    this.updatedAt = new Date();
    if (updatedBy) this.updatedBy = updatedBy;
  }

  activate(updatedBy?: string): void {
    this.isActive = true;
    this.updatedAt = new Date();
    if (updatedBy) this.updatedBy = updatedBy;
  }

  deactivate(updatedBy?: string): void {
    this.isActive = false;
    this.updatedAt = new Date();
    if (updatedBy) this.updatedBy = updatedBy;
  }

  isSelectType(): boolean {
    return this.fieldType === 'select' || this.fieldType === 'multiselect';
  }

  hasValidationRules(): boolean {
    return this.validationRules !== null && Object.keys(this.validationRules).length > 0;
  }

  hasConditionalLogic(): boolean {
    return this.conditionalLogic !== null && Object.keys(this.conditionalLogic).length > 0;
  }

  generateFieldSchema(): Record<string, any> {
    const schema: Record<string, any> = {
      type: this.fieldType,
      label: this.fieldLabel,
      required: this.isRequired,
      order: this.displayOrder
    };

    if (this.defaultValue) schema.defaultValue = this.defaultValue;
    if (this.placeholder) schema.placeholder = this.placeholder;
    if (this.helpText) schema.helpText = this.helpText;
    if (this.fieldGroup) schema.group = this.fieldGroup;
    if (this.fieldOptions) schema.options = this.fieldOptions;
    if (this.validationRules) schema.validation = this.validationRules;
    if (this.conditionalLogic) schema.conditional = this.conditionalLogic;

    return schema;
  }

  static create(data: {
    tenantId: string;
    moduleType: string;
    fieldName: string;
    fieldType: 'text' | 'number' | 'email' | 'phone' | 'date' | 'datetime' | 'boolean' | 'select' | 'multiselect' | 'textarea' | 'file' | 'url';
    fieldLabel: string;
    isRequired?: boolean;
    validationRules?: Record<string, any>;
    fieldOptions?: string[];
    displayOrder?: number;
    defaultValue?: string;
    placeholder?: string;
    helpText?: string;
    fieldGroup?: string;
    conditionalLogic?: Record<string, any>;
    createdBy?: string;
  }): CustomFieldEntity {
    const generateId = () => {
      return 'field_' + Date.now().toString() + '_' + Math.random().toString(36).substr(2, 9);
    };
    
    return new CustomFieldEntity(
      generateId(),
      data.tenantId,
      data.moduleType,
      data.fieldName,
      data.fieldType,
      data.fieldLabel,
      data.isRequired || false,
      data.validationRules || null,
      data.fieldOptions || null,
      data.displayOrder || 0,
      true,
      data.defaultValue || null,
      data.placeholder || null,
      data.helpText || null,
      data.fieldGroup || null,
      data.conditionalLogic || null,
      new Date(),
      new Date(),
      data.createdBy || null,
      null
    );
  }
}