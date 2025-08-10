
export class ValidationDomainService {
  static validateTenantData(data: any): void {
    if (!data.tenantId) {
      throw new Error('Tenant ID is required');
    }

    if (!this.isValidUUID(data.tenantId)) {
      throw new Error('Invalid tenant ID format');
    }
  }

  static validatePremiumAccount(data: any): void {
    if (data.type === 'premium' && !data.paymentMethod) {
      throw new Error('Premium accounts require payment method');
    }
  }

  static validateEntityData(data: any): void {
    if (!data.id) {
      throw new Error('Entity ID is required');
    }

    if (!data.createdAt) {
      data.createdAt = new Date();
    }

    data.updatedAt = new Date();
  }

  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
  
  static validatePhoneNumber(phone: string): boolean {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  }
  
  static validateCPF(cpf: string): boolean {
    // Implementação de validação de CPF
    const cleanCPF = cpf.replace(/[^\d]/g, '');
    if (cleanCPF.length !== 11) return false;
    
    // Validação básica
    if (/^(\d)\1{10}$/.test(cleanCPF)) return false;
    
    return true; // Simplified validation
  }
  
  static validateCNPJ(cnpj: string): boolean {
    // Implementação de validação de CNPJ
    const cleanCNPJ = cnpj.replace(/[^\d]/g, '');
    return cleanCNPJ.length === 14;
  }
  
  static validateRequired(value: any, fieldName: string): void {
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      throw new Error(`${fieldName} is required`);
    }
  }

  private static isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }
}
