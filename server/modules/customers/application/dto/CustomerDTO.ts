/**
 * APPLICATION LAYER - CUSTOMER DTOs
 * Seguindo Clean Architecture - 1qa.md compliance
 */

export interface CreateCustomerDTO {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  mobilePhone?: string;
  cpf?: string;
  
  // Address information
  state?: string;
  address?: string;
  addressNumber?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  zipCode?: string;
  
  // Audit fields (set by system)
  tenantId?: string;
  createdById?: string;
}

export interface UpdateCustomerDTO {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  mobilePhone?: string;
  cpf?: string;
  
  // Address information
  state?: string;
  address?: string;
  addressNumber?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  zipCode?: string;
  
  // System fields
  isActive?: boolean;
  updatedById?: string;
}

export interface CustomerFiltersDTO {
  isActive?: boolean;
  state?: string;
  city?: string;
  search?: string;
  dateFrom?: string; // ISO date string
  dateTo?: string;   // ISO date string
}

export interface CustomerResponseDTO {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  displayName: string;
  email: string;
  phone?: string;
  mobilePhone?: string;
  cpf?: string;
  
  // Address information
  state?: string;
  address?: string;
  addressNumber?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  zipCode?: string;
  
  // Formatted fields for display
  formattedPhone?: string;
  formattedMobilePhone?: string;
  formattedCPF?: string;
  
  // System fields
  isActive: boolean;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

export interface CustomerListResponseDTO {
  success: boolean;
  message: string;
  data: CustomerResponseDTO[];
  pagination: {
    page: number;
    totalPages: number;
    total: number;
    limit: number;
  };
}

export interface CustomerStatsDTO {
  total: number;
  active: number;
  inactive: number;
  byState: Record<string, number>;
  recentCustomers: number;
  topStates: Array<{
    state: string;
    count: number;
  }>;
  topCities: Array<{
    city: string;
    state?: string;
    count: number;
  }>;
}

export interface CustomerSearchDTO {
  q: string; // Search query
  state?: string;
  city?: string;
  page?: number;
  limit?: number;
}

export interface CustomerSearchResponseDTO {
  success: boolean;
  message: string;
  data: CustomerResponseDTO[];
  pagination: {
    page: number;
    totalPages: number;
    total: number;
    limit: number;
  };
  searchTerm: string;
}

export interface CustomerValidationDTO {
  field: 'email' | 'cpf';
  value: string;
  tenantId: string;
  excludeId?: string;
}

export interface CustomerValidationResponseDTO {
  success: boolean;
  available: boolean;
  message: string;
}

export interface BulkUpdateCustomersDTO {
  customerIds: string[];
  updates: {
    isActive?: boolean;
    state?: string;
    city?: string;
  };
}

export interface CustomerLocationStatsDTO {
  success: boolean;
  data: {
    byState: Array<{
      state: string;
      count: number;
      percentage: number;
    }>;
    byCity: Array<{
      city: string;
      state: string;
      count: number;
      percentage: number;
    }>;
    topRegions: Array<{
      region: string;
      states: string[];
      count: number;
    }>;
  };
}

export interface CustomerErrorDTO {
  success: false;
  message: string;
  error: string;
  code?: string;
  field?: string; // For validation errors
}