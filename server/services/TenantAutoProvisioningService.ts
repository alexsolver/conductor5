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
          icon: 'users'
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
        { name: 'Wi-Fi e Internet', categoryName: 'Conectividade & Redes', color: '#8b5cf6', description: 'Problemas de conexão sem fio e internet' },
        { name: 'Redes Corporativas', categoryName: 'Conectividade & Redes', color: '#8b5cf6', description: 'VPNs, domínios, servidores de rede' },
        { name: 'Telefonia', categoryName: 'Conectividade & Redes', color: '#8b5cf6', description: 'Ramais, VOIP, sistemas telefônicos' },
        { name: 'Comunicação Digital', categoryName: 'Conectividade & Redes', color: '#8b5cf6', description: 'E-mail, Teams, videoconferência' },

        // Segurança & Acesso
        { name: 'Controle de Acesso', categoryName: 'Segurança & Acesso', color: '#dc2626', description: 'Senhas, bloqueios, permissões' },
        { name: 'Antivírus e Proteção', categoryName: 'Segurança & Acesso', color: '#dc2626', description: 'Malware, vírus, firewall' },
        { name: 'Backup e Recuperação', categoryName: 'Segurança & Acesso', color: '#dc2626', description: 'Backups, restauração de dados' },
        { name: 'Certificados Digitais', categoryName: 'Segurança & Acesso', color: '#dc2626', description: 'Certificados, assinaturas digitais' },

        // Usuários & Suporte
        { name: 'Treinamento', categoryName: 'Usuários & Suporte', color: '#f59e0b', description: 'Capacitação, tutoriais, dúvidas' },
        { name: 'Solicitações Gerais', categoryName: 'Usuários & Suporte', color: '#f59e0b', description: 'Pedidos diversos dos usuários' },
        { name: 'Suporte Remoto', categoryName: 'Usuários & Suporte', color: '#f59e0b', description: 'Assistência técnica à distância' },
        { name: 'Consultoria', categoryName: 'Usuários & Suporte', color: '#f59e0b', description: 'Orientações técnicas especializadas' }
      ];

      const subcategoryIds: Record<string, string> = {};

      for (const [index, subcategory] of subcategories.entries()) {
        const subcategoryId = randomUUID();
        const categoryId = categoryIds[subcategory.categoryName];

        if (!categoryId) {
          console.warn(`[TICKET-CONFIG] Category not found: ${subcategory.categoryName}`);
          continue;
        }

        subcategoryIds[subcategory.name] = subcategoryId;

        await db.execute(sql`
          INSERT INTO "${sql.raw(schemaName)}"."ticket_subcategories"
          (id, tenant_id, company_id, category_id, name, description, color, icon, active, sort_order, created_at, updated_at)
          VALUES (
            ${subcategoryId}, ${tenantId}, ${companyId}, ${categoryId}, ${subcategory.name}, ${subcategory.description},
            ${subcategory.color}, 'folder', true, ${index + 1}, NOW(), NOW()
          )
        `);

        console.log(`✅ Subcategoria criada: ${subcategory.name}`);
      }

      // 3.3. Criar ações (Nova estrutura completa)
      const actions = [
        // Infraestrutura & Equipamentos - Desktop
        { name: 'Verificar Conexões', subcategoryName: 'Computadores Desktop', color: '#6366f1', description: 'Verificar cabos e conexões físicas' },
        { name: 'Reinstalar Sistema', subcategoryName: 'Computadores Desktop', color: '#6366f1', description: 'Formatação e reinstalação completa' },
        { name: 'Substituir Hardware', subcategoryName: 'Computadores Desktop', color: '#6366f1', description: 'Troca de componentes defeituosos' },

        // Notebooks e Móveis
        { name: 'Calibrar Tela', subcategoryName: 'Notebooks e Móveis', color: '#6366f1', description: 'Ajustar configurações de display' },
        { name: 'Substituir Bateria', subcategoryName: 'Notebooks e Móveis', color: '#6366f1', description: 'Troca de bateria do notebook' },
        { name: 'Configurar Mobile', subcategoryName: 'Notebooks e Móveis', color: '#6366f1', description: 'Setup inicial de dispositivos móveis' },

        // Servidores
        { name: 'Reiniciar Serviços', subcategoryName: 'Servidores', color: '#6366f1', description: 'Restart de serviços críticos' },
        { name: 'Monitorar Performance', subcategoryName: 'Servidores', color: '#6366f1', description: 'Análise de recursos do servidor' },
        { name: 'Aplicar Updates', subcategoryName: 'Servidores', color: '#6366f1', description: 'Atualizações de sistema e segurança' },

        // Periféricos
        { name: 'Configurar Impressora', subcategoryName: 'Periféricos', color: '#6366f1', description: 'Setup e configuração de impressoras' },
        { name: 'Instalar Drivers', subcategoryName: 'Periféricos', color: '#6366f1', description: 'Instalação de drivers específicos' },
        { name: 'Calibrar Monitor', subcategoryName: 'Periféricos', color: '#6366f1', description: 'Ajuste de cores e resolução' },

        // Software & Aplicações - Sistema Operacional
        { name: 'Aplicar Patches', subcategoryName: 'Sistema Operacional', color: '#10b981', description: 'Instalação de correções do SO' },
        { name: 'Otimizar Performance', subcategoryName: 'Sistema Operacional', color: '#10b981', description: 'Limpeza e otimização do sistema' },
        { name: 'Configurar Usuário', subcategoryName: 'Sistema Operacional', color: '#10b981', description: 'Criação e configuração de contas' },

        // Aplicações Corporativas
        { name: 'Sincronizar Dados', subcategoryName: 'Aplicações Corporativas', color: '#10b981', description: 'Sincronização de bases de dados' },
        { name: 'Configurar Integração', subcategoryName: 'Aplicações Corporativas', color: '#10b981', description: 'Setup de integrações entre sistemas' },
        { name: 'Treinar Usuário', subcategoryName: 'Aplicações Corporativas', color: '#10b981', description: 'Capacitação no uso da aplicação' },

        // Software de Produtividade
        { name: 'Restaurar Arquivo', subcategoryName: 'Software de Produtividade', color: '#10b981', description: 'Recuperação de documentos perdidos' },
        { name: 'Configurar Add-ins', subcategoryName: 'Software de Produtividade', color: '#10b981', description: 'Instalação de complementos' },
        { name: 'Migrar Dados', subcategoryName: 'Software de Produtividade', color: '#10b981', description: 'Transferência entre versões' },

        // Licenciamento
        { name: 'Renovar Licença', subcategoryName: 'Licenciamento', color: '#10b981', description: 'Processo de renovação de licenças' },
        { name: 'Ativar Software', subcategoryName: 'Licenciamento', color: '#10b981', description: 'Ativação de produtos licenciados' },
        { name: 'Auditoria Compliance', subcategoryName: 'Licenciamento', color: '#10b981', description: 'Verificação de conformidade' },

        // Conectividade & Redes - Wi-Fi e Internet
        { name: 'Resetar Conexão', subcategoryName: 'Wi-Fi e Internet', color: '#8b5cf6', description: 'Reinicializar configurações de rede' },
        { name: 'Configurar Wi-Fi', subcategoryName: 'Wi-Fi e Internet', color: '#8b5cf6', description: 'Setup de conexão wireless' },
        { name: 'Testar Velocidade', subcategoryName: 'Wi-Fi e Internet', color: '#8b5cf6', description: 'Diagnóstico de performance de rede' },

        // Redes Corporativas
        { name: 'Configurar VPN', subcategoryName: 'Redes Corporativas', color: '#8b5cf6', description: 'Setup de conexão VPN corporativa' },
        { name: 'Mapear Drives', subcategoryName: 'Redes Corporativas', color: '#8b5cf6', description: 'Mapeamento de unidades de rede' },
        { name: 'Configurar Domínio', subcategoryName: 'Redes Corporativas', color: '#8b5cf6', description: 'Ingressar no domínio corporativo' },

        // Telefonia
        { name: 'Configurar Ramal', subcategoryName: 'Telefonia', color: '#8b5cf6', description: 'Setup de ramal telefônico' },
        { name: 'Testar Áudio', subcategoryName: 'Telefonia', color: '#8b5cf6', description: 'Verificação de qualidade de áudio' },
        { name: 'Configurar VOIP', subcategoryName: 'Telefonia', color: '#8b5cf6', description: 'Setup de sistema de voz IP' },

        // Comunicação Digital
        { name: 'Configurar E-mail', subcategoryName: 'Comunicação Digital', color: '#8b5cf6', description: 'Setup de conta de e-mail corporativo' },
        { name: 'Testar Videoconferência', subcategoryName: 'Comunicação Digital', color: '#8b5cf6', description: 'Verificação de sistemas de vídeo' },
        { name: 'Sincronizar Calendário', subcategoryName: 'Comunicação Digital', color: '#8b5cf6', description: 'Setup de calendário compartilhado' },

        // Segurança & Acesso - Controle de Acesso
        { name: 'Resetar Senha', subcategoryName: 'Controle de Acesso', color: '#dc2626', description: 'Redefinição de credenciais de acesso' },
        { name: 'Configurar MFA', subcategoryName: 'Controle de Acesso', color: '#dc2626', description: 'Setup de autenticação multifator' },
        { name: 'Revisar Permissões', subcategoryName: 'Controle de Acesso', color: '#dc2626', description: 'Auditoria de níveis de acesso' },

        // Antivírus e Proteção
        { name: 'Executar Scan', subcategoryName: 'Antivírus e Proteção', color: '#dc2626', description: 'Varredura completa do sistema' },
        { name: 'Atualizar Definições', subcategoryName: 'Antivírus e Proteção', color: '#dc2626', description: 'Update de base de vírus' },
        { name: 'Configurar Firewall', subcategoryName: 'Antivírus e Proteção', color: '#dc2626', description: 'Setup de regras de firewall' },

        // Backup e Recuperação
        { name: 'Executar Backup', subcategoryName: 'Backup e Recuperação', color: '#dc2626', description: 'Processo de backup de dados' },
        { name: 'Restaurar Arquivo', subcategoryName: 'Backup e Recuperação', color: '#dc2626', description: 'Recuperação de arquivos perdidos' },
        { name: 'Testar Integridade', subcategoryName: 'Backup e Recuperação', color: '#dc2626', description: 'Verificação de backups' },

        // Certificados Digitais
        { name: 'Instalar Certificado', subcategoryName: 'Certificados Digitais', color: '#dc2626', description: 'Instalação de certificado digital' },
        { name: 'Renovar Certificado', subcategoryName: 'Certificados Digitais', color: '#dc2626', description: 'Processo de renovação' },
        { name: 'Validar Assinatura', subcategoryName: 'Certificados Digitais', color: '#dc2626', description: 'Verificação de assinatura digital' },

        // Usuários & Suporte - Treinamento
        { name: 'Agendar Treinamento', subcategoryName: 'Treinamento', color: '#f59e0b', description: 'Agendamento de sessão de capacitação' },
        { name: 'Criar Material', subcategoryName: 'Treinamento', color: '#f59e0b', description: 'Desenvolvimento de conteúdo educativo' },
        { name: 'Avaliar Conhecimento', subcategoryName: 'Treinamento', color: '#f59e0b', description: 'Teste de conhecimento pós-treinamento' },

        // Solicitações Gerais
        { name: 'Atender Solicitação', subcategoryName: 'Solicitações Gerais', color: '#f59e0b', description: 'Atendimento de pedido específico' },
        { name: 'Escalar Demanda', subcategoryName: 'Solicitações Gerais', color: '#f59e0b', description: 'Encaminhamento para especialista' },
        { name: 'Acompanhar Processo', subcategoryName: 'Solicitações Gerais', color: '#f59e0b', description: 'Monitoramento de andamento' },

        // Suporte Remoto
        { name: 'Conectar Remotamente', subcategoryName: 'Suporte Remoto', color: '#f59e0b', description: 'Estabelecer conexão remota' },
        { name: 'Diagnosticar Problema', subcategoryName: 'Suporte Remoto', color: '#f59e0b', description: 'Análise remota de issue' },
        { name: 'Aplicar Correção', subcategoryName: 'Suporte Remoto', color: '#f59e0b', description: 'Implementação de solução remota' },

        // Consultoria
        { name: 'Analisar Necessidade', subcategoryName: 'Consultoria', color: '#f59e0b', description: 'Levantamento de requisitos técnicos' },
        { name: 'Elaborar Proposta', subcategoryName: 'Consultoria', color: '#f59e0b', description: 'Criação de proposta técnica' },
        { name: 'Apresentar Solução', subcategoryName: 'Consultoria', color: '#f59e0b', description: 'Demonstração de alternativas' }
      ];

      for (const [index, action] of actions.entries()) {
        const actionId = randomUUID();
        const subcategoryId = subcategoryIds[action.subcategoryName];

        if (!subcategoryId) {
          console.warn(`[TICKET-CONFIG] Subcategory not found: ${action.subcategoryName}`);
          continue;
        }

        await db.execute(sql`
          INSERT INTO "${sql.raw(schemaName)}"."ticket_actions"
          (id, tenant_id, company_id, subcategory_id, name, description, color, active, sort_order, created_at, updated_at)
          VALUES (
            ${actionId}, ${tenantId}, ${companyId}, ${subcategoryId}, ${action.name}, ${action.description},
            ${action.color}, true, ${index + 1}, NOW(), NOW()
          )
        `);

        console.log(`✅ Ação criada: ${action.name}`);
      }

      console.log('🎉 [TICKET-CONFIG] Nova estrutura hierárquica de 5 categorias criada com sucesso!');
      console.log('📊 [TICKET-CONFIG] Resumo:');
      console.log(`   - ${categories.length} categorias principais`);
      console.log(`   - ${subcategories.length} subcategorias`);
      console.log(`   - ${actions.length} ações específicas`);
    } catch (error: any) {
      console.error('❌ [TICKET-CONFIG] Error initializing ticket configurations:', error);
      throw new Error(`Failed to initialize ticket configurations: ${error.message}`);
    }
  }
}

export const tenantAutoProvisioningService =
  new TenantAutoProvisioningService();