/**
 * Get Customer Companies Use Case
 * Clean Architecture - Application Layer
 * Retrieves customer companies with filtering and pagination
 */

import { Company } from '../../domain/entities/Company';
import { ICompanyRepository, CompanyFilter } from '../../domain/ports/ICompanyRepository';

export interface GetCompaniesRequest {
  tenantId: string;
  search?: string;
  industry?: string;
  size?: 'small' | 'medium' | 'large' | 'enterprise';
  status?: 'active' | 'inactive' | 'suspended' | 'trial';
  subscriptionTier?: 'basic' | 'premium' | 'enterprise';
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export interface GetCompaniesResponse {
  companies: Company[];
  total: number;
  page: number;
  totalPages: number;
}

export class GetCompaniesUseCase {
  constructor(
    private readonly customerCompanyRepository: ICompanyRepository
  ) {}

  async execute(request: GetCompaniesRequest): Promise<GetCompaniesResponse> {
    const page = request.page || 1;
    const limit = request.limit || 20;
    const offset = (page - 1) * limit;

    const filter: CompanyFilter = {
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