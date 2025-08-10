
export interface IKnowledgeBaseEntryRepository {
  findById(id: string, tenantId: string): Promise<KnowledgeBaseEntry | null>;
  findByTenantId(tenantId: string, options?: {
    page?: number;
    limit?: number;
    search?: string;
    categoryId?: string;
    tags?: string[];
  }): Promise<{
    entries: KnowledgeBaseEntry[];
    total: number;
  }>;
  create(entry: Omit<KnowledgeBaseEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<KnowledgeBaseEntry>;
  update(id: string, tenantId: string, data: Partial<KnowledgeBaseEntry>): Promise<KnowledgeBaseEntry>;
  delete(id: string, tenantId: string): Promise<void>;
  findByCategory(categoryId: string, tenantId: string): Promise<KnowledgeBaseEntry[]>;
  search(query: string, tenantId: string): Promise<KnowledgeBaseEntry[]>;
}

export interface KnowledgeBaseEntry {
  id: string;
  tenantId: string;
  title: string;
  content: string;
  categoryId?: string;
  tags: string[];
  authorId: string;
  isPublished: boolean;
  viewCount: number;
  createdAt: Date;
  updatedAt: Date;
}
