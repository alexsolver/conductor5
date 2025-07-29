import { Router } from 'express';
import { jwtAuth } from './middleware/jwtAuth';

// Import route modules
import { authRouter as authRoutes } from './modules/auth/routes';
import customersRoutes from './modules/customers/routes';
import { ticketsRouter as ticketsRoutes } from './modules/tickets/routes';
import { dashboardRouter as dashboardRoutes } from './modules/dashboard/routes';
import notificationsRoutes from './modules/notifications/routes';
import knowledgeBaseRoutes from './modules/knowledge-base/routes';
import { materialsServicesRoutes } from './modules/materials-services/routes';
import { technicalSkillsRoutes } from './modules/technical-skills/routes';
import { locationsRouter as locationsRoutes } from './modules/locations/routes';
import locationsNewRoutes from './modules/locations/routes-new';
import customFieldsRoutes from './modules/custom-fields/routes';
import { fieldLayoutRoutes as fieldLayoutsRoutes } from './modules/field-layouts/routes';
import favorecidosRoutes from './modules/favorecidos/routes';
import { peopleRouter as peopleRoutes } from './modules/people/routes';
import saasAdminRoutes from './modules/saas-admin/routes';
import tenantAdminRoutes from './modules/tenant-admin/routes';
import ticketHistoryRoutes from './modules/ticket-history/routes';

// Import individual route files
import templateRoutes from './routes/templateRoutes';
import contractRoutes from './routes/contractRoutes';
import timecardRoutes from './routes/timecardRoutes';
import userManagementRoutes from './routes/userManagementRoutes';
import userProfileRoutes from './routes/userProfileRoutes';
import { teamManagementRoutes } from './routes/teamManagementRoutes';
import tenantAdminTeamRoutes from './routes/tenantAdminTeamRoutes';
import tenantIntegrations from './routes/tenantIntegrations';
import tenantProvisioning from './routes/tenant-provisioning';
import ticketConfigRoutes from './routes/ticketConfigRoutes';
import ticketConfigAdvanced from './routes/ticketConfigAdvanced';
import ticketMetadata from './routes/ticketMetadata';
import ticketRelationships from './routes/ticketRelationships';
import translationsRoutes from './routes/translations';
import localizationRoutes from './routes/localization';
import { emailTemplatesRouter as emailTemplatesRoutes } from './routes/emailTemplates';
import systemScanRoutes from './routes/systemScanRoutes';
import { integrityRouter as integrityRoutes } from './routes/integrityRoutes';
import productivityRoutes from './routes/productivityRoutes';
import authSecurityRoutes from './routes/authSecurity';
import validationRoutes from './routes/validation';
import holidayRoutes from './routes/HolidayController';

const router = Router();

// Auth routes (public)
router.use('/auth', authRoutes);

// Protected routes - require authentication
router.use('/customers', jwtAuth, customersRoutes);
router.use('/tickets', jwtAuth, ticketsRoutes);
router.use('/dashboard', jwtAuth, dashboardRoutes);
router.use('/notifications', jwtAuth, notificationsRoutes);
router.use('/knowledge-base', jwtAuth, knowledgeBaseRoutes);
router.use('/materials-services', jwtAuth, materialsServicesRoutes);
router.use('/technical-skills', jwtAuth, technicalSkillsRoutes);
router.use('/locations', jwtAuth, locationsRoutes);
router.use('/locations-new', jwtAuth, locationsNewRoutes);
router.use('/custom-fields', jwtAuth, customFieldsRoutes);
router.use('/field-layouts', jwtAuth, fieldLayoutsRoutes);
router.use('/favorecidos', jwtAuth, favorecidosRoutes);
router.use('/people', jwtAuth, peopleRoutes);
router.use('/saas-admin', jwtAuth, saasAdminRoutes);
router.use('/tenant-admin', jwtAuth, tenantAdminRoutes);
router.use('/ticket-history', jwtAuth, ticketHistoryRoutes);

// Individual route files
router.use('/templates', jwtAuth, templateRoutes);
router.use('/contracts', jwtAuth, contractRoutes);
router.use('/timecard', jwtAuth, timecardRoutes);
router.use('/user-management', jwtAuth, userManagementRoutes);
router.use('/user-profile', jwtAuth, userProfileRoutes);
router.use('/team-management', jwtAuth, teamManagementRoutes);
router.use('/tenant-admin-team', jwtAuth, tenantAdminTeamRoutes);
router.use('/tenant-integrations', jwtAuth, tenantIntegrations);
router.use('/tenant-provisioning', jwtAuth, tenantProvisioning);
router.use('/ticket-config', jwtAuth, ticketConfigRoutes);
router.use('/ticket-config-advanced', jwtAuth, ticketConfigAdvanced);
router.use('/ticket-metadata', jwtAuth, ticketMetadata);
router.use('/ticket-relationships', jwtAuth, ticketRelationships);
router.use('/translations', jwtAuth, translationsRoutes);
router.use('/localization', jwtAuth, localizationRoutes);
router.use('/email-templates', jwtAuth, emailTemplatesRoutes);
router.use('/system-scan', jwtAuth, systemScanRoutes);
router.use('/integrity', jwtAuth, integrityRoutes);
router.use('/productivity', jwtAuth, productivityRoutes);
router.use('/auth-security', jwtAuth, authSecurityRoutes);
router.use('/validation', jwtAuth, validationRoutes);
router.use('/holidays', jwtAuth, holidayRoutes);

// Customer companies endpoint
router.get('/customer-companies', jwtAuth, async (req, res) => {
  try {
    // Forward to customers module
    res.redirect('/api/customers/companies');
  } catch (error) {
    console.error('Error in customer-companies redirect:', error);
    res.status(500).json({ message: 'Failed to fetch customer companies' });
  }
});

export default router;