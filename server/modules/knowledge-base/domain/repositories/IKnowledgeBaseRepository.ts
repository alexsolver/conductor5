
import { KnowledgeBaseEntry } from '../entities/KnowledgeBaseEntry';

export interface IKnowledgeBaseRepository {
  findById(id: string): Promise<KnowledgeBaseEntry | null>;
  findByTenant(tenantId: string): Promise<KnowledgeBaseEntry[]>;
  save(entry: KnowledgeBaseEntry): Promise<KnowledgeBaseEntry>;
  delete(id: string): Promise<void>;
}
