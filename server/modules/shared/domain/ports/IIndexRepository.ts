/**
 * Index Repository Interface
 * Clean Architecture - Domain Layer
 */

export interface IIndexRepository {
  findAll(): Promise<any[]>;
  search(query: string): Promise<any[]>;
  reindex(): Promise<void>;
}