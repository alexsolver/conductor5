/**
 * Customer Company Repository Interface
 * Clean Architecture - Domain Layer
 * Port definition for customer company data persistence
 */

import { Company } from '../entities/Company';
import { CompanyMembership } from '../entities/CompanyMembership';

export interface CompanyFilter {
  tenantId: string;
  search?: string;
  industry?: string;
  size?: 'small' | 'medium' | 'large' | 'enterprise';
  status?: 'active' | 'inactive' | 'suspended' | 'trial';
  subscriptionTier?: 'basic' | 'premium' | 'enterprise';
  isActive?: boolean;
  limit?: number;
  offset?: number;
}

export interface CompanyMembershipFilter {
  tenantId: string;
  customerId?: string;
  companyId?: string;
  role?: 'member' | 'admin' | 'owner' | 'contact';
  isActive?: boolean;
  isPrimary?: boolean;
  department?: string;
  limit?: number;
  offset?: number;
}

export interface ICompanyRepository {
  // Customer Company Operations
  findById(id: string, tenantId: string): Promise<Company | null>;
  findByName(name: string, tenantId: string): Promise<Company | null>;
  findMany(filter: CompanyFilter): Promise<Company[]>;
  save(company: Company): Promise<Company>;
  delete(id: string, tenantId: string): Promise<boolean>;
  count(filter: Omit<CompanyFilter, 'limit' | 'offset'>): Promise<number>;

  // Customer Company Membership Operations
  findMembershipById(id: string): Promise<CompanyMembership | null>;
  findMembershipsByCustomer(customerId: string, tenantId: string): Promise<CompanyMembership[]>;
  findMembershipsByCompany(companyId: string, tenantId: string): Promise<CompanyMembership[]>;
  findMemberships(filter: CompanyMembershipFilter): Promise<CompanyMembership[]>;
  saveMembership(membership: CompanyMembership): Promise<CompanyMembership>;
  deleteMembership(customerId: string, companyId: string, tenantId: string): Promise<boolean>;
  countMemberships(filter: Omit<CompanyMembershipFilter, 'limit' | 'offset'>): Promise<number>;

  // Special queries
  findPrimaryCompanyByCustomer(customerId: string, tenantId: string): Promise<Company | null>;
  findCompaniesByCustomer(customerId: string, tenantId: string): Promise<Company[]>;
  findCustomersByCompany(companyId: string, tenantId: string): Promise<{ customerId: string; role: string; title?: string }[]>;
  
  // Business intelligence
  getCompanyStats(companyId: string, tenantId: string): Promise<{
    totalCustomers: number;
    activeCustomers: number;
    totalTickets?: number;
    openTickets?: number;
  }>;
}