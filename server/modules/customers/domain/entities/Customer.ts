/**
 * DOMAIN LAYER - CUSTOMER ENTITY
 * Seguindo Clean Architecture - 1qa.md compliance
 */

export interface Customer {
  id: string;
  tenantId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  mobilePhone?: string;
  customerType: 'PF' | 'PJ'; // Pessoa Física ou Jurídica
  cpf?: string;
  cnpj?: string;
  companyName?: string;
  contactPerson?: string;
  
  // Address information
  state?: string;
  address?: string;
  addressNumber?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  zipCode?: string;
  
  // Audit fields
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class CustomerDomainService {
  /**
   * Validates customer basic information
   */
  validateCustomerData(customer: Partial<Customer>): boolean {
    if (!customer.firstName || customer.firstName.trim().length === 0) {
      throw new Error('First name is required');
    }

    if (!customer.lastName || customer.lastName.trim().length === 0) {
      throw new Error('Last name is required');
    }

    if (!customer.email || customer.email.trim().length === 0) {
      throw new Error('Email is required');
    }

    if (!customer.tenantId || customer.tenantId.trim().length === 0) {
      throw new Error('Tenant ID is required');
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customer.email)) {
      throw new Error('Invalid email format');
    }

    // Validate customer type
    if (customer.customerType && !['PF', 'PJ'].includes(customer.customerType)) {
      throw new Error('Customer type must be PF or PJ');
    }

    return true;
  }

  /**
   * Validates CPF format (Brazilian individual tax ID)
   */
  validateCPF(cpf?: string): boolean {
    if (!cpf) return true; // CPF is optional

    // Remove formatting
    const cleanCpf = cpf.replace(/\D/g, '');

    // Check basic format
    if (cleanCpf.length !== 11) {
      throw new Error('CPF must have 11 digits');
    }

    // Check for repeated digits
    if (/^(\d)\1{10}$/.test(cleanCpf)) {
      throw new Error('Invalid CPF format');
    }

    // Validate CPF checksum
    let sum = 0;
    let remainder;

    // First digit validation
    for (let i = 1; i <= 9; i++) {
      sum = sum + parseInt(cleanCpf.substring(i - 1, i)) * (11 - i);
    }
    remainder = (sum * 10) % 11;
    if ((remainder === 10) || (remainder === 11)) remainder = 0;
    if (remainder !== parseInt(cleanCpf.substring(9, 10))) {
      throw new Error('Invalid CPF checksum');
    }

    // Second digit validation
    sum = 0;
    for (let i = 1; i <= 10; i++) {
      sum = sum + parseInt(cleanCpf.substring(i - 1, i)) * (12 - i);
    }
    remainder = (sum * 10) % 11;
    if ((remainder === 10) || (remainder === 11)) remainder = 0;
    if (remainder !== parseInt(cleanCpf.substring(10, 11))) {
      throw new Error('Invalid CPF checksum');
    }

    return true;
  }

  /**
   * Validates CNPJ format (Brazilian company tax ID)
   */
  validateCNPJ(cnpj?: string): boolean {
    if (!cnpj) return true; // CNPJ is optional

    // Remove formatting
    const cleanCnpj = cnpj.replace(/\D/g, '');

    // Check basic format
    if (cleanCnpj.length !== 14) {
      throw new Error('CNPJ must have 14 digits');
    }

    // Check for repeated digits
    if (/^(\d)\1{13}$/.test(cleanCnpj)) {
      throw new Error('Invalid CNPJ format');
    }

    // Validate CNPJ checksum
    let size = cleanCnpj.length - 2;
    let numbers = cleanCnpj.substring(0, size);
    const digits = cleanCnpj.substring(size);
    let sum = 0;
    let pos = size - 7;

    for (let i = size; i >= 1; i--) {
      sum += parseInt(numbers.charAt(size - i)) * pos--;
      if (pos < 2) pos = 9;
    }

    let result = sum % 11 < 2 ? 0 : 11 - sum % 11;
    if (result !== parseInt(digits.charAt(0))) {
      throw new Error('Invalid CNPJ checksum');
    }

    size = size + 1;
    numbers = cleanCnpj.substring(0, size);
    sum = 0;
    pos = size - 7;
    for (let i = size; i >= 1; i--) {
      sum += parseInt(numbers.charAt(size - i)) * pos--;
      if (pos < 2) pos = 9;
    }

    result = sum % 11 < 2 ? 0 : 11 - sum % 11;
    if (result !== parseInt(digits.charAt(1))) {
      throw new Error('Invalid CNPJ checksum');
    }

    return true;
  }

