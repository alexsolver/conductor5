// Shared infrastructure for unified person lookup
import { eq, ilike, or, and } from "drizzle-orm";
import { Person, IPersonRepository } from "../repositories/IPersonRepository";
import { db } from "../../../db";
import { users, customers } from "../../../../shared/schema";

export class DrizzlePersonRepository implements IPersonRepository {
  
  async findPersonById(id: string, type: 'user' | 'customer', tenantId: string): Promise<Person | null> {
    if (type === 'user') {
      const [user] = await db
        .select()
        .from(users)
        .where(and(eq(users.id, id), eq(users.tenantId, tenantId)));
      
      return user ? this.mapUserToPerson(user) : null;
    } else {
      const [customer] = await db
        .select()
        .from(customers)
        .where(and(eq(customers.id, id), eq(customers.tenantId, tenantId)));
      
      return customer ? this.mapCustomerToPerson(customer) : null;
    }
  }

  async findPersonByEmail(email: string, tenantId: string): Promise<Person[]> {
    const [usersResults, customersResults] = await Promise.all([
      db.select().from(users).where(and(eq(users.email, email), eq(users.tenantId, tenantId))),
      db.select().from(customers).where(and(eq(customers.email, email), eq(customers.tenantId, tenantId)))
    ]);

    const people: Person[] = [];
    people.push(...usersResults.map(user => this.mapUserToPerson(user)));
    people.push(...customersResults.map(customer => this.mapCustomerToPerson(customer)));
    
    return people;
  }

  async searchPeople(query: string, tenantId: string, options?: {
    types?: ('user' | 'customer')[];
    limit?: number;
  }): Promise<Person[]> {
    const types = options?.types || ['user', 'customer'];
    const limit = options?.limit || 50;
    const people: Person[] = [];

    const searchTerm = `%${query.toLowerCase()}%`;

    if (types.includes('user')) {
      const usersResults = await db
        .select()
        .from(users)
        .where(
          and(
            eq(users.tenantId, tenantId),
            or(
              ilike(users.email, searchTerm),
              ilike(users.firstName, searchTerm),
              ilike(users.lastName, searchTerm)
            )
          )
        )
        .limit(Math.ceil(limit / types.length));

      people.push(...usersResults.map(user => this.mapUserToPerson(user)));
    }

    if (types.includes('customer')) {
      const customersResults = await db
        .select()
        .from(customers)
        .where(
          and(
            eq(customers.tenantId, tenantId),
            or(
              ilike(customers.email, searchTerm),
              ilike(customers.firstName, searchTerm),
              ilike(customers.lastName, searchTerm),
              ilike(customers.company, searchTerm)
            )
          )
        )
        .limit(Math.ceil(limit / types.length));

      people.push(...customersResults.map(customer => this.mapCustomerToPerson(customer)));
    }

    // Sort by relevance (exact matches first)
    return people
      .sort((a, b) => {
        const aExact = a.email.toLowerCase() === query.toLowerCase() || 
                      a.fullName.toLowerCase() === query.toLowerCase();
        const bExact = b.email.toLowerCase() === query.toLowerCase() || 
                      b.fullName.toLowerCase() === query.toLowerCase();
        
        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;
        return a.fullName.localeCompare(b.fullName);
      })
      .slice(0, limit);
  }

  async validatePersonExists(id: string, type: 'user' | 'customer', tenantId: string): Promise<boolean> {
    const person = await this.findPersonById(id, type, tenantId);
    return person !== null;
  }

  async validatePersonsInSameTenant(
    persons: Array<{ id: string; type: 'user' | 'customer' }>, 
    tenantId: string
  ): Promise<boolean> {
    for (const person of persons) {
      const exists = await this.validatePersonExists(person.id, person.type, tenantId);
      if (!exists) return false;
    }
    return true;
  }

  private mapUserToPerson(user: any): Person {
    return {
      id: user.id,
      type: 'user',
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: this.getFullName(user.firstName, user.lastName, user.email),
      tenantId: user.tenantId,
      active: true, // Users are generally active if they exist
    };
  }

  private mapCustomerToPerson(customer: any): Person {
    return {
      id: customer.id,
      type: 'customer',
      email: customer.email,
      firstName: customer.firstName,
      lastName: customer.lastName,
      fullName: this.getFullName(customer.firstName, customer.lastName, customer.email),
      tenantId: customer.tenantId,
      active: customer.active || true,
    };
  }

  private getFullName(firstName?: string | null, lastName?: string | null, email?: string): string {
    if (!firstName && !lastName) return email || '';
    return [firstName, lastName].filter(Boolean).join(' ');
  }
}