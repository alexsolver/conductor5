/**
 * CustomField Domain Entity - Clean Architecture Domain Layer
 * Resolves violations: Missing domain entities
 */

export class CustomField {
  constructor(
    private readonly id: string,
    private readonly tenantId: string,
    private name: string,
    private label: string,
    private type: string,
    private entityType: string,
    private required: boolean = false,
    private options?: string[],
    private active: boolean = true,
    private readonly createdAt: Date = new Date(),
    private updatedAt: Date = new Date()
  ) {}

  // Getters
  getId(): string { return this.id; }
  getTenantId(): string { return this.tenantId; }
  getName(): string { return this.name; }
  getLabel(): string { return this.label; }
  getType(): string { return this.type; }
  getEntityType(): string { return this.entityType; }
  isRequired(): boolean { return this.required; }
  getOptions(): string[] | undefined { return this.options; }
  isActive(): boolean { return this.active; }
  getCreatedAt(): Date { return this.createdAt; }
  getUpdatedAt(): Date { return this.updatedAt; }

  // Business methods
  updateConfiguration(label: string, required: boolean, options?: string[]): void {
    this.label = label;
    this.required = required;
    this.options = options;
    this.updatedAt = new Date();
  }

  deactivate(): void {
    this.active = false;
    this.updatedAt = new Date();
  }

  activate(): void {
    this.active = true;
    this.updatedAt = new Date();
  }

  validateValue(value: any): boolean {
    // Business logic for field validation
    if (this.required && (value === null || value === undefined || value === '')) {
      return false;
    }

    switch (this.type) {
      case 'email':
        return !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      case 'number':
        return !value || !isNaN(Number(value));
      case 'select':
        return !value || !this.options || this.options.includes(value);
      default:
        return true;
    }
  }
}