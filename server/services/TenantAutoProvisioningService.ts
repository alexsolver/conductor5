/**
 * Tenant Auto-Provisioning Service
 * Handles automatic tenant creation based on different triggers
 */

// Removed direct storage import - using database directly for 1qa.md compliance
import { DependencyContainer } from "../application/services/DependencyContainer";
import crypto from "crypto";
import { storageSimple } from "../storage-simple";
import { TenantTemplateService } from "./TenantTemplateService"; // Assuming TenantTemplateService is in the same directory or accessible path
import { sql } from "drizzle-orm";

export interface AutoProvisioningConfig {
  enabled: boolean;
  allowSelfProvisioning: boolean;
  defaultTenantSettings: Record<string, any>;
  autoCreateOnFirstUser: boolean;
  subdomainGeneration: "random" | "company-based" | "user-based";
}

export interface TenantProvisioningRequest {
  name: string;
  subdomain?: string;
  companyName?: string;
  userEmail?: string;
  settings?: Record<string, any>;
  trigger: "manual" | "registration" | "invitation" | "api";
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
        features: ["tickets", "customers", "analytics"],
        theme: "default",
      },
      autoCreateOnFirstUser: true,
      subdomainGeneration: "company-based",
    };
  }

  /**
   * Automatically provision a new tenant
   */
  async provisionTenant(
    request: TenantProvisioningRequest,
  ): Promise<{ tenant: any; success: boolean; message: string }> {
    try {
      if (!this.config.enabled) {
        return {
          tenant: null,
          success: false,
          message: "Auto-provisioning is disabled",
        };
      }

      // Validate request
      const validationResult = this.validateProvisioningRequest(request);
      if (!validationResult.valid) {
        return {
          tenant: null,
          success: false,
          message: validationResult.message,
        };
      }

      // Generate subdomain if not provided
      const subdomain =
        request.subdomain || (await this.generateSubdomain(request));

      // Check if subdomain already exists
      const { db } = await import("../db");
      const { tenants } = await import("@shared/schema");
      const { eq } = await import("drizzle-orm");

      const existingTenant = await db
        .select()
        .from(tenants)
        .where(eq(tenants.subdomain, subdomain))
        .limit(1);
      if (existingTenant.length > 0) {
        return {
          tenant: null,
          success: false,
          message: `Subdomain '${subdomain}' already exists`,
        };
      }

      // Create tenant entity directly using database for 1qa.md compliance
      const { v4: uuidv4 } = await import("uuid");
      const tenantId = uuidv4();

      const { Tenant } = await import("../domain/entities/Tenant");
      const tenantEntity = new Tenant(tenantId, request.name, subdomain, {
        ...this.config.defaultTenantSettings,
        ...request.settings,
      });

      // Get tenant repository from dependency container
      const { DependencyContainer } = await import(
        "../application/services/DependencyContainer"
      );
      const container = DependencyContainer.getInstance();
      const tenantRepository = await container.getTenantRepository();

      // Save tenant
      const savedTenant = await tenantRepository.save(tenantEntity);

      // Initialize tenant schema and run migrations
      console.log(
        `🏗️ [TENANT-PROVISIONING] Initializing schema for tenant: ${savedTenant.id}`,
      );

      try {
        // First create the schema
        const { schemaManager } = await import("../db");
        await schemaManager.createTenantSchema(savedTenant.id);

        // Run tenant migrations automatically
        console.log(
          `🔧 [TENANT-PROVISIONING] Starting tenant migrations for: ${savedTenant.id}`,
        );
        const migrationModule = await import(
          "../migrations/pg-migrations/config/migration-manager.js"
        );
        const migrationManager = new migrationModule.MigrationManager();

        try {
          await migrationManager.createMigrationTable();
          await migrationManager.runTenantMigrations(savedTenant.id);
          console.log(
            `✅ [TENANT-PROVISIONING] Tenant migrations completed for: ${savedTenant.id}`,
          );
        } catch (migrationError) {
          console.error(
            `❌ [TENANT-PROVISIONING] Migration failed for ${savedTenant.id}:`,
            migrationError,
          );
          throw new Error(
            `Failed to run tenant migrations: ${migrationError.message}`,
          );
        } finally {
          await migrationManager.close();
        }

        // Then initialize it with tables (legacy support)
        await storageSimple.initializeTenantSchema(savedTenant.id);

        // Validate schema was created successfully
        const { TenantValidator } = await import("../database/TenantValidator");
        const isValid = await TenantValidator.validateTenantSchema(
          savedTenant.id,
        );

        if (!isValid) {
          console.error(
            `❌ [TENANT-PROVISIONING] Schema validation failed for tenant ${savedTenant.id}`,
          );
          throw new Error(
            `Schema validation failed for tenant ${savedTenant.id}`,
          );
        }

        // Apply default company template immediately after schema creation
        console.log(
          `🔧 [TENANT-PROVISIONING] Applying default company template for: ${savedTenant.id}`,
        );

        try {
          // Call the internal method to apply template
          await this.applyDefaultCompanyTemplate(savedTenant.id, savedTenant.id); // Assuming companyId is same as tenantId for default template
          console.log(
            `✅ [TENANT-PROVISIONING] Default company template applied for: ${savedTenant.id}`,
          );
        } catch (templateError) {
          console.error(
            `⚠️ [TENANT-PROVISIONING] Template application failed for ${savedTenant.id}:`,
            templateError,
          );
          // Continue without failing the entire tenant creation
        }

        // Initialize ticket configurations with default data
        console.log(
          `🔧 [TENANT-PROVISIONING] Initializing ticket configurations for: ${savedTenant.id}`,
        );
        await this.initializeTicketConfigurations(savedTenant.id, savedTenant.id); // Assuming companyId is same as tenantId for default config

        console.log(
          `✅ [TENANT-PROVISIONING] Schema validated successfully for tenant: ${savedTenant.id}`,
        );

      } catch (schemaError) {
        console.error(
          `❌ [TENANT-PROVISIONING] Schema initialization failed for tenant ${savedTenant.id}:`,
          schemaError,
        );
        throw new Error(
          `Failed to initialize tenant schema: ${schemaError.message}`,
        );
      }

      console.log(
        `✅ [TENANT-PROVISIONING] Tenant schema ready for template application: ${savedTenant.id}`,
      );

      // Log provisioning activity
      console.log(
        `Auto-provisioned tenant: ${savedTenant.name} (${savedTenant.subdomain}) - Trigger: ${request.trigger}`,
      );

      return {
        tenant: savedTenant,
        success: true,
        message: `Tenant '${savedTenant.name}' created successfully`,
      };
    } catch (error) {
      console.error("Error in auto-provisioning:", error);
      return {
        tenant: null,
        success: false,
        message: `Provisioning failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }
  }

  /**
   * Check if tenant should be auto-created for a new user registration
   */
  async shouldAutoProvisionForUser(
    userEmail: string,
    companyName?: string,
  ): Promise<boolean> {
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
  async provisionOnUserRegistration(
    userEmail: string,
    userName: string,
    companyName?: string,
  ): Promise<{ tenant: any; success: boolean; message: string }> {
    const shouldProvision = await this.shouldAutoProvisionForUser(
      userEmail,
      companyName,
    );

    if (!shouldProvision) {
      return {
        tenant: null,
        success: false,
        message: "Auto-provisioning not applicable for this user",
      };
    }

    const tenantName = companyName || `${userName}'s Organization`;

    return await this.provisionTenant({
      name: tenantName,
      companyName,
      userEmail,
      trigger: "registration",
    });
  }

  /**
   * Generate subdomain based on configuration
   */
  private async generateSubdomain(
    request: TenantProvisioningRequest,
  ): Promise<string> {
    let baseSubdomain: string;

    switch (this.config.subdomainGeneration) {
      case "company-based":
        baseSubdomain = this.sanitizeSubdomain(
          request.companyName || request.name,
        );
        break;
      case "user-based":
        baseSubdomain = this.sanitizeSubdomain(
          request.userEmail?.split("@")[0] || request.name,
        );
        break;
      case "random":
      default:
        baseSubdomain = `tenant-${crypto.randomBytes(4).toString("hex")}`;
        break;
    }

    // Ensure uniqueness
    let subdomain = baseSubdomain;
    let counter = 1;

    const { db } = await import("../db");
    const { tenants } = await import("@shared/schema");
    const { eq } = await import("drizzle-orm");

    while (
      (
        await db
          .select()
          .from(tenants)
          .where(eq(tenants.subdomain, subdomain))
          .limit(1)
      ).length > 0
    ) {
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
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .substring(0, 20);
  }

  /**
   * Validate provisioning request
   */
  private validateProvisioningRequest(request: TenantProvisioningRequest): {
    valid: boolean;
    message: string;
  } {
    if (!request.name || request.name.trim().length === 0) {
      return { valid: false, message: "Tenant name is required" };
    }

    if (request.subdomain && !/^[a-z0-9-]+$/.test(request.subdomain)) {
      return {
        valid: false,
        message:
          "Subdomain must contain only lowercase letters, numbers, and hyphens",
      };
    }

    if (request.trigger === "registration" && !request.userEmail) {
      return {
        valid: false,
        message: "User email is required for registration trigger",
      };
    }

    return { valid: true, message: "Valid request" };
  }

  /**
   * Update auto-provisioning configuration
   */
  updateConfig(newConfig: Partial<AutoProvisioningConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log("Auto-provisioning config updated:", this.config);
  }

  /**
   * Get current configuration
   */
  getConfig(): AutoProvisioningConfig {
    return { ...this.config };
  }

  private async applyDefaultCompanyTemplate(tenantId: string, companyId: string): Promise<void> {
    try {
      console.log('🎨 [TENANT-TEMPLATE] Applying default company template...');

      const templateService = new TenantTemplateService();
      await templateService.applyDefaultTemplate(tenantId, companyId);

      console.log('✅ [TENANT-TEMPLATE] Default template applied successfully');
    } catch (error: any) {
      console.error('❌ [TENANT-TEMPLATE] Error applying template:', error);
      throw new Error(`Failed to apply default template: ${error.message}`);
    }
  }

  private async initializeTicketConfigurations(tenantId: string, companyId: string): Promise<void> {
    try {
      console.log('🎫 [TICKET-CONFIG] Initializing ticket configurations...');

      // The hierarchical structure is already created by TenantTemplateService
      // Just create basic field options here
      const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
      const { db } = await import("../db");
      const { sql } = await import("drizzle-orm");

      // Create basic field options (status, priority, etc.)
      const fieldOptions = [
        // Status options
        { field_type: 'status', field_value: 'new', label: 'Novo', color: '#f59e0b', sort_order: 1, is_active: true },
        { field_type: 'status', field_value: 'open', label: 'Aberto', color: '#3b82f6', sort_order: 2, is_active: true },
        { field_type: 'status', field_value: 'in_progress', label: 'Em Progresso', color: '#8b5cf6', sort_order: 3, is_active: true },
        { field_type: 'status', field_value: 'resolved', label: 'Resolvido', color: '#10b981', sort_order: 4, is_active: true },
        { field_type: 'status', field_value: 'closed', label: 'Fechado', color: '#6b7280', sort_order: 5, is_active: true },

        // Priority options
        { field_type: 'priority', field_value: 'low', label: 'Baixa', color: '#10b981', sort_order: 1, is_active: true },
        { field_type: 'priority', field_value: 'medium', label: 'Média', color: '#f59e0b', sort_order: 2, is_active: true },
        { field_type: 'priority', field_value: 'high', label: 'Alta', color: '#f97316', sort_order: 3, is_active: true },
        { field_type: 'priority', field_value: 'critical', label: 'Crítica', color: '#dc2626', sort_order: 4, is_active: true },
      ];

      for (const option of fieldOptions) {
        try {
          await db.execute(sql`
            INSERT INTO "${sql.raw(schemaName)}".ticket_field_options 
            (field_type, field_value, label, color, sort_order, is_active, tenant_id, created_at, updated_at)
            VALUES (
              ${option.field_type}, ${option.field_value}, ${option.label}, ${option.color}, 
              ${option.sort_order}, ${option.is_active}, ${tenantId}, NOW(), NOW()
            )
          `);
        } catch (error) {
          console.warn(`⚠️ Failed to create field option ${option.field_type}:${option.field_value}:`, error.message);
        }
      }

      console.log(`✅ [TICKET-CONFIG] Basic field options initialized successfully!`);

    } catch (error) {
      console.error('❌ [TICKET-CONFIG] Erro ao inicializar configurações básicas:', error);
      // Don't throw, as this is not critical
    }
  }

  private async validateHierarchicalStructure(tenantId: string): Promise<void> {
    try {
      console.log('🔍 [VALIDATION] Validating hierarchical structure...');

      const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
      const { db } = await import("../db");
      const { sql } = await import("drizzle-orm");

      // Verificar se temos exatamente 5 categorias
      const categoriesResult = await db.execute(sql`
        SELECT COUNT(*) as count FROM "${sql.raw(schemaName)}"."ticket_categories"
        WHERE tenant_id = ${tenantId} AND active = true
      `);

      const categoriesCount = Number(categoriesResult[0]?.count || 0);

      if (categoriesCount !== 5) {
        throw new Error(`Expected 5 categories, found ${categoriesCount}`);
      }

      // Verificar subcategorias
      const subcategoriesResult = await db.execute(sql`
        SELECT COUNT(*) as count FROM "${sql.raw(schemaName)}"."ticket_subcategories"
        WHERE tenant_id = ${tenantId} AND active = true
      `);

      const subcategoriesCount = Number(subcategoriesResult[0]?.count || 0);

      console.log(`✅ [VALIDATION] Structure validated: ${categoriesCount} categories, ${subcategoriesCount} subcategories`);

      if (subcategoriesCount < 20) {
        console.warn(`⚠️ [VALIDATION] Expected at least 20 subcategories, found ${subcategoriesCount}`);
      }

    } catch (error) {
      console.error('❌ [VALIDATION] Structure validation failed:', error);
      throw error;
    }
  }
}

export const tenantAutoProvisioningService =
  new TenantAutoProvisioningService();