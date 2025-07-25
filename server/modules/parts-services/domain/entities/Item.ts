
export interface ItemProps {
  id: string;
  tenantId: string;
  active: boolean;
  type: 'material' | 'service';
  name: string;
  integrationCode?: string;
  description?: string;
  unitOfMeasure?: string;
  defaultMaintenancePlan?: string;
  itemGroup?: string;
  defaultChecklist?: string;
  categoryId?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  updatedBy?: string;
}

export class Item {
  private constructor(private props: ItemProps) {}

  static create(props: Omit<ItemProps, 'id' | 'createdAt' | 'updatedAt'>): Item {
    return new Item({
      ...props,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  static fromPersistence(props: ItemProps): Item {
    return new Item(props);
  }

  get id(): string {
    return this.props.id;
  }

  get tenantId(): string {
    return this.props.tenantId;
  }

  get active(): boolean {
    return this.props.active;
  }

  get type(): 'material' | 'service' {
    return this.props.type;
  }

  get name(): string {
    return this.props.name;
  }

  get integrationCode(): string | undefined {
    return this.props.integrationCode;
  }

  get description(): string | undefined {
    return this.props.description;
  }

  get unitOfMeasure(): string | undefined {
    return this.props.unitOfMeasure;
  }

  get defaultMaintenancePlan(): string | undefined {
    return this.props.defaultMaintenancePlan;
  }

  get itemGroup(): string | undefined {
    return this.props.itemGroup;
  }

  get defaultChecklist(): string | undefined {
    return this.props.defaultChecklist;
  }

  get categoryId(): string | undefined {
    return this.props.categoryId;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  get createdBy(): string | undefined {
    return this.props.createdBy;
  }

  get updatedBy(): string | undefined {
    return this.props.updatedBy;
  }

  // Métodos de negócio
  activate(): void {
    this.props.active = true;
    this.props.updatedAt = new Date();
  }

  deactivate(): void {
    this.props.active = false;
    this.props.updatedAt = new Date();
  }

  updateName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new Error('Nome do item não pode estar vazio');
    }
    this.props.name = name.trim();
    this.props.updatedAt = new Date();
  }

  updateDescription(description: string): void {
    this.props.description = description;
    this.props.updatedAt = new Date();
  }

  updateIntegrationCode(code: string): void {
    this.props.integrationCode = code;
    this.props.updatedAt = new Date();
  }

  updateUnitOfMeasure(unit: string): void {
    this.props.unitOfMeasure = unit;
    this.props.updatedAt = new Date();
  }

  updateItemGroup(group: string): void {
    this.props.itemGroup = group;
    this.props.updatedAt = new Date();
  }

  updateCategory(categoryId: string): void {
    this.props.categoryId = categoryId;
    this.props.updatedAt = new Date();
  }

  updateDefaultMaintenancePlan(plan: string): void {
    this.props.defaultMaintenancePlan = plan;
    this.props.updatedAt = new Date();
  }

  updateDefaultChecklist(checklist: string): void {
    this.props.defaultChecklist = checklist;
    this.props.updatedAt = new Date();
  }

  // Validações
  isValid(): boolean {
    return (
      this.props.name && 
      this.props.name.trim().length > 0 &&
      this.props.tenantId &&
      this.props.type &&
      ['material', 'service'].includes(this.props.type)
    );
  }

  isMaterial(): boolean {
    return this.props.type === 'material';
  }

  isService(): boolean {
    return this.props.type === 'service';
  }

  // Para persistência
  toPersistence(): ItemProps {
    return { ...this.props };
  }

  // Para serialização
  toJSON() {
    return {
      id: this.props.id,
      tenantId: this.props.tenantId,
      active: this.props.active,
      type: this.props.type,
      name: this.props.name,
      integrationCode: this.props.integrationCode,
      description: this.props.description,
      unitOfMeasure: this.props.unitOfMeasure,
      defaultMaintenancePlan: this.props.defaultMaintenancePlan,
      itemGroup: this.props.itemGroup,
      defaultChecklist: this.props.defaultChecklist,
      categoryId: this.props.categoryId,
      createdAt: this.props.createdAt,
      updatedAt: this.props.updatedAt,
      createdBy: this.props.createdBy,
      updatedBy: this.props.updatedBy,
    };
  }
}
