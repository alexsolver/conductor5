
import { PersonApplicationService } from '../services/PersonApplicationService';
import { CreatePersonDTO } from '../dto/CreatePersonDTO';
import { Person } from '../../domain/entities/Person';

export class CreatePersonUseCase {
  constructor(
    private personApplicationService: PersonApplicationService
  ) {}

  async execute(data: CreatePersonDTO): Promise<Person> {
    return await this.personApplicationService.createPerson(data);
  }
}
