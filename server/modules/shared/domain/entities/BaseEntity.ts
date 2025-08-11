// CLEAN ARCHITECTURE: Base entity with domain-only concerns

export abstract class BaseEntity {
  public readonly id: string;
  public readonly createdAt: Date;
  public readonly modifiedAt: Date;

  constructor(id: string, createdAt?: Date, modifiedAt?: Date) {
    this.id = id;
    this.createdAt = createdAt || new Date();
    this.modifiedAt = modifiedAt || new Date();
  }
}