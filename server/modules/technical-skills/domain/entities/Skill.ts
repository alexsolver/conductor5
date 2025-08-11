// CLEAN ARCHITECTURE: Domain layer maintains separation of concerns

export interface SkillProps {
  id: string;
  name: string;
  category: string;
  description?: string;
  isActive?: boolean;
  createdAt?: Date;
  modifiedAt?: Date;
}

export class Skill {
  private constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly category: string,
    public readonly description?: string,
    public readonly isActive: boolean = true,
    public readonly createdAt: Date = new Date(),
    public readonly modifiedAt: Date = new Date()
  ) {}

  // Business validation methods
  isValidSkill(): boolean {
    return this.name.length > 0 && this.category.length > 0;
  }
}

export interface UserSkillProps {
  id: string;
  userId: string;
  skillId: string;
  level: number;
  certifiedAt?: Date;
  createdAt?: Date;
  modifiedAt?: Date;
}

export class UserSkill {
  private constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly skillId: string,
    public readonly level: number,
    public readonly certifiedAt?: Date,
    public readonly createdAt: Date = new Date(),
    public readonly modifiedAt: Date = new Date()
  ) {}

  // Business validation methods

  changeLevel(newLevel: number): UserSkill {
    if (newLevel < 1 || newLevel > 5) {
      throw new Error('Skill level must be between 1 and 5');
    }

    return new UserSkill(
      this.id,
      this.userId,
      this.skillId,
      newLevel,
      this.certifiedAt,
      this.createdAt,
      new Date()
    );
  }
}

export interface User {
  id: string;
  name: string;
  email: string;
  skills: Skill[];
}

export interface Project {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  members: User[];
}

export interface Task {
  id: string;
  name: string;
  description: string;
  projectId: string;
  assigneeId: string | null;
  completed: boolean;
}