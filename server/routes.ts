import express from 'express';
import { Router } from 'express';

// ✅ Import existing route modules
import authRoutes from './modules/auth/routes';
import ticketRoutes from './modules/tickets/routes';
import customerRoutes from './modules/customers/routes';
import beneficiaryRoutes from './modules/beneficiaries/routes';
import locationRoutes from './modules/locations/routes';
import userRoutes from './modules/users/routes-clean';
import dashboardRoutes from './modules/dashboard/routes-working';
import materialsServicesRoutes from './modules/materials-services/routes';
import reportRoutes from './modules/reports/routes';
import knowledgeBaseRoutes from './modules/knowledge-base/routes';
import companyRoutes from './modules/companies/routes-clean';
import customFieldRoutes from './modules/custom-fields/routes-working';

// ✅ Import other route files
import timecardRoutes from './routes/timecardRoutes';
import holidayRoutes from './routes/holidaysRoutes';
import contractRoutes from './routes/contractRoutes';
import teamManagementRoutes from './routes/teamManagementRoutes';
import userManagementRoutes from './routes/userManagementRoutes';
import userProfileRoutes from './routes/userProfileRoutes';
import systemAnalyticsRoutes from './routes/systemAnalytics';
import ticketConfigRoutes from './routes/ticketConfigRoutes';
import ticketConfigAdvancedRoutes from './routes/ticketConfigAdvanced';
import ticketFieldOptionsRoutes from './routes/ticketFieldOptions';
import ticketMetadataRoutes from './routes/ticketMetadata';
import userGroupsRoutes from './routes/userGroups';
import userGroupsByAgentRoutes from './routes/userGroupsByAgent';
import translationsRoutes from './routes/translations';
import translationCompletionRoutes from './routes/translationCompletion';
import localizationRoutes from './routes/localization';
import productivityRoutes from './routes/productivityRoutes';
import automationRulesRoutes from './routes/automationRules';
import ticketRelationshipsRoutes from './routes/ticketRelationships';
import ticketsWithRelationshipsRoutes from './routes/ticketsWithRelationships';
import employmentRoutes from './routes/employmentRoutes';
import integrityRoutes from './routes/integrityRoutes';
import systemScanRoutes from './routes/systemScanRoutes';
import certificateRoutes from './routes/certificateRoutes';
import tenantProvisioningRoutes from './routes/tenant-provisioning';
import tenantIntegrationsRoutes from './routes/tenantIntegrations';
import tenantAdminTeamRoutes from './routes/tenantAdminTeamRoutes';
import emailTemplatesRoutes from './routes/emailTemplates';
import authSecurityRoutes from './routes/authSecurity';
import validationRoutes from './routes/validation';
import webhooksRoutes from './routes/webhooks';
import templateRoutes from './routes/templateRoutes';
import scheduleNotificationsRoutes from './routes/scheduleNotifications';

const router = Router();

// ✅ 1QA.MD: Core authentication routes (must be first)
router.use('/auth', authRoutes);

// ✅ 1QA.MD: Core business modules
router.use('/tickets', ticketRoutes);
router.use('/customers', customerRoutes);
router.use('/beneficiaries', beneficiaryRoutes);
router.use('/locations', locationRoutes);
router.use('/users', userRoutes);
router.use('/companies', companyRoutes);
router.use('/custom-fields', customFieldRoutes);

// ✅ 1QA.MD: Dashboard and analytics
router.use('/dashboard', dashboardRoutes);
router.use('/reports', reportRoutes);

// ✅ 1QA.MD: Materials and services
router.use('/materials-services', materialsServicesRoutes);

// ✅ 1QA.MD: Knowledge base
router.use('/knowledge-base', knowledgeBaseRoutes);

// ✅ 1QA.MD: Timecard and scheduling
router.use('/timecard', timecardRoutes);
router.use('/schedule-notifications', scheduleNotificationsRoutes);

// ✅ 1QA.MD: Configuration routes
router.use('/holidays', holidayRoutes);
router.use('/contracts', contractRoutes);
router.use('/ticket-config', ticketConfigRoutes);
router.use('/ticket-config-advanced', ticketConfigAdvancedRoutes);
router.use('/ticket-field-options', ticketFieldOptionsRoutes);
router.use('/ticket-metadata', ticketMetadataRoutes);

// ✅ 1QA.MD: User management
router.use('/team-management', teamManagementRoutes);
router.use('/user-management', userManagementRoutes);
router.use('/user-profile', userProfileRoutes);
router.use('/user-groups', userGroupsRoutes);
router.use('/user-groups-by-agent', userGroupsByAgentRoutes);

// ✅ 1QA.MD: Localization and translations
router.use('/translations', translationsRoutes);
router.use('/translation-completion', translationCompletionRoutes);
router.use('/localization', localizationRoutes);

// ✅ 1QA.MD: System and admin routes
router.use('/system-analytics', systemAnalyticsRoutes);
router.use('/productivity', productivityRoutes);
router.use('/automation-rules', automationRulesRoutes);
router.use('/employment', employmentRoutes);
router.use('/integrity', integrityRoutes);
router.use('/system-scan', systemScanRoutes);

// ✅ 1QA.MD: Tenant and security
router.use('/certificates', certificateRoutes);
router.use('/tenant-provisioning', tenantProvisioningRoutes);
router.use('/tenant-integrations', tenantIntegrationsRoutes);
router.use('/tenant-admin-team', tenantAdminTeamRoutes);
router.use('/auth-security', authSecurityRoutes);

// ✅ 1QA.MD: Ticket relationships
router.use('/ticket-relationships', ticketRelationshipsRoutes);
router.use('/tickets-with-relationships', ticketsWithRelationshipsRoutes);

// ✅ 1QA.MD: Templates and communication
router.use('/email-templates', emailTemplatesRoutes);
router.use('/templates', templateRoutes);
router.use('/webhooks', webhooksRoutes);

// ✅ 1QA.MD: Validation
router.use('/validation', validationRoutes);

export default router;