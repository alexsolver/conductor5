
/**
 * APPLICATION USE CASE - GET BENEFICIARIES
 * Clean Architecture: Application layer use case
 */

import { Beneficiary } from '../../domain/entities/Beneficiary';
import { IBeneficiaryRepository } from '../../domain/repositories/IBeneficiaryRepository';
import { GetBeneficiariesDTO, BeneficiaryResponseDTO } from '../dto/CreateBeneficiaryDTO';

export interface GetBeneficiariesResponse {
  beneficiaries: BeneficiaryResponseDTO[];
  pagination: {
    total: number;
    totalPages: number;
    currentPage: number;
    itemsPerPage: number;
  };
}

export class GetBeneficiariesUseCase {
  constructor(
    private readonly beneficiaryRepository: IBeneficiaryRepository
  ) {}

  async execute(request: GetBeneficiariesDTO): Promise<GetBeneficiariesResponse> {
    if (!request.tenantId?.trim()) {
      throw new Error('Tenant ID é obrigatório');
    }

    const page = request.page || 1;
    const limit = Math.min(request.limit || 10, 100); // Max 100 items per page

    const filters = {
      search: request.search,
      customerId: request.customerId,
      isActive: request.isActive,
      page,
      limit
    };

    const result = await this.beneficiaryRepository.findByTenant(
      request.tenantId,
      filters
    );

    return {
      beneficiaries: result.beneficiaries.map(this.mapToResponseDTO),
      pagination: {
        total: result.total,
        totalPages: result.totalPages,
        currentPage: page,
        itemsPerPage: limit
      }
    };
  }

  private mapToResponseDTO(beneficiary: Beneficiary): BeneficiaryResponseDTO {
    return {
      id: beneficiary.id,
      tenantId: beneficiary.tenantId,
      firstName: beneficiary.firstName,
      lastName: beneficiary.lastName,
      fullName: beneficiary.fullName,
      email: beneficiary.email,
      birthDate: beneficiary.birthDate,
      rg: beneficiary.rg,
      cpfCnpj: beneficiary.cpfCnpj,
      isActive: beneficiary.isActive,
      customerCode: beneficiary.customerCode,
      customerId: beneficiary.customerId,
      phone: beneficiary.phone,
      cellPhone: beneficiary.cellPhone,
      contactPerson: beneficiary.contactPerson,
      contactPhone: beneficiary.contactPhone,
      createdAt: beneficiary.createdAt.toISOString(),
      updatedAt: beneficiary.updatedAt.toISOString()
    };
  }
}
