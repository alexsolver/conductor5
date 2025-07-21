import { GmailService } from './server/services/integrations/gmail/GmailService.ts';

console.log('🚀 Forcing Gmail sync to fetch real emails...');

const gmailService = GmailService.getInstance();

// Gmail config based on what was saved before
const gmailConfig = {
  user: 'alexsolver@gmail.com',
  password: 'cyyj vare pmjh scur',
  host: 'imap.gmail.com',
  port: 993,
  tls: true
};

const tenantId = '3f99462f-3621-4b1b-bea8-782acc50d62e';

try {
  console.log('🔍 Testing Gmail connection...');
  const testResult = await gmailService.testConnection(gmailConfig);
  
  if (testResult.success) {
    console.log(`✅ Gmail connection successful! Latency: ${testResult.latency}ms`);
    
    console.log('🔄 Starting Gmail monitoring...');
    const monitorResult = await gmailService.startEmailMonitoring(tenantId, gmailConfig, 'imap-email');
    
    if (monitorResult.success) {
      console.log('✅ Gmail monitoring started successfully!');
      console.log('📧 The system should now be fetching real emails from alexsolver@gmail.com');
      
      // Wait a few seconds to let it fetch some emails
      setTimeout(() => {
        console.log('🏁 Gmail sync initiated. Check the inbox for real emails!');
        process.exit(0);
      }, 5000);
    } else {
      console.error('❌ Failed to start Gmail monitoring:', monitorResult.message);
      process.exit(1);
    }
  } else {
    console.error('❌ Gmail connection test failed:', testResult.error);
    process.exit(1);
  }
} catch (error) {
  console.error('💥 Error during Gmail sync:', error);
  process.exit(1);
}