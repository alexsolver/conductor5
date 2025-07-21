
console.log('🔄 Forcing Gmail email sync...');

const tenantId = '3f99462f-3621-4b1b-bea8-782acc50d62e';

try {
  // Import the Gmail service directly
  const { GmailService } = await import('./server/services/integrations/gmail/GmailService.ts');
  
  const gmailService = GmailService.getInstance();
  
  console.log('📧 Starting Gmail email sync...');
  const result = await gmailService.startEmailMonitoring(tenantId, 'imap-email');
  
  if (result.success) {
    console.log('✅ Gmail sync completed successfully!');
    console.log('📋 Result:', result.message);
  } else {
    console.error('❌ Gmail sync failed:', result.message);
  }

  // Also start the periodic scheduler
  console.log('🕐 Starting periodic Gmail sync scheduler...');
  const { GmailSyncScheduler } = await import('./server/services/integrations/gmail/GmailSyncScheduler.ts');
  
  const scheduler = GmailSyncScheduler.getInstance();
  await scheduler.startPeriodicSync(tenantId, 5); // Every 5 minutes
  
  console.log('✅ Periodic Gmail sync is now active!');
  
} catch (error) {
  console.error('💥 Error during Gmail sync:', error);
  process.exit(1);
}
