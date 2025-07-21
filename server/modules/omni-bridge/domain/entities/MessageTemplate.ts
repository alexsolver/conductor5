
/**
 * MessageTemplate Domain Entity
 * Clean Architecture - Domain Layer
 */
export class MessageTemplate {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly name: string,
    public readonly description: string,
    public readonly channelType: string,
    public readonly language: string,
    public readonly subject: string | null,
    public readonly content: string,
    public readonly variables: TemplateVariable[],
    public readonly isActive: boolean,
    public readonly useCount: number,
    public readonly createdBy: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  public render(variables: Record<string, any>): RenderedTemplate {
    let renderedSubject = this.subject;
    let renderedContent = this.content;

    // Replace variables in subject
    if (renderedSubject) {
      for (const variable of this.variables) {
        const value = variables[variable.key] || variable.defaultValue || ';
        renderedSubject = renderedSubject.replace(
          new RegExp(`{{${variable.key}}}`, 'g'),
          value
        );
      }
    }

    // Replace variables in content
    for (const variable of this.variables) {
      const value = variables[variable.key] || variable.defaultValue || ';
      renderedContent = renderedContent.replace(
        new RegExp(`{{${variable.key}}}`, 'g'),
        value
      );
    }

    return {
      subject: renderedSubject,
      content: renderedContent
    };
  }

  public getRequiredVariables(): TemplateVariable[] {
    return this.variables.filter(v => v.required);
  }
}

export interface TemplateVariable {
  key: string;
  name: string;
  description: string;
  type: 'text' | 'number' | 'date' | 'email';
  required: boolean;
  defaultValue?: string;
}

export interface RenderedTemplate {
  subject: string | null;
  content: string;
}
