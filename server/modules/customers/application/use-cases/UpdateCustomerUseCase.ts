/**
 * APPLICATION LAYER - UPDATE CUSTOMER USE CASE
 * Seguindo Clean Architecture - 1qa.md compliance
 */

import { Customer, CustomerDomainService } from '../../domain/entities/Customer';
import { ICustomerRepository } from '../../domain/repositories/ICustomerRepository';
import { UpdateCustomerDTO } from '../dto/CustomerDTO';

export class UpdateCustomerUseCase {
  constructor(
    private customerRepository: ICustomerRepository,
    private customerDomainService: CustomerDomainService
  ) {}

  async execute(customerId: string, dto: UpdateCustomerDTO): Promise<Customer> {
    // Find existing customer
    const existingCustomer = await this.customerRepository.findById(customerId);
    if (!existingCustomer) {
      throw new Error('Customer not found');
    }

    if (!existingCustomer.isActive) {
      throw new Error('Cannot update inactive customer');
    }

    // Normalize update data
    const normalizedData = this.normalizeUpdateData(dto);

    // Create updated customer for validation
    const updatedCustomerData = {
      ...existingCustomer,
      ...normalizedData
    };

    // Domain validation (only validate what's being updated)
    if (this.hasSignificantChanges(normalizedData)) {
      this.customerDomainService.validateCompleteCustomer(updatedCustomerData);
    } else {
      // Basic validation for minor updates
      this.customerDomainService.validateCustomerData(updatedCustomerData);
    }

    // Check for duplicates if email, CPF, or CNPJ changed
    await this.validateUniqueness(normalizedData, existingCustomer);

    // Apply business rules for customer type changes
    this.validateCustomerTypeChange(existingCustomer, normalizedData);

    // Prepare update data with proper formatting
    const updateData: Partial<Customer> = {
      ...normalizedData
    };

    // Format specific fields
    if (updateData.phone) {
      updateData.phone = this.customerDomainService.formatPhone(updateData.phone);
    }
    if (updateData.mobilePhone) {
      updateData.mobilePhone = this.customerDomainService.formatPhone(updateData.mobilePhone);
    }
    if (updateData.cpf) {
      updateData.cpf = updateData.cpf.replace(/\D/g, '');
    }
    if (updateData.cnpj) {
      updateData.cnpj = updateData.cnpj.replace(/\D/g, '');
    }
    if (updateData.state) {
      updateData.state = updateData.state.toUpperCase();
    }
    if (updateData.zipCode) {
      updateData.zipCode = updateData.zipCode.replace(/\D/g, '');
    }

    // Update in repository
    const updatedCustomer = await this.customerRepository.update(customerId, updateData);

    return updatedCustomer;
  }

  private normalizeUpdateData(dto: UpdateCustomerDTO): UpdateCustomerDTO {
    const normalized: UpdateCustomerDTO = {};

    // Only normalize fields that are being updated
    if (dto.firstName !== undefined) normalized.firstName = dto.firstName.trim();
    if (dto.lastName !== undefined) normalized.lastName = dto.lastName.trim();
    if (dto.email !== undefined) normalized.email = dto.email.trim().toLowerCase();
    if (dto.phone !== undefined) normalized.phone = dto.phone?.trim();
    if (dto.mobilePhone !== undefined) normalized.mobilePhone = dto.mobilePhone?.trim();
    if (dto.cpf !== undefined) normalized.cpf = dto.cpf?.replace(/\D/g, '');
    if (dto.cnpj !== undefined) normalized.cnpj = dto.cnpj?.replace(/\D/g, '');
    if (dto.companyName !== undefined) normalized.companyName = dto.companyName?.trim();
    if (dto.contactPerson !== undefined) normalized.contactPerson = dto.contactPerson?.trim();
    if (dto.state !== undefined) normalized.state = dto.state?.trim().toUpperCase();
    if (dto.address !== undefined) normalized.address = dto.address?.trim();
    if (dto.addressNumber !== undefined) normalized.addressNumber = dto.addressNumber?.trim();
    if (dto.complement !== undefined) normalized.complement = dto.complement?.trim();
    if (dto.neighborhood !== undefined) normalized.neighborhood = dto.neighborhood?.trim();
    if (dto.city !== undefined) normalized.city = dto.city?.trim();
    if (dto.zipCode !== undefined) normalized.zipCode = dto.zipCode?.replace(/\D/g, '');
    if (dto.customerType !== undefined) normalized.customerType = dto.customerType;
    if (dto.isActive !== undefined) normalized.isActive = dto.isActive;
    if (dto.updatedById !== undefined) normalized.updatedById = dto.updatedById;

    return normalized;
  }

  private hasSignificantChanges(dto: UpdateCustomerDTO): boolean {
    // Check if changes that require full validation are being made
    return !!(
      dto.firstName ||
      dto.lastName ||
      dto.email ||
      dto.customerType ||
      dto.cpf ||
      dto.cnpj ||
      dto.companyName
    );
  }

  private async validateUniqueness(dto: UpdateCustomerDTO, existingCustomer: Customer): Promise<void> {
    // Check email uniqueness if email is being changed
    if (dto.email && dto.email !== existingCustomer.email) {
      const emailExists = await this.customerRepository.emailExists(
        dto.email, 
        existingCustomer.tenantId, 
        existingCustomer.id
      );
      if (emailExists) {
        throw new Error('Email already exists for this tenant');
      }
    }

    // Check CPF uniqueness if CPF is being changed
    if (dto.cpf && dto.cpf !== existingCustomer.cpf) {
      const cpfExists = await this.customerRepository.cpfExists(
        dto.cpf, 
        existingCustomer.tenantId, 
        existingCustomer.id
      );
      if (cpfExists) {
        throw new Error('CPF already exists for this tenant');
      }
    }

    // Check CNPJ uniqueness if CNPJ is being changed
    if (dto.cnpj && dto.cnpj !== existingCustomer.cnpj) {
      const cnpjExists = await this.customerRepository.cnpjExists(
        dto.cnpj, 
        existingCustomer.tenantId, 
        existingCustomer.id
      );
      if (cnpjExists) {
        throw new Error('CNPJ already exists for this tenant');
      }
    }
  }

  private validateCustomerTypeChange(existingCustomer: Customer, dto: UpdateCustomerDTO): void {
    // If customer type is changing, validate the transition
    if (dto.customerType && dto.customerType !== existingCustomer.customerType) {
      if (dto.customerType === 'PF') {
        // Changing to individual - ensure PF fields are provided
        if (!dto.cpf && !existingCustomer.cpf) {
          throw new Error('CPF is required when changing to individual customer (PF)');
        }
        // Clear PJ fields when changing to PF
        dto.cnpj = undefined;
        dto.companyName = undefined;
      } else if (dto.customerType === 'PJ') {
        // Changing to company - ensure PJ fields are provided
        if (!dto.cnpj && !existingCustomer.cnpj) {
          throw new Error('CNPJ is required when changing to company customer (PJ)');
        }
        if (!dto.companyName && !existingCustomer.companyName) {
          throw new Error('Company name is required when changing to company customer (PJ)');
        }
        // Clear PF fields when changing to PJ
        dto.cpf = undefined;
      }
    }
  }
}