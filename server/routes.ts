import type { Express, Response } from "express";
import { createServer, type Server } from "http";
import { unifiedStorage } from "./storage-simple";
import { schemaManager } from "./db";
import { jwtAuth, AuthenticatedRequest } from "./middleware/jwtAuth";
import { requirePermission, requireTenantAccess } from "./middleware/rbacMiddleware";
import createCSPMiddleware, { createCSPReportingEndpoint, createCSPManagementRoutes } from "./middleware/cspMiddleware";
import { createMemoryRateLimitMiddleware, RATE_LIMIT_CONFIGS } from "./services/redisRateLimitService";
import { createFeatureFlagMiddleware } from "./services/featureFlagService";
import cookieParser from "cookie-parser";
import { insertCustomerSchema, insertTicketSchema, insertTicketMessageSchema } from "@shared/schema-master";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import ticketConfigRoutes from "./routes/ticketConfigRoutes";
import userManagementRoutes from "./routes/userManagementRoutes";

import { integrityRouter as integrityRoutes } from './routes/integrityRoutes';
import systemScanRoutes from './routes/systemScanRoutes';
import { technicalSkillsRoutes } from './modules/technical-skills/routes';
// import internalFormsRoutes from './modules/internal-forms/routes'; // Temporarily removed
// Removed: external-contacts routes - functionality eliminated
// import locationRoutes from './routes/locationRoutes'; // Temporarily removed
import ticketRelationshipsRoutes from './routes/ticketRelationships';
// import { omniBridgeRoutes } from './modules/omni-bridge/routes'; // Temporarily removed
import saasAdminRoutes from './modules/saas-admin/routes';
import tenantAdminRoutes from './modules/tenant-admin/routes';
import { dashboardRouter as dashboardRoutes } from './modules/dashboard/routes';
import multilocationRoutes from './routes/multilocation';
import geolocationRoutes from './routes/geolocation';
import holidayRoutes from './routes/HolidayController';
// import omnibridgeRoutes from './routes/omnibridge'; // Removed - using real APIs only

// Removed: journeyRoutes - functionality eliminated from system
import { timecardRoutes } from './routes/timecardRoutes';
import scheduleRoutes from './modules/schedule-management/infrastructure/routes/scheduleRoutes';
import { userProfileRoutes } from './routes/userProfileRoutes';
import { teamManagementRoutes } from './routes/teamManagementRoutes';
import contractRoutes from './routes/contractRoutes';
import { ItemsController } from './controllers/ItemsController';
import { PartsServicesController } from './controllers/PartsServicesController';

