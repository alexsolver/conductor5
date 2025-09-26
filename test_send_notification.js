
// Script para enviar notificação de teste - Corrigido
console.log('🔔 Iniciando teste de notificação...');

async function sendTestNotificationFixed() {
  try {
    console.log('📨 Enviando notificação de teste com campos corretos...');
    
    // Use um token válido do browser ou faça login antes
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1NTBlODQwMC1lMjliLTQxZDQtYTcxNi00NDY2NTU0NDAwMDEiLCJlbWFpbCI6ImFsZXhAbGFuc29sdmVyLmNvbSIsInRlbmFudElkIjoiM2Y5OTQ2MmYtMzYyMS00YjFiLWJlYTgtNzgyYWNjNTBkNjJlIiwiaWF0IjoxNzM3OTc3MDExLCJleHAiOjE3Mzc5ODA2MTF9.abc123';
    
    const notificationData = {
      // Campos obrigatórios conforme a API
      tenantId: '3f99462f-3621-4b1b-bea8-782acc50d62e',
      userId: '550e8400-e29b-41d4-a716-446655440001', // User ID do alex@lansolver.com
      title: 'Teste de Notificação',
      message: 'Esta é uma notificação de teste enviada para alex@lansolver.com',
      
      // Campos opcionais
      type: 'system_maintenance',
      severity: 'medium',
      channels: ['in_app'],
      data: {
        email: 'alex@lansolver.com',
        testType: 'manual_test',
        timestamp: new Date().toISOString(),
        source: 'notification_test_script_fixed'
      }
    };
    
    console.log('📤 Dados da notificação:', JSON.stringify(notificationData, null, 2));
    
    const response = await fetch('http://localhost:5000/api/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'X-Tenant-ID': '3f99462f-3621-4b1b-bea8-782acc50d62e'
      },
      body: JSON.stringify(notificationData)
    });

    console.log('📊 Status da resposta:', response.status);
    
    const result = await response.json();
    console.log('📧 Resultado completo:', JSON.stringify(result, null, 2));
    
    if (result.success) {
      console.log('✅ Notificação criada com sucesso!');
      console.log('📝 ID da notificação:', result.data?.id);
    } else {
      console.log('❌ Falha ao criar notificação:', result.message || result.error);
      
      // Debug adicional
      if (response.status === 400) {
        console.log('🔍 Erro 400 - Bad Request. Verifique os campos obrigatórios:');
        console.log('- tenantId:', notificationData.tenantId ? '✅' : '❌');
        console.log('- userId:', notificationData.userId ? '✅' : '❌');
        console.log('- title:', notificationData.title ? '✅' : '❌');
        console.log('- message:', notificationData.message ? '✅' : '❌');
      }
    }
  } catch (error) {
    console.log('❌ Erro ao enviar notificação:', error.message);
    console.log('🔍 Stack trace:', error.stack);
  }
}

// Função alternativa para testar com login primeiro
async function testWithLogin() {
  try {
    console.log('🔑 Tentando fazer login primeiro...');
    
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'alex@lansolver.com',
        password: 'admin123' // Tente diferentes senhas
      })
    });

    const loginData = await loginResponse.json();
    console.log('📊 Login response:', JSON.stringify(loginData, null, 2));
    
    if (loginData.success && loginData.data?.tokens?.accessToken) {
      console.log('✅ Login realizado com sucesso');
      const token = loginData.data.tokens.accessToken;
      
      // Usar token válido para criar notificação
      await sendNotificationWithToken(token);
    } else {
      console.log('❌ Falha no login, usando método direto...');
      await sendTestNotificationFixed();
    }
  } catch (error) {
    console.log('❌ Erro durante login:', error.message);
    await sendTestNotificationFixed();
  }
}

async function sendNotificationWithToken(token) {
  const notificationData = {
    tenantId: '3f99462f-3621-4b1b-bea8-782acc50d62e',
    userId: '550e8400-e29b-41d4-a716-446655440001',
    title: 'Teste de Notificação com Token Válido',
    message: 'Esta é uma notificação de teste enviada com token válido para alex@lansolver.com',
    type: 'system_maintenance',
    severity: 'medium',
    channels: ['in_app']
  };
  
  const response = await fetch('http://localhost:5000/api/notifications', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'X-Tenant-ID': '3f99462f-3621-4b1b-bea8-782acc50d62e'
    },
    body: JSON.stringify(notificationData)
  });

  const result = await response.json();
  console.log('📧 Resultado com token válido:', JSON.stringify(result, null, 2));
}

// Executar teste
console.log('🚀 Executando teste de notificação...');
testWithLogin();
