
import { randomUUID } from 'crypto';

async function testNotificationAction() {
  console.log('🧪 [TEST] Testing notification action...');

  const tenantId = '3f99462f-3621-4b1b-bea8-782acc50d62e';
  const testUserId = '550e8400-e29b-41d4-a716-446655440001'; // Admin user ID
  const testMessage = 'Teste de notificação de automação - ' + new Date().toLocaleString();

  try {
    // Import required services
    const { ActionExecutor } = await import('../modules/omnibridge/infrastructure/services/ActionExecutor');

    // Create test context
    const context = {
      ruleId: 'test-rule-' + randomUUID(),
      ruleName: 'Teste de Notificação',
      tenantId: tenantId,
      messageData: {
        content: 'Esta é uma mensagem de teste para disparar a automação',
        sender: 'test@conductor.com',
        channel: 'test',
        timestamp: new Date()
      },
      aiAnalysis: null
    };

    // Create test action
    const testAction = {
      id: 'test-action-' + randomUUID(),
      type: 'send_notification',
      params: {
        recipient: testUserId,
        message: testMessage,
        priority: 'medium',
        type: 'automation_test'
      },
      config: {
        recipient: testUserId,
        message: testMessage,
        priority: 'medium',
        type: 'automation_test'
      }
    };

    // Execute action
    const actionExecutor = new ActionExecutor();
    const result = await actionExecutor.execute(testAction as any, context);

    console.log('✅ [TEST] Notification action test result:', result);

    if (result.success) {
      console.log('🎉 [TEST] Notification action is working correctly!');
      console.log('📧 [TEST] Notification sent to:', testUserId);
      console.log('💬 [TEST] Message:', testMessage);
    } else {
      console.error('❌ [TEST] Notification action failed:', result.message);
    }

    return result;

  } catch (error) {
    console.error('❌ [TEST] Error testing notification action:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Execute test if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testNotificationAction().then(result => {
    console.log('🏁 [TEST] Test completed:', result);
    process.exit(0);
  }).catch(error => {
    console.error('💥 [TEST] Test failed with error:', error);
    process.exit(1);
  });
}

export { testNotificationAction };
