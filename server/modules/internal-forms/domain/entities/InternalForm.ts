export class InternalForm {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public name: string,
    public description?: string,
    public category: string = 'general',
    public fields: any[] = [],
    public actions: any[] = [],
    public approvalFlow?: any[],
    public isActive: boolean = true,
    public readonly createdBy: string = '',
    public readonly createdAt: Date = new Date(),
    public updatedAt: Date = new Date()
  ) {}

  validate(): void {
    if (!this.name || this.name.trim() === '') {
      throw new Error('Form name is required');
    }
    
    if (!this.tenantId || this.tenantId.trim() === '') {
      throw new Error('Tenant ID is required');
    }
    
    if (!this.category || this.category.trim() === '') {
      throw new Error('Category is required');
    }
    
    if (!Array.isArray(this.fields)) {
      throw new Error('Fields must be an array');
    }
    
    if (!Array.isArray(this.actions)) {
      throw new Error('Actions must be an array');
    }
  }

  activate(): void {
    this.isActive = true;
    this.updatedAt = new Date();
  }

  deactivate(): void {
    this.isActive = false;
    this.updatedAt = new Date();
  }

  updateFields(fields: any[]): void {
    this.fields = fields;
    this.updatedAt = new Date();
  }

  updateActions(actions: any[]): void {
    this.actions = actions;
    this.updatedAt = new Date();
  }

  addField(field: any): void {
    this.fields.push(field);
    this.updatedAt = new Date();
  }

  removeField(fieldName: string): void {
    this.fields = this.fields.filter(field => field.name !== fieldName);
    this.updatedAt = new Date();
  }

  hasApprovalFlow(): boolean {
    return this.approvalFlow && this.approvalFlow.length > 0;
  }
}