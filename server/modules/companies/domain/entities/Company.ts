/**
 * DOMAIN LAYER - COMPANY ENTITY
 * Seguindo Clean Architecture - 1qa.md compliance
 */

// Core Company Entity Interface
export interface Company {
  id: string;
  tenantId: string;
  
  // Basic Company Information
  name: string;                    // Razão Social
  displayName?: string;            // Nome Fantasia
  description?: string;            // Company description
  
  // Brazilian Business Information
  cnpj: string;                    // Brazilian company tax ID
  industry?: string;               // Industry/sector (CNAE category)
  size?: CompanySize;              // Company size (micro, small, medium, large)
  
  // Contact Information
  email?: string;
  phone?: string;
  website?: string;
  
  // Address Information
  address?: string;
  addressNumber?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;                  // Brazilian state code (2 chars)
  zipCode?: string;                // Brazilian CEP format
  
  // Business Status
  status: CompanyStatus;           // Active, inactive, suspended
  subscriptionTier?: SubscriptionTier; // Free, basic, premium, enterprise
  
  // System Fields
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Value Objects
export type CompanySize = 'micro' | 'small' | 'medium' | 'large' | 'enterprise';

export type CompanyStatus = 'active' | 'inactive' | 'suspended' | 'pending';

export type SubscriptionTier = 'free' | 'basic' | 'premium' | 'enterprise';

// Company Domain Service with Business Rules
export class CompanyDomainService {
  
  validateCNPJ(cnpj: string): boolean {
    if (!cnpj) return false;
    
    // Remove formatting
    const cleanCnpj = cnpj.replace(/\D/g, '');
    
    // Check length
    if (cleanCnpj.length !== 14) return false;
    
    // Check for repeated digits
    if (/^(\d)\1+$/.test(cleanCnpj)) return false;
    
    // CNPJ checksum validation algorithm
    const calculateCheckDigit = (cnpjBase: string, weights: number[]): number => {
      const sum = cnpjBase
        .split('')
        .reduce((acc, digit, index) => acc + parseInt(digit) * weights[index], 0);
      const remainder = sum % 11;
      return remainder < 2 ? 0 : 11 - remainder;
    };
    
    // First check digit
    const firstWeights = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const firstCheckDigit = calculateCheckDigit(cleanCnpj.substring(0, 12), firstWeights);
    
    if (firstCheckDigit !== parseInt(cleanCnpj[12])) return false;
    
    // Second check digit
    const secondWeights = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const secondCheckDigit = calculateCheckDigit(cleanCnpj.substring(0, 13), secondWeights);
    
    return secondCheckDigit === parseInt(cleanCnpj[13]);
  }

  formatCNPJ(cnpj?: string): string {
    if (!cnpj) return '';
    const cleanCnpj = cnpj.replace(/\D/g, '');
    if (cleanCnpj.length !== 14) return cnpj;
    return cleanCnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  }

