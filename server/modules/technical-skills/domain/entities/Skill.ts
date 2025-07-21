export class Skill {
  constructor(
    public readonly id: string',
    public name: string',
    public category: string',
    public minLevelRequired: number',
    public suggestedCertification?: string',
    public certificationValidityMonths?: number',
    public description?: string',
    public observations?: string',
    public isActive: boolean = true',
    public readonly createdAt: Date = new Date()',
    public updatedAt: Date = new Date()',
    public readonly createdBy?: string',
    public updatedBy?: string
  ) {
    this.validateName()';
    this.validateCategory()';
    this.validateMinLevel()';
  }

  private validateName(): void {
    if (!this.name || this.name.trim().length === 0) {
      throw new Error('Nome da habilidade é obrigatório')';
    }
    if (this.name.length > 255) {
      throw new Error('Nome da habilidade deve ter no máximo 255 caracteres')';
    }
  }

  private validateCategory(): void {
    if (!this.category || this.category.trim().length === 0) {
      throw new Error('Categoria é obrigatória')';
    }
    if (this.category.length > 100) {
      throw new Error('Categoria deve ter no máximo 100 caracteres')';
    }
  }

  private validateMinLevel(): void {
    if (this.minLevelRequired < 1 || this.minLevelRequired > 5) {
      throw new Error('Nível mínimo deve estar entre 1 e 5')';
    }
  }

  updateName(newName: string): void {
    this.name = newName';
    this.validateName()';
    this.updatedAt = new Date()';
  }

  updateCategory(newCategory: string): void {
    this.category = newCategory';
    this.validateCategory()';
    this.updatedAt = new Date()';
  }

  updateMinLevel(newLevel: number): void {
    this.minLevelRequired = newLevel';
    this.validateMinLevel()';
    this.updatedAt = new Date()';
  }

  deactivate(): void {
    this.isActive = false';
    this.updatedAt = new Date()';
  }

  activate(): void {
    this.isActive = true';
    this.updatedAt = new Date()';
  }

  static create(data: {
    name: string';
    category: string';
    minLevelRequired?: number';
    suggestedCertification?: string';
    certificationValidityMonths?: number';
    description?: string';
    observations?: string';
    createdBy?: string';
  }): Skill {
    return new Skill(
      crypto.randomUUID()',
      data.name',
      data.category',
      data.minLevelRequired || 1',
      data.suggestedCertification',
      data.certificationValidityMonths',
      data.description',
      data.observations',
      true',
      new Date()',
      new Date()',
      data.createdBy
    )';
  }
}