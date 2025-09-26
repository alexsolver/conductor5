
// Script para enviar notificação de teste para alex@lansolver.com
console.log('🔔 Enviando notificação de teste...');

async function sendTestNotification() {
  try {
    const response = await fetch('http://localhost:5000/api/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1NTBlODQwMC1lMjliLTQxZDQtYTcxNi00NDY2NTU0NDAwMDEiLCJlbWFpbCI6ImFsZXhAbGFuc29sdmVyLmNvbSIsInRlbmFudElkIjoiM2Y5OTQ2MmYtMzYyMS00YjFiLWJlYTgtNzgyYWNjNTBkNjJlIiwiaWF0IjoxNzM3OTc3MDExLCJleHAiOjE3Mzc5ODA2MTF9.abc123',
        'X-Tenant-ID': '3f99462f-3621-4b1b-bea8-782acc50d62e'
      },
      body: JSON.stringify({
        userId: '550e8400-e29b-41d4-a716-446655440001',
        type: 'test',
        title: 'Notificação de Teste',
        message: 'Esta é uma notificação de teste enviada para alex@lansolver.com',
        priority: 'medium',
        channels: ['in_app', 'email'],
        data: {
          email: 'alex@lansolver.com',
          testType: 'manual_test',
          timestamp: new Date().toISOString()
        }
      })
    });

    const result = await response.json();
    console.log('📧 Resultado do envio de notificação:', result);
    
    if (result.success) {
      console.log('✅ Notificação enviada com sucesso!');
      console.log('📝 ID da notificação:', result.data?.id);
    } else {
      console.log('❌ Falha ao enviar notificação:', result.message || result.error);
    }
  } catch (error) {
    console.log('❌ Erro ao enviar notificação:', error.message);
  }
}

// Executar teste
sendTestNotification();
