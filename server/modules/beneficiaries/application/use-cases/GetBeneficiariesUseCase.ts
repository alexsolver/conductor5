/**
 * GetBeneficiariesUseCase - Clean Architecture Application Layer
 * Resolves violations: Missing Use Cases to handle business logic
 */

import { Beneficiary } from '../../domain/entities/Beneficiary';

interface BeneficiaryRepositoryInterface {
  findByTenant(tenantId: string, filters?: any): Promise<Beneficiary[]>;
}

export interface GetBeneficiariesRequest {
  tenantId: string;
  search?: string;
  customerId?: string;
  active?: boolean;
}

export interface GetBeneficiariesResponse {
  beneficiaries: Array<{
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    customerId: string;
    relationshipType: string;
    isActive: boolean;
  }>;
  total: number;
}

export class GetBeneficiariesUseCase {
  constructor(
    private readonly beneficiaryRepository: BeneficiaryRepositoryInterface
  ) {}

  async execute(request: GetBeneficiariesRequest): Promise<GetBeneficiariesResponse> {
    const beneficiaries = await this.beneficiaryRepository.findByTenant(
      request.tenantId,
      {
        search: request.search,
        customerId: request.customerId,
        active: request.active
      }
    );

    return {
      beneficiaries: beneficiaries.map((b: Beneficiary) => ({
        id: b.getId(),
        firstName: b.getFirstName(),
        lastName: b.getLastName(),
        email: b.getEmail(),
        phone: b.getPhone(),
        customerId: b.getCustomerId(),
        relationshipType: b.getRelationshipType(),
        isActive: b.isActive()
      })),
      total: beneficiaries.length
    };
  }
}