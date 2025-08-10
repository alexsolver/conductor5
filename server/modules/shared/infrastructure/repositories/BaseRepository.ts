import { IBaseRepository } from '../../domain/repositories/IBaseRepository';

export abstract class BaseRepository<T> implements IBaseRepository<T> {
  protected db: any;

  constructor(database: any) {
    this.db = database;
  }

  abstract findById(id: string): Promise<T | null>;
  abstract save(entity: T): Promise<T>;
  abstract delete(id: string): Promise<void>;
  abstract findAll(): Promise<T[]>;
}