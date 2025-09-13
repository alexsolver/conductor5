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

      const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
      const { db } = await import("../db");

      // 1. Create ticket categories first
      const categories = [
        { id: crypto.randomUUID(), name: 'Hardware', description: 'Problemas de hardware', color: '#3b82f6', sortOrder: 1 },
        { id: crypto.randomUUID(), name: 'Software', description: 'Problemas de software', color: '#10b981', sortOrder: 2 },
        { id: crypto.randomUUID(), name: 'Rede', description: 'Problemas de rede', color: '#f59e0b', sortOrder: 3 }
      ];

      for (const category of categories) {
        await db.execute(sql`
          INSERT INTO "${sql.raw(schemaName)}"."ticket_categories" (
            id, tenant_id, company_id, name, description, color, icon, active, sort_order, created_at, updated_at
          ) VALUES (
            ${category.id}, ${tenantId}, ${companyId}, ${category.name}, ${category.description}, 
            ${category.color}, null, true, ${category.sortOrder}, NOW(), NOW()
          )
        `);
      }

      // 2. Create subcategories for each category
      const subcategories = [
        // Hardware subcategories
        { id: crypto.randomUUID(), name: 'Desktop', description: 'Problemas com Desktops', categoryId: categories[0].id, color: '#60a5fa', sortOrder: 1 },
        { id: crypto.randomUUID(), name: 'Impressora', description: 'Problemas com Impressoras', categoryId: categories[0].id, color: '#a78bfa', sortOrder: 2 },
        // Software subcategories
        { id: crypto.randomUUID(), name: 'Sistema Operacional', description: 'Problemas com SO', categoryId: categories[1].id, color: '#34d399', sortOrder: 1 },
        { id: crypto.randomUUID(), name: 'Aplicativo', description: 'Problemas com Aplicativos', categoryId: categories[1].id, color: '#fbbf24', sortOrder: 2 },
        // Network subcategories
        { id: crypto.randomUUID(), name: 'Conectividade', description: 'Problemas de conexão', categoryId: categories[2].id, color: '#fb923c', sortOrder: 1 },
        { id: crypto.randomUUID(), name: 'Equipamento', description: 'Problemas com equipamentos de rede', categoryId: categories[2].id, color: '#f87171', sortOrder: 2 }
      ];

      for (const subcategory of subcategories) {
        await db.execute(sql`
          INSERT INTO "${sql.raw(schemaName)}"."ticket_subcategories" (
            id, tenant_id, company_id, category_id, name, description, color, icon, active, sort_order, created_at, updated_at
          ) VALUES (
            ${subcategory.id}, ${tenantId}, ${companyId}, ${subcategory.categoryId}, ${subcategory.name}, 
            ${subcategory.description}, ${subcategory.color}, null, true, ${subcategory.sortOrder}, NOW(), NOW()
          )
        `);
      }

      // 3. Create actions for each subcategory
      const actions = [
        // Desktop actions
        { name: 'Diagnóstico Inicial', description: 'Verificação preliminar do problema', subcategoryId: subcategories[0].id, estimatedTime: 10, color: '#93c5fc' },
        { name: 'Troca de Componente', description: 'Substituição de peça defeituosa', subcategoryId: subcategories[0].id, estimatedTime: 30, color: '#a7f3d0' },
        { name: 'Teste de Funcionamento', description: 'Validação pós-reparo', subcategoryId: subcategories[0].id, estimatedTime: 15, color: '#fde68a' },

        // Printer actions
        { name: 'Configuração de Rede', description: 'Setup de conexão de rede', subcategoryId: subcategories[1].id, estimatedTime: 20, color: '#c4b5fd' },
        { name: 'Troca de Toner/Tinta', description: 'Substituição de consumíveis', subcategoryId: subcategories[1].id, estimatedTime: 10, color: '#fbbf24' },
        { name: 'Manutenção Preventiva', description: 'Limpeza e verificação', subcategoryId: subcategories[1].id, estimatedTime: 25, color: '#fb7185' },

        // OS actions
        { name: 'Atualização de Sistema', description: 'Update do SO', subcategoryId: subcategories[2].id, estimatedTime: 45, color: '#6ee7b7' },
        { name: 'Reinstalação', description: 'Formatação e nova instalação', subcategoryId: subcategories[2].id, estimatedTime: 120, color: '#fcd34d' },
        { name: 'Configuração de Permissões', description: 'Ajuste de acesso', subcategoryId: subcategories[2].id, estimatedTime: 15, color: '#f472b6' },

        // Application actions
        { name: 'Instalação de Software', description: 'Setup de nova aplicação', subcategoryId: subcategories[3].id, estimatedTime: 20, color: '#fef08a' },
        { name: 'Atualização de Versão', description: 'Update de aplicativo', subcategoryId: subcategories[3].id, estimatedTime: 15, color: '#c084fc' },
        { name: 'Correção de Configuração', description: 'Ajuste de settings', subcategoryId: subcategories[3].id, estimatedTime: 10, color: '#fb923c' },

        // Connectivity actions
        { name: 'Teste de Conectividade', description: 'Verificação de conexão', subcategoryId: subcategories[4].id, estimatedTime: 10, color: '#fbbf24' },
        { name: 'Configuração de IP', description: 'Setup de endereçamento', subcategoryId: subcategories[4].id, estimatedTime: 15, color: '#a78bfa' },
        { name: 'Reset de Equipamento', description: 'Reinicialização de dispositivos', subcategoryId: subcategories[4].id, estimatedTime: 5, color: '#fb7185' },

        // Equipment actions
        { name: 'Substituição de Cabo', description: 'Troca de cabeamento', subcategoryId: subcategories[5].id, estimatedTime: 10, color: '#34d399' },
        { name: 'Configuração de Switch/Router', description: 'Setup de equipamentos', subcategoryId: subcategories[5].id, estimatedTime: 30, color: '#60a5fa' },
        { name: 'Documentação Técnica', description: 'Registro de alterações', subcategoryId: subcategories[5].id, estimatedTime: 10, color: '#fcd34d' }
      ];

      for (const action of actions) {
        const actionId = crypto.randomUUID();
        await db.execute(sql`
          INSERT INTO "${sql.raw(schemaName)}"."ticket_actions" (
            id, tenant_id, company_id, subcategory_id, name, description, estimated_time_minutes, 
            color, icon, active, sort_order, created_at, updated_at
          ) VALUES (
            ${actionId}, ${tenantId}, ${companyId}, ${action.subcategoryId}, ${action.name}, 
            ${action.description}, ${action.estimatedTime}, ${action.color}, null, true, 
            ${action.sortOrder || 1}, NOW(), NOW()
          )
        `);
      }

      console.log('✅ [TICKET-CONFIG] Ticket configurations initialized successfully');
    } catch (error: any) {
      console.error('❌ [TICKET-CONFIG] Error initializing ticket configurations:', error);
      throw new Error(`Failed to initialize ticket configurations: ${error.message}`);
    }
  }
}

export const tenantAutoProvisioningService =
  new TenantAutoProvisioningService();