/**
 * CustomerCompany Domain Entity
 * Clean Architecture - Domain Layer
 * Represents a customer organization with business rules and validation
 */

export class CustomerCompany {
  constructor(
    private readonly id: string,
    private readonly tenantId: string,
    private name: string,
    private displayName: string | null = null,
    private description: string | null = null,
    private industry: string | null = null,
    private size: 'small' | 'medium' | 'large' | 'enterprise' | null = null,
    private email: string | null = null,
    private phone: string | null = null,
    private website: string | null = null,
    private address: {
      street?: string;
      city?: string;
      state?: string;
      country?: string;
      postalCode?: string;
    } = {},
    private taxId: string | null = null,
    private registrationNumber: string | null = null,
    private subscriptionTier: 'basic' | 'premium' | 'enterprise' = 'basic',
    private contractType: 'monthly' | 'yearly' | 'custom' | null = null,
    private maxUsers: number | null = null,
    private maxTickets: number | null = null,
    private settings: {
      timezone?: string;
      locale?: string;
      currency?: string;
      dateFormat?: string;
      timeFormat?: string;
      notifications?: {
        email?: boolean;
        sms?: boolean;
        slack?: boolean;
      };
      branding?: {
        logo?: string;
        primaryColor?: string;
        secondaryColor?: string;
      };
    } = {},
    private tags: string[] = [],
    private metadata: Record<string, unknown> = {},
    private status: 'active' | 'inactive' | 'suspended' | 'trial' = 'active',
    private isActive: boolean = true,
    private isPrimary: boolean = false,
    private readonly createdAt: Date = new Date(),
    private updatedAt: Date = new Date(),
    private readonly createdBy: string,
    private updatedBy: string | null = null
  ) {
    this.validateBusinessRules();
  }

  // Getters
  getId(): string { return this.id; }
  getTenantId(): string { return this.tenantId; }
  getName(): string { return this.name; }
  getDisplayName(): string | null { return this.displayName; }
  getDescription(): string | null { return this.description; }
  getIndustry(): string | null { return this.industry; }
  getSize(): string | null { return this.size; }
  getEmail(): string | null { return this.email; }
  getPhone(): string | null { return this.phone; }
  getWebsite(): string | null { return this.website; }
  getAddress(): Record<string, string> | undefined { return this.address; }
  getTaxId(): string | null { return this.taxId; }
  getRegistrationNumber(): string | null { return this.registrationNumber; }
  getSubscriptionTier(): string { return this.subscriptionTier; }
  getContractType(): string | null { return this.contractType; }
  getMaxUsers(): number | null { return this.maxUsers; }
  getMaxTickets(): number | null { return this.maxTickets; }
  getSettings(): Record<string, unknown> | undefined { return this.settings; }
  getTags(): string[] { return this.tags; }
  getMetadata(): Record<string, any> { return this.metadata; }
  getStatus(): string { return this.status; }
  isActiveCompany(): boolean { return this.isActive; }
  isPrimaryCompany(): boolean { return this.isPrimary; }
  getCreatedAt(): Date { return this.createdAt; }
  getUpdatedAt(): Date { return this.updatedAt; }
  getCreatedBy(): string { return this.createdBy; }
  getUpdatedBy(): string | null { return this.updatedBy; }

  // Business Methods
  getEffectiveName(): string {
    return this.displayName || this.name;
  }

  canCreateTickets(): boolean {
    return this.isActive && (this.status === 'active' || this.status === 'trial');
  }

  hasReachedUserLimit(currentUsers: number): boolean {
    return this.maxUsers !== null && currentUsers >= this.maxUsers;
  }

  hasReachedTicketLimit(currentTickets: number): boolean {
    return this.maxTickets !== null && currentTickets >= this.maxTickets;
  }

  canUpgradeSubscription(): boolean {
    const tiers = ['basic', 'premium', 'enterprise'];
    const currentIndex = tiers.indexOf(this.subscriptionTier);
    return currentIndex < tiers.length - 1;
  }

  hasTag(tag: string): boolean {
    return this.tags.includes(tag);
  }

  isEnterprise(): boolean {
    return this.subscriptionTier === 'enterprise' || this.size === 'enterprise';
  }

  hasValidContact(): boolean {
    return !!(this.email || this.phone);
  }

