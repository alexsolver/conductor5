
export class TemplateHierarchy {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly parentId?: string,
    public readonly name: string,
    public readonly description?: string,
    public readonly level: number = 0,
    public readonly path: string = '',
    public readonly active: boolean = true,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date()
  ) {}

  static create(
    id: string,
    tenantId: string,
    name: string,
    parentId?: string,
    description?: string
  ): TemplateHierarchy {
    return new TemplateHierarchy(id, tenantId, parentId, name, description);
  }

  isValid(): boolean {
    return this.name.length > 0 && this.tenantId.length > 0;
  }

  isRoot(): boolean {
    return !this.parentId;
  }
}
