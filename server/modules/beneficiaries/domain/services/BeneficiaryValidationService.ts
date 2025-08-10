
export class BeneficiaryValidationService {
  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static validateName(name: string): boolean {
    return name && name.trim().length >= 2;
  }

  static validateCustomerId(customerId: string): boolean {
    // UUID validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(customerId);
  }

  static validateBeneficiary(beneficiary: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.validateName(beneficiary.name)) {
      errors.push('Nome deve ter pelo menos 2 caracteres');
    }

    if (!this.validateEmail(beneficiary.email)) {
      errors.push('Email deve ter formato válido');
    }

    if (!this.validateCustomerId(beneficiary.customerId)) {
      errors.push('Customer ID deve ser um UUID válido');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
