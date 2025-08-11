// Repository Interface - Domain Layer
import { Customer } from "../entities/Customer";

export interface ICustomerRepository {
  // Core CRUD operations
  findById(id: string, tenantId: string): Promise<Customer | null>;
  findByEmail(email: string, tenantId: string): Promise<Customer | null>;
  findAll(tenantId: string, options?: {
    limit?: number;
    offset?: number;
    verified?: boolean;
    active?: boolean;
    company?: string;
    tags?: string[];
  }): Promise<Customer[]>;
  
  save(customer: Customer): Promise<Customer>;
  update(id: string, tenantId: string, customer: Customer): Promise<Customer>;
  delete(id: string, tenantId: string): Promise<boolean>;
  
  // Business queries
  findByCompany(company: string, tenantId: string): Promise<Customer[]>;
  findByTag(tag: string, tenantId: string): Promise<Customer[]>;
  findSuspended(tenantId: string): Promise<Customer[]>;
  findUnverified(tenantId: string): Promise<Customer[]>;
  
  // Statistics
  countTotal(tenantId: string): Promise<number>;
  countActive(tenantId: string): Promise<number>;
  countByCompany(tenantId: string): Promise<Record<string, number>>;
  
  // Bulk operations
  bulkCreate(customers: Customer[]): Promise<Customer[]>;
  bulkUpdate(customers: Customer[]): Promise<Customer[]>;
}