  /**
   * Validates phone number format
   */
  validatePhone(phone?: string): boolean {
    if (!phone) return true; // Phone is optional

    // Brazilian phone format: (XX) XXXXX-XXXX or (XX) XXXX-XXXX
    const phoneRegex = /^\(\d{2}\) \d{4,5}-\d{4}$/;
    if (!phoneRegex.test(phone)) {
      throw new Error('Invalid phone format. Use: (XX) XXXXX-XXXX');
    }

    return true;
  }

  /**
   * Validates ZIP code format (Brazilian CEP)
   */
  validateZipCode(zipCode?: string): boolean {
    if (!zipCode) return true; // ZIP code is optional

    // Brazilian ZIP code format: XXXXX-XXX
    const zipRegex = /^\d{5}-\d{3}$/;
    if (!zipRegex.test(zipCode)) {
      throw new Error('Invalid ZIP code format. Use: XXXXX-XXX');
    }

    return true;
  }

  /**
   * Validates customer based on type (PF/PJ)
   */
  validateCustomerByType(customer: Partial<Customer>): boolean {
    if (customer.customerType === 'PF') {
      // Pessoa Física - CPF required, company fields should be empty
      if (!customer.cpf) {
        throw new Error('CPF is required for individual customers (PF)');
      }
      
      this.validateCPF(customer.cpf);
      
      if (customer.cnpj) {
        throw new Error('CNPJ should not be provided for individual customers (PF)');
      }
    } else if (customer.customerType === 'PJ') {
      // Pessoa Jurídica - CNPJ and company name required
      if (!customer.cnpj) {
        throw new Error('CNPJ is required for company customers (PJ)');
      }
      
      if (!customer.companyName || customer.companyName.trim().length === 0) {
        throw new Error('Company name is required for company customers (PJ)');
      }
      
      this.validateCNPJ(customer.cnpj);
      
      if (customer.cpf) {
        throw new Error('CPF should not be provided for company customers (PJ)');
      }
    }

    return true;
  }

  /**
   * Creates full name from first and last name
   */
  createFullName(firstName: string, lastName: string): string {
    return `${firstName.trim()} ${lastName.trim()}`;
  }

  /**
   * Formats phone number for storage
   */
  formatPhone(phone?: string): string | undefined {
    if (!phone) return undefined;
    
    // Remove all non-digits
    const digits = phone.replace(/\D/g, '');
    
    // Format based on length
    if (digits.length === 10) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    } else if (digits.length === 11) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
    }
    
    return phone; // Return as-is if format is unexpected
  }

  /**
   * Formats CPF for display
   */
  formatCPF(cpf?: string): string | undefined {
    if (!cpf) return undefined;
    
    const digits = cpf.replace(/\D/g, '');
    if (digits.length === 11) {
      return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
    }
    
    return cpf;
  }

  /**
   * Formats CNPJ for display
   */
  formatCNPJ(cnpj?: string): string | undefined {
    if (!cnpj) return undefined;
    
    const digits = cnpj.replace(/\D/g, '');
    if (digits.length === 14) {
      return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
    }
    
    return cnpj;
  }

  /**
   * Gets customer display name based on type
   */
  getDisplayName(customer: Customer): string {
    if (customer.customerType === 'PJ' && customer.companyName) {
      return customer.companyName;
    }
    
    return this.createFullName(customer.firstName, customer.lastName);
  }

  /**
   * Validates complete customer data for creation/update
   */
  validateCompleteCustomer(customer: Partial<Customer>): boolean {
    // Basic validation
    this.validateCustomerData(customer);
    
    // Phone validation
    this.validatePhone(customer.phone);
    this.validatePhone(customer.mobilePhone);
    
    // ZIP code validation
    this.validateZipCode(customer.zipCode);
    
    // Type-specific validation
    this.validateCustomerByType(customer);
    
    return true;
  }
}