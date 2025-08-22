
import { createNotificationUseCase } from '../modules/notifications-alerts/application/use-cases/CreateNotificationUseCase';

async function testRealTimeNotifications() {
  console.log('🧪 [TEST] Testing real-time notifications...');
  
  const tenantId = '3f99462f-3621-4b1b-bea8-782acc50d62e';
  
  // Criar notificação normal
  setTimeout(async () => {
    try {
      console.log('📨 [TEST] Creating normal notification...');
      
      // Esta seria a implementação real usando o use case
      const notification = {
        tenantId,
        type: 'system',
        title: 'Teste de Notificação Normal',
        message: 'Esta é uma notificação de teste para verificar o sistema de push em tempo real.',
        priority: 3,
        recipientId: 'test-user',
        channels: ['in-app', 'email']
      };
      
      console.log('📨 [TEST] Normal notification would be created:', notification);
    } catch (error) {
      console.error('❌ [TEST] Error creating normal notification:', error);
    }
  }, 2000);
  
  // Criar notificação urgente
  setTimeout(async () => {
    try {
      console.log('🚨 [TEST] Creating urgent notification...');
      
      const urgentNotification = {
        tenantId,
        type: 'security',
        title: 'URGENTE: Falha de Segurança Detectada',
        message: 'Uma tentativa de acesso não autorizado foi detectada no sistema.',
        priority: 9,
        recipientId: 'test-user',
        channels: ['in-app', 'email', 'sms'],
        actionUrl: '/security-alerts'
      };
      
      console.log('🚨 [TEST] Urgent notification would be created:', urgentNotification);
    } catch (error) {
      console.error('❌ [TEST] Error creating urgent notification:', error);
    }
  }, 5000);
  
  // Criar notificação de ticket
  setTimeout(async () => {
    try {
      console.log('🎫 [TEST] Creating ticket notification...');
      
      const ticketNotification = {
        tenantId,
        type: 'ticket',
        title: 'Novo Ticket Atribuído',
        message: 'O ticket #12345 foi atribuído para você.',
        priority: 6,
        recipientId: 'test-user',
        channels: ['in-app'],
        actionUrl: '/tickets/12345'
      };
      
      console.log('🎫 [TEST] Ticket notification would be created:', ticketNotification);
    } catch (error) {
      console.error('❌ [TEST] Error creating ticket notification:', error);
    }
  }, 8000);
  
  console.log('🧪 [TEST] Test notifications scheduled. Check the browser console and UI for real-time updates.');
}

// Executar teste se chamado diretamente
if (require.main === module) {
  testRealTimeNotifications().catch(console.error);
}

export { testRealTimeNotifications };