  validateEmail(email?: string): boolean {
    if (!email) return true; // Optional field
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  validatePhone(phone?: string): boolean {
    if (!phone) return true; // Optional field
    // Brazilian phone format: (11) 99999-9999 or (11) 9999-9999
    const phoneRegex = /^\(\d{2}\)\s\d{4,5}-\d{4}$/;
    return phoneRegex.test(phone) || /^\d{10,11}$/.test(phone.replace(/\D/g, ''));
  }

  formatPhone(phone?: string): string {
    if (!phone) return '';
    const cleanPhone = phone.replace(/\D/g, '');
    
    if (cleanPhone.length === 11) {
      // Mobile: (11) 99999-9999
      return cleanPhone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    } else if (cleanPhone.length === 10) {
      // Landline: (11) 9999-9999
      return cleanPhone.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    
    return phone; // Return original if format doesn't match
  }

  validateCEP(zipCode?: string): boolean {
    if (!zipCode) return true; // Optional field
    const cleanZipCode = zipCode.replace(/\D/g, '');
    return cleanZipCode.length === 8;
  }

  formatCEP(zipCode?: string): string {
    if (!zipCode) return '';
    const cleanZipCode = zipCode.replace(/\D/g, '');
    if (cleanZipCode.length !== 8) return zipCode;
    return cleanZipCode.replace(/(\d{5})(\d{3})/, '$1-$2');
  }

  validateBrazilianState(state?: string): boolean {
    if (!state) return true; // Optional field
    
    const validStates = [
      'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
      'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
      'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
    ];
    
    return validStates.includes(state.toUpperCase());
  }

  validateWebsite(website?: string): boolean {
    if (!website) return true; // Optional field
    try {
      new URL(website);
      return true;
    } catch {
      return false;
    }
  }

  validateCompanySize(size?: CompanySize): boolean {
    if (!size) return true; // Optional field
    const validSizes: CompanySize[] = ['micro', 'small', 'medium', 'large', 'enterprise'];
    return validSizes.includes(size);
  }

  validateCompanyStatus(status: CompanyStatus): boolean {
    const validStatuses: CompanyStatus[] = ['active', 'inactive', 'suspended', 'pending'];
    return validStatuses.includes(status);
  }

  validateSubscriptionTier(tier?: SubscriptionTier): boolean {
    if (!tier) return true; // Optional field
    const validTiers: SubscriptionTier[] = ['free', 'basic', 'premium', 'enterprise'];
    return validTiers.includes(tier);
  }

  // Business rule: Create company display name
  createDisplayName(name: string, displayName?: string): string {
    return displayName && displayName.trim() !== '' ? displayName : name;
  }

  // Business rule: Generate company identifier
  generateCompanyCode(name: string, cnpj: string): string {
    const nameCode = name.replace(/\s+/g, '').substring(0, 6).toUpperCase();
    const cnpjSuffix = cnpj.replace(/\D/g, '').substring(8, 12);
    return `${nameCode}-${cnpjSuffix}`;
  }

  // Business rule: Determine company tier based on size
  recommendSubscriptionTier(size?: CompanySize): SubscriptionTier {
    switch (size) {
      case 'micro':
      case 'small':
        return 'basic';
      case 'medium':
        return 'premium';
      case 'large':
      case 'enterprise':
        return 'enterprise';
      default:
        return 'free';
    }
  }

  // Business rule: Validate complete company data
  validateCompanyData(company: Partial<Company>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Required fields validation
    if (!company.name?.trim()) {
      errors.push('Company name is required');
    }

    if (!company.cnpj?.trim()) {
      errors.push('CNPJ is required');
    } else if (!this.validateCNPJ(company.cnpj)) {
      errors.push('Invalid CNPJ format or checksum');
    }

    if (!company.status) {
      errors.push('Company status is required');
    } else if (!this.validateCompanyStatus(company.status)) {
      errors.push('Invalid company status');
    }

    // Optional fields validation
    if (company.email && !this.validateEmail(company.email)) {
      errors.push('Invalid email format');
    }

    if (company.phone && !this.validatePhone(company.phone)) {
      errors.push('Invalid phone format');
    }

    if (company.zipCode && !this.validateCEP(company.zipCode)) {
      errors.push('Invalid CEP format');
    }

    if (company.state && !this.validateBrazilianState(company.state)) {
      errors.push('Invalid Brazilian state code');
    }

    if (company.website && !this.validateWebsite(company.website)) {
      errors.push('Invalid website URL');
    }

    if (company.size && !this.validateCompanySize(company.size)) {
      errors.push('Invalid company size');
    }

    if (company.subscriptionTier && !this.validateSubscriptionTier(company.subscriptionTier)) {
      errors.push('Invalid subscription tier');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Business rule: Format company for display
  formatCompanyDisplay(company: Company): {
    displayName: string;
    formattedCNPJ: string;
    formattedPhone: string;
    formattedZipCode: string;
    fullAddress: string;
  } {
    const addressParts = [
      company.address,
      company.addressNumber,
      company.complement,
      company.neighborhood,
      company.city,
      company.state
    ].filter(Boolean);

    return {
      displayName: this.createDisplayName(company.name, company.displayName),
      formattedCNPJ: this.formatCNPJ(company.cnpj),
      formattedPhone: this.formatPhone(company.phone),
      formattedZipCode: this.formatCEP(company.zipCode),
      fullAddress: addressParts.join(', ')
    };
  }

  // Business rule: Check if company can be deleted
  canDeleteCompany(company: Company): { canDelete: boolean; reason?: string } {
    if (company.status === 'active') {
      return { canDelete: false, reason: 'Cannot delete active company' };
    }

    // Additional business rules can be added here
    // e.g., check for active customers, contracts, etc.

    return { canDelete: true };
  }
}