
import { IBeneficiaryRepository } from '../../domain/repositories/IBeneficiaryRepository';
import { Beneficiary } from '../../domain/entities/Beneficiary';

export interface GetBeneficiariesRequest {
  tenantId: string;
  page?: number;
  limit?: number;
  search?: string;
}

export interface GetBeneficiariesResponse {
  beneficiaries: Beneficiary[];
  total: number;
  page: number;
  limit: number;
}

export class GetBeneficiariesUseCase {
  constructor(
    private beneficiaryRepository: IBeneficiaryRepository
  ) {}

  async execute(request: GetBeneficiariesRequest): Promise<GetBeneficiariesResponse> {
    const { tenantId, page = 1, limit = 20, search } = request;
    
    const beneficiaries = await this.beneficiaryRepository.findByTenant(tenantId, {
      page,
      limit,
      search
    });

    const total = await this.beneficiaryRepository.countByTenant(tenantId, search);

    return {
      beneficiaries,
      total,
      page,
      limit
    };
  }
}
