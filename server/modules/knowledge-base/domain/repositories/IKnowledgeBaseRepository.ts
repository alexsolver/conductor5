import { KnowledgeBaseEntry } from '../entities/KnowledgeBaseEntry';

export interface IKnowledgeBaseRepository {
  create(entry: KnowledgeBaseEntry): Promise<KnowledgeBaseEntry>;
  findById(id: string): Promise<KnowledgeBaseEntry | null>;
  findByTenant(tenantId: string): Promise<KnowledgeBaseEntry[]>;
  update(id: string, entry: Partial<KnowledgeBaseEntry>): Promise<KnowledgeBaseEntry>;
  delete(id: string): Promise<void>;
}