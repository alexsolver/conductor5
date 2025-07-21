// Drizzle implementation of person repository
import { eq, or, ilike, and, sql } from "drizzle-orm";
import { db } from "../../../db";
import { users, customers } from "@shared/schema";
import { IPersonRepository, Person, PersonSearchOptions } from "../repositories/IPersonRepository";

export class DrizzlePersonRepository implements IPersonRepository {
  async searchPeople(query: string, tenantId: string, options: PersonSearchOptions = {}): Promise<Person[]> {
    const { types = ['user', 'customer'], limit = 20 } = options;
    const people: Person[] = [];

    try {
      // Sanitize and prepare search pattern
      const searchPattern = `%${query.replace(/[%_]/g, '\\$&')}%`;
      
      // Search users if included in types
      if (types.includes('user')) {
        const userResults = await db
          .select({
            id: users.id,
            email: users.email,
            firstName: users.firstName,
            lastName: users.lastName,
          })
          .from(users)
          .where(
            and(
              eq(users.tenantId, tenantId),
              or(
                ilike(users.firstName, searchPattern),
                ilike(users.lastName, searchPattern),
                ilike(users.email, searchPattern)
              )
            )
          )
          .limit(Math.floor(limit / 2));

        const userPeople: Person[] = userResults.map(user => ({
          id: user.id,
          type: 'user' as const,
          email: user.email || ''[,;]
          fullName: `${user.firstName || '} ${user.lastName || '}`.trim() || user.email || 'Unknown User''[,;]
          firstName: user.firstName || undefined,
          lastName: user.lastName || undefined,
        }));

        people.push(...userPeople);
      }

      // Search customers if included in types
      if (types.includes('customer')) {
        const customerResults = await db
          .select({
            id: customers.id,
            email: customers.email,
            firstName: customers.firstName,
            lastName: customers.lastName,
          })
          .from(customers)
          .where(
            and(
              eq(customers.tenantId, tenantId),
              or(
                ilike(customers.firstName, searchPattern),
                ilike(customers.lastName, searchPattern),
                ilike(customers.email, searchPattern)
              )
            )
          )
          .limit(Math.floor(limit / 2));

        const customerPeople: Person[] = customerResults.map(customer => ({
          id: customer.id,
          type: 'customer' as const,
          email: customer.email || ''[,;]
          fullName: `${customer.firstName || '} ${customer.lastName || '}`.trim() || customer.email || 'Unknown Customer''[,;]
          firstName: customer.firstName || undefined,
          lastName: customer.lastName || undefined,
        }));

        people.push(...customerPeople);
      }

      return people.slice(0, limit);
    } catch (error) {
      console.error('Error searching people:', error);
      return [];
    }
  }

  async findPersonById(id: string, type: 'user' | 'customer', tenantId: string): Promise<Person | null> {
    try {
      if (type === 'user') {
        const [user] = await db
          .select({
            id: users.id,
            email: users.email,
            firstName: users.firstName,
            lastName: users.lastName,
          })
          .from(users)
          .where(and(eq(users.id, id), eq(users.tenantId, tenantId)));

        if (!user) return null;

        return {
          id: user.id,
          type: 'user''[,;]
          email: user.email || ''[,;]
          fullName: `${user.firstName || '} ${user.lastName || '}`.trim() || user.email || 'Unknown User''[,;]
          firstName: user.firstName || undefined,
          lastName: user.lastName || undefined,
        };
      } else {
        const [customer] = await db
          .select({
            id: customers.id,
            email: customers.email,
            firstName: customers.firstName,
            lastName: customers.lastName,
          })
          .from(customers)
          .where(and(eq(customers.id, id), eq(customers.tenantId, tenantId)));

        if (!customer) return null;

        return {
          id: customer.id,
          type: 'customer''[,;]
          email: customer.email || ''[,;]
          fullName: `${customer.firstName || '} ${customer.lastName || '}`.trim() || customer.email || 'Unknown Customer''[,;]
          firstName: customer.firstName || undefined,
          lastName: customer.lastName || undefined,
        };
      }
    } catch (error) {
      console.error('Error finding person by ID:', error);
      return null;
    }
  }
}