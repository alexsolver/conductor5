// Domain entity - no external dependencies

export interface Skill {
  id: string;
  name: string;
  description?: string;
  category: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  isActive: boolean;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

export class SkillEntity implements Skill {
  constructor(
    public id: string,
    public name: string,
    public category: string,
    public level: 'beginner' | 'intermediate' | 'advanced' | 'expert',
    public tenantId: string,
    public description?: string,
    public isActive: boolean = true,
    public createdAt: Date = new Date(),
    public updatedAt: Date = new Date()
  ) {}

  activate(): void {
    this.isActive = true;
    this.updatedAt = new Date();
  }

  deactivate(): void {
    this.isActive = false;
    this.updatedAt = new Date();
  }

  updateDetails(name: string, description?: string, category?: string): void {
    this.name = name;
    if (description !== undefined) this.description = description;
    if (category !== undefined) this.category = category;
    this.updatedAt = new Date();
  }

  updateLevel(level: 'beginner' | 'intermediate' | 'advanced' | 'expert'): void {
    this.level = level;
    this.updatedAt = new Date();
  }
}