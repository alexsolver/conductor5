
import { randomUUID } from 'crypto';

async function testNotificationFix() {
  console.log('🧪 [TEST] Testing notification fix...');

  const tenantId = '3f99462f-3621-4b1b-bea8-782acc50d62e';
  const testEmail = 'alex@lansolver.com';
  const testMessage = 'Teste corrigido de notificação - ' + new Date().toLocaleString();

  try {
    // Import required services
    const { ActionExecutor } = await import('../modules/omnibridge/infrastructure/services/ActionExecutor');

    // Create test context
    const context = {
      ruleId: 'test-rule-' + randomUUID(),
      ruleName: 'Teste de Notificação Corrigido',
      tenantId: tenantId,
      messageData: {
        content: 'Esta é uma mensagem de teste para disparar a automação corrigida',
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

    // Execute action
    const actionExecutor = new ActionExecutor();
    const result = await actionExecutor.execute(testAction as any, context);

    console.log('✅ [TEST] Notification test result:', result);

    if (result.success) {
      console.log('🎉 [TEST] Notification action now working correctly!');
      console.log('📧 [TEST] Details:', result.data);
    } else {
      console.log('❌ [TEST] Notification action still failing:', result.message);
      console.log('🔍 [TEST] Error details:', result.error);
    }

  } catch (error) {
    console.error('❌ [TEST] Error testing notification:', error);
  }
}

// Run the test
testNotificationFix().then(() => {
  console.log('🏁 [TEST] Notification fix test completed');
  process.exit(0);
}).catch(error => {
  console.error('💥 [TEST] Test failed:', error);
  process.exit(1);
});
