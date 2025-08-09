
import { Person } from '../entities/Person';

export interface IPersonRepository {
  findById(id: string, tenantId: string): Promise<Person | null>;
  findAll(tenantId: string): Promise<Person[]>;
  create(entity: Person): Promise<Person>;
  update(id: string, entity: Partial<Person>, tenantId: string): Promise<Person | null>;
  delete(id: string, tenantId: string): Promise<boolean>;
  findByEmail(email: string, tenantId: string): Promise<Person | null>;
  findByDocument(document: string, tenantId: string): Promise<Person | null>;
}
