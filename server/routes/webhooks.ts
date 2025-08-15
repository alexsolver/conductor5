import { Router } from 'express';

const router = Router();

console.log('🔧 [WEBHOOKS] Registering webhook routes (no authentication required)');

/**
 * Telegram Webhook Endpoint - Receive incoming messages
 * POST /api/webhooks/telegram/:tenantId
 */
router.post('/telegram/:tenantId', async (req, res) => {
  try {
    const { tenantId } = req.params;
    const webhookData = req.body;

    console.log(`📨 [TELEGRAM-WEBHOOK] Received webhook for tenant: ${tenantId}`);

    // ✅ VALIDATION: Check if it's a valid Telegram webhook
    if (!webhookData.update_id) {
      console.log(`❌ [TELEGRAM-WEBHOOK] Invalid webhook data - missing update_id`);
      return res.status(200).json({
        success: false,
        message: 'Invalid Telegram webhook data'
      });
    }

    // ✅ PROCESSING: Process with MessageIngestionService
    const { MessageIngestionService } = await import('../modules/omnibridge/infrastructure/services/MessageIngestionService');
    const { DrizzleMessageRepository } = await import('../modules/omnibridge/infrastructure/repositories/DrizzleMessageRepository');
    
    const messageRepository = new DrizzleMessageRepository();
    const ingestionService = new MessageIngestionService(messageRepository);
    
    const result = await ingestionService.processTelegramWebhook(webhookData, tenantId);

    // ✅ SUCCESS: Telegram expects 200 OK response
    return res.status(200).json({
      success: result.success,
      message: 'Webhook processed successfully',
      processed: result.processed,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error(`❌ [TELEGRAM-WEBHOOK] Error processing webhook:`, error);

    // ✅ CRITICAL: Always return 200 to Telegram to avoid retries
    return res.status(200).json({
      success: false,
      message: 'Webhook processing error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

export default router;