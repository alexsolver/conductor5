// =====================================================
// OMNIBRIDGE ROUTES
// API route definitions for unified communication management
// =====================================================

import { Router } from 'express';
import { OmnibridgeController } from './application/controllers/OmnibridgeController';

const router = Router();
const omnibridgeController = new OmnibridgeController();

// =====================================================
// COMMUNICATION CHANNELS ROUTES
// =====================================================

// GET /api/omnibridge/channels - Get all communication channels
router.get('/channels', omnibridgeController.getChannels.bind(omnibridgeController));

// POST /api/omnibridge/channels - Create a new communication channel
router.post('/channels', omnibridgeController.createChannel.bind(omnibridgeController));

// GET /api/omnibridge/channels/:channelId - Get specific channel
router.get('/channels/:channelId', omnibridgeController.getChannelById.bind(omnibridgeController));

// PUT /api/omnibridge/channels/:channelId - Update channel
router.put('/channels/:channelId', omnibridgeController.updateChannel.bind(omnibridgeController));

// DELETE /api/omnibridge/channels/:channelId - Delete channel
router.delete('/channels/:channelId', omnibridgeController.deleteChannel.bind(omnibridgeController));

// =====================================================
// UNIFIED INBOX ROUTES
// =====================================================

// GET /api/omnibridge/inbox - Get inbox messages with filtering
router.get('/inbox', omnibridgeController.getInboxMessages.bind(omnibridgeController));

// GET /api/omnibridge/inbox/:messageId - Get specific message
router.get('/inbox/:messageId', omnibridgeController.getInboxMessageById.bind(omnibridgeController));

// PUT /api/omnibridge/inbox/:messageId/read - Mark message as read
router.put('/inbox/:messageId/read', omnibridgeController.markMessageAsRead.bind(omnibridgeController));

// PUT /api/omnibridge/inbox/:messageId/archive - Archive message
router.put('/inbox/:messageId/archive', omnibridgeController.archiveMessage.bind(omnibridgeController));

// POST /api/omnibridge/inbox/search - Search messages
router.post('/inbox/search', omnibridgeController.searchMessages.bind(omnibridgeController));

// GET /api/omnibridge/inbox/unread-count - Get unread messages count
router.get('/inbox/unread-count', omnibridgeController.getUnreadCount.bind(omnibridgeController));

// =====================================================
// PROCESSING RULES ROUTES
// =====================================================

// GET /api/omnibridge/rules - Get processing rules
router.get('/rules', omnibridgeController.getProcessingRules.bind(omnibridgeController));

// POST /api/omnibridge/rules - Create processing rule
router.post('/rules', omnibridgeController.createProcessingRule.bind(omnibridgeController));

// PUT /api/omnibridge/rules/:ruleId - Update processing rule
router.put('/rules/:ruleId', omnibridgeController.updateProcessingRule.bind(omnibridgeController));

// DELETE /api/omnibridge/rules/:ruleId - Delete processing rule
router.delete('/rules/:ruleId', omnibridgeController.deleteProcessingRule.bind(omnibridgeController));

// =====================================================
// RESPONSE TEMPLATES ROUTES
// =====================================================

// GET /api/omnibridge/templates - Get response templates
router.get('/templates', omnibridgeController.getResponseTemplates.bind(omnibridgeController));

// POST /api/omnibridge/templates - Create response template
router.post('/templates', omnibridgeController.createResponseTemplate.bind(omnibridgeController));

// =====================================================
// TEAM SIGNATURES ROUTES
// =====================================================

// GET /api/omnibridge/signatures - Get team signatures
router.get('/signatures', omnibridgeController.getSignatures.bind(omnibridgeController));

// =====================================================
// ANALYTICS AND MONITORING ROUTES
// =====================================================

// GET /api/omnibridge/analytics - Get channel analytics
router.get('/analytics', omnibridgeController.getChannelAnalytics.bind(omnibridgeController));

// GET /api/omnibridge/dashboard - Get dashboard metrics
router.get('/dashboard', omnibridgeController.getDashboardMetrics.bind(omnibridgeController));

// GET /api/omnibridge/logs - Get processing logs
router.get('/logs', omnibridgeController.getProcessingLogs.bind(omnibridgeController));

// GET /api/omnibridge/health - Perform health check
router.get('/health', omnibridgeController.performHealthCheck.bind(omnibridgeController));

export { router as omnibridgeRoutes };