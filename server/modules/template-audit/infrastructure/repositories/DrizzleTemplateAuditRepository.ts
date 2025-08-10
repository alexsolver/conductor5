
export class DrizzleTemplateAuditRepository {
  constructor(private db: any) {}

  async create(audit: any): Promise<any> {
    // Implementação com Drizzle
    return this.db.insert(audit);
  }

  async findByTemplate(templateId: string): Promise<any[]> {
    return this.db.select().where({ templateId });
  }

  async findByUser(userId: string): Promise<any[]> {
    return this.db.select().where({ userId });
  }
}
