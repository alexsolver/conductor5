
export class TemplateVersionCreatedEvent {
  constructor(
    public readonly templateVersionId: string,
    public readonly tenantId: string,
    public readonly version: string,
    public readonly createdAt: Date
  ) {}
}
