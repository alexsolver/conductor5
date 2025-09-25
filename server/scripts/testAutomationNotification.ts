
import { randomUUID } from 'crypto';

async function testAutomationNotification() {
  console.log('🧪 [TEST] Starting automation notification test...');

  const tenantId = '3f99462f-3621-4b1b-bea8-782acc50d62e'; // Your tenant ID
  const testEmail = 'alex@lansolver.com';
  const testMessage = 'Teste de notificação de automação - ' + new Date().toLocaleString();

  try {
    // Import required services
    const { ActionExecutor } = await import('../modules/omnibridge/infrastructure/services/ActionExecutor');
    const { AutomationAction } = await import('../modules/omnibridge/domain/entities/AutomationRule');

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

    console.log('✅ [TEST] Automation notification test result:', result);

    if (result.success) {
      console.log('🎉 [TEST] Notification action executed successfully!');
    } else {
      console.log('❌ [TEST] Notification action failed:', result.message);
    }

  } catch (error) {
    console.error('❌ [TEST] Error testing automation notification:', error);
  }
}

// Run the test
testAutomationNotification().then(() => {
  console.log('🏁 [TEST] Test completed');
  process.exit(0);
}).catch(error => {
  console.error('💥 [TEST] Test failed:', error);
  process.exit(1);
});
