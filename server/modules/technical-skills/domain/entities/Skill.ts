// Domain layer não deve importar ORM diretamente

export interface SkillProps {
  id: string;
  name: string;
  category: string;
  description?: string;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Skill {
  private constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly category: string,
    public readonly description?: string,
    public readonly isActive: boolean = true,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date()
  ) {}

  static create(props: Omit<SkillProps, 'id' | 'createdAt' | 'updatedAt'>): Skill {
    return new Skill(
      crypto.randomUUID(),
      props.name,
      props.category,
      props.description,
      props.isActive ?? true
    );
  }

  static reconstruct(props: SkillProps): Skill {
    return new Skill(
      props.id,
      props.name,
      props.category,
      props.description,
      props.isActive ?? true,
      props.createdAt,
      props.updatedAt
    );
  }
}

export interface UserSkillProps {
  id: string;
  userId: string;
  skillId: string;
  level: number;
  certifiedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export class UserSkill {
  private constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly skillId: string,
    public readonly level: number,
    public readonly certifiedAt?: Date,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date()
  ) {}

  static create(props: Omit<UserSkillProps, 'id' | 'createdAt' | 'updatedAt'>): UserSkill {
    if (props.level < 1 || props.level > 5) {
      throw new Error('Skill level must be between 1 and 5');
    }

    return new UserSkill(
      crypto.randomUUID(),
      props.userId,
      props.skillId,
      props.level,
      props.certifiedAt
    );
  }

  static reconstruct(props: UserSkillProps): UserSkill {
    return new UserSkill(
      props.id,
      props.userId,
      props.skillId,
      props.level,
      props.certifiedAt,
      props.createdAt,
      props.updatedAt
    );
  }

  updateLevel(newLevel: number): UserSkill {
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