  // Business Rules Validation
  private validateBusinessRules(): void {
    if (!this.name || this.name.trim().length === 0) {
      throw new Error('Company name is required');
    }

    if (this.name.length > 255) {
      throw new Error('Company name must be 255 characters or less');
    }

    if (!this.tenantId) {
      throw new Error('Company must belong to a tenant');
    }

    if (!this.createdBy) {
      throw new Error('Company must have a creator');
    }

    if (this.email && !this.isValidEmail(this.email)) {
      throw new Error('Invalid email format');
    }

    if (this.website && !this.isValidWebsite(this.website)) {
      throw new Error('Invalid website URL format');
    }

    if (this.maxUsers !== null && this.maxUsers < 1) {
      throw new Error('Maximum users must be greater than 0');
    }

    if (this.maxTickets !== null && this.maxTickets < 1) {
      throw new Error('Maximum tickets must be greater than 0');
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private isValidWebsite(website: string): boolean {
    try {
      new URL(website);
      return true;
    } catch {
      return false;
    }
  }

  // Update Methods
  updateBasicInfo(props: {
    name?: string;
    displayName?: string | null;
    description?: string | null;
    industry?: string | null;
    size?: 'small' | 'medium' | 'large' | 'enterprise' | null;
    updatedBy: string;
  }): CustomerCompany {
    return new CustomerCompany(
      this.id,
      this.tenantId,
      props.name !== undefined ? props.name : this.name,
      props.displayName !== undefined ? props.displayName : this.displayName,
      props.description !== undefined ? props.description : this.description,
      props.industry !== undefined ? props.industry : this.industry,
      props.size !== undefined ? props.size : this.size,
      this.email,
      this.phone,
      this.website,
      this.address,
      this.taxId,
      this.registrationNumber,
      this.subscriptionTier,
      this.contractType,
      this.maxUsers,
      this.maxTickets,
      this.settings,
      this.tags,
      this.metadata,
      this.status,
      this.isActive,
      this.isPrimary,
      this.createdAt,
      new Date(),
      this.createdBy,
      props.updatedBy
    );
  }

  updateContactInfo(props: {
    email?: string | null;
    phone?: string | null;
    website?: string | null;
    address?: Record<string, string>;
    updatedBy: string;
  }): CustomerCompany {
    return new CustomerCompany(
      this.id,
      this.tenantId,
      this.name,
      this.displayName,
      this.description,
      this.industry,
      this.size,
      props.email !== undefined ? props.email : this.email,
      props.phone !== undefined ? props.phone : this.phone,
      props.website !== undefined ? props.website : this.website,
      props.address !== undefined ? props.address : this.address,
      this.taxId,
      this.registrationNumber,
      this.subscriptionTier,
      this.contractType,
      this.maxUsers,
      this.maxTickets,
      this.settings,
      this.tags,
      this.metadata,
      this.status,
      this.isActive,
      this.isPrimary,
      this.createdAt,
      new Date(),
      this.createdBy,
      props.updatedBy
    );
  }

  updateSubscription(props: {
    subscriptionTier?: 'basic' | 'premium' | 'enterprise';
    contractType?: 'monthly' | 'yearly' | 'custom' | null;
    maxUsers?: number | null;
    maxTickets?: number | null;
    updatedBy: string;
  }): CustomerCompany {
    return new CustomerCompany(
      this.id,
      this.tenantId,
      this.name,
      this.displayName,
      this.description,
      this.industry,
      this.size,
      this.email,
      this.phone,
      this.website,
      this.address,
      this.taxId,
      this.registrationNumber,
      props.subscriptionTier !== undefined ? props.subscriptionTier : this.subscriptionTier,
      props.contractType !== undefined ? props.contractType : this.contractType,
      props.maxUsers !== undefined ? props.maxUsers : this.maxUsers,
      props.maxTickets !== undefined ? props.maxTickets : this.maxTickets,
      this.settings,
      this.tags,
      this.metadata,
      this.status,
      this.isActive,
      this.isPrimary,
      this.createdAt,
      new Date(),
      this.createdBy,
      props.updatedBy
    );
  }

  updateStatus(props: {
    status?: 'active' | 'inactive' | 'suspended' | 'trial';
    isActive?: boolean;
    updatedBy: string;
  }): CustomerCompany {
    return new CustomerCompany(
      this.id,
      this.tenantId,
      this.name,
      this.displayName,
      this.description,
      this.industry,
      this.size,
      this.email,
      this.phone,
      this.website,
      this.address,
      this.taxId,
      this.registrationNumber,
      this.subscriptionTier,
      this.contractType,
      this.maxUsers,
      this.maxTickets,
      this.settings,
      this.tags,
      this.metadata,
      props.status !== undefined ? props.status : this.status,
      props.isActive !== undefined ? props.isActive : this.isActive,
      this.isPrimary,
      this.createdAt,
      new Date(),
      this.createdBy,
      props.updatedBy
    );
  }

  // Factory Methods
  static create(props: {
    tenantId: string;
    name: string;
    displayName?: string | null;
    description?: string | null;
    industry?: string | null;
    size?: 'small' | 'medium' | 'large' | 'enterprise' | null;
    email?: string | null;
    phone?: string | null;
    website?: string | null;
    address?: Record<string, string>;
    subscriptionTier?: 'basic' | 'premium' | 'enterprise';
    createdBy: string;
  }): CustomerCompany {
    return new CustomerCompany(
      crypto.randomUUID(),
      props.tenantId,
      props.name,
      props.displayName || null,
      props.description || null,
      props.industry || null,
      props.size || null,
      props.email || null,
      props.phone || null,
      props.website || null,
      props.address || {},
      null, // taxId
      null, // registrationNumber
      props.subscriptionTier || 'basic',
      null, // contractType
      null, // maxUsers
      null, // maxTickets
      {}, // settings
      [], // tags
      {}, // metadata
      'active', // status
      true, // isActive
      false, // isPrimary
      new Date(),
      new Date(),
      props.createdBy,
      null
    );
  }

  static fromPersistence(data: Record<string, unknown>): CustomerCompany {
    return new CustomerCompany(
      data.id,
      data.tenantId,
      data.name,
      data.displayName,
      data.description,
      data.industry,
      data.size,
      data.email,
      data.phone,
      data.website,
      data.address || {},
      data.taxId,
      data.registrationNumber,
      data.subscriptionTier || 'basic',
      data.contractType,
      data.maxUsers,
      data.maxTickets,
      data.settings || {},
      data.tags || [],
      data.metadata || {},
      data.status || 'active',
      data.isActive !== false,
      data.isPrimary || false,
      data.createdAt,
      data.updatedAt,
      data.createdBy,
      data.updatedBy
    );
  }
}