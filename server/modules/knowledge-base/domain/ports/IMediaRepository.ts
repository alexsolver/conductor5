import { IMedia } from '../../domain/entities/IMedia';
import { IIMediaRepository } from '../../domain/ports/IIMediaRepository';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '@shared/schema';

export class DrizzleIMediaRepository implements IIMediaRepository {
  constructor(private readonly db: ReturnType<typeof drizzle>) {}

  async findById(id: string, tenantId: string): Promise<IMedia | null> {
    // Implementar busca por ID
    throw new Error('Method not implemented.');
  }

  async findAll(tenantId: string): Promise<IMedia[]> {
    // Implementar busca de todos
    throw new Error('Method not implemented.');
  }

  async create(entity: IMedia): Promise<IMedia> {
    // Implementar criação
    throw new Error('Method not implemented.');
  }

  async update(id: string, entity: Partial<IMedia>, tenantId: string): Promise<IMedia | null> {
    // Implementar atualização
    throw new Error('Method not implemented.');
  }

  async delete(id: string, tenantId: string): Promise<boolean> {
    // Implementar exclusão
    throw new Error('Method not implemented.');
  }
}
