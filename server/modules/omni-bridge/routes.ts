
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
router.use(requirePermission('tenant', 'manage_settings'));

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
router.get('/monitoring', omniBridgeController.getMonitoringStatus.bind(omniBridgeController));

export { router as omniBridgeRoutes };
