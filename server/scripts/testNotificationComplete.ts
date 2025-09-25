
import { randomUUID } from 'crypto';

async function testNotificationComplete() {
  console.log('🧪 [TEST] Testing complete notification system...');

  const tenantId = '3f99462f-3621-4b1b-bea8-782acc50d62e';
  const testEmail = 'alex@lansolver.com';
  const testMessage = 'Teste completo de notificação - ' + new Date().toLocaleString();

  try {
    // Import required services
    const { ActionExecutor } = await import('../modules/omnibridge/infrastructure/services/ActionExecutor');

    // Create test context
    const context = {
      ruleId: 'test-rule-' + randomUUID(),
      ruleName: 'Teste Completo de Notificação',
      tenantId: tenantId,
      messageData: {
        content: 'Esta é uma mensagem de teste para disparar a automação de notificação',
        sender: 'test@conductor.com',
        channel: 'telegram',
        channelType: 'telegram',
        timestamp: new Date()
      },
      aiAnalysis: null
    };

    // Create test action
    const testAction = {
      id: 'test-action-' + randomUUID(),
      type: 'send_notification',
      params: {
        recipient: testEmail,
        message: testMessage,
        priority: 'medium'
      },
      config: {
        recipient: testEmail,
        message: testMessage,
        priority: 'medium'
      }
    };

    console.log('🔄 [TEST] Executing notification action...');

    // Execute action
    const actionExecutor = new ActionExecutor();
    const result = await actionExecutor.execute(testAction as any, context);

    console.log('✅ [TEST] Complete notification test result:', result);

    if (result.success) {
      console.log('🎉 [TEST] Notification system is now working correctly!');
      console.log('📧 [TEST] Notification details:', result.data);
      console.log('📋 [TEST] Success message:', result.message);
    } else {
      console.log('❌ [TEST] Notification system still has issues:', result.message);
      console.log('🔍 [TEST] Error details:', result.error);
    }

    // Test notification retrieval
    console.log('\n🔍 [TEST] Testing notification retrieval...');
    
    const { DrizzleNotificationRepository } = await import('../modules/notifications/infrastructure/repositories/DrizzleNotificationRepository');
    const notificationRepo = new DrizzleNotificationRepository();
    
    // Get recent notifications
    const notifications = await notificationRepo.findByType('automation_notification', tenantId, 5);
    console.log('📊 [TEST] Found notifications:', notifications.length);
    
    notifications.forEach((notif, index) => {
      console.log(`📧 [TEST] Notification ${index + 1}:`, {
        id: notif.id,
        title: notif.title,
        message: notif.message.substring(0, 50) + '...',
        status: notif.status,
        createdAt: notif.createdAt
      });
    });

  } catch (error) {
    console.error('❌ [TEST] Error testing notification:', error);
  }
}

// Run the test
testNotificationComplete().then(() => {
  console.log('🏁 [TEST] Complete notification test finished');
  process.exit(0);
}).catch(error => {
  console.error('💥 [TEST] Test failed:', error);
  process.exit(1);
});
