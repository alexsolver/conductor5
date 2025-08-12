/**
 * DOMAIN LAYER - COMPANY REPOSITORY INTERFACE
 * Seguindo Clean Architecture - 1qa.md compliance
 */

import { Company, CompanyStatus, CompanySize, SubscriptionTier } from '../entities/Company';

// Filtering and search interfaces
export interface CompanyFilters {
  name?: string;
  cnpj?: string;
  industry?: string;
  size?: CompanySize[];
  status?: CompanyStatus[];
  subscriptionTier?: SubscriptionTier[];
  state?: string;
  city?: string;
  isActive?: boolean;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string; // General text search
}

export interface PaginationOptions {
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export interface CompanyListResult {
  companies: Company[];
  total: number;
  page: number;
  totalPages: number;
}

// Main repository interface
export interface ICompanyRepository {
  // Basic CRUD operations
  findById(id: string): Promise<Company | null>;
  findByIdAndTenant(id: string, tenantId: string): Promise<Company | null>;
  create(companyData: Omit<Company, 'id' | 'createdAt' | 'updatedAt'>): Promise<Company>;
  update(id: string, updates: Partial<Company>): Promise<Company>;
  delete(id: string): Promise<void>; // Soft delete

  // Business-specific queries
  findByCNPJ(cnpj: string): Promise<Company | null>;
  findByCNPJAndTenant(cnpj: string, tenantId: string): Promise<Company | null>;
  findByName(name: string, tenantId: string): Promise<Company[]>;
  findByEmail(email: string): Promise<Company | null>;
  findByEmailAndTenant(email: string, tenantId: string): Promise<Company | null>;

  // Filtering and search
  findWithFilters(
    filters: CompanyFilters, 
    pagination: PaginationOptions, 
    tenantId?: string
  ): Promise<CompanyListResult>;
  
  searchCompanies(
    searchTerm: string, 
    tenantId?: string, 
    pagination?: PaginationOptions
  ): Promise<CompanyListResult>;

  // Tenant-specific queries
  findByTenant(tenantId: string): Promise<Company[]>;
  findByStatusAndTenant(status: CompanyStatus, tenantId: string): Promise<Company[]>;
  findBySizeAndTenant(size: CompanySize, tenantId: string): Promise<Company[]>;
  findBySubscriptionAndTenant(tier: SubscriptionTier, tenantId: string): Promise<Company[]>;
  findByLocationAndTenant(state?: string, city?: string, tenantId?: string): Promise<Company[]>;

  // Statistics and analytics
  getStatistics(tenantId?: string): Promise<{
    total: number;
    active: number;
    inactive: number;
    suspended: number;
    bySize: Record<CompanySize, number>;
    bySubscription: Record<SubscriptionTier, number>;
    byState: Record<string, number>;
    recentCompanies: number; // Last 30 days
  }>;

  countByFilters(filters: CompanyFilters, tenantId?: string): Promise<number>;

  // Uniqueness validation
  cnpjExists(cnpj: string, tenantId: string, excludeId?: string): Promise<boolean>;
  emailExists(email: string, tenantId: string, excludeId?: string): Promise<boolean>;
  nameExists(name: string, tenantId: string, excludeId?: string): Promise<boolean>;

  // Bulk operations
  bulkUpdate(ids: string[], updates: Partial<Company>): Promise<Company[]>;
  bulkChangeStatus(ids: string[], status: CompanyStatus): Promise<Company[]>;

  // Advanced queries
  findByIndustry(industry: string, tenantId: string): Promise<Company[]>;
  findCompaniesByCustomerCount(minCustomers: number, tenantId: string): Promise<Company[]>;
  findExpiredSubscriptions(tenantId: string): Promise<Company[]>;
  findCompaniesForNotification(tenantId: string): Promise<Company[]>;
  findRecentCompanies(tenantId: string, days: number): Promise<Company[]>;

  // Integration queries (for relationships with other modules)
  findCompaniesByCustomerIds(customerIds: string[], tenantId: string): Promise<Company[]>;
  getCompanyCustomerCount(companyId: string, tenantId: string): Promise<number>;
  getCompanyTicketCount(companyId: string, tenantId: string): Promise<number>;
}