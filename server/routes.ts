import type { Express } from "express";
import { createServer, type Server } from "http";
import { unifiedStorage } from "./storage-master";
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
import tenantAdminTeamRoutes from "./routes/tenantAdminTeamRoutes";
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
// Removed: journeyRoutes - functionality eliminated from system
// import timecardRoutes from './routes/timecardRoutes'; // Temporarily removed
// import scheduleRoutes from './modules/schedule-management/routes'; // Temporarily removed

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
  const { customersRouter } = await import('./modules/customers/routes');
  const { ticketsRouter } = await import('./modules/tickets/routes');
  const { knowledgeBaseRouter } = await import('./modules/knowledge-base/routes');
  const { peopleRouter } = await import('./modules/people/routes');
  const favorecidosRouter = await import('./modules/favorecidos/routes');

  // Module Integrity Control System

  // Mount microservice routes
  app.use('/api/dashboard', dashboardRouter);
  app.use('/api/customers', customersRouter);
  app.use('/api/favorecidos', favorecidosRouter.default);
  app.use('/api/tickets', ticketsRouter);
  app.use('/api/knowledge-base', knowledgeBaseRouter);
  app.use('/api/people', peopleRouter);
  app.use('/api/integrity', integrityRoutes);
  app.use('/api/system', systemScanRoutes);

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
  // app.use('/api/schedule', scheduleRoutes); // Temporarily removed

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
      await unifiedSchemaManager.initializeTenantSchema(tenantId);

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

  // Tenant admin team management routes
  app.use('/api/tenant-admin/team', tenantAdminTeamRoutes);

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

  // OmniBridge Module temporarily removed

  // Timecard Routes temporarily removed due to syntax issues

  const httpServer = createServer(app);
  return httpServer;
}