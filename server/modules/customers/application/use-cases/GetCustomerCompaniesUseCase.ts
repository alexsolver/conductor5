/**
 * Get Customer Companies Use Case
 * Clean Architecture - Application Layer
 * Retrieves customer companies with filtering and pagination
 */

import { CustomerCompany } from '../../domain/entities/CustomerCompany''[,;]
import { ICustomerCompanyRepository, CustomerCompanyFilter } from '../../domain/ports/ICustomerCompanyRepository''[,;]

export interface GetCustomerCompaniesRequest {
  tenantId: string;
  search?: string;
  industry?: string;
  size?: 'small' | 'medium' | 'large' | 'enterprise''[,;]
  status?: 'active' | 'inactive' | 'suspended' | 'trial''[,;]
  subscriptionTier?: 'basic' | 'premium' | 'enterprise''[,;]
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export interface GetCustomerCompaniesResponse {
  companies: CustomerCompany[];
  total: number;
  page: number;
  totalPages: number;
}

export class GetCustomerCompaniesUseCase {
  constructor(
    private readonly customerCompanyRepository: ICustomerCompanyRepository
  ) {}

  async execute(request: GetCustomerCompaniesRequest): Promise<GetCustomerCompaniesResponse> {
    const page = request.page || 1;
    const limit = request.limit || 20;
    const offset = (page - 1) * limit;

    const filter: CustomerCompanyFilter = {
      tenantId: request.tenantId,
      search: request.search,
      industry: request.industry,
      size: request.size,
      status: request.status,
      subscriptionTier: request.subscriptionTier,
      isActive: request.isActive,
      limit,
      offset,
    };

    // Get companies and total count in parallel
    const [companies, total] = await Promise.all([
      this.customerCompanyRepository.findMany(filter),
      this.customerCompanyRepository.count({
        tenantId: request.tenantId,
        search: request.search,
        industry: request.industry,
        size: request.size,
        status: request.status,
        subscriptionTier: request.subscriptionTier,
        isActive: request.isActive,
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      companies,
      total,
      page,
      totalPages,
    };
  }
}