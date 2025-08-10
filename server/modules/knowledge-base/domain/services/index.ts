export class KnowledgeBaseDomainService {
  static validateEntry(entry: any): boolean {
    return !!(entry.title && entry.content && entry.tenantId);
  }

  static generateSlug(title: string): string {
    return title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  }
}

export { KnowledgeBaseSearchService } from './KnowledgeBaseSearchService';