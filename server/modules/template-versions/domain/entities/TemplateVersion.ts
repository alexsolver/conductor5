
export class TemplateVersion {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly templateId: string,
    public readonly version: string,
    public readonly name: string,
    public readonly description?: string,
    public readonly configuration: any = {},
    public readonly isActive: boolean = false,
    public readonly isDraft: boolean = true,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date()
  ) {}

  static create(
    id: string,
    tenantId: string,
    templateId: string,
    version: string,
    name: string,
    description?: string
  ): TemplateVersion {
    return new TemplateVersion(id, tenantId, templateId, version, name, description);
  }

  isValid(): boolean {
    return this.name.length > 0 && this.version.length > 0;
  }

  activate(): TemplateVersion {
    return new TemplateVersion(
      this.id,
      this.tenantId,
      this.templateId,
      this.version,
      this.name,
      this.description,
      this.configuration,
      true,
      false,
      this.createdAt,
      new Date()
    );
  }
}
