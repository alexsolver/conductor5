/**
 * Person Domain Entity - Phase 13 Implementation
 * 
 * Representa uma pessoa no domínio do sistema Conductor
 * Entidade pura sem dependências externas
 * 
 * @module PersonEntity
 * @version 1.0.0
 * @created 2025-08-12 - Phase 13 Clean Architecture Implementation
 */

import { validateCPF, validateCNPJ } from '../../infrastructure/services/BrazilianValidationService';

export interface Person {
  id: string;
  tenantId: string;
  personType: 'natural' | 'legal'; // PF ou PJ
  firstName: string;
  lastName?: string;
  companyName?: string;
  email?: string;
  phone?: string;
  cellPhone?: string;
  cpf?: string;
  cnpj?: string;
  rg?: string;
  birthDate?: Date;
  address?: {
    street?: string;
    number?: string;
    complement?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  contactPerson?: string;
  contactPhone?: string;
  notes?: string;
  tags?: string[];
  isActive: boolean;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  updatedBy?: string;
}

export class PersonEntity {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public personType: 'natural' | 'legal',
    public firstName: string,
    public lastName: string | null = null,
    public companyName: string | null = null,
    public email: string | null = null,
    public phone: string | null = null,
    public cellPhone: string | null = null,
    public cpf: string | null = null,
    public cnpj: string | null = null,
    public rg: string | null = null,
    public birthDate: Date | null = null,
    public address: {
      street?: string;
      number?: string;
      complement?: string;
      neighborhood?: string;
      city?: string;
      state?: string;
      zipCode?: string;
      country?: string;
    } | null = null,
    public contactPerson: string | null = null,
    public contactPhone: string | null = null,
    public notes: string | null = null,
    public tags: string[] = [],
    public isActive: boolean = true,
    public metadata: Record<string, any> | null = null,
    public readonly createdAt: Date = new Date(),
    public updatedAt: Date = new Date(),
    public readonly createdBy: string | null = null,
    public updatedBy: string | null = null
  ) {
    this.validateTenantId();
    this.validatePersonType();
    this.validateFirstName();
    this.validatePersonTypeSpecificFields();
    this.validateDocuments();
    this.validateEmail();
    this.validatePhone();
    this.validateBirthDate();
  }

  private validateTenantId(): void {
    if (!this.tenantId || this.tenantId.trim().length === 0) {
      throw new Error('Tenant ID é obrigatório');
    }
  }

  private validatePersonType(): void {
    if (!this.personType || !['natural', 'legal'].includes(this.personType)) {
      throw new Error('Tipo de pessoa deve ser "natural" (PF) ou "legal" (PJ)');
    }
  }

  private validateFirstName(): void {
    if (!this.firstName || this.firstName.trim().length === 0) {
      throw new Error('Nome/Razão social é obrigatório');
    }
    
    if (this.firstName.length > 100) {
      throw new Error('Nome/Razão social deve ter no máximo 100 caracteres');
    }
  }

  private validatePersonTypeSpecificFields(): void {
    if (this.personType === 'natural') {
      // Pessoa Física - deve ter nome e sobrenome
      if (!this.lastName || this.lastName.trim().length === 0) {
        throw new Error('Sobrenome é obrigatório para pessoa física');
      }
      if (this.companyName) {
        throw new Error('Nome da empresa não deve ser preenchido para pessoa física');
      }
    } else if (this.personType === 'legal') {
      // Pessoa Jurídica - deve ter companyName
      if (!this.companyName || this.companyName.trim().length === 0) {
        throw new Error('Nome da empresa é obrigatório para pessoa jurídica');
      }
      if (this.lastName) {
        throw new Error('Sobrenome não deve ser preenchido para pessoa jurídica');
      }
    }
  }

  private validateDocuments(): void {
    if (this.personType === 'natural') {
      // Pessoa Física - validar CPF se fornecido
      if (this.cpf && !validateCPF(this.cpf)) {
        throw new Error('CPF inválido');
      }
      if (this.cnpj) {
        throw new Error('CNPJ não deve ser preenchido para pessoa física');
      }
    } else if (this.personType === 'legal') {
      // Pessoa Jurídica - validar CNPJ se fornecido
      if (this.cnpj && !validateCNPJ(this.cnpj)) {
        throw new Error('CNPJ inválido');
      }
      if (this.cpf) {
        throw new Error('CPF não deve ser preenchido para pessoa jurídica');
      }
      if (this.rg) {
        throw new Error('RG não deve ser preenchido para pessoa jurídica');
      }
    }
  }

