import { IUserSkill } from '../../domain/entities/IUserSkill';
import { IIUserSkillRepository } from '../../domain/ports/IIUserSkillRepository';
// Removed drizzle-orm dependency - domain layer should not depend on infrastructure
import * as schema from '@shared/schema';

export class DrizzleIUserSkillRepository implements IIUserSkillRepository {
  constructor(private readonly db: ReturnType<typeof drizzle>) {}

  async findById(id: string, tenantId: string): Promise<IUserSkill | null> {
    // Implementar busca por ID
    throw new Error('Method not implemented.');
  }

  async findAll(tenantId: string): Promise<IUserSkill[]> {
    // Implementar busca de todos
    throw new Error('Method not implemented.');
  }

  async create(entity: IUserSkill): Promise<IUserSkill> {
    // Implementar criação
    throw new Error('Method not implemented.');
  }

  async update(id: string, entity: Partial<IUserSkill>, tenantId: string): Promise<IUserSkill | null> {
    // Implementar atualização
    throw new Error('Method not implemented.');
  }

  async delete(id: string, tenantId: string): Promise<boolean> {
    // Implementar exclusão
    throw new Error('Method not implemented.');
  }
}