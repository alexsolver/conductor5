
import { DrizzleNotificationRepository } from '../modules/notifications/infrastructure/repositories/DrizzleNotificationRepository';
import { CreateNotificationUseCase } from '../modules/notifications/application/use-cases/CreateNotificationUseCase';
import { DrizzleNotificationPreferenceRepository } from '../modules/notifications/infrastructure/repositories/DrizzleNotificationPreferenceRepository';

async function testNotifications() {
  console.log('🔔 [TEST] Iniciando teste de notificações...');
  
  try {
    const notificationRepository = new DrizzleNotificationRepository();
    const preferenceRepository = new DrizzleNotificationPreferenceRepository();
    const createNotificationUseCase = new CreateNotificationUseCase(
      notificationRepository,
      preferenceRepository
    );

    // Tenant e usuário para teste (usando os dados do sistema atual)
    const testTenantId = '3f99462f-3621-4b1b-bea8-782acc50d62e';
    const testUserId = '550e8400-e29b-41d4-a716-446655440001';

    // Notificação 1: Sistema
    console.log('📧 [TEST] Criando notificação de sistema...');
    const systemNotification = await createNotificationUseCase.execute({
      tenantId: testTenantId,
      userId: testUserId,
      type: 'system_alert',
      title: '🚨 Alerta do Sistema',
      message: 'Sistema de notificações funcionando perfeitamente! Esta é uma notificação de teste do sistema.',
      priority: 'high',
      channels: ['in_app', 'email'],
      data: {
        category: 'test',
        timestamp: new Date().toISOString(),
        source: 'notification_test_script'
      },
      sourceType: 'system',
      sourceId: 'test-system-alert-001'
    });

    if (systemNotification.success) {
      console.log('✅ [TEST] Notificação de sistema criada:', systemNotification.data?.id);
    }

    // Notificação 2: Ticket
    console.log('🎫 [TEST] Criando notificação de ticket...');
    const ticketNotification = await createNotificationUseCase.execute({
      tenantId: testTenantId,
      userId: testUserId,
      type: 'ticket_created',
      title: '🎫 Novo Ticket Criado',
      message: 'Um novo ticket foi criado no sistema: "Teste de Notificação #12345". Clique para visualizar os detalhes.',
      priority: 'medium',
      channels: ['in_app', 'email'],
      data: {
        ticketNumber: 'TICK-12345',
        category: 'support',
        priority: 'medium',
        customer: 'Cliente Teste'
      },
      sourceType: 'ticket',
      sourceId: 'test-ticket-12345'
    });

    if (ticketNotification.success) {
      console.log('✅ [TEST] Notificação de ticket criada:', ticketNotification.data?.id);
    }

    // Notificação 3: Campo/Operacional
    console.log('🔧 [TEST] Criando notificação de campo...');
    const fieldNotification = await createNotificationUseCase.execute({
      tenantId: testTenantId,
      userId: testUserId,
      type: 'field_technician_arrived',
      title: '🔧 Técnico em Campo',
      message: 'Técnico chegou ao local de atendimento. Status: No local - Iniciando diagnóstico do equipamento.',
      priority: 'medium',
      channels: ['in_app', 'sms', 'push'],
      data: {
        technicianName: 'João Silva',
        location: 'São Paulo - SP',
        coordinates: {
          lat: -23.5505,
          lng: -46.6333
        },
        estimatedDuration: '2 horas'
      },
      sourceType: 'field_operation',
      sourceId: 'test-field-op-789'
    });

    if (fieldNotification.success) {
      console.log('✅ [TEST] Notificação de campo criada:', fieldNotification.data?.id);
    }

    // Aguardar um pouco e verificar se as notificações foram criadas
    console.log('\n📊 [TEST] Verificando notificações criadas...');
    setTimeout(async () => {
      try {
        const notifications = await notificationRepository.findByUserId(testUserId, testTenantId, 10, 0);
        const recentNotifications = notifications.filter(n => 
          n.data?.source === 'notification_test_script' || 
          n.sourceId?.startsWith('test-')
        );
        
        console.log(`\n🎯 [TEST] Encontradas ${recentNotifications.length} notificações de teste:`);
        recentNotifications.forEach((notification, index) => {
          console.log(`\n${index + 1}. 📬 ${notification.title}`);
          console.log(`   📝 ${notification.message}`);
          console.log(`   🏷️  Tipo: ${notification.type}`);
          console.log(`   📊 Prioridade: ${notification.severity}`);
          console.log(`   📡 Canais: ${notification.channels.join(', ')}`);
          console.log(`   🕐 Criado: ${notification.createdAt}`);
          console.log(`   🆔 ID: ${notification.id}`);
        });

        console.log('\n✅ [TEST] Teste de notificações concluído com sucesso!');
        console.log('💡 [INFO] As notificações devem aparecer no sininho do header da aplicação.');
        console.log('💡 [INFO] Acesse a aplicação e verifique o ícone de notificações no canto superior direito.');
        
      } catch (error) {
        console.error('❌ [ERROR] Erro ao verificar notificações:', error);
      }
    }, 2000);

  } catch (error) {
    console.error('❌ [ERROR] Erro durante o teste de notificações:', error);
    console.error('Stack trace:', error instanceof Error ? error.stack : 'Unknown error');
  }
}

// Executar o teste
testNotifications().catch(console.error);
