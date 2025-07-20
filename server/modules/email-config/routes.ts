
import { Router } from 'express';
import { jwtAuth } from '../../middleware/jwtAuth';
import { EmailConfigController } from './application/controllers/EmailConfigController';

const router = Router();
const emailConfigController = new EmailConfigController();

// Apply authentication middleware
router.use(jwtAuth);

// ========== EMAIL PROCESSING RULES ROUTES ==========

// GET /api/email-config/rules - List all email rules
router.get('/rules', (req, res) => emailConfigController.getEmailRules(req, res));

// POST /api/email-config/rules - Create new email rule
router.post('/rules', (req, res) => emailConfigController.createEmailRule(req, res));

// GET /api/email-config/rules/:ruleId - Get specific email rule
router.get('/rules/:ruleId', (req, res) => emailConfigController.getEmailRule(req, res));

// PUT /api/email-config/rules/:ruleId - Update email rule
router.put('/rules/:ruleId', (req, res) => emailConfigController.updateEmailRule(req, res));

// DELETE /api/email-config/rules/:ruleId - Delete email rule
router.delete('/rules/:ruleId', (req, res) => emailConfigController.deleteEmailRule(req, res));

// POST /api/email-config/rules/:ruleId/test - Test email rule
router.post('/rules/:ruleId/test', (req, res) => emailConfigController.testEmailRule(req, res));

// ========== EMAIL RESPONSE TEMPLATES ROUTES ==========

// GET /api/email-config/templates - List all email templates
router.get('/templates', (req, res) => emailConfigController.getEmailTemplates(req, res));

// POST /api/email-config/templates - Create new email template
router.post('/templates', (req, res) => emailConfigController.createEmailTemplate(req, res));

// ========== EMAIL MONITORING CONTROL ROUTES ==========

// POST /api/email-config/monitoring/start - Start email monitoring
router.post('/monitoring/start', (req, res) => emailConfigController.startEmailMonitoring(req, res));

// POST /api/email-config/monitoring/stop - Stop email monitoring
router.post('/monitoring/stop', (req, res) => emailConfigController.stopEmailMonitoring(req, res));

// GET /api/email-config/monitoring/status - Get monitoring status
router.get('/monitoring/status', (req, res) => emailConfigController.getEmailMonitoringStatus(req, res));

// GET /api/email-config/monitoring/logs - Get processing logs
router.get('/monitoring/logs', (req, res) => emailConfigController.getProcessingLogs(req, res));

// POST /api/email-config/monitoring/test - Process test email
router.post('/monitoring/test', (req, res) => emailConfigController.processTestEmail(req, res));

// GET /api/email-config/templates/:templateId - Get specific email template
router.get('/templates/:templateId', (req, res) => emailConfigController.getEmailTemplate(req, res));

// PUT /api/email-config/templates/:templateId - Update email template
router.put('/templates/:templateId', (req, res) => emailConfigController.updateEmailTemplate(req, res));

// DELETE /api/email-config/templates/:templateId - Delete email template
router.delete('/templates/:templateId', (req, res) => emailConfigController.deleteEmailTemplate(req, res));

// POST /api/email-config/templates/:templateId/render - Render template with variables
router.post('/templates/:templateId/render', (req, res) => emailConfigController.renderEmailTemplate(req, res));

// GET /api/email-config/variables - Get available template variables
router.get('/variables', (req, res) => emailConfigController.getAvailableVariables(req, res));

// ========== EMAIL INBOX MESSAGES ROUTES ==========

// GET /api/email-config/inbox - Get inbox messages
router.get('/inbox', (req, res) => emailConfigController.getInboxMessages(req, res));

// GET /api/email-config/inbox/:messageId - Get specific inbox message
router.get('/inbox/:messageId', (req, res) => emailConfigController.getInboxMessage(req, res));

// PUT /api/email-config/inbox/:messageId/read - Mark message as read
router.put('/inbox/:messageId/read', (req, res) => emailConfigController.markInboxMessageAsRead(req, res));

// POST /api/email-config/inbox/:messageId/create-rule - Create rule from message
router.post('/inbox/:messageId/create-rule', (req, res) => emailConfigController.createRuleFromInboxMessage(req, res));

export default router;
