
import { Person } from '../../domain/entities/Person';
import { IPersonRepository } from '../../domain/repositories/IPersonRepository';
import { drizzle } from 'drizzle-orm/neon-http';

export class DrizzlePersonRepository implements IPersonRepository {
  constructor(private readonly db: ReturnType<typeof drizzle>) {}

  async findById(id: string, tenantId: string): Promise<Person | null> {
    // Implementar busca por ID
    throw new Error('Method not implemented.');
  }

  async findAll(tenantId: string): Promise<Person[]> {
    // Implementar busca de todos
    throw new Error('Method not implemented.');
  }

  async create(entity: Person): Promise<Person> {
    // Implementar criação
    throw new Error('Method not implemented.');
  }

  async update(id: string, entity: Partial<Person>, tenantId: string): Promise<Person | null> {
    // Implementar atualização
    throw new Error('Method not implemented.');
  }

  async delete(id: string, tenantId: string): Promise<boolean> {
    // Implementar exclusão
    throw new Error('Method not implemented.');
  }

  async findByEmail(email: string, tenantId: string): Promise<Person | null> {
    // Implementar busca por email
    throw new Error('Method not implemented.');
  }

  async findByDocument(document: string, tenantId: string): Promise<Person | null> {
    // Implementar busca por documento
    throw new Error('Method not implemented.');
  }
}
