/**
 * OmniBridge Routes
 * Clean Architecture - Infrastructure Layer
 */
import { Router } from 'express';
import { jwtAuth } from '../../middleware/jwtAuth';
import { requirePermission } from '../../middleware/rbacMiddleware';
import { OmniBridgeController } from './application/controllers/OmniBridgeController';
import { DrizzleChannelRepository } from './infrastructure/repositories/DrizzleChannelRepository';
import { DrizzleUnifiedMessageRepository } from './infrastructure/repositories/DrizzleUnifiedMessageRepository';
import { DrizzleProcessingRuleRepository } from './infrastructure/repositories/DrizzleProcessingRuleRepository';
import { DrizzleMessageTemplateRepository } from './infrastructure/repositories/DrizzleMessageTemplateRepository';

const router = Router();

// Initialize repositories
const channelRepository = new DrizzleChannelRepository();
const messageRepository = new DrizzleUnifiedMessageRepository();
const ruleRepository = new DrizzleProcessingRuleRepository();
const templateRepository = new DrizzleMessageTemplateRepository();

// Initialize controller
const omniBridgeController = new OmniBridgeController(
  channelRepository,
  messageRepository,
  ruleRepository,
  templateRepository
);

// Apply authentication middleware
router.use(jwtAuth);

// Middleware de verificação de permissão mais flexível para OmniBridge
router.use((req, res, next) => {
  const user = (req as any).user;

  console.log('🔐 OmniBridge Auth Debug:', {
    hasUser: !!user,
    userRole: user?.role,
    userId: user?.id,
    tenantId: user?.tenantId,
    authHeader: req.headers.authorization ? 'Present' : 'Missing'
  });

  if (!user) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  // Permitir acesso para saas_admin, tenant_admin e agent
  const allowedRoles = ['saas_admin', 'tenant_admin', 'agent'];
  if (!allowedRoles.includes(user.role)) {
    console.log('🚫 OmniBridge Access Denied:', { userRole: user.role, allowedRoles });
    return res.status(403).json({ success: false, message: 'Insufficient permissions for OmniBridge' });
  }

  console.log('✅ OmniBridge Access Granted for:', user.role);
  next();
});

// === CHANNEL MANAGEMENT ROUTES ===
router.get('/channels', omniBridgeController.getChannels.bind(omniBridgeController));
router.post('/channels/sync', omniBridgeController.syncChannels.bind(omniBridgeController));

// === INBOX MANAGEMENT ROUTES ===
router.get('/inbox', omniBridgeController.getInbox.bind(omniBridgeController));
router.put('/inbox/:messageId/read', omniBridgeController.markMessageAsRead.bind(omniBridgeController));
router.put('/inbox/:messageId/archive', omniBridgeController.archiveMessage.bind(omniBridgeController));

// === PROCESSING ROUTES ===
router.post('/process', omniBridgeController.processMessages.bind(omniBridgeController));
router.get('/rules', omniBridgeController.getProcessingRules.bind(omniBridgeController));

// === TEMPLATE ROUTES ===
router.get('/templates', omniBridgeController.getTemplates.bind(omniBridgeController));

// === MONITORING ROUTES ===
router.post('/monitoring/start', omniBridgeController.startMonitoring.bind(omniBridgeController));
router.get('/monitoring', omniBridgeController.getMonitoringStatus.bind(omniBridgeController));
router.post('/sync/force', omniBridgeController.forceSyncEmails.bind(omniBridgeController));

export { router as omniBridgeRoutes };