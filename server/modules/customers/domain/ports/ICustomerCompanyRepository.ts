/**
 * Customer Company Repository Interface
 * Clean Architecture - Domain Layer
 * Port definition for customer company data persistence
 */

import { CustomerCompany } from '../entities/CustomerCompany'[,;]
import { CustomerCompanyMembership } from '../entities/CustomerCompanyMembership'[,;]

export interface CustomerCompanyFilter {
  tenantId: string;
  search?: string;
  industry?: string;
  size?: 'small' | 'medium' | 'large' | 'enterprise'[,;]
  status?: 'active' | 'inactive' | 'suspended' | 'trial'[,;]
  subscriptionTier?: 'basic' | 'premium' | 'enterprise'[,;]
  isActive?: boolean;
  limit?: number;
  offset?: number;
}

export interface CustomerCompanyMembershipFilter {
  tenantId: string;
  customerId?: string;
  companyId?: string;
  role?: 'member' | 'admin' | 'owner' | 'contact'[,;]
  isActive?: boolean;
  isPrimary?: boolean;
  department?: string;
  limit?: number;
  offset?: number;
}

export interface ICustomerCompanyRepository {
  // Customer Company Operations
  findById(id: string, tenantId: string): Promise<CustomerCompany | null>;
  findByName(name: string, tenantId: string): Promise<CustomerCompany | null>;
  findMany(filter: CustomerCompanyFilter): Promise<CustomerCompany[]>;
  save(company: CustomerCompany): Promise<CustomerCompany>;
  delete(id: string, tenantId: string): Promise<boolean>;
  count(filter: Omit<CustomerCompanyFilter, 'limit' | 'offset'>): Promise<number>;

  // Customer Company Membership Operations
  findMembershipById(id: string): Promise<CustomerCompanyMembership | null>;
  findMembershipsByCustomer(customerId: string, tenantId: string): Promise<CustomerCompanyMembership[]>;
  findMembershipsByCompany(companyId: string, tenantId: string): Promise<CustomerCompanyMembership[]>;
  findMemberships(filter: CustomerCompanyMembershipFilter): Promise<CustomerCompanyMembership[]>;
  saveMembership(membership: CustomerCompanyMembership): Promise<CustomerCompanyMembership>;
  deleteMembership(customerId: string, companyId: string, tenantId: string): Promise<boolean>;
  countMemberships(filter: Omit<CustomerCompanyMembershipFilter, 'limit' | 'offset'>): Promise<number>;

  // Special queries
  findPrimaryCompanyByCustomer(customerId: string, tenantId: string): Promise<CustomerCompany | null>;
  findCompaniesByCustomer(customerId: string, tenantId: string): Promise<CustomerCompany[]>;
  findCustomersByCompany(companyId: string, tenantId: string): Promise<{ customerId: string; role: string; title?: string }[]>;
  
  // Business intelligence
  getCompanyStats(companyId: string, tenantId: string): Promise<{
    totalCustomers: number;
    activeCustomers: number;
    totalTickets?: number;
    openTickets?: number;
  }>;
}