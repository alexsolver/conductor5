
// ✅ 1QA.MD COMPLIANCE: CUSTOMER REPOSITORY PADRONIZADO
import { Customer } from "../../domain/entities/Customer";
import { ICustomerRepository } from "../../domain/repositories/ICustomerRepository";
import { db, sql, customers } from '@shared/schema';
import { eq, desc, count, and, ilike } from "drizzle-orm";
import { logError } from "../../utils/logger";
import { schemaManager } from "../../database/EnterpriseConnectionManager";

export class CustomerRepository implements ICustomerRepository {
  
  async findById(id: string, tenantId: string): Promise<Customer | null> {
    try {
      const { db: tenantDb, schema: tenantSchema } = await schemaManager.getTenantDb(tenantId);
      const { customers: tenantCustomers } = tenantSchema;
      
      const [customerData] = await tenantDb
        .select()
        .from(tenantCustomers)
        .where(and(
          eq(tenantCustomers.id, id),
          eq(tenantCustomers.tenantId, tenantId),
          eq(tenantCustomers.isActive, true)
        ));

      if (!customerData) return null;

      return this.mapToEntity(customerData, tenantId);
    } catch (error) {
      logError('Error finding customer by ID', error, { customerId: id, tenantId });
      return null;
    }
  }

  async findByEmail(email: string, tenantId: string): Promise<Customer | null> {
    try {
      const { db: tenantDb, schema: tenantSchema } = await schemaManager.getTenantDb(tenantId);
      const { customers: tenantCustomers } = tenantSchema;
      
      const [customerData] = await tenantDb
        .select()
        .from(tenantCustomers)
        .where(and(
          eq(tenantCustomers.email, email),
          eq(tenantCustomers.tenantId, tenantId),
          eq(tenantCustomers.isActive, true)
        ));

      if (!customerData) return null;

      return this.mapToEntity(customerData, tenantId);
    } catch (error) {
      logError('Error finding customer by email', error, { email, tenantId });
      return null;
    }
  }

  async findByTenant(tenantId: string, limit = 50, offset = 0): Promise<Customer[]> {
    try {
      const { db: tenantDb, schema: tenantSchema } = await schemaManager.getTenantDb(tenantId);
      const { customers: tenantCustomers } = tenantSchema;
      
      const customerData = await tenantDb
        .select()
        .from(tenantCustomers)
        .where(and(
          eq(tenantCustomers.tenantId, tenantId),
          eq(tenantCustomers.isActive, true)
        ))
        .limit(limit)
        .offset(offset)
        .orderBy(desc(tenantCustomers.createdAt));

      return customerData.map(data => this.mapToEntity(data, tenantId));
    } catch (error) {
      logError('Error finding customers by tenant', error, { tenantId, limit, offset });
      return [];
    }
  }

  async searchCustomers(tenantId: string, searchTerm: string, limit = 50): Promise<Customer[]> {
    try {
      const { db: tenantDb, schema: tenantSchema } = await schemaManager.getTenantDb(tenantId);
      const { customers: tenantCustomers } = tenantSchema;
      
      const customerData = await tenantDb
        .select()
        .from(tenantCustomers)
        .where(and(
          eq(tenantCustomers.tenantId, tenantId),
          eq(tenantCustomers.isActive, true),
          ilike(tenantCustomers.firstName, `%${searchTerm}%`)
        ))
        .limit(limit)
        .orderBy(desc(tenantCustomers.createdAt));

      return customerData.map(data => this.mapToEntity(data, tenantId));
    } catch (error) {
      logError('Error searching customers', error, { tenantId, searchTerm });
      return [];
    }
  }

