export class Skill {
  constructor(
    public readonly id: string,
    public name: string,
    public category: string,
    public description?: string,
    public suggestedCertification?: string,
    public certificationValidityMonths?: number,
    public observations?: string,
    public scaleOptions: Array<{level: number, label: string, description: string}> = [],
    public tenantId?: string,
    public isActive: boolean = true,
    public readonly createdAt: Date = new Date(),
    public updatedAt: Date = new Date(),
    public readonly createdBy?: string,
    public updatedBy?: string
  ) {
    this.validateName();
    this.validateCategory();
  }

  private validateName(): void {
    if (!this.name || this.name.trim().length === 0) {
      throw new Error('Nome da habilidade é obrigatório');
    }
    if (this.name.length > 255) {
      throw new Error('Nome da habilidade deve ter no máximo 255 caracteres');
    }
  }

  private validateCategory(): void {
    if (!this.category || this.category.trim().length === 0) {
      throw new Error('Categoria é obrigatória');
    }
    if (this.category.length > 100) {
      throw new Error('Categoria deve ter no máximo 100 caracteres');
    }
  }

  updateName(newName: string): void {
    this.name = newName;
    this.validateName();
    this.updatedAt = new Date();
  }

  updateCategory(newCategory: string): void {
    this.category = newCategory;
    this.validateCategory();
    this.updatedAt = new Date();
  }

  updateScaleOptions(newScaleOptions: Array<{level: number, label: string, description: string}>): void {
    this.scaleOptions = newScaleOptions;
    this.updatedAt = new Date();
  }

  deactivate(): void {
    this.isActive = false;
    this.updatedAt = new Date();
  }

  activate(): void {
    this.isActive = true;
    this.updatedAt = new Date();
  }

  static create(data: {
    name: string;
    category: string;
    description?: string;
    suggestedCertification?: string;
    certificationValidityMonths?: number;
    observations?: string;
    scaleOptions?: Array<{level: number, label: string, description: string}>;
    createdBy?: string;
    tenantId?: string;
  }): Skill {
    return new Skill(
      crypto.randomUUID(),
      data.name,
      data.category,
      data.description,
      data.suggestedCertification,
      data.certificationValidityMonths,
      data.observations,
      data.scaleOptions || [],
      data.tenantId,
      true,
      new Date(),
      new Date(),
      data.createdBy
    );
  }
}