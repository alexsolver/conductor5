
import { CreateBeneficiaryDTO } from '../../application/dto/CreateBeneficiaryDTO';

export class BeneficiaryDomainService {
  async validateBeneficiaryData(data: CreateBeneficiaryDTO): Promise<void> {
    if (!data.firstName || data.firstName.trim().length === 0) {
      throw new Error('First name is required');
    }

    if (!data.lastName || data.lastName.trim().length === 0) {
      throw new Error('Last name is required');
    }

    if (!data.email || !this.isValidEmail(data.email)) {
      throw new Error('Valid email is required');
    }

    if (!data.tenantId) {
      throw new Error('Tenant ID is required');
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
