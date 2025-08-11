/**
 * Beneficiary Domain Service
 * Clean Architecture - Domain Layer
 * Contains business logic that doesn't belong to any specific entity
 */

import { CreateBeneficiaryDTO } from '../../application/dto/CreateBeneficiaryDTO';

export class BeneficiaryDomainService {
  async validateBeneficiaryData(data: CreateBeneficiaryDTO): Promise<void> {
    // Business rule validations
    if (!data.name || data.name.trim().length < 2) {
      throw new Error('Beneficiary name must be at least 2 characters long');
    }

    if (data.email && !this.isValidEmail(data.email)) {
      throw new Error('Invalid email format');
    }

    if (data.document && !this.isValidDocument(data.document)) {
      throw new Error('Invalid document format');
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private isValidDocument(document: string): boolean {
    // Simple validation for now - can be enhanced with CPF/CNPJ validation
    return document.replace(/\D/g, '').length >= 11;
  }
}