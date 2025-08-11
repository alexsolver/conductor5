import crypto from 'crypto';
import { BeneficiaryUpdatedEvent } from '../../domain/events/BeneficiaryUpdatedEvent';
import { IBeneficiaryRepository } from '../../domain/repositories/IBeneficiaryRepository';
import { BeneficiaryDomainService } from '../../domain/services/BeneficiaryDomainService';
import { Beneficiary } from '../../domain/entities/Beneficiary'; // Assuming Beneficiary entity is defined elsewhere
import { CreateBeneficiaryDTO } from '../dtos/CreateBeneficiaryDTO'; // Assuming DTO is defined elsewhere

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

  async execute(id: string, data: Partial<CreateBeneficiaryDTO>, tenantId: string): Promise<Beneficiary | null> {
    const beneficiary = await this.beneficiaryRepository.findById(id);

    if (!beneficiary) {
      return null; // Return null if beneficiary not found, consistent with return type
    }

    // Apply updates based on the provided data
    const updatedBeneficiaryData = { ...beneficiary, ...data };

    // Ensure the entity is updated correctly before saving
    const updatedBeneficiary = Beneficiary.create(updatedBeneficiaryData, beneficiary.version); // Assuming a static create method exists for entity instantiation and versioning

    await this.beneficiaryRepository.update(updatedBeneficiary);

    const event: BeneficiaryUpdatedEvent = {
      id: crypto.randomUUID(),
      beneficiaryId: id,
      changes: data, // Reflecting the actual changes made
      updatedBy: data.updatedBy || 'system', // Assuming updatedBy is in data, with a fallback
      updatedAt: new Date(),
      tenantId: tenantId
    };

    // Publish event logic would go here, potentially using an event publisher
    // For example: await this.eventPublisher.publish(event);

    return updatedBeneficiary;
  }
}