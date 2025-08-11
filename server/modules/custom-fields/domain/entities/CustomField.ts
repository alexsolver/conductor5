/**
 * Custom Field Domain Entity
 * Clean Architecture - Domain Layer
 */

export class CustomField {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly name: string,
    public readonly fieldType: 'text' | 'number' | 'boolean' | 'select' | 'multiselect' | 'date',
    public readonly isRequired: boolean = false,
    public readonly defaultValue?: any,
    public readonly options: string[] = [],
    public readonly validation?: {
      min?: number;
      max?: number;
      pattern?: string;
    },
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date()
  ) {
    this.validateInvariants();
  }

  private validateInvariants(): void {
    if (!this.id) {
      throw new Error('Custom field ID is required');
    }
    
    if (!this.tenantId) {
      throw new Error('Tenant ID is required');
    }
    
    if (!this.name || this.name.trim().length === 0) {
      throw new Error('Custom field name is required');
    }
  }

  // Business methods
  isSelectType(): boolean {
    return this.fieldType === 'select' || this.fieldType === 'multiselect';
  }

  hasOptions(): boolean {
    return this.options && this.options.length > 0;
  }

  validateValue(value: any): boolean {
    if (this.isRequired && (value === null || value === undefined || value === '')) {
      return false;
    }

    if (this.isSelectType() && this.hasOptions()) {
      if (this.fieldType === 'select') {
        return this.options.includes(value);
      } else if (this.fieldType === 'multiselect' && Array.isArray(value)) {
        return value.every(v => this.options.includes(v));
      }
    }

    return true;
  }
}