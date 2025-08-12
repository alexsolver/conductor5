/**
 * APPLICATION LAYER - CREATE CUSTOMER USE CASE
 * Seguindo Clean Architecture - 1qa.md compliance
 */

import { Customer, CustomerDomainService } from '../../domain/entities/Customer';
import { ICustomerRepository } from '../../domain/repositories/ICustomerRepository';
import { CreateCustomerDTO } from '../dto/CustomerDTO';

export class CreateCustomerUseCase {
  constructor(
    private customerRepository: ICustomerRepository,
    private customerDomainService: CustomerDomainService
  ) {}

  async execute(dto: CreateCustomerDTO): Promise<Customer> {
    // Validate input data
    if (!dto.tenantId) {
      throw new Error('Tenant ID is required');
    }

    // Normalize data
    const normalizedData = this.normalizeCustomerData(dto);

    // Domain validation
    this.customerDomainService.validateCompleteCustomer(normalizedData);

    // Check for duplicates
    await this.validateUniqueness(normalizedData);

    // Create customer entity
    const customerData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'> = {
      tenantId: normalizedData.tenantId!,
      firstName: normalizedData.firstName,
      lastName: normalizedData.lastName,
      email: normalizedData.email.toLowerCase(),
      phone: this.customerDomainService.formatPhone(normalizedData.phone),
      mobilePhone: this.customerDomainService.formatPhone(normalizedData.mobilePhone),
      customerType: normalizedData.customerType,
      cpf: normalizedData.cpf ? normalizedData.cpf.replace(/\D/g, '') : undefined,
      cnpj: normalizedData.cnpj ? normalizedData.cnpj.replace(/\D/g, '') : undefined,
      companyName: normalizedData.companyName,
      contactPerson: normalizedData.contactPerson,
      state: normalizedData.state,
      address: normalizedData.address,
      addressNumber: normalizedData.addressNumber,
      complement: normalizedData.complement,
      neighborhood: normalizedData.neighborhood,
      city: normalizedData.city,
      zipCode: normalizedData.zipCode,
      isActive: true
    };

    // Create in repository
    const createdCustomer = await this.customerRepository.create(customerData);

    return createdCustomer;
  }

  private normalizeCustomerData(dto: CreateCustomerDTO): CreateCustomerDTO {
    return {
      ...dto,
      firstName: dto.firstName.trim(),
      lastName: dto.lastName.trim(),
      email: dto.email.trim().toLowerCase(),
      phone: dto.phone?.trim(),
      mobilePhone: dto.mobilePhone?.trim(),
      cpf: dto.cpf?.replace(/\D/g, ''), // Remove formatting
      cnpj: dto.cnpj?.replace(/\D/g, ''), // Remove formatting
      companyName: dto.companyName?.trim(),
      contactPerson: dto.contactPerson?.trim(),
      state: dto.state?.trim().toUpperCase(), // State codes in uppercase
      address: dto.address?.trim(),
      addressNumber: dto.addressNumber?.trim(),
      complement: dto.complement?.trim(),
      neighborhood: dto.neighborhood?.trim(),
      city: dto.city?.trim(),
      zipCode: dto.zipCode?.replace(/\D/g, '') // Remove formatting
    };
  }

  private async validateUniqueness(dto: CreateCustomerDTO): Promise<void> {
    if (!dto.tenantId) {
      throw new Error('Tenant ID is required for uniqueness validation');
    }

    // Check email uniqueness within tenant
    const emailExists = await this.customerRepository.emailExists(dto.email, dto.tenantId);
    if (emailExists) {
      throw new Error('Email already exists for this tenant');
    }

    // Check CPF uniqueness within tenant (for PF customers)
    if (dto.customerType === 'PF' && dto.cpf) {
      const cpfExists = await this.customerRepository.cpfExists(dto.cpf, dto.tenantId);
      if (cpfExists) {
        throw new Error('CPF already exists for this tenant');
      }
    }

    // Check CNPJ uniqueness within tenant (for PJ customers)
    if (dto.customerType === 'PJ' && dto.cnpj) {
      const cnpjExists = await this.customerRepository.cnpjExists(dto.cnpj, dto.tenantId);
      if (cnpjExists) {
        throw new Error('CNPJ already exists for this tenant');
      }
    }
  }
}