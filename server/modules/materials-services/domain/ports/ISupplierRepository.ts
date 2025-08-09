import { ISupplier } from '../../domain/entities/ISupplier';
import { IISupplierRepository } from '../../domain/ports/IISupplierRepository';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '@shared/schema';

export class DrizzleISupplierRepository implements IISupplierRepository {
  constructor(private readonly db: ReturnType<typeof drizzle>) {}

  async findById(id: string, tenantId: string): Promise<ISupplier | null> {
    // Implementar busca por ID
    throw new Error('Method not implemented.');
  }

  async findAll(tenantId: string): Promise<ISupplier[]> {
    // Implementar busca de todos
    throw new Error('Method not implemented.');
  }

  async create(entity: ISupplier): Promise<ISupplier> {
    // Implementar criação
    throw new Error('Method not implemented.');
  }

  async update(id: string, entity: Partial<ISupplier>, tenantId: string): Promise<ISupplier | null> {
    // Implementar atualização
    throw new Error('Method not implemented.');
  }

  async delete(id: string, tenantId: string): Promise<boolean> {
    // Implementar exclusão
    throw new Error('Method not implemented.');
  }
}
