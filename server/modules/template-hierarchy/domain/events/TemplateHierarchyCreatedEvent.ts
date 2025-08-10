
<line_number>1</line_number>
export class TemplateHierarchyCreatedEvent {
  constructor(
    public readonly id: string,
    public readonly parentId: string | null,
    public readonly templateId: string,
    public readonly tenantId: string,
    public readonly createdAt: Date = new Date()
  ) {}
}
