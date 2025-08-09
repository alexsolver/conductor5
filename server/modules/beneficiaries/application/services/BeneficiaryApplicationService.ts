
import { IBeneficiaryRepository } from '../../domain/repositories/IBeneficiaryRepository';
import { CreateBeneficiaryDTO, BeneficiaryResponseDTO } from '../dto/CreateBeneficiaryDTO';
import { BeneficiaryDomainService } from '../../domain/services/BeneficiaryDomainService';

export class BeneficiaryApplicationService {
  constructor(private beneficiaryRepository: IBeneficiaryRepository) {}

  async createBeneficiary(data: CreateBeneficiaryDTO): Promise<BeneficiaryResponseDTO> {
    if (!BeneficiaryDomainService.validateBeneficiaryData(data)) {
      throw new Error('Invalid beneficiary data');
    }

    const beneficiary = await this.beneficiaryRepository.create({
      ...data,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date()
    });

    return {
      id: beneficiary.id,
      name: beneficiary.name,
      email: beneficiary.email,
      phone: beneficiary.phone,
      cpf: beneficiary.cpf,
      cnpj: beneficiary.cnpj,
      address: beneficiary.address,
      createdAt: beneficiary.createdAt,
      updatedAt: beneficiary.updatedAt
    };
  }

  async getAllBeneficiaries(tenantId: string): Promise<BeneficiaryResponseDTO[]> {
    const beneficiaries = await this.beneficiaryRepository.findByTenantId(tenantId);
    return beneficiaries.map(b => ({
      id: b.id,
      name: b.name,
      email: b.email,
      phone: b.phone,
      cpf: b.cpf,
      cnpj: b.cnpj,
      address: b.address,
      createdAt: b.createdAt,
      updatedAt: b.updatedAt
    }));
  }
}
