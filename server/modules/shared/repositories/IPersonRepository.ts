// Shared repository interface for unified person lookup
export interface Person {
  id: string;
  type: 'user' | 'customer';
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  fullName: string;
  tenantId: string;
  active: boolean;
}

export interface IPersonRepository {
  // Unified person lookup across users and customers
  findPersonById(id: string, type: 'user' | 'customer', tenantId: string): Promise<Person | null>;
  findPersonByEmail(email: string, tenantId: string): Promise<Person[]>; // May return both user and customer
  searchPeople(query: string, tenantId: string, options?: {
    types?: ('user' | 'customer')[];
    limit?: number;
  }): Promise<Person[]>;
  
  // Validation methods
  validatePersonExists(id: string, type: 'user' | 'customer', tenantId: string): Promise<boolean>;
  validatePersonsInSameTenant(persons: Array<{ id: string; type: 'user' | 'customer' }>, tenantId: string): Promise<boolean>;
}