  async save(customer: Customer): Promise<Customer> {
    try {
      const { db: tenantDb, schema: tenantSchema } = await schemaManager.getTenantDb(customer.tenantId);
      const { customers: tenantCustomers } = tenantSchema;
      
      const [savedData] = await tenantDb
        .insert(tenantCustomers)
        .values({
          id: customer.id,
          tenantId: customer.tenantId,
          email: customer.email,
          firstName: customer.firstName,
          lastName: customer.lastName,
          phone: customer.phone,
          mobilePhone: customer.mobilePhone,
          customerType: customer.customerType,
          cpf: customer.cpf,
          cnpj: customer.cnpj,
          companyName: customer.companyName,
          contactPerson: customer.contactPerson,
          state: customer.state,
          address: customer.address,
          addressNumber: customer.addressNumber,
          complement: customer.complement,
          neighborhood: customer.neighborhood,
          city: customer.city,
          zipCode: customer.zipCode,
          isActive: customer.isActive,
          createdAt: customer.createdAt,
          updatedAt: customer.updatedAt
        })
        .returning();

      return this.mapToEntity(savedData, customer.tenantId);
    } catch (error) {
      logError('Error saving customer', error, { customerId: customer.id, tenantId: customer.tenantId });
      throw new Error('Failed to save customer');
    }
  }

  async update(customer: Customer): Promise<Customer> {
    try {
      const { db: tenantDb, schema: tenantSchema } = await schemaManager.getTenantDb(customer.tenantId);
      const { customers: tenantCustomers } = tenantSchema;
      
      const [updatedData] = await tenantDb
        .update(tenantCustomers)
        .set({
          email: customer.email,
          firstName: customer.firstName,
          lastName: customer.lastName,
          phone: customer.phone,
          mobilePhone: customer.mobilePhone,
          customerType: customer.customerType,
          cpf: customer.cpf,
          cnpj: customer.cnpj,
          companyName: customer.companyName,
          contactPerson: customer.contactPerson,
          state: customer.state,
          address: customer.address,
          addressNumber: customer.addressNumber,
          complement: customer.complement,
          neighborhood: customer.neighborhood,
          city: customer.city,
          zipCode: customer.zipCode,
          isActive: customer.isActive,
          updatedAt: new Date()
        })
        .where(and(
          eq(tenantCustomers.id, customer.id),
          eq(tenantCustomers.tenantId, customer.tenantId)
        ))
        .returning();

      return this.mapToEntity(updatedData, customer.tenantId);
    } catch (error) {
      logError('Error updating customer', error, { customerId: customer.id, tenantId: customer.tenantId });
      throw new Error('Failed to update customer');
    }
  }

  async delete(id: string, tenantId: string): Promise<boolean> {
    try {
      const { db: tenantDb, schema: tenantSchema } = await schemaManager.getTenantDb(tenantId);
      const { customers: tenantCustomers } = tenantSchema;
      
      // Soft delete
      await tenantDb
        .update(tenantCustomers)
        .set({ 
          isActive: false,
          updatedAt: new Date()
        })
        .where(and(
          eq(tenantCustomers.id, id),
          eq(tenantCustomers.tenantId, tenantId)
        ));

      return true;
    } catch (error) {
      logError('Error deleting customer', error, { customerId: id, tenantId });
      return false;
    }
  }

  async countByTenant(tenantId: string): Promise<number> {
    try {
      const { db: tenantDb, schema: tenantSchema } = await schemaManager.getTenantDb(tenantId);
      const { customers: tenantCustomers } = tenantSchema;
      
      const [result] = await tenantDb
        .select({ count: count() })
        .from(tenantCustomers)
        .where(and(
          eq(tenantCustomers.tenantId, tenantId),
          eq(tenantCustomers.isActive, true)
        ));

      return result.count || 0;
    } catch (error) {
      logError('Error counting customers', error, { tenantId });
      return 0;
    }
  }

  private mapToEntity(data: any, tenantId: string): Customer {
    return new Customer(
      data.id,
      tenantId,
      data.email,
      data.firstName || data.first_name,
      data.lastName || data.last_name,
      data.phone,
      data.mobilePhone || data.mobile_phone,
      data.customerType || data.customer_type || "PF",
      data.cpf,
      data.cnpj,
      data.companyName || data.company_name,
      data.contactPerson || data.contact_person,
      data.state,
      data.address,
      data.addressNumber || data.address_number,
      data.complement,
      data.neighborhood,
      data.city,
      data.zipCode || data.zip_code,
      data.isActive ?? data.is_active ?? true,
      data.createdAt || data.created_at || new Date(),
      data.updatedAt || data.updated_at || new Date()
    );
  }
}
