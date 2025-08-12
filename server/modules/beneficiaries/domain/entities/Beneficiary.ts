/**
 * Beneficiary Entity - Domain Layer
 * 
 * Represents a beneficiary in the system with comprehensive Brazilian compliance support.
 * Beneficiaries are individuals or entities that receive benefits or services through customers.
 * 
 * @module BeneficiaryEntity
 * @version 1.0.0
 * @created 2025-01-12 - Phase 7 Clean Architecture Implementation
 */

export interface Beneficiary {
  id: string;
  tenantId: string;
  
  // Basic Information
  firstName: string | null;
  lastName: string | null;
  name: string; // Full name or display name - REQUIRED
  email: string | null;
  phone: string | null;
  cellPhone: string | null;
  
  // Brazilian Legal Documents
  cpf: string | null;
  cnpj: string | null;
  rg: string | null;
  
  // Address Information
  address: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  
  // Contact Information
  contactPerson: string | null;
  contactPhone: string | null;
  
  // Integration and Customer Relationship
  integrationCode: string | null;
  customerId: string | null;
  customerCode: string | null;
  
  // Birth Date for benefits
  birthDate: Date | null;
  
  // Additional Information
  notes: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface BeneficiaryFilterCriteria {
  tenantId: string;
  search?: string; // Search across name, email, cpf, phone
  customerCode?: string;
  customerId?: string;
  city?: string;
  state?: string;
  isActive?: boolean;
  hasEmail?: boolean;
  hasPhone?: boolean;
  hasCpf?: boolean;
  hasCnpj?: boolean;
  birthDateFrom?: Date;
  birthDateTo?: Date;
  createdFrom?: Date;
  createdTo?: Date;
  page?: number;
  limit?: number;
  sortBy?: 'name' | 'email' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

export interface BeneficiaryStats {
  tenantId: string;
  totalBeneficiaries: number;
  activeBeneficiaries: number;
  inactiveBeneficiaries: number;
  beneficiariesWithEmail: number;
  beneficiariesWithPhone: number;
  beneficiariesWithCpf: number;
  beneficiariesWithCnpj: number;
  beneficiariesByState: Record<string, number>;
  beneficiariesByCity: Record<string, number>;
  recentBeneficiariesCount: number; // Last 30 days
  lastUpdated: Date;
}

/**
 * Brazilian Document Types
 */
export enum BrazilianDocumentType {
  CPF = 'cpf',
  CNPJ = 'cnpj',
  RG = 'rg'
}

/**
 * Beneficiary Domain Service
 * Contains pure business logic and validation rules
 */
export class BeneficiaryDomainService {
  
  /**
   * Validates CPF (Brazilian individual tax ID)
   */
  static validateCpf(cpf: string): boolean {
    if (!cpf) return false;
    
    // Remove formatting
    const cleanCpf = cpf.replace(/[^\d]/g, '');
    
    // Check length
    if (cleanCpf.length !== 11) return false;
    
    // Check for invalid sequences
    if (/^(\d)\1+$/.test(cleanCpf)) return false;
    
    // Validate check digits
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cleanCpf[i]) * (10 - i);
    }
    let digit1 = (sum * 10) % 11;
    if (digit1 === 10) digit1 = 0;
    
    if (digit1 !== parseInt(cleanCpf[9])) return false;
    
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cleanCpf[i]) * (11 - i);
    }
    let digit2 = (sum * 10) % 11;
    if (digit2 === 10) digit2 = 0;
    
    return digit2 === parseInt(cleanCpf[10]);
  }
  
  /**
   * Validates CNPJ (Brazilian company tax ID)
   */
  static validateCnpj(cnpj: string): boolean {
    if (!cnpj) return false;
    
    // Remove formatting
    const cleanCnpj = cnpj.replace(/[^\d]/g, '');
    
    // Check length
    if (cleanCnpj.length !== 14) return false;
    
    // Check for invalid sequences
    if (/^(\d)\1+$/.test(cleanCnpj)) return false;
    
    // Validate check digits
    const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      sum += parseInt(cleanCnpj[i]) * weights1[i];
    }
    let digit1 = sum % 11;
    digit1 = digit1 < 2 ? 0 : 11 - digit1;
    
    if (digit1 !== parseInt(cleanCnpj[12])) return false;
    
    sum = 0;
    for (let i = 0; i < 13; i++) {
      sum += parseInt(cleanCnpj[i]) * weights2[i];
    }
    let digit2 = sum % 11;
    digit2 = digit2 < 2 ? 0 : 11 - digit2;
    
    return digit2 === parseInt(cleanCnpj[13]);
  }
  
  /**
   * Validates email format
   */
  static validateEmail(email: string): boolean {
    if (!email) return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
  
  /**
   * Validates Brazilian phone number
   */
  static validatePhone(phone: string): boolean {
    if (!phone) return false;
    const cleanPhone = phone.replace(/[^\d]/g, '');
    return cleanPhone.length >= 10 && cleanPhone.length <= 11;
  }
  
  /**
   * Validates Brazilian ZIP code (CEP)
   */
  static validateZipCode(zipCode: string): boolean {
    if (!zipCode) return false;
    const cleanZip = zipCode.replace(/[^\d]/g, '');
    return cleanZip.length === 8;
  }
  
  /**
   * Formats CPF for display
   */
  static formatCpf(cpf: string): string {
    if (!cpf) return '';
    const clean = cpf.replace(/[^\d]/g, '');
    if (clean.length === 11) {
      return `${clean.slice(0, 3)}.${clean.slice(3, 6)}.${clean.slice(6, 9)}-${clean.slice(9, 11)}`;
    }
    return cpf;
  }
  
  /**
   * Formats CNPJ for display
   */
  static formatCnpj(cnpj: string): string {
    if (!cnpj) return '';
    const clean = cnpj.replace(/[^\d]/g, '');
    if (clean.length === 14) {
      return `${clean.slice(0, 2)}.${clean.slice(2, 5)}.${clean.slice(5, 8)}/${clean.slice(8, 12)}-${clean.slice(12, 14)}`;
    }
    return cnpj;
  }
  
  /**
   * Formats phone for display
   */
  static formatPhone(phone: string): string {
    if (!phone) return '';
    const clean = phone.replace(/[^\d]/g, '');
    
    if (clean.length === 11) {
      return `(${clean.slice(0, 2)}) ${clean.slice(2, 7)}-${clean.slice(7, 11)}`;
    } else if (clean.length === 10) {
      return `(${clean.slice(0, 2)}) ${clean.slice(2, 6)}-${clean.slice(6, 10)}`;
    }
    return phone;
  }
  
  /**
   * Formats ZIP code for display
   */
  static formatZipCode(zipCode: string): string {
    if (!zipCode) return '';
    const clean = zipCode.replace(/[^\d]/g, '');
    if (clean.length === 8) {
      return `${clean.slice(0, 5)}-${clean.slice(5, 8)}`;
    }
    return zipCode;
  }
  
  /**
   * Generates display name for beneficiary
   */
  static generateDisplayName(beneficiary: Partial<Beneficiary>): string {
    if (beneficiary.name) return beneficiary.name;
    
    if (beneficiary.firstName && beneficiary.lastName) {
      return `${beneficiary.firstName} ${beneficiary.lastName}`;
    }
    
    if (beneficiary.firstName) return beneficiary.firstName;
    if (beneficiary.lastName) return beneficiary.lastName;
    
    return beneficiary.email || beneficiary.cpf || beneficiary.cnpj || 'Unknown';
  }
  
  /**
   * Validates complete beneficiary data
   */
  static validateBeneficiary(data: Partial<Beneficiary>): string[] {
    const errors: string[] = [];
    
    // Name is required
    if (!data.name) {
      errors.push('Name is required');
    }
    
    // Email validation (if provided)
    if (data.email && !this.validateEmail(data.email)) {
      errors.push('Invalid email format');
    }
    
    // CPF validation (if provided)
    if (data.cpf && !this.validateCpf(data.cpf)) {
      errors.push('Invalid CPF format');
    }
    
    // CNPJ validation (if provided)
    if (data.cnpj && !this.validateCnpj(data.cnpj)) {
      errors.push('Invalid CNPJ format');
    }
    
    // Phone validation (if provided)
    if (data.phone && !this.validatePhone(data.phone)) {
      errors.push('Invalid phone format');
    }
    
    // Cell phone validation (if provided)
    if (data.cellPhone && !this.validatePhone(data.cellPhone)) {
      errors.push('Invalid cell phone format');
    }
    
    // ZIP code validation (if provided)
    if (data.zipCode && !this.validateZipCode(data.zipCode)) {
      errors.push('Invalid ZIP code format');
    }
    
    // Contact phone validation (if provided)
    if (data.contactPhone && !this.validatePhone(data.contactPhone)) {
      errors.push('Invalid contact phone format');
    }
    
    return errors;
  }
  
  /**
   * Determines the age of a beneficiary
   */
  static calculateAge(birthDate: Date): number | null {
    if (!birthDate) return null;
    
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      return age - 1;
    }
    
    return age;
  }
  
  /**
   * Checks if beneficiary has complete contact information
   */
  static hasCompleteContactInfo(beneficiary: Beneficiary): boolean {
    return !!(beneficiary.email || beneficiary.phone || beneficiary.cellPhone);
  }
  
  /**
   * Checks if beneficiary has complete address information
   */
  static hasCompleteAddress(beneficiary: Beneficiary): boolean {
    return !!(beneficiary.address && beneficiary.city && beneficiary.state && beneficiary.zipCode);
  }
}