
#!/usr/bin/env tsx

import { MessageIngestionService } from '../modules/omnibridge/infrastructure/services/MessageIngestionService';
import { DrizzleMessageRepository } from '../modules/omnibridge/infrastructure/repositories/DrizzleMessageRepository';
import { ProcessMessageUseCase } from '../modules/omnibridge/application/use-cases/ProcessMessageUseCase';

async function testImapEmailIngestion() {
  console.log('🔧 [IMAP-EMAIL-TEST] Testing IMAP email ingestion...');
  
  const tenantId = '3f99462f-3621-4b1b-bea8-782acc50d62e';
  
  try {
    // Initialize services following 1qa.md patterns
    const messageRepository = new DrizzleMessageRepository();
    const processMessageUseCase = new ProcessMessageUseCase(messageRepository);
    const ingestionService = new MessageIngestionService(messageRepository, processMessageUseCase);
    
    // Test IMAP email data
    const testEmailData = {
      messageId: 'test-imap-' + Date.now(),
      from: 'test@example.com',
      to: 'inbox@conductor.com',
      subject: 'Test IMAP Email Ingestion',
      text: 'This is a test email to verify IMAP ingestion is working properly.',
      date: new Date(),
      headers: {},
      attachments: [],
      priority: 'medium'
    };
    
    console.log(`📨 [IMAP-EMAIL-TEST] Processing test email for tenant: ${tenantId}`);
    
    // Process the email through IMAP ingestion
    const result = await ingestionService.processImapEmail(testEmailData, tenantId);
    
    console.log(`✅ [IMAP-EMAIL-TEST] Email ingested successfully:`);
    console.log(`   - Message ID: ${result.id}`);
    console.log(`   - From: ${result.from}`);
    console.log(`   - Subject: ${result.subject}`);
    console.log(`   - Channel: ${result.channelType}`);
    console.log(`   - Status: ${result.status}`);
    
    // Verify the message appears in inbox
    const messages = await messageRepository.findByTenant(tenantId, 10, 0);
    const ourMessage = messages.find(m => m.id === result.id);
    
    if (ourMessage) {
      console.log(`✅ [IMAP-EMAIL-TEST] Message found in inbox - ingestion working correctly!`);
    } else {
      console.log(`❌ [IMAP-EMAIL-TEST] Message NOT found in inbox - there's still an issue`);
    }
    
  } catch (error) {
    console.error('❌ [IMAP-EMAIL-TEST] Error testing IMAP email ingestion:', error);
  }
}

if (require.main === module) {
  testImapEmailIngestion();
}

export { testImapEmailIngestion };
