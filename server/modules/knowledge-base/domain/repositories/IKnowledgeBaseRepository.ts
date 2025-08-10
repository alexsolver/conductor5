
import { KnowledgeBaseEntry } from '../entities/KnowledgeBaseEntry';

export interface IKnowledgeBaseRepository {
  findById(id: string): Promise<KnowledgeBaseEntry | null>;
  findByTenant(tenantId: string): Promise<KnowledgeBaseEntry[]>;
  save(entry: KnowledgeBaseEntry): Promise<KnowledgeBaseEntry>;
  delete(id: string): Promise<void>;
}
export interface IKnowledgeBaseRepository {
  create(entry: any): Promise<any>;
  findById(id: string): Promise<any>;
  findByTenant(tenantId: string): Promise<any[]>;
  update(id: string, data: any): Promise<any>;
  delete(id: string): Promise<void>;
}
