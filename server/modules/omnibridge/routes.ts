import { Router } from 'express';
import { OmnibridgeController } from './application/controllers/OmnibridgeController';
import { EmailMonitoringService } from './services/EmailMonitoringService';
import { jwtAuth } from '../../middleware/jwtAuth';

const router = Router();
const omnibridgeController = new OmnibridgeController();
const emailMonitoringService = new EmailMonitoringService();

// Apply authentication to all routes
router.use(jwtAuth);

// =====================================================
// EMAIL MONITORING
// =====================================================
router.post('/monitoring/start', async (req: any, res) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return res.status(400).json({ message: 'Tenant ID is required' });
    }

    const result = await emailMonitoringService.startMonitoring(tenantId);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error starting monitoring:', error);
    res.status(500).json({ message: 'Failed to start monitoring' });
  }
});

router.get('/monitoring/status', async (req: any, res) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return res.status(400).json({ message: 'Tenant ID is required' });
    }

    const status = await emailMonitoringService.getMonitoringStatus(tenantId);
    res.json({ 
      success: true, 
      data: {
        ...status,
        tenantId,
        message: status.isMonitoring ? 'Monitoramento ativo' : 'Monitoramento inativo'
      }
    });
  } catch (error) {
    console.error('Error getting monitoring status:', error);
    res.status(500).json({ message: 'Failed to get monitoring status' });
  }
});

// =====================================================
// COMMUNICATION CHANNELS
// =====================================================
router.get('/channels', omnibridgeController.getChannels.bind(omnibridgeController));
router.post('/channels', omnibridgeController.createChannel.bind(omnibridgeController));
router.get('/channels/:channelId', omnibridgeController.getChannelById.bind(omnibridgeController));
router.put('/channels/:channelId', omnibridgeController.updateChannel.bind(omnibridgeController));
router.delete('/channels/:channelId', omnibridgeController.deleteChannel.bind(omnibridgeController));
router.post('/channels/:channelId/test', omnibridgeController.testChannelConnection.bind(omnibridgeController));
router.post('/channels/:channelId/monitoring', omnibridgeController.toggleChannelMonitoring.bind(omnibridgeController));
router.put('/channels/:channelId/configuration', omnibridgeController.saveChannelConfiguration.bind(omnibridgeController));

// =====================================================
// UNIFIED INBOX
// =====================================================
router.get('/inbox', omnibridgeController.getInboxMessages.bind(omnibridgeController));
router.get('/inbox/unread-count', omnibridgeController.getUnreadCount.bind(omnibridgeController));
router.get('/inbox/:messageId', omnibridgeController.getInboxMessageById.bind(omnibridgeController));
router.patch('/inbox/:messageId/read', omnibridgeController.markMessageAsRead.bind(omnibridgeController));
router.patch('/inbox/:messageId/archive', omnibridgeController.archiveMessage.bind(omnibridgeController));
router.post('/inbox/search', omnibridgeController.searchMessages.bind(omnibridgeController));

// =====================================================
// PROCESSING RULES
// =====================================================
router.get('/rules', omnibridgeController.getProcessingRules.bind(omnibridgeController));
router.post('/rules', omnibridgeController.createProcessingRule.bind(omnibridgeController));
router.put('/rules/:ruleId', omnibridgeController.updateProcessingRule.bind(omnibridgeController));
router.delete('/rules/:ruleId', omnibridgeController.deleteProcessingRule.bind(omnibridgeController));

// =====================================================
// RESPONSE TEMPLATES
// =====================================================
router.get('/templates', omnibridgeController.getResponseTemplates.bind(omnibridgeController));
router.post('/templates', omnibridgeController.createResponseTemplate.bind(omnibridgeController));

// =====================================================
// TEAM SIGNATURES
// =====================================================
router.get('/signatures', omnibridgeController.getSignatures.bind(omnibridgeController));

// =====================================================
// ANALYTICS AND MONITORING
// =====================================================
router.get('/analytics', omnibridgeController.getChannelAnalytics.bind(omnibridgeController));
router.get('/dashboard/metrics', omnibridgeController.getDashboardMetrics.bind(omnibridgeController));
router.get('/logs', omnibridgeController.getProcessingLogs.bind(omnibridgeController));
router.get('/health', omnibridgeController.performHealthCheck.bind(omnibridgeController));

export default router;