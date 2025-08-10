
import { KnowledgeBaseEntry } from '../entities/KnowledgeBaseEntry';

export interface IKnowledgeBaseEntryRepository {
  save(entry: KnowledgeBaseEntry): Promise<KnowledgeBaseEntry>;
  findById(id: string): Promise<KnowledgeBaseEntry | null>;
  findByCategory(category: string): Promise<KnowledgeBaseEntry[]>;
  findByAuthor(authorId: string): Promise<KnowledgeBaseEntry[]>;
  findPublished(): Promise<KnowledgeBaseEntry[]>;
  search(query: string): Promise<KnowledgeBaseEntry[]>;
  delete(id: string): Promise<void>;
  update(entry: KnowledgeBaseEntry): Promise<KnowledgeBaseEntry>;
}
