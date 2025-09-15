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

        // Check if this is the first tenant to apply the template
        const { db } = await import("../db");
        const { tenants } = await import("@shared/schema");
        const { count } = await import("drizzle-orm");

        const tenantCount = await db.select({ count: count() }).from(tenants);

        if (tenantCount[0].count === 1) {
          // This is the first tenant, apply the template
          try {
            await this.initializeTicketConfigurations(savedTenant.id, savedTenant.id); // Assuming companyId is same as tenantId for default config
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
        } else {
          console.log(
            `ℹ️ [TENANT-PROVISIONING] Skipping template application for tenant ${savedTenant.id} as it's not the first tenant.`,
          );
        }


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

  public async initializeTicketConfigurations(tenantId: string, companyId: string): Promise<void> {
    try {
      console.log('🎫 [TICKET-CONFIG] Initializing ticket configurations...');

      const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
      const { db } = await import("../db");

      // Need to import randomUUID from 'crypto' if it's not globally available
      const { randomUUID } = await import("crypto");

      // ============================================================================
      // SEÇÃO 3: CRIAR CATEGORIAS, SUBCATEGORIAS E AÇÕES (NOVA ESTRUTURA DE 5 CATEGORIAS)
      // ============================================================================

      console.log('🎯 Criando nova estrutura hierárquica de 5 categorias...');

      // 3.1. Criar categorias (Nova estrutura moderna)
      const categories = [
        {
          name: 'Infraestrutura & Equipamentos',
          color: '#6366f1',
          description: 'Problemas relacionados a hardware, equipamentos e infraestrutura física',
          icon: 'server'
        },
        {
          name: 'Software & Aplicações',
          color: '#10b981',
          description: 'Questões relacionadas a softwares, aplicativos e sistemas',
          icon: 'code'
        },
        {
          name: 'Conectividade & Redes',
          color: '#8b5cf6',
          description: 'Problemas de rede, conectividade e comunicação',
          icon: 'wifi'
        },
        {
          name: 'Segurança & Acesso',
          color: '#dc2626',
          description: 'Questões de segurança, acessos e permissões',
          icon: 'shield'
        },
        {
          name: 'Usuários & Suporte',
          color: '#f59e0b',
          description: 'Solicitações de usuários, treinamentos e suporte geral',
          icon: 'user-check'
        }
      ];

      const categoryIds: Record<string, string> = {};

      for (const [index, category] of categories.entries()) {
        const categoryId = randomUUID();
        categoryIds[category.name] = categoryId;

        await db.execute(sql`
          INSERT INTO "${sql.raw(schemaName)}"."ticket_categories"
          (id, tenant_id, company_id, name, description, color, icon, active, sort_order, created_at, updated_at)
          VALUES (
            ${categoryId}, ${tenantId}, ${companyId}, ${category.name}, ${category.description},
            ${category.color}, ${category.icon}, true, ${index + 1}, NOW(), NOW()
          )
        `);

        console.log(`✅ Categoria criada: ${category.name}`);
      }

      // 3.2. Criar subcategorias (Nova estrutura abrangente)
      const subcategories = [
        // Infraestrutura & Equipamentos
        { name: 'Computadores Desktop', categoryName: 'Infraestrutura & Equipamentos', color: '#6366f1', description: 'Problemas com PCs fixos' },
        { name: 'Notebooks e Móveis', categoryName: 'Infraestrutura & Equipamentos', color: '#6366f1', description: 'Laptops, tablets, dispositivos móveis' },
        { name: 'Servidores', categoryName: 'Infraestrutura & Equipamentos', color: '#6366f1', description: 'Infraestrutura de servidores' },
        { name: 'Periféricos', categoryName: 'Infraestrutura & Equipamentos', color: '#6366f1', description: 'Impressoras, monitores, teclados, mouse' },

        // Software & Aplicações
        { name: 'Sistema Operacional', categoryName: 'Software & Aplicações', color: '#10b981', description: 'Windows, Linux, macOS' },
        { name: 'Aplicações Corporativas', categoryName: 'Software & Aplicações', color: '#10b981', description: 'ERP, CRM, sistemas internos' },
        { name: 'Software de Produtividade', categoryName: 'Software & Aplicações', color: '#10b981', description: 'Office, navegadores, ferramentas' },
        { name: 'Licenciamento', categoryName: 'Software & Aplicações', color: '#10b981', description: 'Renovações, ativações, compliance' },

        // Conectividade & Redes
        { name: 'Rede Local (LAN)', categoryName: 'Conectividade & Redes', color: '#8b5cf6', description: 'Switches, cabos, conectividade interna' },
        { name: 'Internet e WAN', categoryName: 'Conectividade & Redes', color: '#8b5cf6', description: 'Conexões externas, provedores' },
        { name: 'Wi-Fi e Wireless', categoryName: 'Conectividade & Redes', color: '#8b5cf6', description: 'Redes sem fio, access points' },
        { name: 'VPN e Acesso Remoto', categoryName: 'Conectividade & Redes', color: '#8b5cf6', description: 'Conexões seguras, trabalho remoto' },

        // Segurança & Acesso
        { name: 'Controle de Acesso', categoryName: 'Segurança & Acesso', color: '#dc2626', description: 'Permissões, usuários, grupos' },
        { name: 'Antivírus e Proteção', categoryName: 'Segurança & Acesso', color: '#dc2626', description: 'Malware, ameaças, quarentena' },
        { name: 'Backup e Recovery', categoryName: 'Segurança & Acesso', color: '#dc2626', description: 'Backups, restaurações, disaster recovery' },

        // Usuários & Suporte
        { name: 'Contas e Perfis', categoryName: 'Usuários & Suporte', color: '#f59e0b', description: 'Criação, alteração, desativação de usuários' },
        { name: 'Treinamento', categoryName: 'Usuários & Suporte', color: '#f59e0b', description: 'Capacitação, manuais, orientações' },
        { name: 'Solicitações Gerais', categoryName: 'Usuários & Suporte', color: '#f59e0b', description: 'Pedidos diversos, informações' }
      ];

      const subcategoryIds: Record<string, string> = {};

      for (const [index, subcategory] of subcategories.entries()) {
        const subcategoryId = randomUUID();
        subcategoryIds[subcategory.name] = subcategoryId;
        const categoryId = categoryIds[subcategory.categoryName];

        await db.execute(sql`
          INSERT INTO "${sql.raw(schemaName)}"."ticket_subcategories"
          (id, tenant_id, company_id, category_id, name, description, color, active, sort_order, created_at, updated_at)
          VALUES (
            ${subcategoryId}, ${tenantId}, ${companyId}, ${categoryId}, ${subcategory.name},
            ${subcategory.description}, ${subcategory.color}, true, ${index + 1}, NOW(), NOW()
          )
        `);

        console.log(`✅ Subcategoria criada: ${subcategory.name}`);
      }

      // 3.3. Criar ações (Ações específicas para cada contexto)
      const actions = [
        // Infraestrutura & Equipamentos
        { name: 'Substituição de Componente', subcategoryName: 'Computadores Desktop', color: '#6366f1', description: 'Trocar peça defeituosa' },
        { name: 'Manutenção Preventiva', subcategoryName: 'Computadores Desktop', color: '#6366f1', description: 'Limpeza e verificação geral' },
        { name: 'Configuração de Hardware', subcategoryName: 'Notebooks e Móveis', color: '#6366f1', description: 'Configurar dispositivo móvel' },
        { name: 'Instalação de Equipamento', subcategoryName: 'Servidores', color: '#6366f1', description: 'Instalar novo servidor' },
        { name: 'Diagnóstico Técnico', subcategoryName: 'Periféricos', color: '#6366f1', description: 'Diagnosticar problema em periférico' },

        // Software & Aplicações
        { name: 'Instalação de Software', subcategoryName: 'Sistema Operacional', color: '#10b981', description: 'Instalar aplicação no sistema' },
        { name: 'Atualização de Sistema', subcategoryName: 'Sistema Operacional', color: '#10b981', description: 'Atualizar SO para nova versão' },
        { name: 'Correção de Bug', subcategoryName: 'Aplicações Corporativas', color: '#10b981', description: 'Corrigir erro em aplicação' },
        { name: 'Configuração de Aplicação', subcategoryName: 'Software de Produtividade', color: '#10b981', description: 'Configurar software para usuário' },
        { name: 'Licenciamento', subcategoryName: 'Licenciamento', color: '#10b981', description: 'Renovar ou ativar licença' },

        // Conectividade & Redes
        { name: 'Diagnóstico de Rede', subcategoryName: 'Rede Local (LAN)', color: '#8b5cf6', description: 'Diagnosticar problema de conexão' },
        { name: 'Configuração de Acesso', subcategoryName: 'Internet e WAN', color: '#8b5cf6', description: 'Configurar acesso à internet' },
        { name: 'Reset de Conexão', subcategoryName: 'Wi-Fi e Wireless', color: '#8b5cf6', description: 'Resetar configurações Wi-Fi' },
        { name: 'Configuração VPN', subcategoryName: 'VPN e Acesso Remoto', color: '#8b5cf6', description: 'Configurar conexão VPN' },

        // Segurança & Acesso
        { name: 'Liberação de Acesso', subcategoryName: 'Controle de Acesso', color: '#dc2626', description: 'Liberar acesso para usuário' },
        { name: 'Bloqueio de Ameaça', subcategoryName: 'Antivírus e Proteção', color: '#dc2626', description: 'Bloquear ameaça detectada' },
        { name: 'Restauração de Backup', subcategoryName: 'Backup e Recovery', color: '#dc2626', description: 'Restaurar dados de backup' },

        // Usuários & Suporte
        { name: 'Criação de Usuário', subcategoryName: 'Contas e Perfis', color: '#f59e0b', description: 'Criar nova conta de usuário' },
        { name: 'Treinamento Técnico', subcategoryName: 'Treinamento', color: '#f59e0b', description: 'Treinar usuário em sistema' },
        { name: 'Orientação Técnica', subcategoryName: 'Solicitações Gerais', color: '#f59e0b', description: 'Orientar usuário sobre procedimento' }
      ];

      for (const [index, action] of actions.entries()) {
        const actionId = randomUUID();
        const subcategoryId = subcategoryIds[action.subcategoryName];

        await db.execute(sql`
          INSERT INTO "${sql.raw(schemaName)}"."ticket_actions"
          (id, tenant_id, company_id, subcategory_id, name, description, color, active, sort_order, created_at, updated_at)
          VALUES (
            ${actionId}, ${tenantId}, ${companyId}, ${subcategoryId}, ${action.name},
            ${action.description}, ${action.color}, true, ${index + 1}, NOW(), NOW()
          )
        `);

        console.log(`✅ Ação criada: ${action.name}`);
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