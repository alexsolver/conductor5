/**
 * Tenant Auto-Provisioning Service
 * Handles automatic tenant creation based on different triggers
 */

// Removed direct storage import - using database directly for 1qa.md compliance
import { DependencyContainer } from "../application/services/DependencyContainer";
import crypto from "crypto";
import { storageSimple } from '../storage-simple';

export interface AutoProvisioningConfig {
  enabled: boolean;
  allowSelfProvisioning: boolean;
  defaultTenantSettings: Record<string, any>;
  autoCreateOnFirstUser: boolean;
  subdomainGeneration: 'random' | 'company-based' | 'user-based';
}

export interface TenantProvisioningRequest {
  name: string;
  subdomain?: string;
  companyName?: string;
  userEmail?: string;
  settings?: Record<string, any>;
  trigger: 'manual' | 'registration' | 'invitation' | 'api';
}

class TenantAutoProvisioningService {
  private config: AutoProvisioningConfig;

  constructor() {
    this.config = {
      enabled: true,
      allowSelfProvisioning: true,
      defaultTenantSettings: {
        maxUsers: 50,
        maxTickets: 1000,
        features: ['tickets', 'customers', 'analytics'],
        theme: 'default'
      },
      autoCreateOnFirstUser: true,
      subdomainGeneration: 'company-based'
    };
  }

