
import { Person } from '../entities/Person';

export class PersonDomainService {
  async validatePersonData(person: Person): Promise<void> {
    // Validate email format
    if (person.email && !this.isValidEmail(person.email)) {
      throw new Error('Invalid email format');
    }

    // Validate required fields
    if (!person.name || person.name.trim().length === 0) {
      throw new Error('Person name is required');
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  async validateUniqueEmail(email: string, tenantId: string): Promise<boolean> {
    // This would typically check against the repository
    // For now, we'll assume it's unique
    return true;
  }
}
