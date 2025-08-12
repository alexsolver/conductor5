/**
 * APPLICATION LAYER - COMPANY DTOs
 * Seguindo Clean Architecture - 1qa.md compliance
 */

import { CompanySize, CompanyStatus, SubscriptionTier } from '../../domain/entities/Company';

// Create Company DTO
export interface CreateCompanyDTO {
  // Required fields
  name: string;
  cnpj: string;
  status: CompanyStatus;

  // Optional business information
  displayName?: string;
  description?: string;
  industry?: string;
  size?: CompanySize;
  subscriptionTier?: SubscriptionTier;

  // Optional contact information
  email?: string;
  phone?: string;
  website?: string;

  // Optional address information
  address?: string;
  addressNumber?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zipCode?: string;

  // System fields (populated automatically)
  tenantId?: string;
  createdById?: string;
  isActive?: boolean;
}

// Update Company DTO
export interface UpdateCompanyDTO {
  // Business information
  name?: string;
  displayName?: string;
  description?: string;
  industry?: string;
  size?: CompanySize;
  status?: CompanyStatus;
  subscriptionTier?: SubscriptionTier;

  // Contact information
  email?: string;
  phone?: string;
  website?: string;

  // Address information
  address?: string;
  addressNumber?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zipCode?: string;

  // System fields
  isActive?: boolean;
  updatedById?: string;
}

// Company Response DTO
export interface CompanyResponseDTO {
  id: string;
  tenantId: string;

  // Business information
  name: string;
  displayName: string;
  description?: string;
  cnpj: string;
  formattedCNPJ: string;
  industry?: string;
  size?: CompanySize;
  status: CompanyStatus;
  subscriptionTier?: SubscriptionTier;

  // Contact information
  email?: string;
  phone?: string;
  formattedPhone?: string;
  website?: string;

  // Address information
  address?: string;
  addressNumber?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  formattedZipCode?: string;
  fullAddress?: string;

  // System information
  isActive: boolean;
  createdAt: string;
  updatedAt: string;

  // Computed fields
  companyCode?: string;
  customerCount?: number;
  ticketCount?: number;
}

// Company List Response DTO
export interface CompanyListResponseDTO {
  success: boolean;
  message?: string;
  data: CompanyResponseDTO[];
  pagination: {
    page: number;
    totalPages: number;
    total: number;
    limit: number;
  };
}

// Company Search DTO
export interface CompanySearchDTO {
  searchTerm: string;
  filters?: {
    status?: CompanyStatus[];
    size?: CompanySize[];
    subscriptionTier?: SubscriptionTier[];
    industry?: string;
    state?: string;
    city?: string;
  };
  pagination?: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  };
}

// Company Filters DTO
export interface CompanyFiltersDTO {
  name?: string;
  cnpj?: string;
  industry?: string;
  size?: CompanySize[];
  status?: CompanyStatus[];
  subscriptionTier?: SubscriptionTier[];
  state?: string;
  city?: string;
  isActive?: boolean;
  dateFrom?: string; // ISO date string
  dateTo?: string;   // ISO date string
  search?: string;
}

// Company Statistics DTO
export interface CompanyStatsDTO {
  total: number;
  active: number;
  inactive: number;
  suspended: number;
  pending: number;
  
  bySize: {
    micro: number;
    small: number;
    medium: number;
    large: number;
    enterprise: number;
  };
  
  bySubscription: {
    free: number;
    basic: number;
    premium: number;
    enterprise: number;
  };
  
  byState: Array<{
    state: string;
    count: number;
  }>;
  
  byIndustry: Array<{
    industry: string;
    count: number;
  }>;
  
  recentCompanies: number;
  growthRate: number; // Percentage growth last 30 days
  
  // Engagement metrics
  averageCustomersPerCompany: number;
  averageTicketsPerCompany: number;
}

// Bulk Company Operations DTO
export interface BulkUpdateCompaniesDTO {
  companyIds: string[];
  updates: {
    status?: CompanyStatus;
    subscriptionTier?: SubscriptionTier;
    industry?: string;
    isActive?: boolean;
  };
}

// Company Association DTO
export interface CompanyAssociationDTO {
  companyId: string;
  customerIds: string[];
  associationType: 'customer' | 'supplier' | 'partner';
  role?: string;
  isPrimary?: boolean;
  metadata?: Record<string, any>;
}

// Company Validation DTO
export interface CompanyValidationDTO {
  cnpj?: string;
  email?: string;
  name?: string;
  excludeId?: string; // For update validation
}

// Company Profile DTO (Extended information)
export interface CompanyProfileDTO extends CompanyResponseDTO {
  // Relationship data
  customers: Array<{
    id: string;
    name: string;
    email: string;
    associatedAt: string;
  }>;
  
  tickets: Array<{
    id: string;
    title: string;
    status: string;
    createdAt: string;
  }>;
  
  // Activity summary
  activity: {
    lastTicket: string | null;
    lastCustomerAddition: string | null;
    totalInteractions: number;
  };
  
  // Business metrics
  metrics: {
    monthlyTickets: number;
    averageResolutionTime: number;
    customerSatisfaction: number;
  };
}

// Company Export DTO
export interface CompanyExportDTO {
  format: 'csv' | 'xlsx' | 'json';
  filters?: CompanyFiltersDTO;
  fields: Array<keyof CompanyResponseDTO>;
  includeRelatedData?: boolean;
}