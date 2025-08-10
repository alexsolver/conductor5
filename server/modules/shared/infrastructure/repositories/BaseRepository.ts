import { Pool } from 'pg';

export abstract class BaseRepository {
  protected pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  protected async query(text: string, params?: any[]): Promise<any> {
    try {
      return await this.pool.query(text, params);
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    }
  }

  protected getSchemaName(tenantId: string): string {
    return `tenant_${tenantId.replace(/-/g, '_')}`;
  }
}