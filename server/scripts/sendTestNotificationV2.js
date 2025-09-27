// Script para enviar notificação de teste via SendGrid
import { NotificationController } from '../modules/notifications/application/controllers/NotificationController.js';

async function sendTestNotification() {
  console.log('📧 [TEST-NOTIFICATION] Iniciando envio de notificação de teste...');

  const tenantId = '3f99462f-3621-4b1b-bea8-782acc50d62e';
  const userId = '550e8400-e29b-41d4-a716-446655440001';

  try {
    // Create notification controller instance
    const notificationController = new NotificationController();

    // Create test notification data
    const testNotificationData = {
      tenantId,
      recipientId: userId,
      type: 'ticket_created',
      title: 'Notificação de Teste - Conductor',
      content: 'Esta é uma notificação de teste enviada pelo sistema Conductor para verificar a integração com SendGrid.',
      priority: 'medium',
      channels: ['email', 'in_app'],
      metadata: {
        test: true,
        timestamp: new Date().toISOString(),
        source: 'manual_test'
      }
    };

    // Create mock request object
    const mockReq = {
      user: { 
        tenantId,
        userId,
        id: userId
      },
      body: testNotificationData
    };

    // Create mock response object
    const mockRes = {
      status: (code) => ({
        json: (data) => {
          console.log(`📧 [TEST-NOTIFICATION] Response (${code}):`, JSON.stringify(data, null, 2));
          return mockRes;
        }
      }),
      json: (data) => {
        console.log('📧 [TEST-NOTIFICATION] Result:', JSON.stringify(data, null, 2));
        return mockRes;
      }
    };

    // Send test notification
    console.log('🔔 [TEST-NOTIFICATION] Criando notificação de teste...');
    await notificationController.createNotification(mockReq, mockRes);

    // Wait a moment then process
    console.log('⏳ [TEST-NOTIFICATION] Aguardando 2 segundos...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Process pending notifications
    console.log('🔄 [TEST-NOTIFICATION] Processando notificações pendentes...');
    const processReq = {
      user: { tenantId, userId, id: userId },
      body: { tenantId }
    };
    
    await notificationController.processNotifications(processReq, mockRes);

    console.log('✅ [TEST-NOTIFICATION] Teste concluído!');

  } catch (error) {
    console.error('❌ [TEST-NOTIFICATION] Erro ao enviar notificação:', error);
    if (error instanceof Error) {
      console.error('❌ [TEST-NOTIFICATION] Detalhes:', error.message);
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