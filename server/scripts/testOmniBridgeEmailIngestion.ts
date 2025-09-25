
import { MessageIngestionService } from '../modules/omnibridge/infrastructure/services/MessageIngestionService';
import { DrizzleMessageRepository } from '../modules/omnibridge/infrastructure/repositories/DrizzleMessageRepository';
import { ProcessMessageUseCase } from '../modules/omnibridge/application/use-cases/ProcessMessageUseCase';

async function testOmniBridgeEmailIngestion() {
  console.log('🔧 [OMNIBRIDGE-EMAIL-TEST] Testing email ingestion flow...');
  
  const tenantId = '3f99462f-3621-4b1b-bea8-782acc50d62e';
  
  try {
    // Initialize services
    const messageRepository = new DrizzleMessageRepository();
    const processMessageUseCase = new ProcessMessageUseCase(messageRepository);
    const ingestionService = new MessageIngestionService(messageRepository, processMessageUseCase);
    
    // Create test email data
    const testEmailData = {
      messageId: 'test-email-' + Date.now(),
      from: 'test@example.com',
      to: 'inbox@conductor.com', 
      subject: 'Teste de Ingresso de Email no OmniBridge',
      text: 'Este é um email de teste para verificar se a ingestão está funcionando corretamente no OmniBridge.',
      date: new Date(),
      headers: {},
      attachments: [],
      priority: 'medium',
      metadata: {
        testEmail: true,
        source: 'omnibridge-email-test'
      }
    };
    
    console.log(`📨 [OMNIBRIDGE-EMAIL-TEST] Processing test email for tenant: ${tenantId}`);
    console.log(`📨 [OMNIBRIDGE-EMAIL-TEST] Email details:`, {
      messageId: testEmailData.messageId,
      from: testEmailData.from,
      subject: testEmailData.subject
    });
    
    // Process the email through IMAP ingestion
    const result = await ingestionService.processImapEmail(testEmailData, tenantId);
    
    console.log(`✅ [OMNIBRIDGE-EMAIL-TEST] Email ingested successfully:`);
    console.log(`   - Message ID: ${result.id}`);
    console.log(`   - From: ${result.from}`);
    console.log(`   - Subject: ${result.subject}`);
    console.log(`   - Channel: ${result.channelType}`);
    console.log(`   - Status: ${result.status}`);
    
    // Verify the message appears in inbox
    console.log(`🔍 [OMNIBRIDGE-EMAIL-TEST] Verifying message appears in inbox...`);
    const messages = await messageRepository.findByTenant(tenantId, 10, 0);
    const ourMessage = messages.find(m => m.id === result.id);
    
    if (ourMessage) {
      console.log(`✅ [OMNIBRIDGE-EMAIL-TEST] SUCCESS: Message found in inbox!`);
      console.log(`   - Database ID: ${ourMessage.id}`);
      console.log(`   - From Address: ${ourMessage.from}`);
      console.log(`   - Channel Type: ${ourMessage.channelType}`);
    } else {
      console.log(`❌ [OMNIBRIDGE-EMAIL-TEST] FAILURE: Message NOT found in inbox`);
      console.log(`📊 [OMNIBRIDGE-EMAIL-TEST] Total messages in inbox: ${messages.length}`);
    }
    
    // Test API endpoint
    console.log(`🔍 [OMNIBRIDGE-EMAIL-TEST] Testing API endpoint...`);
    const { OmniBridgeController } = await import('../modules/omnibridge/application/controllers/OmniBridgeController');
    const { GetMessagesUseCase } = await import('../modules/omnibridge/application/use-cases/GetMessagesUseCase');
    
    const getMessagesUseCase = new GetMessagesUseCase(messageRepository);
    const controller = new OmniBridgeController(
      null as any, // Not needed for this test
      null as any, // Not needed for this test
      getMessagesUseCase,
      null as any  // Not needed for this test
    );
    
    // Mock request and response objects
    const mockReq = {
      user: { tenantId },
      query: { limit: '10', offset: '0' }
    } as any;
    
    const mockRes = {
      json: (data: any) => {
        console.log(`📡 [OMNIBRIDGE-EMAIL-TEST] API Response:`, {
          success: data.success,
          messageCount: data.messages?.length || 0,
          hasOurMessage: data.messages?.some((m: any) => m.id === result.id)
        });
      },
      status: (code: number) => mockRes
    } as any;
    
    await controller.getMessages(mockReq, mockRes);
    
  } catch (error) {
    console.error('❌ [OMNIBRIDGE-EMAIL-TEST] Error testing email ingestion:', error);
  }
}

if (require.main === module) {
  testOmniBridgeEmailIngestion();
}

export { testOmniBridgeEmailIngestion };
