/**
 * Tenant Auto-Provisioning Service
 * Handles automatic tenant creation based on different triggers
 */

// Removed direct storage import - using database directly for 1qa.md compliance
import { DependencyContainer } from "../application/services/DependencyContainer";
import crypto from "crypto";
import { storageSimple } from "../storage-simple";
import { TenantTemplateService } from "./TenantTemplateService"; // Assuming TenantTemplateService is in the same directory or accessible path

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

      // 1. Create ticket field configurations
      const fieldConfigs = [
        {
          fieldName: 'status',
          displayName: 'Status',
          fieldType: 'select',
          options: [
            { value: 'novo', label: 'Novo', color: '#6b7280', sortOrder: 1, isDefault: true, statusType: 'open' },
            { value: 'aberto', label: 'Aberto', color: '#3b82f6', sortOrder: 2, isDefault: false, statusType: 'open' },
            { value: 'em_andamento', label: 'Em Andamento', color: '#f59e0b', sortOrder: 3, isDefault: false, statusType: 'open' },
            { value: 'resolvido', label: 'Resolvido', color: '#10b981', sortOrder: 4, isDefault: false, statusType: 'paused' },
            { value: 'fechado', label: 'Fechado', color: '#6b7280', sortOrder: 5, isDefault: false, statusType: 'closed' }
          ]
        },
        {
          fieldName: 'priority',
          displayName: 'Prioridade',
          fieldType: 'select',
          options: [
            { value: 'low', label: 'Baixa', color: '#10b981', sortOrder: 1, isDefault: false },
            { value: 'medium', label: 'Média', color: '#f59e0b', sortOrder: 2, isDefault: true },
            { value: 'high', label: 'Alta', color: '#ef4444', sortOrder: 3, isDefault: false },
            { value: 'critical', label: 'Crítica', color: '#dc2626', sortOrder: 4, isDefault: false }
          ]
        },
        {
          fieldName: 'impact',
          displayName: 'Impacto',
          fieldType: 'select',
          options: [
            { value: 'baixo', label: 'Baixo', color: '#10b981', sortOrder: 1, isDefault: true },
            { value: 'medio', label: 'Médio', color: '#f59e0b', sortOrder: 2, isDefault: false },
            { value: 'alto', label: 'Alto', color: '#ef4444', sortOrder: 3, isDefault: false }
          ]
        },
        {
          fieldName: 'urgency',
          displayName: 'Urgência',
          fieldType: 'select',
          options: [
            { value: 'low', label: 'Baixa', color: '#10b981', sortOrder: 1, isDefault: true },
            { value: 'medium', label: 'Média', color: '#f59e0b', sortOrder: 2, isDefault: false },
            { value: 'high', label: 'Alta', color: '#ef4444', sortOrder: 3, isDefault: false }
          ]
        }
      ];

      // 2. Insert field configurations and options
      for (const config of fieldConfigs) {
        // Insert field configuration
        const configResult = await db.execute(`
          INSERT INTO "${schemaName}"."ticket_field_configurations" 
          (tenant_id, company_id, field_name, display_name, field_type, is_required, is_system_field, sort_order, is_active)
          VALUES ('${tenantId}', '${companyId}', '${config.fieldName}', '${config.displayName}', '${config.fieldType}', true, true, 1, true)
          ON CONFLICT (tenant_id, company_id, field_name) DO UPDATE SET updated_at = NOW()
          RETURNING id
        `);

        if (configResult.rows.length > 0) {
          const fieldConfigId = configResult.rows[0].id;

          // Insert field options
          for (const option of config.options) {
            await db.execute(`
              INSERT INTO "${schemaName}"."ticket_field_options" 
              (tenant_id, company_id, field_config_id, option_value, display_label, color_hex, sort_order, is_default, is_active, option_config)
              VALUES (
                '${tenantId}', 
                '${companyId}', 
                '${fieldConfigId}', 
                '${option.value}', 
                '${option.label}', 
                '${option.color}', 
                ${option.sortOrder}, 
                ${option.isDefault}, 
                true,
                ${option.statusType ? `'{"statusType":"${option.statusType}"}'::jsonb` : 'null'}
              )
              ON CONFLICT (tenant_id, company_id, field_config_id, option_value) DO NOTHING
            `);
          }

          console.log(`✅ [TICKET-CONFIG] Field ${config.fieldName} configured with ${config.options.length} options`);
        }
      }

      // 3. Create default categories
      const categories = [
        { name: 'Suporte Técnico', description: 'Problemas relacionados a infraestrutura, hardware e software', color: '#3b82f6', icon: 'wrench' },
        { name: 'Atendimento ao Cliente', description: 'Dúvidas, reclamações e suporte geral ao cliente', color: '#10b981', icon: 'user-check' },
        { name: 'Financeiro', description: 'Questões relacionadas a faturamento, pagamentos e contratos', color: '#f59e0b', icon: 'dollar-sign' },
        { name: 'Administrativo', description: 'Processos internos, documentação e gestão', color: '#8b5cf6', icon: 'file-text' }
      ];

      const categoryIds: Record<string, string> = {};

      for (const [index, category] of categories.entries()) {
        const categoryResult = await db.execute(`
          INSERT INTO "${schemaName}"."ticket_categories" 
          (id, tenant_id, company_id, name, description, color, icon, active, sort_order, created_at, updated_at)
          VALUES (gen_random_uuid(), '${tenantId}', '${companyId}', '${category.name}', '${category.description}', '${category.color}', '${category.icon}', true, ${index + 1}, NOW(), NOW())
          ON CONFLICT (tenant_id, company_id, name) DO UPDATE SET updated_at = NOW()
          RETURNING id
        `);

        if (categoryResult.rows.length > 0) {
          categoryIds[category.name] = categoryResult.rows[0].id;
        }
      }

      // 4. Create default subcategories
      const subcategories = [
        // Suporte Técnico
        { categoryName: 'Suporte Técnico', name: 'Hardware', description: 'Problemas com equipamentos físicos', color: '#ef4444', icon: 'monitor' },
        { categoryName: 'Suporte Técnico', name: 'Software', description: 'Problemas com aplicações e licenças', color: '#8b5cf6', icon: 'code' },
        { categoryName: 'Suporte Técnico', name: 'Rede', description: 'Problemas de conectividade e infraestrutura', color: '#06b6d4', icon: 'wifi' },

        // Atendimento ao Cliente
        { categoryName: 'Atendimento ao Cliente', name: 'Dúvidas Gerais', description: 'Questões sobre produtos e serviços', color: '#10b981', icon: 'help-circle' },
        { categoryName: 'Atendimento ao Cliente', name: 'Reclamações', description: 'Insatisfação com produtos ou serviços', color: '#f59e0b', icon: 'alert-triangle' },
        { categoryName: 'Atendimento ao Cliente', name: 'Sugestões', description: 'Ideias de melhoria e feedback', color: '#3b82f6', icon: 'lightbulb' },

        // Financeiro
        { categoryName: 'Financeiro', name: 'Faturamento', description: 'Dúvidas sobre cobranças e faturas', color: '#f59e0b', icon: 'receipt' },
        { categoryName: 'Financeiro', name: 'Pagamentos', description: 'Questões sobre forma de pagamento', color: '#10b981', icon: 'credit-card' },
        { categoryName: 'Financeiro', name: 'Contratos', description: 'Alterações e renovações contratuais', color: '#8b5cf6', icon: 'file-signature' }
      ];

      const subcategoryIds: Record<string, string> = {};

      for (const [index, subcategory] of subcategories.entries()) {
        const categoryId = categoryIds[subcategory.categoryName];
        if (categoryId) {
          const subcategoryResult = await db.execute(`
            INSERT INTO "${schemaName}"."ticket_subcategories" 
            (id, tenant_id, company_id, category_id, name, description, color, icon, active, sort_order, created_at, updated_at)
            VALUES (gen_random_uuid(), '${tenantId}', '${companyId}', '${categoryId}', '${subcategory.name}', '${subcategory.description}', '${subcategory.color}', '${subcategory.icon}', true, ${index + 1}, NOW(), NOW())
            ON CONFLICT (tenant_id, company_id, category_id, name) DO UPDATE SET updated_at = NOW()
            RETURNING id
          `);

          if (subcategoryResult.rows.length > 0) {
            subcategoryIds[subcategory.name] = subcategoryResult.rows[0].id;
          }
        }
      }

      // 5. Create default actions
      const actions = [
        // Hardware
        { subcategoryName: 'Hardware', name: 'Diagnóstico de Hardware', description: 'Verificar funcionamento de componentes físicos', estimatedTime: 60, color: '#ef4444', icon: 'search', actionType: 'diagnostic' },
        { subcategoryName: 'Hardware', name: 'Substituição de Peças', description: 'Trocar componentes defeituosos', estimatedTime: 120, color: '#ef4444', icon: 'tool', actionType: 'repair' },

        // Software
        { subcategoryName: 'Software', name: 'Reinstalação de Software', description: 'Remover e instalar novamente aplicações', estimatedTime: 45, color: '#8b5cf6', icon: 'download', actionType: 'installation' },
        { subcategoryName: 'Software', name: 'Atualização de Sistema', description: 'Aplicar patches e atualizações', estimatedTime: 30, color: '#8b5cf6', icon: 'refresh-cw', actionType: 'update' },

        // Rede
        { subcategoryName: 'Rede', name: 'Teste de Conectividade', description: 'Verificar comunicação de rede', estimatedTime: 20, color: '#06b6d4', icon: 'activity', actionType: 'testing' },
        { subcategoryName: 'Rede', name: 'Configuração de Firewall', description: 'Ajustar regras de segurança', estimatedTime: 40, color: '#06b6d4', icon: 'shield', actionType: 'configuration' },

        // Dúvidas Gerais
        { subcategoryName: 'Dúvidas Gerais', name: 'Resposta por E-mail', description: 'Esclarecer dúvidas via comunicação escrita', estimatedTime: 15, color: '#10b981', icon: 'mail', actionType: 'communication' },
        { subcategoryName: 'Dúvidas Gerais', name: 'Atendimento Telefônico', description: 'Esclarecimento por telefone', estimatedTime: 20, color: '#10b981', icon: 'phone', actionType: 'communication' },

        // Faturamento
        { subcategoryName: 'Faturamento', name: 'Verificar Cobrança', description: 'Analisar itens da fatura', estimatedTime: 20, color: '#f59e0b', icon: 'calculator', actionType: 'verification' },
        { subcategoryName: 'Faturamento', name: 'Reemitir Fatura', description: 'Gerar nova via do documento', estimatedTime: 10, color: '#f59e0b', icon: 'file-text', actionType: 'documentation' }
      ];

      for (const [index, action] of actions.entries()) {
        const subcategoryId = subcategoryIds[action.subcategoryName];
        if (subcategoryId) {
          await db.execute(`
            INSERT INTO "${schemaName}"."ticket_actions" 
            (id, tenant_id, company_id, subcategory_id, name, description, estimated_time_minutes, color, icon, active, sort_order, action_type, created_at, updated_at)
            VALUES (
              gen_random_uuid(), 
              '${tenantId}', 
              '${companyId}', 
              '${subcategoryId}', 
              '${action.name}', 
              '${action.description}', 
              ${action.estimatedTime}, 
              '${action.color}', 
              '${action.icon}', 
              true, 
              ${index + 1}, 
              '${action.actionType}', 
              NOW(), 
              NOW()
            )
            ON CONFLICT (tenant_id, company_id, subcategory_id, name) DO UPDATE SET updated_at = NOW()
          `);
        }
      }

      console.log('✅ [TICKET-CONFIG] Ticket configurations initialized successfully:', {
        fieldConfigs: fieldConfigs.length,
        categories: categories.length,
        subcategories: subcategories.length,
        actions: actions.length
      });

    } catch (error: any) {
      console.error('❌ [TICKET-CONFIG] Error initializing ticket configurations:', error);
      throw new Error(`Failed to initialize ticket configurations: ${error.message}`);
    }
  }
}

export const tenantAutoProvisioningService =
  new TenantAutoProvisioningService();