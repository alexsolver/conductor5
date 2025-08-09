
import { IPersonRepository } from '../../domain/repositories/IPersonRepository';

export interface SearchPeopleFilters {
  companyId: string;
  types?: ('user' | 'customer' | 'beneficiary')[];
  searchTerm?: string;
}

export interface PersonSearchResult {
  id: string;
  type: 'user' | 'customer' | 'beneficiary';
  name: string;
  email?: string;
  companyId: string;
  companyName?: string;
}

export class SearchPeopleUseCase {
  constructor(
    private readonly personRepository: IPersonRepository
  ) {}

  async execute(filters: SearchPeopleFilters): Promise<PersonSearchResult[]> {
    return await this.personRepository.searchUnified(filters);
  }
}