  /**
   * Automatically provision a new tenant
   */
  async provisionTenant(request: TenantProvisioningRequest): Promise<{ tenant: any; success: boolean; message: string }> {
    try {
      if (!this.config.enabled) {
        return { tenant: null, success: false, message: 'Auto-provisioning is disabled' };
      }

      // Validate request
      const validationResult = this.validateProvisioningRequest(request);
      if (!validationResult.valid) {
        return { tenant: null, success: false, message: validationResult.message };
      }

      // Generate subdomain if not provided
      const subdomain = request.subdomain || await this.generateSubdomain(request);

      // Check if subdomain already exists
      const { db } = await import('../db');
      const { tenants } = await import('@shared/schema');
      const { eq } = await import('drizzle-orm');

      const existingTenant = await db.select().from(tenants).where(eq(tenants.subdomain, subdomain)).limit(1);
      if (existingTenant.length > 0) {
        return { tenant: null, success: false, message: `Subdomain '${subdomain}' already exists` };
      }

      // Create tenant entity directly using database for 1qa.md compliance
      const { v4: uuidv4 } = await import('uuid');
      const tenantId = uuidv4();

      const { Tenant } = await import('../domain/entities/Tenant');
      const tenantEntity = new Tenant(
        tenantId,
        request.name,
        subdomain,
        { ...this.config.defaultTenantSettings, ...request.settings }
      );

      // Get tenant repository from dependency container
      const { DependencyContainer } = await import('../application/services/DependencyContainer');
      const container = DependencyContainer.getInstance();
      const tenantRepository = await container.getTenantRepository();

      // Save tenant
      const savedTenant = await tenantRepository.save(tenantEntity);

      // Initialize tenant schema using storage service
      console.log(`🏗️ [TENANT-PROVISIONING] Initializing schema for tenant: ${savedTenant.id}`);
      
      try {
        // First create the schema
        const { schemaManager } = await import('../db');
        await schemaManager.createTenantSchema(savedTenant.id);
        
        // Then initialize it with tables
        await storageSimple.initializeTenantSchema(savedTenant.id);

        // Validate schema was created successfully
        const { TenantValidator } = await import('../database/TenantValidator');
        const isValid = await TenantValidator.validateTenantSchema(savedTenant.id);
        
        if (!isValid) {
          console.error(`❌ [TENANT-PROVISIONING] Schema validation failed for tenant ${savedTenant.id}`);
          throw new Error(`Schema validation failed for tenant ${savedTenant.id}`);
        }
      } catch (schemaError) {
        console.error(`❌ [TENANT-PROVISIONING] Schema initialization failed for tenant ${savedTenant.id}:`, schemaError);
        throw new Error(`Failed to initialize tenant schema: ${schemaError.message}`);
      }

      console.log(`✅ [TENANT-PROVISIONING] Schema validated successfully for tenant: ${savedTenant.id}`);

      // Log provisioning activity
      console.log(`Auto-provisioned tenant: ${savedTenant.name} (${savedTenant.subdomain}) - Trigger: ${request.trigger}`);

      return {
        tenant: savedTenant,
        success: true,
        message: `Tenant '${savedTenant.name}' created successfully`
      };

    } catch (error) {
      console.error('Error in auto-provisioning:', error);
      return {
        tenant: null,
        success: false,
        message: `Provisioning failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Check if tenant should be auto-created for a new user registration
   */
  async shouldAutoProvisionForUser(userEmail: string, companyName?: string): Promise<boolean> {
    if (!this.config.enabled || !this.config.autoCreateOnFirstUser) {
      return false;
    }

    // Check if user already belongs to a tenant
    // This line was corrected to use storageSimple instead of storage
    const existingUser = await storageSimple.getUserByEmail?.(userEmail);
    if (existingUser?.tenantId) {
      return false;
    }

    // Additional logic can be added here (e.g., domain-based checks)
    return true;
  }

  /**
   * Auto-provision tenant on user registration
   */
  async provisionOnUserRegistration(userEmail: string, userName: string, companyName?: string): Promise<{ tenant: any; success: boolean; message: string }> {
    const shouldProvision = await this.shouldAutoProvisionForUser(userEmail, companyName);

    if (!shouldProvision) {
      return { tenant: null, success: false, message: 'Auto-provisioning not applicable for this user' };
    }

    const tenantName = companyName || `${userName}'s Organization`;

    return await this.provisionTenant({
      name: tenantName,
      companyName,
      userEmail,
      trigger: 'registration'
    });
  }

  /**
   * Generate subdomain based on configuration
   */
  private async generateSubdomain(request: TenantProvisioningRequest): Promise<string> {
    let baseSubdomain: string;

    switch (this.config.subdomainGeneration) {
      case 'company-based':
        baseSubdomain = this.sanitizeSubdomain(request.companyName || request.name);
        break;
      case 'user-based':
        baseSubdomain = this.sanitizeSubdomain(request.userEmail?.split('@')[0] || request.name);
        break;
      case 'random':
      default:
        baseSubdomain = `tenant-${crypto.randomBytes(4).toString('hex')}`;
        break;
    }

    // Ensure uniqueness
    let subdomain = baseSubdomain;
    let counter = 1;

    const { db } = await import('../db');
    const { tenants } = await import('@shared/schema');
    const { eq } = await import('drizzle-orm');

    while ((await db.select().from(tenants).where(eq(tenants.subdomain, subdomain)).limit(1)).length > 0) {
      subdomain = `${baseSubdomain}-${counter}`;
      counter++;
    }

    return subdomain;
  }

  /**
   * Sanitize string for subdomain use
   */
  private sanitizeSubdomain(input: string): string {
    return input
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 20);
  }

  /**
   * Validate provisioning request
   */
  private validateProvisioningRequest(request: TenantProvisioningRequest): { valid: boolean; message: string } {
    if (!request.name || request.name.trim().length === 0) {
      return { valid: false, message: 'Tenant name is required' };
    }

    if (request.subdomain && !/^[a-z0-9-]+$/.test(request.subdomain)) {
      return { valid: false, message: 'Subdomain must contain only lowercase letters, numbers, and hyphens' };
    }

    if (request.trigger === 'registration' && !request.userEmail) {
      return { valid: false, message: 'User email is required for registration trigger' };
    }

    return { valid: true, message: 'Valid request' };
  }

  /**
   * Update auto-provisioning configuration
   */
  updateConfig(newConfig: Partial<AutoProvisioningConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('Auto-provisioning config updated:', this.config);
  }

  /**
   * Get current configuration
   */
  getConfig(): AutoProvisioningConfig {
    return { ...this.config };
  }
}

export const tenantAutoProvisioningService = new TenantAutoProvisioningService();