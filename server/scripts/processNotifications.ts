import { NotificationController } from '../modules/notifications/application/controllers/NotificationController.js';

async function processNotifications() {
  console.log('📧 [PROCESS-NOTIFICATIONS] Iniciando processamento de notificações pendentes...');

  const tenantId = '3f99462f-3621-4b1b-bea8-782acc50d62e';

  try {
    // Create notification controller instance
    const notificationController = new NotificationController();

    // Create mock request object (sem autenticação para script interno)
    const mockReq = {
      user: { 
        tenantId,
        userId: '550e8400-e29b-41d4-a716-446655440001',
        id: '550e8400-e29b-41d4-a716-446655440001'
      },
      body: {
        tenantId
      }
    } as any;

    // Create mock response object
    const mockRes = {
      status: (code: number) => ({
        json: (data: any) => {
          console.log(`📧 [PROCESS-NOTIFICATIONS] Response (${code}):`, JSON.stringify(data, null, 2));
          return mockRes;
        }
      }),
      json: (data: any) => {
        console.log(`📧 [PROCESS-NOTIFICATIONS] Processing result:`, JSON.stringify(data, null, 2));
        return mockRes;
      }
    } as any;

    // Process pending notifications
    console.log('🔔 [PROCESS-NOTIFICATIONS] Processando notificações...');
    await notificationController.processNotifications(mockReq, mockRes);

    console.log('✅ [PROCESS-NOTIFICATIONS] Processamento concluído!');

  } catch (error) {
    console.error('❌ [PROCESS-NOTIFICATIONS] Erro ao processar notificações:', error);
    if (error instanceof Error) {
      console.error('❌ [PROCESS-NOTIFICATIONS] Detalhes do erro:', error.message);
      console.error('❌ [PROCESS-NOTIFICATIONS] Stack:', error.stack);
    }
  }
}

// Execute the processing
processNotifications().then(() => {
  console.log('📧 [PROCESS-NOTIFICATIONS] Script finalizado');
}).catch((error) => {
  console.error('❌ [PROCESS-NOTIFICATIONS] Erro fatal:', error);
});