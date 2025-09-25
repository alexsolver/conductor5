
import { DrizzleMessageRepository } from '../modules/omnibridge/infrastructure/repositories/DrizzleMessageRepository';
import { GmailService } from '../services/integrations/gmail/GmailService';

async function testEmailDiagnostic() {
  console.log('🔧 [EMAIL-DIAGNOSTIC] Starting comprehensive email diagnostic...');
  
  const tenantId = '3f99462f-3621-4b1b-bea8-782acc50d62e';
  
  try {
    console.log('📋 [EMAIL-DIAGNOSTIC] Step 1: Checking integration configuration...');
    
    // Check integration configuration
    const { storage } = await import('../storage-simple');
    const integrations = await storage.getTenantIntegrations(tenantId);
    const emailIntegrations = integrations.filter((i: any) => 
      i.category === 'Comunicação' || i.name.toLowerCase().includes('email') || i.name.toLowerCase().includes('imap')
    );
    
    console.log(`📧 [EMAIL-DIAGNOSTIC] Found ${emailIntegrations.length} email integrations:`);
    emailIntegrations.forEach((integration: any) => {
      console.log(`   - ${integration.name} (${integration.id}) - Status: ${integration.status}`);
      console.log(`     Config: ${JSON.stringify(integration.config, null, 2)}`);
    });
    
    console.log('📋 [EMAIL-DIAGNOSTIC] Step 2: Testing Gmail service...');
    
    // Test Gmail service connection
    const gmailService = GmailService.getInstance();
    const status = gmailService.getMonitoringStatus();
    console.log(`📊 [EMAIL-DIAGNOSTIC] Gmail service status:`, status);
    
    if (status.activeConnections === 0) {
      console.log('🔄 [EMAIL-DIAGNOSTIC] No active connections. Starting email monitoring...');
      
      const imapIntegration = await storage.getIntegrationByType(tenantId, 'IMAP Email');
      if (imapIntegration && imapIntegration.status === 'connected') {
        const result = await gmailService.startEmailMonitoring(tenantId, imapIntegration.id);
        console.log(`📧 [EMAIL-DIAGNOSTIC] Start monitoring result:`, result);
        
        // Give it a moment to connect
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Try to fetch emails
        console.log('📨 [EMAIL-DIAGNOSTIC] Attempting to fetch emails...');
        await gmailService.fetchRecentEmails(tenantId, imapIntegration.id);
      }
    }
    
    console.log('📋 [EMAIL-DIAGNOSTIC] Step 3: Checking database for recent messages...');
    
    // Check database for messages
    const messageRepository = new DrizzleMessageRepository();
    const messages = await messageRepository.findByTenant(tenantId, 50, 0);
    
    console.log(`💾 [EMAIL-DIAGNOSTIC] Found ${messages.length} total messages in database`);
    
    const emailMessages = messages.filter(m => m.channelType === 'email');
    console.log(`📧 [EMAIL-DIAGNOSTIC] Found ${emailMessages.length} email messages`);
    
    if (emailMessages.length > 0) {
      console.log('📧 [EMAIL-DIAGNOSTIC] Recent email messages:');
      emailMessages.slice(0, 5).forEach((msg, index) => {
        console.log(`   ${index + 1}. From: ${msg.fromAddress} - Subject: ${msg.subject} - Date: ${msg.createdAt}`);
      });
    }
    
    console.log('📋 [EMAIL-DIAGNOSTIC] Step 4: Testing direct email ingestion...');
    
    // Test direct ingestion
    const { MessageIngestionService } = await import('../modules/omnibridge/infrastructure/services/MessageIngestionService');
    const { ProcessMessageUseCase } = await import('../modules/omnibridge/application/use-cases/ProcessMessageUseCase');
    
    const processMessageUseCase = new ProcessMessageUseCase(messageRepository);
    const ingestionService = new MessageIngestionService(messageRepository, processMessageUseCase);
    
    const testEmail = {
      messageId: 'diagnostic-test-' + Date.now(),
      from: 'diagnostic@test.com',
      to: 'alexsolver@gmail.com',
      subject: 'Diagnostic Test Email - ' + new Date().toISOString(),
      text: 'This is a diagnostic test email to verify email ingestion is working.',
      date: new Date(),
      headers: {},
      attachments: [],
      priority: 'medium',
      metadata: {
        diagnostic: true,
        testRun: new Date().toISOString()
      }
    };
    
    console.log('🧪 [EMAIL-DIAGNOSTIC] Creating test email...');
    const testResult = await ingestionService.processImapEmail(testEmail, tenantId);
    console.log('✅ [EMAIL-DIAGNOSTIC] Test email created:', testResult.id);
    
    // Verify test email was saved
    const verifyMessage = await messageRepository.findById(testResult.id, tenantId);
    if (verifyMessage) {
      console.log('✅ [EMAIL-DIAGNOSTIC] Test email verified in database');
    } else {
      console.log('❌ [EMAIL-DIAGNOSTIC] Test email NOT found in database');
    }
    
    console.log('📋 [EMAIL-DIAGNOSTIC] Step 5: Final status summary...');
    
    const finalMessages = await messageRepository.findByTenant(tenantId, 10, 0);
    console.log(`📊 [EMAIL-DIAGNOSTIC] Final message count: ${finalMessages.length}`);
    
    const finalStatus = gmailService.getMonitoringStatus();
    console.log(`📊 [EMAIL-DIAGNOSTIC] Final Gmail status:`, finalStatus);
    
    console.log('✅ [EMAIL-DIAGNOSTIC] Diagnostic completed successfully');
    
  } catch (error) {
    console.error('❌ [EMAIL-DIAGNOSTIC] Diagnostic failed:', error);
  }
}

if (require.main === module) {
  testEmailDiagnostic();
}

export { testEmailDiagnostic };
