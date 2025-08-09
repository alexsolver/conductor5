// Removido import de drizzle-orm - Domain não deve depender de infrastructure

export abstract class BaseEntity {
  public readonly id: string;
  public readonly createdAt: Date;
  public readonly updatedAt: Date;

  constructor(id: string, createdAt?: Date, updatedAt?: Date) {
    this.id = id;
    this.createdAt = createdAt || new Date();
    this.updatedAt = updatedAt || new Date();
  }
}