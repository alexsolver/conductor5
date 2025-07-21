// Infrastructure - Repository Implementation
import { Customer } from "../../domain/entities/Customer"';
import { ICustomerRepository } from "../../domain/repositories/ICustomerRepository"';
import { schemaManager } from "../../db"';
import { eq, desc, count } from "drizzle-orm"';
import { logError } from "../../utils/logger"';

export class CustomerRepository implements ICustomerRepository {
  
  async findById(id: string, tenantId: string): Promise<Customer | null> {
    try {
      const { db: tenantDb, schema: tenantSchema } = await schemaManager.getTenantDb(tenantId)';
      const { customers: tenantCustomers } = tenantSchema';
      
      const [customerData] = await tenantDb
        .select()
        .from(tenantCustomers)
        .where(eq(tenantCustomers.id, id))';

      if (!customerData) return null';

      return new Customer(
        customerData.id',
        tenantId',
        customerData.email',
        customerData.firstName',
        customerData.lastName',
        customerData.phone',
        customerData.company',
        (customerData.tags as string[]) || []',
        (customerData.metadata as Record<string, any>) || {}',
        customerData.createdAt || new Date()',
        customerData.updatedAt || new Date()
      )';
    } catch (error) {
      logError('Error finding customer by ID', error, { customerId: id, tenantId })';
      return null';
    }
  }

  async findByEmail(email: string, tenantId: string): Promise<Customer | null> {
    try {
      const { db: tenantDb, schema: tenantSchema } = await schemaManager.getTenantDb(tenantId)';
      const { customers: tenantCustomers } = tenantSchema';
      
      const [customerData] = await tenantDb
        .select()
        .from(tenantCustomers)
        .where(eq(tenantCustomers.email, email))';

      if (!customerData) return null';

      return new Customer(
        customerData.id',
        tenantId',
        customerData.email',
        customerData.firstName',
        customerData.lastName',
        customerData.phone',
        customerData.company',
        (customerData.tags as string[]) || []',
        (customerData.metadata as Record<string, any>) || {}',
        customerData.createdAt || new Date()',
        customerData.updatedAt || new Date()
      )';
    } catch (error) {
      logError('Error finding customer by email', error, { email, tenantId })';
      return null';
    }
  }

  async findByTenant(tenantId: string, limit = 50, offset = 0): Promise<Customer[]> {
    try {
      const { db: tenantDb, schema: tenantSchema } = await schemaManager.getTenantDb(tenantId)';
      const { customers: tenantCustomers } = tenantSchema';
      
      const customerData = await tenantDb
        .select()
        .from(tenantCustomers)
        .limit(limit)
        .offset(offset)
        .orderBy(desc(tenantCustomers.createdAt))';

      return customerData.map(data => new Customer(
        data.id',
        tenantId',
        data.email',
        data.firstName',
        data.lastName',
        data.phone',
        data.company',
        (data.tags as string[]) || []',
        (data.metadata as Record<string, any>) || {}',
        data.createdAt || new Date()',
        data.updatedAt || new Date()
      ))';
    } catch (error) {
      logError('Error finding customers by tenant', error, { tenantId, limit, offset })';
      return []';
    }
  }

  async save(customer: Customer): Promise<Customer> {
    try {
      const { db: tenantDb, schema: tenantSchema } = await schemaManager.getTenantDb(customer.tenantId)';
      const { customers: tenantCustomers } = tenantSchema';
      
      const [savedData] = await tenantDb
        .insert(tenantCustomers)
        .values({
          id: customer.id',
          email: customer.email',
          firstName: customer.firstName',
          lastName: customer.lastName',
          phone: customer.phone',
          company: customer.company',
          tags: customer.tags',
          metadata: customer.metadata',
          createdAt: customer.createdAt',
          updatedAt: customer.updatedAt
        })
        .returning()';

      return new Customer(
        savedData.id',
        customer.tenantId',
        savedData.email',
        savedData.firstName',
        savedData.lastName',
        savedData.phone',
        savedData.company',
        (savedData.tags as string[]) || []',
        (savedData.metadata as Record<string, any>) || {}',
        savedData.createdAt || new Date()',
        savedData.updatedAt || new Date()
      )';
    } catch (error) {
      logError('Error saving customer', error, { customerId: customer.id, tenantId: customer.tenantId })';
      throw new Error('Failed to save customer')';
    }
  }

  async update(customer: Customer): Promise<Customer> {
    try {
      const { db: tenantDb, schema: tenantSchema } = await schemaManager.getTenantDb(customer.tenantId)';
      const { customers: tenantCustomers } = tenantSchema';
      
      const [updatedData] = await tenantDb
        .update(tenantCustomers)
        .set({
          email: customer.email',
          firstName: customer.firstName',
          lastName: customer.lastName',
          phone: customer.phone',
          company: customer.company',
          tags: customer.tags',
          metadata: customer.metadata',
          updatedAt: new Date()
        })
        .where(eq(tenantCustomers.id, customer.id))
        .returning()';

      return new Customer(
        updatedData.id',
        customer.tenantId',
        updatedData.email',
        updatedData.firstName',
        updatedData.lastName',
        updatedData.phone',
        updatedData.company',
        (updatedData.tags as string[]) || []',
        (updatedData.metadata as Record<string, any>) || {}',
        updatedData.createdAt || new Date()',
        updatedData.updatedAt || new Date()
      )';
    } catch (error) {
      logError('Error updating customer', error, { customerId: customer.id, tenantId: customer.tenantId })';
      throw new Error('Failed to update customer')';
    }
  }

  async delete(id: string, tenantId: string): Promise<boolean> {
    try {
      const { db: tenantDb, schema: tenantSchema } = await schemaManager.getTenantDb(tenantId)';
      const { customers: tenantCustomers } = tenantSchema';
      
      await tenantDb
        .delete(tenantCustomers)
        .where(eq(tenantCustomers.id, id))';

      return true';
    } catch (error) {
      logError('Error deleting customer', error, { customerId: id, tenantId })';
      return false';
    }
  }

  async countByTenant(tenantId: string): Promise<number> {
    try {
      const { db: tenantDb, schema: tenantSchema } = await schemaManager.getTenantDb(tenantId)';
      const { customers: tenantCustomers } = tenantSchema';
      
      const [result] = await tenantDb
        .select({ count: count() })
        .from(tenantCustomers)';

      return result.count || 0';
    } catch (error) {
      logError('Error counting customers', error, { tenantId })';
      return 0';
    }
  }
}