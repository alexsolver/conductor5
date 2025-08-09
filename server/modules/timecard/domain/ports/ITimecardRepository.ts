import { ITimecard } from '../../domain/entities/ITimecard';
import { IITimecardRepository } from '../../domain/ports/IITimecardRepository';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '@shared/schema';

export class DrizzleITimecardRepository implements IITimecardRepository {
  constructor(private readonly db: ReturnType<typeof drizzle>) {}

  async findById(id: string, tenantId: string): Promise<ITimecard | null> {
    // Implementar busca por ID
    throw new Error('Method not implemented.');
  }

  async findAll(tenantId: string): Promise<ITimecard[]> {
    // Implementar busca de todos
    throw new Error('Method not implemented.');
  }

  async create(entity: ITimecard): Promise<ITimecard> {
    // Implementar criação
    throw new Error('Method not implemented.');
  }

  async update(id: string, entity: Partial<ITimecard>, tenantId: string): Promise<ITimecard | null> {
    // Implementar atualização
    throw new Error('Method not implemented.');
  }

  async delete(id: string, tenantId: string): Promise<boolean> {
    // Implementar exclusão
    throw new Error('Method not implemented.');
  }
}
