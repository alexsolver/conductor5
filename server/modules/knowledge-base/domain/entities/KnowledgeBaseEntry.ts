// Removed drizzle-orm dependency from domain layer - using pure domain entities

export class KnowledgeBaseEntry {
  constructor(
    public readonly id: string,
    public readonly title: string,
    public readonly content: string,
    public readonly category: string,
    public readonly tenantId: string,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date()
  ) {}
}