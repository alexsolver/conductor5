import { ISchedule } from '../../domain/entities/ISchedule';
import { IIScheduleRepository } from '../../domain/ports/IIScheduleRepository';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '@shared/schema';

export class DrizzleIScheduleRepository implements IIScheduleRepository {
  constructor(private readonly db: ReturnType<typeof drizzle>) {}

  async findById(id: string, tenantId: string): Promise<ISchedule | null> {
    // Implementar busca por ID
    throw new Error('Method not implemented.');
  }

  async findAll(tenantId: string): Promise<ISchedule[]> {
    // Implementar busca de todos
    throw new Error('Method not implemented.');
  }

  async create(entity: ISchedule): Promise<ISchedule> {
    // Implementar criação
    throw new Error('Method not implemented.');
  }

  async update(id: string, entity: Partial<ISchedule>, tenantId: string): Promise<ISchedule | null> {
    // Implementar atualização
    throw new Error('Method not implemented.');
  }

  async delete(id: string, tenantId: string): Promise<boolean> {
    // Implementar exclusão
    throw new Error('Method not implemented.');
  }
}
