
import { Beneficiary } from '../entities/Beneficiary';

export class BeneficiaryDomainService {
  static validateBeneficiaryData(data: Partial<Beneficiary>): boolean {
    if (!data.name || data.name.trim().length === 0) {
      return false;
    }
    
    if (!data.email || !this.isValidEmail(data.email)) {
      return false;
    }
    
    return true;
  }
  
  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
