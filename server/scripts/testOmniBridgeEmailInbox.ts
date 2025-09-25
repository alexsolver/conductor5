
import { DrizzleMessageRepository } from '../modules/omnibridge/infrastructure/repositories/DrizzleMessageRepository';
import { MessageIngestionService } from '../modules/omnibridge/infrastructure/services/MessageIngestionService';
import { ProcessMessageUseCase } from '../modules/omnibridge/application/use-cases/ProcessMessageUseCase';

async function testOmniBridgeEmailInbox() {
  console.log('🧪 [OMNIBRIDGE-INBOX-TEST] Testing email inbox functionality...');
  
  const tenantId = '3f99462f-3621-4b1b-bea8-782acc50d62e';
  
  try {
    // Initialize services
    const messageRepository = new DrizzleMessageRepository();
    const processMessageUseCase = new ProcessMessageUseCase(messageRepository);
    const ingestionService = new MessageIngestionService(messageRepository, processMessageUseCase);
    
    // Create test email data simulating IMAP integration
    const testEmailData = {
      messageId: 'test-imap-email-' + Date.now(),
      from: 'test@example.com',
      to: 'alexsolver@gmail.com', 
      subject: 'Teste de Email IMAP para OmniBridge Inbox',
      text: 'Este é um email de teste para verificar se emails IMAP chegam corretamente no inbox do OmniBridge.',
      date: new Date(),
      headers: {
        'message-id': 'test-message-id-' + Date.now(),
        'from': 'test@example.com',
        'to': 'alexsolver@gmail.com',
        'subject': 'Teste de Email IMAP para OmniBridge Inbox'
      },
      attachments: [],
      priority: 'medium',
      metadata: {
        testEmail: true,
        source: 'omnibridge-inbox-test',
        imapProcessed: true
      }
    };
    
    console.log(`📨 [OMNIBRIDGE-INBOX-TEST] Processing test email via MessageIngestionService`);
    console.log(`📨 [OMNIBRIDGE-INBOX-TEST] Email details:`, {
      messageId: testEmailData.messageId,
      from: testEmailData.from,
      subject: testEmailData.subject
    });
    
    // Process the email through IMAP ingestion 
    const result = await ingestionService.processImapEmail(testEmailData, tenantId);
    
    console.log(`✅ [OMNIBRIDGE-INBOX-TEST] Email ingested successfully:`);
    console.log(`   - Message ID: ${result.id}`);
    console.log(`   - From: ${result.from}`);
    console.log(`   - Subject: ${result.subject}`);
    console.log(`   - Channel: ${result.channelType}`);
    console.log(`   - Status: ${result.status}`);
    
    // Verify the message appears in OmniBridge inbox
    console.log(`🔍 [OMNIBRIDGE-INBOX-TEST] Verifying message appears in OmniBridge inbox...`);
    const messages = await messageRepository.findByTenant(tenantId, 10, 0);
    const ourMessage = messages.find(m => m.id === result.id);
    
    if (ourMessage) {
      console.log(`✅ [OMNIBRIDGE-INBOX-TEST] SUCCESS: Message found in OmniBridge inbox!`);
      console.log(`   - Database ID: ${ourMessage.id}`);
      console.log(`   - From Address: ${ourMessage.from}`);
      console.log(`   - Channel Type: ${ourMessage.channelType}`);
      console.log(`   - Content Preview: ${ourMessage.body?.substring(0, 100)}...`);
    } else {
      console.log(`❌ [OMNIBRIDGE-INBOX-TEST] FAILURE: Message NOT found in OmniBridge inbox`);
      console.log(`📊 [OMNIBRIDGE-INBOX-TEST] Total messages in inbox: ${messages.length}`);
    }
    
    // Test OmniBridge API endpoint
    console.log(`🔍 [OMNIBRIDGE-INBOX-TEST] Testing OmniBridge API endpoint...`);
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
        console.log(`📡 [OMNIBRIDGE-INBOX-TEST] API Response:`, {
          success: data.success,
          messageCount: data.messages?.length || 0,
          hasOurMessage: data.messages?.some((m: any) => m.id === result.id),
          firstMessage: data.messages?.[0] ? {
            id: data.messages[0].id,
            from: data.messages[0].from,
            subject: data.messages[0].subject
          } : null
        });
        
        if (data.messages?.some((m: any) => m.id === result.id)) {
          console.log(`🎯 [OMNIBRIDGE-INBOX-TEST] FINAL SUCCESS: Email is accessible through OmniBridge API!`);
        } else {
          console.log(`❌ [OMNIBRIDGE-INBOX-TEST] FINAL FAILURE: Email not accessible through OmniBridge API`);
        }
      },
      status: (code: number) => mockRes
    } as any;
    
    await controller.getMessages(mockReq, mockRes);
    
  } catch (error) {
    console.error('❌ [OMNIBRIDGE-INBOX-TEST] Error testing email inbox:', error);
  }
}

if (require.main === module) {
  testOmniBridgeEmailInbox();
}

export { testOmniBridgeEmailInbox };
