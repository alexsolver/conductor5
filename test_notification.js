// Teste rápido para verificar sistema de notificação
console.log('🔔 Testando sistema de notificação...');

async function testNotification() {
  try {
    const response = await fetch('/api/omnibridge/automation-rules/test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant-ID': '3f99462f-3621-4b1b-bea8-782acc50d62e'
      },
      credentials: 'include',
      body: JSON.stringify({
        rule: {
          id: 'test_rule',
          name: 'Teste Notificação',
          triggers: [{
            type: 'keyword',
            config: {
              keywords: 'test'
            }
          }],
          actions: [{
            type: 'send_notification',
            config: {
              recipient: 'alex@lansolver.com',
              message: 'Notificação de teste de automação',
              priority: 'medium'
            }
          }]
        },
        message: 'Esta é uma mensagem test para testar a automação',
        channel: 'email'
      })
    });

    const result = await response.json();
    console.log('📧 Resultado do teste:', result);
    
    if (result.success) {
      console.log('✅ Teste de notificação executado com sucesso!');
    } else {
      console.log('❌ Teste de notificação falhou:', result.error);
    }
  } catch (error) {
    console.log('❌ Erro ao testar notificação:', error);
  }
}

// Executar teste apenas se estivermos no browser
if (typeof window !== 'undefined') {
  testNotification();
}