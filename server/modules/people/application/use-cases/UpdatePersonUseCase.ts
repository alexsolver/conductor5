
import { PersonUpdatedEvent } from '../../domain/events/PersonUpdatedEvent';
import { IPersonRepository } from '../../domain/repositories/IPersonRepository';
import { PersonDomainService } from '../../domain/services/PersonDomainService';

export interface UpdatePersonRequest {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  updatedBy: string;
  tenantId: string;
}

export class UpdatePersonUseCase {
  constructor(
    private personRepository: IPersonRepository,
    private domainService: PersonDomainService
  ) {}

  async execute(request: UpdatePersonRequest): Promise<void> {
    const person = await this.personRepository.findById(request.id);
    
    if (!person) {
      throw new Error('Person not found');
    }

    const updatedPerson = { ...person, ...request };
    await this.personRepository.update(updatedPerson);

    const event: PersonUpdatedEvent = {
      id: crypto.randomUUID(),
      personId: request.id,
      changes: request,
      updatedBy: request.updatedBy,
      updatedAt: new Date(),
      tenantId: request.tenantId
    };

    // Publish event logic would go here
  }
}
