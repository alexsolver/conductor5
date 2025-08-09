
import { IPersonRepository } from '../../domain/repositories/IPersonRepository';
import { PersonDomainService } from '../../domain/services/PersonDomainService';
import { CreatePersonDTO } from '../dto/CreatePersonDTO';
import { Person } from '../../domain/entities/Person';

export class PersonApplicationService {
  constructor(
    private personRepository: IPersonRepository,
    private personDomainService: PersonDomainService
  ) {}

  async createPerson(data: CreatePersonDTO): Promise<Person> {
    const person = new Person({
      id: crypto.randomUUID(),
      tenantId: data.tenantId,
      name: data.name,
      email: data.email,
      phone: data.phone,
      position: data.position,
      department: data.department,
      skills: data.skills || [],
      isActive: data.isActive,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await this.personDomainService.validatePersonData(person);

    return await this.personRepository.create(person);
  }

  async getPersonsByTenant(tenantId: string): Promise<Person[]> {
    return await this.personRepository.findByTenant(tenantId);
  }
}
