
import { randomUUID } from 'crypto';

async function testNotificationActionFixed() {
  console.log('🧪 [TEST] Testing fixed notification action...');

  const tenantId = '3f99462f-3621-4b1b-bea8-782acc50d62e';
  const testUserId = '550e8400-e29b-41d4-a716-446655440001'; // Admin user ID
  const testMessage = 'Teste de notificação corrigida - ' + new Date().toLocaleString();

  try {
    // Import required services
    const { ActionExecutor } = await import('../modules/omnibridge/infrastructure/services/ActionExecutor');

    // Create test context
    const context = {
      ruleId: 'test-rule-' + randomUUID(),
      ruleName: 'Teste de Notificação Corrigida',
      tenantId: tenantId,
      messageData: {
        content: 'Esta é uma mensagem de teste para disparar a automação corrigida',
        from: 'test@conductor.com',
        subject: 'Teste de Automação',
        channel: 'test',
        timestamp: new Date()
      },
      aiAnalysis: null
    };

    // Create test action with proper configuration
    const testAction = {
      id: 'test-action-' + randomUUID(),
      type: 'send_notification',
      config: {
        users: [testUserId], // ✅ Especificar usuários corretamente
        subject: 'Notificação de Teste da Automação',
        message: testMessage,
        channels: ['in_app', 'email'],
        priority: 'medium'
      },
      params: {
        users: [testUserId],
        subject: 'Notificação de Teste da Automação',
        message: testMessage,
        channels: ['in_app', 'email'],
        priority: 'medium'
      }
    };

    // Execute action
    const actionExecutor = new ActionExecutor();
    const result = await actionExecutor.execute(testAction as any, context);

    console.log('✅ [TEST] Fixed notification test result:', JSON.stringify(result, null, 2));

    if (result.success) {
      console.log('🎉 [TEST] Notification action is now working correctly!');
      console.log(`📊 [TEST] Success count: ${result.data?.successCount}/${result.data?.totalCount}`);
    } else {
      console.error('❌ [TEST] Notification action still has issues:', result.error);
    }

  } catch (error) {
    console.error('❌ [TEST] Error testing notification action:', error);
  }
}

// Execute test
testNotificationActionFixed().catch(console.error);
