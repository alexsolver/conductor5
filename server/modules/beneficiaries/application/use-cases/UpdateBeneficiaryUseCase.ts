
import { BeneficiaryUpdatedEvent } from '../../domain/events/BeneficiaryUpdatedEvent';
import { IBeneficiaryRepository } from '../../domain/repositories/IBeneficiaryRepository';
import { BeneficiaryDomainService } from '../../domain/services/BeneficiaryDomainService';

export interface UpdateBeneficiaryRequest {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  updatedBy: string;
  tenantId: string;
}

export class UpdateBeneficiaryUseCase {
  constructor(
    private beneficiaryRepository: IBeneficiaryRepository,
    private domainService: BeneficiaryDomainService
  ) {}

  async execute(request: UpdateBeneficiaryRequest): Promise<void> {
    const beneficiary = await this.beneficiaryRepository.findById(request.id);
    
    if (!beneficiary) {
      throw new Error('Beneficiary not found');
    }

    const updatedBeneficiary = { ...beneficiary, ...request };
    await this.beneficiaryRepository.update(updatedBeneficiary);

    const event: BeneficiaryUpdatedEvent = {
      id: crypto.randomUUID(),
      beneficiaryId: request.id,
      changes: request,
      updatedBy: request.updatedBy,
      updatedAt: new Date(),
      tenantId: request.tenantId
    };

    // Publish event logic would go here
  }
}
import { IBeneficiaryRepository } from '../../domain/repositories/IBeneficiaryRepository';
import { Beneficiary } from '../../domain/entities/Beneficiary';

export class UpdateBeneficiaryUseCase {
  constructor(
    private readonly beneficiaryRepository: IBeneficiaryRepository
  ) {}

  async execute(id: string, data: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    document?: string;
    address?: string;
    beneficiaryType?: 'individual' | 'corporate';
    isActive?: boolean;
  }): Promise<Beneficiary | null> {
    const existingBeneficiary = await this.beneficiaryRepository.findById(id);
    if (!existingBeneficiary) {
      return null;
    }

    const updatedBeneficiary = existingBeneficiary.update(data);
    return await this.beneficiaryRepository.update(id, updatedBeneficiary);
  }
}
