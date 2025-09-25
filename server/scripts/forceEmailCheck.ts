
#!/usr/bin/env tsx

async function forceEmailCheck() {
  console.log('🔧 [FORCE-EMAIL-CHECK] Starting forced email check...');
  
  const tenantId = '3f99462f-3621-4b1b-bea8-782acc50d62e';
  
  try {
    // Import services
    const { GmailService } = await import('../services/integrations/gmail/GmailService');
    const { OmniBridgeAutoStart } = await import('../services/OmniBridgeAutoStart');
    
    const gmailService = GmailService.getInstance();
    const autoStart = new OmniBridgeAutoStart();
    
    console.log('🔄 [FORCE-EMAIL-CHECK] Starting communication channels...');
    await autoStart.detectAndStartCommunicationChannels(tenantId);
    
    console.log('📧 [FORCE-EMAIL-CHECK] Fetching recent emails...');
    await gmailService.fetchRecentEmails(tenantId, 'imap-email');
    
    console.log('✅ [FORCE-EMAIL-CHECK] Email check completed successfully');
    
    // Check monitoring status
    const status = gmailService.getMonitoringStatus();
    console.log('📊 [FORCE-EMAIL-CHECK] Monitoring status:', status);
    
  } catch (error) {
    console.error('❌ [FORCE-EMAIL-CHECK] Error during email check:', error);
  }
}

if (require.main === module) {
  forceEmailCheck();
}

export { forceEmailCheck };
