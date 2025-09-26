
// Script para enviar notificação de teste para alex@lansolver.com
console.log('🔔 Iniciando teste de notificação...');

async function getValidToken() {
  try {
    console.log('🔑 Fazendo login para obter token válido...');
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'alex@lansolver.com',
        password: 'password123' // Você pode precisar ajustar a senha
      })
    });

    const loginData = await loginResponse.json();
    
    if (loginData.success && loginData.data && loginData.data.tokens) {
      console.log('✅ Login realizado com sucesso');
      return loginData.data.tokens.accessToken;
    } else {
      console.log('❌ Falha no login:', loginData.message);
      return null;
    }
  } catch (error) {
    console.log('❌ Erro durante login:', error.message);
    return null;
  }
}

async function sendTestNotification() {
  try {
    // Primeiro, obter um token válido
    const token = await getValidToken();
    
    if (!token) {
      console.log('❌ Não foi possível obter um token válido. Parando execução.');
      return;
    }

    console.log('📨 Enviando notificação de teste...');
    
    const response = await fetch('http://localhost:5000/api/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'X-Tenant-ID': '3f99462f-3621-4b1b-bea8-782acc50d62e'
      },
      body: JSON.stringify({
        userId: 'f8990921-62bd-42f1-921f-09477baef86e',
        type: 'custom',
        title: 'Notificação de Teste',
        message: 'Esta é uma notificação de teste enviada para alex@lansolver.com através do sistema de notificações',
        priority: 'medium',
        channels: ['in_app', 'email'],
        data: {
          email: 'alex@lansolver.com',
          testType: 'manual_test',
          timestamp: new Date().toISOString(),
          source: 'notification_test_script'
        }
      })
    });

    const result = await response.json();
    console.log('📧 Resultado do envio de notificação:', result);
    
    if (result.success) {
      console.log('✅ Notificação criada com sucesso!');
      console.log('📝 ID da notificação:', result.data?.id);
      
      // Se a notificação foi criada, tentar enviá-la
      if (result.data?.id) {
        console.log('📤 Tentando enviar a notificação...');
        const sendResponse = await fetch(`http://localhost:5000/api/notifications/${result.data.id}/send`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'X-Tenant-ID': '3f99462f-3621-4b1b-bea8-782acc50d62e'
          },
          body: JSON.stringify({
            forceResend: true
          })
        });
        
        const sendResult = await sendResponse.json();
        console.log('📤 Resultado do envio:', sendResult);
      }
    } else {
      console.log('❌ Falha ao criar notificação:', result.message || result.error);
    }
  } catch (error) {
    console.log('❌ Erro ao enviar notificação:', error.message);
  }
}

// Executar teste
sendTestNotification();