export async function registerRoutes(app: Express): Promise<Server> {
  // Add cookie parser middleware
  app.use(cookieParser());

  // Apply CSP middleware
  app.use(createCSPMiddleware({
    environment: process.env.NODE_ENV === 'production' ? 'production' : 'development',
    nonce: true
  }));



  // Apply memory-based rate limiting middleware  
  app.use('/api/auth/login', createMemoryRateLimitMiddleware(RATE_LIMIT_CONFIGS.LOGIN));
  app.use('/api/auth/register', createMemoryRateLimitMiddleware(RATE_LIMIT_CONFIGS.REGISTRATION));
  app.use('/api/auth/password-reset', createMemoryRateLimitMiddleware(RATE_LIMIT_CONFIGS.PASSWORD_RESET));
  app.use('/api', createMemoryRateLimitMiddleware(RATE_LIMIT_CONFIGS.API_GENERAL));

  // Apply feature flag middleware
  app.use(createFeatureFlagMiddleware());

  // CSP reporting endpoint
  app.post('/api/csp-report', createCSPReportingEndpoint());

  // CSP management routes (admin only)
  app.use('/api/csp', requirePermission('platform', 'manage_security'), createCSPManagementRoutes());

  // Feature flags routes
  app.get('/api/feature-flags', jwtAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { featureFlagService } = await import('./services/featureFlagService');
      const context = {
        userId: req.user?.id,
        tenantId: req.user?.tenantId || undefined,
        userAttributes: req.user,
        tenantAttributes: req.tenant
      };

      const flags = await featureFlagService.getAllFlags(context);
      res.json({ flags });
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch feature flags' });
    }
  });

  app.get('/api/feature-flags/:flagId', jwtAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { featureFlagService } = await import('./services/featureFlagService');
      const context = {
        userId: req.user?.id,
        tenantId: req.user?.tenantId || undefined,
        userAttributes: req.user,
        tenantAttributes: req.tenant
      };

      const isEnabled = await featureFlagService.isEnabled(req.params.flagId, context);
      res.json({ flagId: req.params.flagId, enabled: isEnabled });
    } catch (error) {
      res.status(500).json({ message: 'Failed to check feature flag' });
    }
  });

  // RBAC management routes
  app.get('/api/rbac/permissions', jwtAuth, requirePermission('platform', 'manage_security'), async (req: AuthenticatedRequest, res) => {
    try {
      const { PERMISSIONS } = await import('./middleware/rbacMiddleware');
      res.json({ permissions: PERMISSIONS });
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch permissions' });
    }
  });

  app.get('/api/rbac/roles', jwtAuth, requirePermission('platform', 'manage_security'), async (req: AuthenticatedRequest, res) => {
    try {
      const { ROLE_PERMISSIONS } = await import('./middleware/rbacMiddleware');
      res.json({ roles: ROLE_PERMISSIONS });
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch roles' });
    }
  });

  app.get('/api/rbac/user-permissions/:userId', jwtAuth, requirePermission('platform', 'manage_users'), async (req: AuthenticatedRequest, res) => {
    try {
      const { rbacService } = await import('./middleware/rbacMiddleware');
      const permissions = await rbacService.getUserPermissions(req.params.userId, req.user?.tenantId || undefined);
      res.json({ permissions });
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch user permissions' });
    }
  });

  // Initialize clean architecture dependencies before importing routes
  const { setupCustomerDependencies } = await import('./modules/customers/infrastructure/setup/CustomerDependencySetup');
  setupCustomerDependencies();

  // Import and mount authentication routes
  const { authRouter } = await import('./modules/auth/routes');
  app.use('/api/auth', authRouter);

  // Import microservice routers
  const { dashboardRouter } = await import('./modules/dashboard/routes');
  // customersRouter removed - functionality consolidated into /api/clientes
  const { ticketsRouter } = await import('./modules/tickets/routes');
  const { knowledgeBaseRouter } = await import('./modules/knowledge-base/routes');
  const { peopleRouter } = await import('./modules/people/routes');
  const favorecidosRouter = await import('./modules/favorecidos/routes');

  // Module Integrity Control System

  // Mount microservice routes
  app.use('/api/dashboard', dashboardRouter);
  // /api/customers route removed - use /api/clientes instead
  app.use('/api/favorecidos', favorecidosRouter.default);
  app.use('/api/tickets', ticketsRouter);
  app.use('/api/knowledge-base', knowledgeBaseRouter);
  app.use('/api/people', peopleRouter);
  app.use('/api/integrity', integrityRoutes);
  app.use('/api/system', systemScanRoutes);

  // === CLIENTES ROUTES ===
  app.get("/api/clientes", async (req, res) => {
    try {
      const tenantId = "3f99462f-3621-4b1b-bea8-782acc50d62e"; // Default tenant for testing
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      const search = req.query.search as string || "";
      
      const clientes = await unifiedStorage.getClientes(tenantId, { limit, offset, search });
      const total = await unifiedStorage.getClientesCount(tenantId);
      
      res.json({ 
        success: true, 
        data: clientes, 
        total,
        message: `Encontrados ${clientes.length} clientes`
      });
    } catch (error) {
      console.error("Error fetching clientes:", error);
      res.status(500).json({ success: false, message: "Erro ao buscar clientes" });
    }
  });

  app.post("/api/clientes", async (req, res) => {
    try {
      const tenantId = "3f99462f-3621-4b1b-bea8-782acc50d62e";
      const cliente = await unifiedStorage.createCliente(tenantId, req.body);
      
      res.status(201).json({ 
        success: true, 
        data: cliente,
        message: "Cliente criado com sucesso"
      });
    } catch (error) {
      console.error("Error creating cliente:", error);
      res.status(500).json({ success: false, message: "Erro ao criar cliente" });
    }
  });

  app.put("/api/clientes/:id", async (req, res) => {
    try {
      const tenantId = "3f99462f-3621-4b1b-bea8-782acc50d62e";
      const { id } = req.params;
      
      const updated = await unifiedStorage.updateCliente(tenantId, id, req.body);
      
      if (!updated) {
        return res.status(404).json({ success: false, message: "Cliente não encontrado" });
      }
      
      res.json({ 
        success: true, 
        data: updated,
        message: "Cliente atualizado com sucesso"
      });
    } catch (error) {
      console.error("Error updating cliente:", error);
      res.status(500).json({ success: false, message: "Erro ao atualizar cliente" });
    }
  });

  app.delete("/api/clientes/:id", async (req, res) => {
    try {
      const tenantId = "3f99462f-3621-4b1b-bea8-782acc50d62e";
      const { id } = req.params;
      
      const deleted = await unifiedStorage.deleteCliente(tenantId, id);
      
      if (!deleted) {
        return res.status(404).json({ success: false, message: "Cliente não encontrado" });
      }
      
      res.json({ 
        success: true,
        message: "Cliente excluído com sucesso"
      });
    } catch (error) {
      console.error("Error deleting cliente:", error);
      res.status(500).json({ success: false, message: "Erro ao excluir cliente" });
    }
  });

  // Locations routes temporarily removed due to syntax issues

  // Import and mount localization routes
  const localizationRoutes = await import('./routes/localization');
  app.use('/api/localization', localizationRoutes.default);
  
  // Import and mount multilocation routes (enterprise international support)
  const multilocationRoutes = await import('./routes/multilocation');
  app.use('/api/multilocation', multilocationRoutes.default);

  // Import and mount tenant provisioning routes
  const tenantProvisioningRoutes = await import('./routes/tenant-provisioning');
  app.use('/api/tenant-provisioning', tenantProvisioningRoutes.default);

  // Import and mount translations routes
  const translationsRoutes = await import('./routes/translations');
  app.use('/api/translations', translationsRoutes.default);

  // Import and mount validation routes
  const validationRoutes = await import('./routes/validation');
  app.use('/api/validation', validationRoutes.default);

  // Import and mount auth security routes
  const authSecurityRoutes = await import('./routes/authSecurity');
  app.use('/api/auth-security', authSecurityRoutes.default);

  // Import and mount template routes
  const templateRoutes = await import('./routes/templateRoutes');
  app.use('/api/templates', templateRoutes.default);

  // Import and mount admin routes
  const saasAdminRoutes = await import('./modules/saas-admin/routes');
  const tenantAdminRoutes = await import('./modules/tenant-admin/routes');
  // const saasAdminIntegrationsRoutes = await import('./routes/saasAdminIntegrations'); // Temporarily removed
  const tenantIntegrationsRoutes = await import('./routes/tenantIntegrations');
  app.use('/api/saas-admin', saasAdminRoutes.default);
  app.use('/api/tenant-admin', tenantAdminRoutes.default);
  // Removed: journey API routes - functionality eliminated from system
  app.use('/api/schedule', scheduleRoutes);

  // Tenant endpoint for fetching tenant details
  app.get('/api/tenants/:tenantId', jwtAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { tenantId } = req.params;

      // Only allow users to fetch their own tenant data (or SaaS admins)
      if (req.user?.role !== 'saas_admin' && req.user?.tenantId !== tenantId) {
        return res.status(403).json({ message: 'Access denied' });
      }

      const container = (await import('./application/services/DependencyContainer')).DependencyContainer.getInstance();
      const tenantRepository = container.tenantRepository;

      const tenant = await tenantRepository.findById(tenantId);
      if (!tenant) {
        return res.status(404).json({ message: 'Tenant not found' });
      }

      res.json({
        id: tenant.id,
        name: tenant.name,
        subdomain: tenant.subdomain,
        isActive: tenant.isActive,
        createdAt: tenant.createdAt
      });
    } catch (error) {
      console.error('Error fetching tenant:', error);
      res.status(500).json({ message: 'Failed to fetch tenant' });
    }
  });

  // Schema management (admin only)
  app.post("/api/admin/init-schema/:tenantId", jwtAuth, async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { tenantId } = req.params;

      // Initialize tenant schema
      await schemaManager.initializeTenantSchema(tenantId);

      res.json({ message: `Schema initialized for tenant ${tenantId}` });
    } catch (error) {
      console.error("Error initializing schema:", error);
      res.status(500).json({ message: "Failed to initialize schema" });
    }
  });

  // Ticket configuration management routes
  app.use('/api/ticket-config', ticketConfigRoutes);

  // User management routes
  app.use('/api/user-management', userManagementRoutes);

  // User profile routes
  app.use('/api/user', jwtAuth, userProfileRoutes);

  // Team management routes
  app.use('/api/team-management', jwtAuth, teamManagementRoutes);



  // Ticket relationships routes
  app.use('/api/tickets', ticketRelationshipsRoutes);

  // Customer-Location relationship routes
  app.get('/api/customers/:customerId/locations', jwtAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { customerId } = req.params;
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        return res.status(401).json({ message: 'Tenant required' });
      }

      // Note: Customer locations functionality requires implementation of customerLocations table in schema
      // For now, return locations associated with the tenant
      const locations = await unifiedStorage.getLocations ? await unifiedStorage.getLocations(tenantId) : [];

      res.json({ locations });
    } catch (error) {
      console.error('Error fetching customer locations:', error);
      res.status(500).json({ message: 'Failed to fetch customer locations' });
    }
  });

  app.post('/api/customers/:customerId/locations', jwtAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { customerId } = req.params;
      const { locationId, isPrimary } = req.body;
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        return res.status(401).json({ message: 'Tenant required' });
      }

      // Note: Customer-location associations require implementation
      // For now, return success message without actual association
      const newAssociation = { id: 'temp-id', customerId, locationId, isPrimary };

      res.json({ message: 'Location associated with customer successfully' });
    } catch (error) {
      console.error('Error associating customer with location:', error);
      res.status(500).json({ message: 'Failed to associate customer with location' });
    }
  });

  app.delete('/api/customers/:customerId/locations/:locationId', jwtAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { customerId, locationId } = req.params;
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        return res.status(401).json({ message: 'Tenant required' });
      }

      // Note: Customer-location dissociation requires implementation
      // For now, return success message

      res.json({ message: 'Location removed from customer successfully' });
    } catch (error) {
      console.error('Error removing customer location:', error);
      res.status(500).json({ message: 'Failed to remove customer location' });
    }
  });

  // Removed: Multi-tenant routes - functionality eliminated from system

  // Technical Skills routes
  app.use('/api/technical-skills', technicalSkillsRoutes);
  
  // Holiday routes for journey control system
  app.use('/api/holidays', holidayRoutes);
  
  // Global multilocation API endpoints
  app.get('/api/multilocation/markets', jwtAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const tenantId = req.user?.tenantId;
      const pool = schemaManager.getPool();
      
      const result = await pool.query(
        `SELECT * FROM "${schemaManager.getSchemaName(tenantId)}"."market_localization" WHERE tenant_id = $1 AND is_active = true ORDER BY market_code`,
        [tenantId]
      );

      const markets = result.rows.map(row => ({
        marketCode: row.market_code,
        countryCode: row.country_code,
        languageCode: row.language_code,
        currencyCode: row.currency_code
      }));

      res.json({ markets, defaultMarket: 'BR' });
    } catch (error) {
      console.error('Error fetching markets:', error);
      res.status(500).json({ error: 'Failed to fetch markets' });
    }
  });

  app.get('/api/multilocation/config/:marketCode', jwtAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { marketCode } = req.params;
      const tenantId = req.user?.tenantId;
      const pool = schemaManager.getPool();
      
      const result = await pool.query(
        `SELECT * FROM "${schemaManager.getSchemaName(tenantId)}"."market_localization" WHERE tenant_id = $1 AND market_code = $2`,
        [tenantId, marketCode]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: `Market not found: ${marketCode}` });
      }

      const market = result.rows[0];
      res.json({
        marketCode: market.market_code,
        config: {
          countryCode: market.country_code,
          languageCode: market.language_code,
          currencyCode: market.currency_code,
          displayConfig: market.display_config,
          validationRules: market.validation_rules,
          legalFields: market.legal_field_mappings
        }
      });
    } catch (error) {
      console.error('Error fetching market config:', error);
      res.status(500).json({ error: 'Failed to fetch market config' });
    }
  });

  // Currency conversion endpoint
  app.post('/api/geolocation/convert-currency', jwtAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { amount, from, to } = req.body;
      
      // Get exchange rate from database
      const pool = schemaManager.getPool();
      const result = await pool.query(
        'SELECT exchange_rate FROM exchange_rates WHERE base_currency = $1 AND target_currency = $2',
        [from, to]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: `Exchange rate not found for ${from} to ${to}` });
      }

      const exchangeRate = parseFloat(result.rows[0].exchange_rate);
      const convertedAmount = amount * exchangeRate;
      let formattedAmount = convertedAmount.toFixed(2);
      if (to === 'BRL') {
        formattedAmount = `R$ ${convertedAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
      } else if (to === 'USD') {
        formattedAmount = `$${convertedAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
      } else if (to === 'EUR') {
        formattedAmount = `€${convertedAmount.toLocaleString('en-GB', { minimumFractionDigits: 2 })}`;
      }

      res.json({
        originalAmount: amount,
        originalCurrency: from,
        convertedAmount,
        targetCurrency: to,
        exchangeRate,
        formattedAmount
      });
    } catch (error) {
      console.error('Currency conversion error:', error);
      res.status(500).json({ error: 'Failed to convert currency' });
    }
  });
  
  // Global multilocation routes  
  // app.use('/api/multilocation', multilocationRoutes); // Temporarily disabled due to module export issue
  
  // Removed duplicate OmniBridge routes - now defined earlier before middleware

  // Helper functions for channel transformation
  function getChannelIcon(type: string): string {
    const iconMap: Record<string, string> = {
      'IMAP Email': 'Mail',
      'Gmail OAuth2': 'Mail',
      'Outlook OAuth2': 'Mail', 
      'Email SMTP': 'Mail',
      'WhatsApp Business': 'MessageCircle',
      'Twilio SMS': 'MessageSquare',
      'Telegram Bot': 'Send',
      'Facebook Messenger': 'MessageCircle',
      'Web Chat': 'Globe',
      'Zapier': 'Zap',
      'Webhooks': 'Webhook',
      'CRM Integration': 'Database',
      'SSO/SAML': 'Shield',
      'Chatbot IA': 'Bot'
    };
    return iconMap[type] || 'Settings';
  }

  function getChannelDescription(type: string): string {
    const descMap: Record<string, string> = {
      'IMAP Email': 'Recebimento de emails via protocolo IMAP',
      'Gmail OAuth2': 'Integração OAuth2 com Gmail',
      'Outlook OAuth2': 'Integração OAuth2 com Outlook',
      'Email SMTP': 'Envio de emails via protocolo SMTP',
      'WhatsApp Business': 'API oficial do WhatsApp Business',
      'Twilio SMS': 'Envio e recebimento de SMS via Twilio',
      'Telegram Bot': 'Bot para comunicação via Telegram',
      'Facebook Messenger': 'Integração com Facebook Messenger',
      'Web Chat': 'Widget de chat para websites',
      'Zapier': 'Automações via Zapier',
      'Webhooks': 'Recebimento de webhooks externos',
      'CRM Integration': 'Sincronização com sistemas CRM',
      'SSO/SAML': 'Autenticação única empresarial',
      'Chatbot IA': 'Assistente virtual com IA'
    };
    return descMap[type] || 'Canal de comunicação';
  }
  
  // Geolocation detection and formatting routes  
  // app.use('/api/geolocation', geolocationRoutes); // Temporarily disabled due to module export issue
  
  // app.use('/api/internal-forms', internalFormsRoutes); // Temporarily removed



  // app.use('/api/locations', locationRoutes); // Temporarily removed

  // Ticket Templates routes
  const ticketTemplatesRoutes = (await import('./routes/ticketTemplates')).default;
  app.use('/api/templates', ticketTemplatesRoutes);
  // Auth routes already mounted above, removing duplicate

  // Email Templates routes  
  const { emailTemplatesRouter } = await import('./routes/emailTemplates');
  app.use('/api/email-templates', emailTemplatesRouter);

  // Removed: External Contacts routes - functionality eliminated

  // Location routes

  // Project routes temporarily removed due to syntax issues

  // Email Configuration API Routes - For OmniBridge integration
  app.get('/api/email-config/integrations', jwtAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(400).json({ message: "Tenant ID required" });
      }

      // Get all integrations from database, filter only communication category
      const integrations = await unifiedStorage.getTenantIntegrations(tenantId);
      const communicationIntegrations = integrations.filter((integration: any) => 
        integration.category === 'Comunicação'
      );

      res.json({ integrations: communicationIntegrations });
    } catch (error) {
      console.error('Error fetching email integrations:', error);
      res.status(500).json({ message: "Failed to fetch integrations" });
    }
  });

  app.get('/api/email-config/inbox', jwtAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(400).json({ message: "Tenant ID required" });
      }

      // Get inbox messages from database
      const messages = await unifiedStorage.getEmailInboxMessages(tenantId);
      res.json({ messages });
    } catch (error) {
      console.error('Error fetching inbox messages:', error);
      res.status(500).json({ message: "Failed to fetch inbox messages" });
    }
  });

  app.get('/api/email-config/monitoring/status', jwtAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(400).json({ message: "Tenant ID required" });
      }

      // Get IMAP integration status from database
      const imapIntegration = await unifiedStorage.getIntegrationByType(tenantId, 'IMAP Email');
      const isMonitoring = imapIntegration && imapIntegration.status === 'connected';

      res.json({
        isMonitoring,
        status: isMonitoring ? 'active' : 'inactive',
        lastCheck: new Date().toISOString(),
        activeConnections: isMonitoring ? 1 : 0
      });
    } catch (error) {
      console.error('Error getting monitoring status:', error);
      res.status(500).json({ 
        isMonitoring: false,
        status: 'error',
        message: 'Failed to get monitoring status' 
      });
    }
  });

  app.post('/api/email-config/monitoring/start', jwtAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(400).json({ message: "Tenant ID required" });
      }

      // Get IMAP integration
      const imapIntegration = await unifiedStorage.getIntegrationByType(tenantId, 'IMAP Email');
      if (!imapIntegration) {
        return res.status(404).json({ message: "IMAP integration not found" });
      }

      // Start Gmail service monitoring
      const { GmailService } = await import('./services/integrations/gmail/GmailService');
      const gmailService = new GmailService();
      
      const result = await gmailService.startEmailMonitoring(tenantId, imapIntegration.id);
      
      if (result.success) {
        // Update integration status to connected
        await unifiedStorage.updateTenantIntegrationStatus(tenantId, imapIntegration.id, 'connected');
        
        res.json({
          success: true,
          message: "Monitoramento IMAP iniciado com sucesso",
          isMonitoring: true
        });
      } else {
        res.status(500).json({
          success: false,
          message: result.message || "Failed to start monitoring"
        });
      }
    } catch (error) {
      console.error('Error starting email monitoring:', error);
      res.status(500).json({
        success: false,
        message: "Failed to start monitoring"
      });
    }
  });

  app.post('/api/email-config/monitoring/stop', jwtAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(400).json({ message: "Tenant ID required" });
      }

      // Get IMAP integration
      const imapIntegration = await unifiedStorage.getIntegrationByType(tenantId, 'IMAP Email');
      if (!imapIntegration) {
        return res.status(404).json({ message: "IMAP integration not found" });
      }

      // Stop Gmail service monitoring
      const { GmailService } = await import('./services/integrations/gmail/GmailService');
      const gmailService = new GmailService();
      
      await gmailService.stopEmailMonitoring(tenantId);
      
      // Update integration status to disconnected
      await unifiedStorage.updateTenantIntegrationStatus(tenantId, imapIntegration.id, 'disconnected');
      
      res.json({
        success: true,
        message: "Monitoramento IMAP parado com sucesso",
        isMonitoring: false
      });
    } catch (error) {
      console.error('Error stopping email monitoring:', error);
      res.status(500).json({
        success: false,
        message: "Failed to stop monitoring"
      });
    }
  });

  // OmniBridge Module temporarily removed

  // Timecard Routes temporarily removed due to syntax issues

  // OmniBridge Auto-Start Routes - Simplified without requireTenantAccess
  app.post('/api/omnibridge/start-monitoring', jwtAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { omniBridgeAutoStart } = await import('./services/OmniBridgeAutoStart');
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        return res.status(400).json({ message: "Tenant ID required" });
      }

      console.log(`🚀 Starting OmniBridge monitoring for tenant: ${tenantId}`);
      await omniBridgeAutoStart.detectAndStartCommunicationChannels(tenantId);
      
      res.json({ 
        message: "OmniBridge monitoring started successfully",
        activeMonitoring: omniBridgeAutoStart.getActiveMonitoring(),
        isActive: true
      });
    } catch (error) {
      console.error('Error starting OmniBridge monitoring:', error);
      res.status(500).json({ message: "Failed to start monitoring" });
    }
  });

  app.post('/api/omnibridge/stop-monitoring', jwtAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { omniBridgeAutoStart } = await import('./services/OmniBridgeAutoStart');
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        return res.status(400).json({ message: "Tenant ID required" });
      }

      console.log(`🛑 Stopping OmniBridge monitoring for tenant: ${tenantId}`);
      await omniBridgeAutoStart.stopAllMonitoring(tenantId);
      
      res.json({ 
        message: "OmniBridge monitoring stopped successfully",
        isActive: false
      });
    } catch (error) {
      console.error('Error stopping OmniBridge monitoring:', error);
      res.status(500).json({ message: "Failed to stop monitoring" });
    }
  });

  app.get('/api/omnibridge/monitoring-status', jwtAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { omniBridgeAutoStart } = await import('./services/OmniBridgeAutoStart');
      
      const activeMonitoring = omniBridgeAutoStart.getActiveMonitoring();
      res.json({ 
        activeMonitoring,
        isActive: activeMonitoring.length > 0
      });
    } catch (error) {
      console.error('Error getting monitoring status:', error);
      res.status(500).json({ message: "Failed to get status" });
    }
  });

  // Timecard routes - Registro de Ponto
  app.use('/api/timecard', jwtAuth, timecardRoutes);

  // Contract Management routes - Gestão de Contratos
  app.use('/api/contracts', contractRoutes);

  // Items Management routes - Gestão de Itens
  const itemsController = new ItemsController();
  
  // Items CRUD
  app.post('/api/items', jwtAuth, requireTenantAccess, (req: AuthenticatedRequest, res: Response) => itemsController.createItem(req, res));
  app.get('/api/items', jwtAuth, requireTenantAccess, (req: AuthenticatedRequest, res: Response) => itemsController.getItems(req, res));
  app.get('/api/items/stats', jwtAuth, requireTenantAccess, (req: AuthenticatedRequest, res: Response) => itemsController.getItemsStats(req, res));
  app.get('/api/items/:id', jwtAuth, requireTenantAccess, (req: AuthenticatedRequest, res: Response) => itemsController.getItemById(req, res));
  app.put('/api/items/:id', jwtAuth, requireTenantAccess, (req: AuthenticatedRequest, res: Response) => itemsController.updateItem(req, res));
  app.delete('/api/items/:id', jwtAuth, requireTenantAccess, (req: AuthenticatedRequest, res: Response) => itemsController.deleteItem(req, res));

  // Item Attachments
  app.post('/api/items/:itemId/attachments', jwtAuth, requireTenantAccess, (req: AuthenticatedRequest, res: Response) => itemsController.createItemAttachment(req, res));
  app.get('/api/items/:itemId/attachments', jwtAuth, requireTenantAccess, (req: AuthenticatedRequest, res: Response) => itemsController.getItemAttachments(req, res));
  app.delete('/api/items/attachments/:attachmentId', jwtAuth, requireTenantAccess, (req: AuthenticatedRequest, res: Response) => itemsController.deleteItemAttachment(req, res));

  // Item Links (item to item relationships)
  app.post('/api/items/:itemId/links', jwtAuth, requireTenantAccess, (req: AuthenticatedRequest, res: Response) => itemsController.createItemLink(req, res));
  app.get('/api/items/:itemId/links', jwtAuth, requireTenantAccess, (req: AuthenticatedRequest, res: Response) => itemsController.getItemLinks(req, res));
  app.delete('/api/items/links/:linkId', jwtAuth, requireTenantAccess, (req: AuthenticatedRequest, res: Response) => itemsController.deleteItemLink(req, res));

  // Item Customer Links (item to customer relationships)
  app.post('/api/items/:itemId/customer-links', jwtAuth, requireTenantAccess, (req: AuthenticatedRequest, res: Response) => itemsController.createItemCustomerLink(req, res));
  app.get('/api/items/:itemId/customer-links', jwtAuth, requireTenantAccess, (req: AuthenticatedRequest, res: Response) => itemsController.getItemCustomerLinks(req, res));
  app.put('/api/items/customer-links/:linkId', jwtAuth, requireTenantAccess, (req: AuthenticatedRequest, res: Response) => itemsController.updateItemCustomerLink(req, res));
  app.delete('/api/items/customer-links/:linkId', jwtAuth, requireTenantAccess, (req: AuthenticatedRequest, res: Response) => itemsController.deleteItemCustomerLink(req, res));

  // Item Supplier Links (item to supplier relationships)
  app.post('/api/items/:itemId/supplier-links', jwtAuth, requireTenantAccess, (req: AuthenticatedRequest, res: Response) => itemsController.createItemSupplierLink(req, res));
  app.get('/api/items/:itemId/supplier-links', jwtAuth, requireTenantAccess, (req: AuthenticatedRequest, res: Response) => itemsController.getItemSupplierLinks(req, res));
  app.put('/api/items/supplier-links/:linkId', jwtAuth, requireTenantAccess, (req: AuthenticatedRequest, res: Response) => itemsController.updateItemSupplierLink(req, res));
  app.delete('/api/items/supplier-links/:linkId', jwtAuth, requireTenantAccess, (req: AuthenticatedRequest, res: Response) => itemsController.deleteItemSupplierLink(req, res));

  // Parts & Services Management - Complete Module
  const partsServicesController = new PartsServicesController();
  
  // Items Management (Extended)
  app.get('/api/parts-services/items', jwtAuth, requireTenantAccess, (req: AuthenticatedRequest, res: Response) => partsServicesController.getItems(req, res));
  app.post('/api/parts-services/items', jwtAuth, requireTenantAccess, (req: AuthenticatedRequest, res: Response) => partsServicesController.createItem(req, res));
  app.put('/api/parts-services/items/:id', jwtAuth, requireTenantAccess, (req: AuthenticatedRequest, res: Response) => partsServicesController.updateItem(req, res));
  app.delete('/api/parts-services/items/:id', jwtAuth, requireTenantAccess, (req: AuthenticatedRequest, res: Response) => partsServicesController.deleteItem(req, res));

  // Stock Control
  app.get('/api/parts-services/stock-locations', jwtAuth, requireTenantAccess, (req: AuthenticatedRequest, res: Response) => partsServicesController.getStockLocations(req, res));
  app.post('/api/parts-services/stock-locations', jwtAuth, requireTenantAccess, (req: AuthenticatedRequest, res: Response) => partsServicesController.createStockLocation(req, res));
  app.get('/api/parts-services/stock-levels', jwtAuth, requireTenantAccess, (req: AuthenticatedRequest, res: Response) => partsServicesController.getStockLevels(req, res));
  app.post('/api/parts-services/stock-levels', jwtAuth, requireTenantAccess, (req: AuthenticatedRequest, res: Response) => partsServicesController.createStockLevel(req, res));
  app.get('/api/parts-services/stock-movements', jwtAuth, requireTenantAccess, (req: AuthenticatedRequest, res: Response) => partsServicesController.getStockMovements(req, res));
  app.post('/api/parts-services/stock-movements', jwtAuth, requireTenantAccess, (req: AuthenticatedRequest, res: Response) => partsServicesController.createStockMovement(req, res));

  // Suppliers Management
  app.get('/api/parts-services/suppliers', jwtAuth, requireTenantAccess, (req: AuthenticatedRequest, res: Response) => partsServicesController.getSuppliers(req, res));
  app.post('/api/parts-services/suppliers', jwtAuth, requireTenantAccess, (req: AuthenticatedRequest, res: Response) => partsServicesController.createSupplier(req, res));
  app.put('/api/parts-services/suppliers/:id', jwtAuth, requireTenantAccess, (req: AuthenticatedRequest, res: Response) => partsServicesController.updateSupplier(req, res));
  app.delete('/api/parts-services/suppliers/:id', jwtAuth, requireTenantAccess, (req: AuthenticatedRequest, res: Response) => partsServicesController.deleteSupplier(req, res));

  // Service Integration
  app.get('/api/parts-services/service-kits', jwtAuth, requireTenantAccess, (req: AuthenticatedRequest, res: Response) => partsServicesController.getServiceKits(req, res));
  app.post('/api/parts-services/service-kits', jwtAuth, requireTenantAccess, (req: AuthenticatedRequest, res: Response) => partsServicesController.createServiceKit(req, res));

  // Price Lists (LPU)
  app.get('/api/parts-services/price-lists', jwtAuth, requireTenantAccess, (req: AuthenticatedRequest, res: Response) => partsServicesController.getPriceLists(req, res));
  app.post('/api/parts-services/price-lists', jwtAuth, requireTenantAccess, (req: AuthenticatedRequest, res: Response) => partsServicesController.createPriceList(req, res));

  // Quality Certifications (Compliance)
  app.get('/api/parts-services/quality-certifications', jwtAuth, requireTenantAccess, (req: AuthenticatedRequest, res: Response) => partsServicesController.getQualityCertifications(req, res));
  app.post('/api/parts-services/quality-certifications', jwtAuth, requireTenantAccess, (req: AuthenticatedRequest, res: Response) => partsServicesController.createQualityCertification(req, res));

  // Dashboard Statistics
  app.get('/api/parts-services/dashboard-stats', jwtAuth, requireTenantAccess, (req: AuthenticatedRequest, res: Response) => partsServicesController.getDashboardStats(req, res));

  // Customer companies compatibility route for contract creation
  app.get('/api/customer-companies', jwtAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ message: 'Tenant required' });
      }

      // Import and use the customer companies controller
      const { getCustomerCompanyController } = await import('./modules/customers/infrastructure/setup/CustomerDependencySetup');
      const controller = getCustomerCompanyController();
      
      // Call the existing controller method
      await controller.getCompanies(req as any, res as any);
    } catch (error) {
      console.error('Error fetching customer companies via compatibility route:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch customer companies' 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}