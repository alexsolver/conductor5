
<line_number>1</line_number>
import { KnowledgeBaseEntry } from '../entities/KnowledgeBaseEntry';

export interface IKnowledgeBaseRepository {
  findById(id: string, tenantId: string): Promise<KnowledgeBaseEntry | null>;
  findAll(tenantId: string): Promise<KnowledgeBaseEntry[]>;
  create(entry: KnowledgeBaseEntry): Promise<KnowledgeBaseEntry>;
  update(id: string, entry: Partial<KnowledgeBaseEntry>, tenantId: string): Promise<KnowledgeBaseEntry | null>;
  delete(id: string, tenantId: string): Promise<boolean>;
  search(query: string, tenantId: string): Promise<KnowledgeBaseEntry[]>;
}
