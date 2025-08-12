/**
 * DOMAIN LAYER - CUSTOMER REPOSITORY INTERFACE
 * Seguindo Clean Architecture - 1qa.md compliance
 */

import { Customer } from '../entities/Customer';

export interface CustomerFilters {
  customerType?: ('PF' | 'PJ')[];
  isActive?: boolean;
  state?: string;
  city?: string;
  search?: string; // Search in name, email, company name
  dateFrom?: Date;
  dateTo?: Date;
}

export interface PaginationOptions {
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export interface CustomerListResult {
  customers: Customer[];
  total: number;
  page: number;
  totalPages: number;
}

export interface ICustomerRepository {
  /**
   * Find customer by ID
   */
  findById(id: string): Promise<Customer | null>;

  /**
   * Find customer by ID within tenant scope
   */
  findByIdAndTenant(id: string, tenantId: string): Promise<Customer | null>;

  /**
   * Find customer by email
   */
  findByEmail(email: string): Promise<Customer | null>;

  /**
   * Find customer by email within tenant scope
   */
  findByEmailAndTenant(email: string, tenantId: string): Promise<Customer | null>;

  /**
   * Find customer by CPF within tenant scope
   */
  findByCPFAndTenant(cpf: string, tenantId: string): Promise<Customer | null>;

  /**
   * Find customer by CNPJ within tenant scope
   */
  findByCNPJAndTenant(cnpj: string, tenantId: string): Promise<Customer | null>;

  /**
   * Create new customer
   */
  create(customerData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>): Promise<Customer>;

  /**
   * Update customer by ID
   */
  update(id: string, updates: Partial<Customer>): Promise<Customer>;

  /**
   * Soft delete customer
   */
  delete(id: string): Promise<void>;

  /**
   * Find customers with filters and pagination
   */
  findWithFilters(
    filters: CustomerFilters, 
    pagination: PaginationOptions, 
    tenantId?: string
  ): Promise<CustomerListResult>;

  /**
   * Find all customers for tenant
   */
  findByTenant(tenantId: string): Promise<Customer[]>;

  /**
   * Find customers by type within tenant
   */
  findByTypeAndTenant(customerType: 'PF' | 'PJ', tenantId: string): Promise<Customer[]>;

  /**
   * Find customers by location (state/city) within tenant
   */
  findByLocationAndTenant(state?: string, city?: string, tenantId?: string): Promise<Customer[]>;

  /**
   * Count customers with filters
   */
  countByFilters(filters: CustomerFilters, tenantId?: string): Promise<number>;

  /**
   * Get customer statistics
   */
  getStatistics(tenantId?: string): Promise<{
    total: number;
    active: number;
    inactive: number;
    byType: Record<'PF' | 'PJ', number>;
    byState: Record<string, number>;
    recentCustomers: number; // Last 30 days
  }>;

  /**
   * Search customers by text
   */
  searchCustomers(
    searchTerm: string, 
    tenantId?: string, 
    pagination?: PaginationOptions
  ): Promise<CustomerListResult>;

  /**
   * Check if email exists (for uniqueness validation)
   */
  emailExists(email: string, tenantId: string, excludeId?: string): Promise<boolean>;

  /**
   * Check if CPF exists (for uniqueness validation)
   */
  cpfExists(cpf: string, tenantId: string, excludeId?: string): Promise<boolean>;

  /**
   * Check if CNPJ exists (for uniqueness validation)
   */
  cnpjExists(cnpj: string, tenantId: string, excludeId?: string): Promise<boolean>;

  /**
   * Bulk update customers
   */
  bulkUpdate(ids: string[], updates: Partial<Customer>): Promise<Customer[]>;

  /**
   * Find customers by company name (for PJ type)
   */
  findByCompanyName(companyName: string, tenantId: string): Promise<Customer[]>;

  /**
   * Get customers for specific activities (notifications, etc)
   */
  findCustomersForNotification(tenantId: string): Promise<Customer[]>;

  /**
   * Find recent customers
   */
  findRecentCustomers(tenantId: string, days: number): Promise<Customer[]>;
}