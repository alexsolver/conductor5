
export interface InternalFormField {
  id: string;
  name: string;
  type: 'text' | 'number' | 'email' | 'select' | 'textarea' | 'checkbox' | 'date' | 'file';
  label: string;
  placeholder?: string;
  required: boolean;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    custom?: string;
  };
  options?: Array<{ value: string; label: string }>;
  defaultValue?: any;
  conditionalLogic?: {
    field: string;
    operator: 'equals' | 'not_equals' | 'contains';
    value: any;
    action: 'show' | 'hide' | 'require';
  }[];
}

export interface InternalFormAction {
  id: string;
  type: 'webhook' | 'email' | 'database' | 'integration' | 'workflow';
  name: string;
  config: Record<string, any>;
  conditions?: {
    field: string;
    operator: string;
    value: any;
  }[];
  order: number;
}

export interface InternalFormApproval {
  level: number;
  approverRole: string;
  approverUsers?: string[];
  required: boolean;
  emailTemplate?: string;
}

export class InternalForm {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public name: string,
    public description: string,
    public category: string,
    public fields: InternalFormField[],
    public actions: InternalFormAction[],
    public approvalFlow?: InternalFormApproval[],
    public isActive: boolean = true,
    public createdBy: string,
    public readonly createdAt: Date = new Date(),
    public updatedAt: Date = new Date()
  ) {}

  public validate(): void {
    if (!this.name?.trim()) {
      throw new Error('Form name is required');
    }
    if (!this.fields?.length) {
      throw new Error('Form must have at least one field');
    }
    if (!this.tenantId) {
      throw new Error('Tenant ID is required');
    }
  }

  public addField(field: InternalFormField): void {
    this.fields.push(field);
    this.updatedAt = new Date();
  }

  public addAction(action: InternalFormAction): void {
    this.actions.push(action);
    this.updatedAt = new Date();
  }

  public activate(): void {
    this.isActive = true;
    this.updatedAt = new Date();
  }

  public deactivate(): void {
    this.isActive = false;
    this.updatedAt = new Date();
  }
}
