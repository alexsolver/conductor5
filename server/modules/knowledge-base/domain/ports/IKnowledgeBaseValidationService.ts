
export interface IKnowledgeBaseValidationService {
  validateEntry(entry: any): boolean;
  validateContent(content: string): boolean;
  validatePermissions(userId: string, entryId: string): boolean;
}
