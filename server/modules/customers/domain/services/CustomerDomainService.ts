
import { Customer } from '../entities/Customer';

export class CustomerDomainService {
  validateCustomerData(name: string, email?: string): boolean {
    if (!name || name.trim().length < 2) {
      return false;
    }

    if (email && !this.isValidEmail(email)) {
      return false;
    }

    return true;
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  generateCustomerCode(name: string): string {
    const cleanName = name.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    const timestamp = Date.now().toString().slice(-6);
    return `${cleanName.slice(0, 4)}${timestamp}`;
  }

  isValidDocumentNumber(document: string, type: 'cpf' | 'cnpj'): boolean {
    // Implementação simplificada - em produção usar biblioteca específica
    if (type === 'cpf') {
      return document.replace(/\D/g, '').length === 11;
    } else {
      return document.replace(/\D/g, '').length === 14;
    }
  }
}
