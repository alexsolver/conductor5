import { ILPUCacheWarmer } from '../../domain/entities/ILPUCacheWarmer';
import { IILPUCacheWarmerRepository } from '../../domain/ports/IILPUCacheWarmerRepository';
// Removed external dependencies from domain layer
// Domain should only contain business logic interfaces

export class DrizzleILPUCacheWarmerRepository implements IILPUCacheWarmerRepository {
  constructor(private readonly db: ReturnType<typeof drizzle>) {}

  async findById(id: string, tenantId: string): Promise<ILPUCacheWarmer | null> {
    // Implementar busca por ID
    throw new Error('Method not implemented.');
  }

  async findAll(tenantId: string): Promise<ILPUCacheWarmer[]> {
    // Implementar busca de todos
    throw new Error('Method not implemented.');
  }

  async create(entity: ILPUCacheWarmer): Promise<ILPUCacheWarmer> {
    // Implementar criação
    throw new Error('Method not implemented.');
  }

  async update(id: string, entity: Partial<ILPUCacheWarmer>, tenantId: string): Promise<ILPUCacheWarmer | null> {
    // Implementar atualização
    throw new Error('Method not implemented.');
  }

  async delete(id: string, tenantId: string): Promise<boolean> {
    // Implementar exclusão
    throw new Error('Method not implemented.');
  }
}