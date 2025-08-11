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
  modifiedAt: Date;
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
    public createdAt: Date,
    public modifiedAt: Date
  ) {}

  activate(): void {
    this.isActive = true;
    // Modified timestamp managed by application layer
  }

  deactivate(): void {
    this.isActive = false;
    // Modified timestamp managed by application layer
  }

  changeDetails(name: string, description?: string, category?: string): void {
    this.name = name;
    if (description !== undefined) this.description = description;
    if (category !== undefined) this.category = category;
    // Modified timestamp managed by application layer
  }

  changeLevel(level: 'beginner' | 'intermediate' | 'advanced' | 'expert'): void {
    this.level = level;
    // Modified timestamp managed by application layer
  }
}