
export class TemplateCreatedEvent {
  constructor(
    public readonly templateId: string,
    public readonly tenantId: string,
    public readonly createdAt: Date = new Date()
  ) {}
}
