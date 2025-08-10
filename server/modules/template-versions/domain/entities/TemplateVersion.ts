
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

  // Factory method moved to repository or service layer to maintain clean domain entities
  // Infrastructure concerns should not be in domain entities

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
