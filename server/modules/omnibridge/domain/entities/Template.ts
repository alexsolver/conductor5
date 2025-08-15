
export interface TemplateVariable {
  name: string;
  type: 'text' | 'number' | 'date' | 'email' | 'phone';
  required: boolean;
  defaultValue?: string;
  description?: string;
}

export interface Template {
  id: string;
  name: string;
  description?: string;
  subject?: string;
  content: string;
  variables: TemplateVariable[];
  category: string;
  isActive: boolean;
  usage_count: number;
  tenantId: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export class TemplateEntity implements Template {
  constructor(
    public id: string,
    public name: string,
    public content: string,
    public category: string,
    public tenantId: string,
    public createdBy: string,
    public description?: string,
    public subject?: string,
    public variables: TemplateVariable[] = [],
    public isActive: boolean = true,
    public usage_count: number = 0,
    public createdAt: Date = new Date(),
    public updatedAt: Date = new Date()
  ) {}

  public activate(): void {
    this.isActive = true;
    this.updatedAt = new Date();
  }

  public deactivate(): void {
    this.isActive = false;
    this.updatedAt = new Date();
  }

  public incrementUsage(): void {
    this.usage_count++;
    this.updatedAt = new Date();
  }

  public renderContent(variables: Record<string, any>): string {
    let renderedContent = this.content;
    
    this.variables.forEach(variable => {
      const value = variables[variable.name] || variable.defaultValue || '';
      const placeholder = `{{${variable.name}}}`;
      renderedContent = renderedContent.replace(new RegExp(placeholder, 'g'), value);
    });

    return renderedContent;
  }

  public renderSubject(variables: Record<string, any>): string {
    if (!this.subject) return '';
    
    let renderedSubject = this.subject;
    
    this.variables.forEach(variable => {
      const value = variables[variable.name] || variable.defaultValue || '';
      const placeholder = `{{${variable.name}}}`;
      renderedSubject = renderedSubject.replace(new RegExp(placeholder, 'g'), value);
    });

    return renderedSubject;
  }
}
