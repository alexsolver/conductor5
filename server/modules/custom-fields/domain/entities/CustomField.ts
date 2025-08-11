
// CLEAN ARCHITECTURE: Domain entity with business logic only

export interface CustomFieldValidation {
  min?: number;
  max?: number;
  pattern?: string;
}

export class CustomField {
  constructor(
    private readonly id: string,
    private readonly tenantId: string,
    private name: string,
    private type: 'text' | 'number' | 'date' | 'boolean' | 'dropdown' | 'multidropdown',
    private required: boolean,
    private entityType: string,
    private options: string[] = [],
    private defaultValue: any = null,
    private validation: CustomFieldValidation = {},
    private readonly createdAt: Date = new Date(),
    private modifiedAt: Date = new Date()
  ) {}

  // Getters
  getId(): string { return this.id; }
  getTenantId(): string { return this.tenantId; }
  getName(): string { return this.name; }
  getType(): 'text' | 'number' | 'date' | 'boolean' | 'dropdown' | 'multidropdown' { return this.type; }
  isRequired(): boolean { return this.required; }
  getEntityType(): string { return this.entityType; }
  getOptions(): string[] { return this.options; }
  getDefaultValue(): any { return this.defaultValue; }
  getValidation(): CustomFieldValidation { return this.validation; }
  getCreatedAt(): Date { return this.createdAt; }
  getModifiedAt(): Date { return this.modifiedAt; }

  // Business methods
  validateValue(value: any): boolean {
    if (this.required && (value === null || value === undefined || value === '')) {
      return false;
    }

    switch (this.type) {
      case 'number':
        const numValue = Number(value);
        if (isNaN(numValue)) return false;
        if (this.validation.min !== undefined && numValue < this.validation.min) return false;
        if (this.validation.max !== undefined && numValue > this.validation.max) return false;
        break;
      case 'text':
        if (typeof value !== 'string') return false;
        if (this.validation.pattern && !new RegExp(this.validation.pattern).test(value)) return false;
        break;
      case 'dropdown':
      case 'multidropdown':
        const values = Array.isArray(value) ? value : [value];
        if (values.some(v => !this.options.includes(v))) return false;
        break;
    }

    return true;
  }

  hasDropdownOptions(): boolean {
    return this.type === 'dropdown' || this.type === 'multidropdown';
  }

  changeName(name: string): void {
    this.name = name;
    this.modifiedAt = new Date();
  }

  setRequired(required: boolean): void {
    this.required = required;
    this.modifiedAt = new Date();
  }
}
