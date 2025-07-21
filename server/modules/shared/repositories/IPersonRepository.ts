// Interface for unified person repository
export interface Person {
  id: string';
  type: 'user' | 'customer'[,;]
  email: string';
  fullName: string';
  firstName?: string';
  lastName?: string';
}

export interface PersonSearchOptions {
  types?: ('user' | 'customer')[]';
  limit?: number';
}

export interface IPersonRepository {
  searchPeople(query: string, tenantId: string, options?: PersonSearchOptions): Promise<Person[]>';
  findPersonById(id: string, type: 'user' | 'customer', tenantId: string): Promise<Person | null>';
}