import { Customer } from '../../domain/entities/Customer';
import { ICustomerRepository } from '../../domain/ports/ICustomerRepository';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '@shared/schema';
import { eq, and, like, count, or } from 'drizzle-orm';

export class DrizzleCustomerRepository implements ICustomerRepository {
  constructor(private readonly db: ReturnType<typeof drizzle>) {}

  async findById(id: string, tenantId: string): Promise<Customer | null> {
    // Implementar busca por ID
    throw new Error('Method not implemented.');
  }

  async findAll(tenantId: string): Promise<Customer[]> {
    const results = await this.db
      .select()
      .from(schema.customers)
      .where(and(
        eq(schema.customers.tenantId, tenantId),
        eq(schema.customers.isActive, true)
      ));
    
    return results.map(this.toDomainEntity);
  }

  async create(entity: Customer): Promise<Customer> {
    // Implementar criação
    throw new Error('Method not implemented.');
  }

  async update(id: string, entity: Partial<Customer>, tenantId: string): Promise<Customer | null> {
    // Implementar atualização
    throw new Error('Method not implemented.');
  }

  async delete(id: string, tenantId: string): Promise<boolean> {
    // Implementar exclusão
    throw new Error('Method not implemented.');
  }

  async findMany(filter: { tenantId: string; search?: string; active?: boolean; verified?: boolean; limit?: number; offset?: number; }): Promise<Customer[]> {
    let query = this.db
      .select()
      .from(schema.customers)
      .where(and(
        eq(schema.customers.tenantId, filter.tenantId),
        eq(schema.customers.isActive, filter.active ?? true)
      ));

    if (filter.search) {
      query = query.where(
        or(
          like(schema.customers.firstName, `%${filter.search}%`),
          like(schema.customers.lastName, `%${filter.search}%`),
          like(schema.customers.email, `%${filter.search}%`)
        )
      );
    }

    if (filter.limit) {
      query = query.limit(filter.limit);
    }

    if (filter.offset) {
      query = query.offset(filter.offset);
    }

    const results = await query;
    return results.map(this.toDomainEntity);
  }

  async findByEmail(email: string, tenantId: string): Promise<Customer | null> {
    // Implementar busca por email
    throw new Error('Method not implemented.');
  }

  async save(customer: Customer): Promise<Customer> {
    // Implementar salvamento
    return this.create(customer);
  }

  async count(filter: { tenantId: string; search?: string; active?: boolean; verified?: boolean; }): Promise<number> {
    const results = await this.db
      .select({ count: count() })
      .from(schema.customers)
      .where(and(
        eq(schema.customers.tenantId, filter.tenantId),
        eq(schema.customers.isActive, filter.active ?? true)
      ));
    
    return results[0]?.count || 0;
  }

  private toDomainEntity(row: any): Customer {
    return new Customer(
      row.id,
      row.tenantId,
      row.customerType || 'PF',
      row.isActive ? 'Ativo' : 'Inativo',
      row.email,
      null, // description
      null, // internalCode
      row.firstName,
      row.lastName,
      row.cpf,
      row.companyName,
      row.cnpj,
      row.contactPerson,
      null, // responsible
      row.phone,
      row.mobilePhone,
      null, // position
      null, // supervisor
      null, // coordinator
      null, // manager
      [], // tags
      {}, // metadata
      false, // verified
      row.isActive || true,
      false, // suspended
      null, // lastLogin
      'UTC', // timezone
      'pt-BR', // locale
      'pt', // language
      null, // externalId
      'customer', // role
      null, // notes
      null, // avatar
      null, // signature
      new Date(row.createdAt),
      new Date(row.updatedAt)
    );
  }
}