  private validateEmail(): void {
    if (this.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(this.email)) {
        throw new Error('Email inválido');
      }
      if (this.email.length > 255) {
        throw new Error('Email deve ter no máximo 255 caracteres');
      }
    }
  }

  private validatePhone(): void {
    if (this.phone && this.phone.length > 20) {
      throw new Error('Telefone deve ter no máximo 20 caracteres');
    }
    if (this.cellPhone && this.cellPhone.length > 20) {
      throw new Error('Celular deve ter no máximo 20 caracteres');
    }
    if (this.contactPhone && this.contactPhone.length > 20) {
      throw new Error('Telefone de contato deve ter no máximo 20 caracteres');
    }
  }

  private validateBirthDate(): void {
    if (this.birthDate) {
      if (this.personType === 'legal') {
        throw new Error('Data de nascimento não deve ser preenchida para pessoa jurídica');
      }
      
      const now = new Date();
      const minAge = new Date(now.getFullYear() - 120, now.getMonth(), now.getDate());
      const maxAge = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
      
      if (this.birthDate < minAge || this.birthDate > maxAge) {
        throw new Error('Data de nascimento deve estar entre 1 e 120 anos atrás');
      }
    }
  }

  updateFirstName(firstName: string, updatedBy?: string): void {
    this.firstName = firstName;
    this.validateFirstName();
    this.updatedAt = new Date();
    if (updatedBy) this.updatedBy = updatedBy;
  }

  updateLastName(lastName: string | null, updatedBy?: string): void {
    this.lastName = lastName;
    this.validatePersonTypeSpecificFields();
    this.updatedAt = new Date();
    if (updatedBy) this.updatedBy = updatedBy;
  }

  updateCompanyName(companyName: string | null, updatedBy?: string): void {
    this.companyName = companyName;
    this.validatePersonTypeSpecificFields();
    this.updatedAt = new Date();
    if (updatedBy) this.updatedBy = updatedBy;
  }

  updateEmail(email: string | null, updatedBy?: string): void {
    this.email = email;
    this.validateEmail();
    this.updatedAt = new Date();
    if (updatedBy) this.updatedBy = updatedBy;
  }

  updatePhone(phone: string | null, updatedBy?: string): void {
    this.phone = phone;
    this.validatePhone();
    this.updatedAt = new Date();
    if (updatedBy) this.updatedBy = updatedBy;
  }

  updateCellPhone(cellPhone: string | null, updatedBy?: string): void {
    this.cellPhone = cellPhone;
    this.validatePhone();
    this.updatedAt = new Date();
    if (updatedBy) this.updatedBy = updatedBy;
  }

  updateCPF(cpf: string | null, updatedBy?: string): void {
    this.cpf = cpf;
    this.validateDocuments();
    this.updatedAt = new Date();
    if (updatedBy) this.updatedBy = updatedBy;
  }

  updateCNPJ(cnpj: string | null, updatedBy?: string): void {
    this.cnpj = cnpj;
    this.validateDocuments();
    this.updatedAt = new Date();
    if (updatedBy) this.updatedBy = updatedBy;
  }

  updateRG(rg: string | null, updatedBy?: string): void {
    this.rg = rg;
    this.validateDocuments();
    this.updatedAt = new Date();
    if (updatedBy) this.updatedBy = updatedBy;
  }

  updateBirthDate(birthDate: Date | null, updatedBy?: string): void {
    this.birthDate = birthDate;
    this.validateBirthDate();
    this.updatedAt = new Date();
    if (updatedBy) this.updatedBy = updatedBy;
  }

  updateAddress(address: PersonEntity['address'], updatedBy?: string): void {
    this.address = address;
    this.updatedAt = new Date();
    if (updatedBy) this.updatedBy = updatedBy;
  }

  updateContactPerson(contactPerson: string | null, updatedBy?: string): void {
    this.contactPerson = contactPerson;
    this.updatedAt = new Date();
    if (updatedBy) this.updatedBy = updatedBy;
  }

  updateContactPhone(contactPhone: string | null, updatedBy?: string): void {
    this.contactPhone = contactPhone;
    this.validatePhone();
    this.updatedAt = new Date();
    if (updatedBy) this.updatedBy = updatedBy;
  }

  updateNotes(notes: string | null, updatedBy?: string): void {
    this.notes = notes;
    this.updatedAt = new Date();
    if (updatedBy) this.updatedBy = updatedBy;
  }

  updateTags(tags: string[], updatedBy?: string): void {
    this.tags = tags;
    this.updatedAt = new Date();
    if (updatedBy) this.updatedBy = updatedBy;
  }

  addTag(tag: string, updatedBy?: string): void {
    if (!this.tags.includes(tag)) {
      this.tags.push(tag);
      this.updatedAt = new Date();
      if (updatedBy) this.updatedBy = updatedBy;
    }
  }

  removeTag(tag: string, updatedBy?: string): void {
    const index = this.tags.indexOf(tag);
    if (index > -1) {
      this.tags.splice(index, 1);
      this.updatedAt = new Date();
      if (updatedBy) this.updatedBy = updatedBy;
    }
  }

  updateMetadata(metadata: Record<string, any> | null, updatedBy?: string): void {
    this.metadata = metadata;
    this.updatedAt = new Date();
    if (updatedBy) this.updatedBy = updatedBy;
  }

  activate(updatedBy?: string): void {
    this.isActive = true;
    this.updatedAt = new Date();
    if (updatedBy) this.updatedBy = updatedBy;
  }

  deactivate(updatedBy?: string): void {
    this.isActive = false;
    this.updatedAt = new Date();
    if (updatedBy) this.updatedBy = updatedBy;
  }

  getFullName(): string {
    if (this.personType === 'natural') {
      return `${this.firstName} ${this.lastName || ''}`.trim();
    } else {
      return this.companyName || this.firstName;
    }
  }

  getDisplayName(): string {
    return this.getFullName();
  }

  getDocument(): string | null {
    if (this.personType === 'natural') {
      return this.cpf;
    } else {
      return this.cnpj;
    }
  }

  getDocumentType(): string | null {
    if (this.personType === 'natural') {
      return this.cpf ? 'CPF' : null;
    } else {
      return this.cnpj ? 'CNPJ' : null;
    }
  }

  hasCompleteAddress(): boolean {
    return !!(this.address && 
              this.address.street && 
              this.address.number && 
              this.address.city && 
              this.address.state && 
              this.address.zipCode);
  }

  hasContact(): boolean {
    return !!(this.email || this.phone || this.cellPhone);
  }

  getAge(): number | null {
    if (!this.birthDate || this.personType !== 'natural') {
      return null;
    }
    
    const today = new Date();
    const birth = new Date(this.birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  }

  static create(data: {
    tenantId: string;
    personType: 'natural' | 'legal';
    firstName: string;
    lastName?: string;
    companyName?: string;
    email?: string;
    phone?: string;
    cellPhone?: string;
    cpf?: string;
    cnpj?: string;
    rg?: string;
    birthDate?: Date;
    address?: PersonEntity['address'];
    contactPerson?: string;
    contactPhone?: string;
    notes?: string;
    tags?: string[];
    metadata?: Record<string, any>;
    createdBy?: string;
  }): PersonEntity {
    const generateId = () => {
      return 'person_' + Date.now().toString() + '_' + Math.random().toString(36).substr(2, 9);
    };
    
    return new PersonEntity(
      generateId(),
      data.tenantId,
      data.personType,
      data.firstName,
      data.lastName || null,
      data.companyName || null,
      data.email || null,
      data.phone || null,
      data.cellPhone || null,
      data.cpf || null,
      data.cnpj || null,
      data.rg || null,
      data.birthDate || null,
      data.address || null,
      data.contactPerson || null,
      data.contactPhone || null,
      data.notes || null,
      data.tags || [],
      true,
      data.metadata || null,
      new Date(),
      new Date(),
      data.createdBy || null,
      null
    );
  }
}