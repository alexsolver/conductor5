
import { randomUUID } from 'crypto';

async function sendTestNotification() {
  console.log('📧 [TEST-NOTIFICATION] Enviando notificação de teste para alex@lansolver.com...');

  const tenantId = '3f99462f-3621-4b1b-bea8-782acc50d62e';
  const testEmail = 'alex@lansolver.com';
  const testUserId = '550e8400-e29b-41d4-a716-446655440001'; // Admin user ID
  const testMessage = 'Notificação de teste enviada em ' + new Date().toLocaleString('pt-BR');

  try {
    // Import required services
    const { NotificationController } = await import('../modules/notifications/application/controllers/NotificationController');

    // Create notification controller instance
    const notificationController = new NotificationController();

    // Create mock request object
    const mockReq = {
      user: { 
        tenantId,
        userId: testUserId,
        id: testUserId
      },
      body: {
        tenantId,
        userId: testUserId,
        type: 'custom',
        title: 'Notificação de Teste - Sistema Conductor',
        message: testMessage,
        data: { 
          email: testEmail,
          recipientEmail: testEmail,
          test: true,
          timestamp: new Date().toISOString()
        },
        priority: 'medium',
        channels: ['email', 'in_app']
      }
    } as any;

    // Create mock response object
    const mockRes = {
      status: (code: number) => ({
        json: (data: any) => {
          console.log(`📧 [TEST-NOTIFICATION] Response (${code}):`, JSON.stringify(data, null, 2));
          return mockRes;
        }
      }),
      json: (data: any) => {
        console.log(`📧 [TEST-NOTIFICATION] Notification created successfully:`, JSON.stringify(data, null, 2));
        return mockRes;
      }
    } as any;

    // Create the notification
    console.log('🔔 [TEST-NOTIFICATION] Criando notificação...');
    await notificationController.createNotification(mockReq, mockRes);

    console.log('✅ [TEST-NOTIFICATION] Teste de notificação concluído!');
    console.log(`📧 [TEST-NOTIFICATION] Email de destino: ${testEmail}`);
    console.log(`💬 [TEST-NOTIFICATION] Mensagem: ${testMessage}`);

  } catch (error) {
    console.error('❌ [TEST-NOTIFICATION] Erro ao enviar notificação de teste:', error);
    if (error instanceof Error) {
      console.error('❌ [TEST-NOTIFICATION] Detalhes do erro:', error.message);
      console.error('❌ [TEST-NOTIFICATION] Stack:', error.stack);
    }
  }
}

// Execute the test
sendTestNotification().then(() => {
  console.log('📧 [TEST-NOTIFICATION] Script finalizado');
}).catch((error) => {
  console.error('❌ [TEST-NOTIFICATION] Erro fatal:', error);
});
