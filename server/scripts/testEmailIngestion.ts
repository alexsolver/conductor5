
#!/usr/bin/env tsx

import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '../../shared/schema';

async function testEmailIngestion() {
  console.log('🔧 [EMAIL-TEST] Testing email ingestion for alex@lansolver.com');
  
  const tenantId = '3f99462f-3621-4b1b-bea8-782acc50d62e';
  
  try {
    // Check database connection
    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      options: `-c search_path=${schemaName}`,
      ssl: false,
    });
    
    const tenantDb = drizzle({ client: pool, schema });
    
    // Check if omnibridge_messages table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = $1 
        AND table_name = 'omnibridge_messages'
      );
    `, [schemaName]);
    
    console.log(`📊 [EMAIL-TEST] Table exists: ${tableCheck.rows[0].exists}`);
    
    if (!tableCheck.rows[0].exists) {
      console.log('❌ [EMAIL-TEST] omnibridge_messages table does not exist');
      return;
    }
    
    // Check recent messages
    const recentMessages = await pool.query(`
      SELECT id, channel_type, "from", subject, created_at
      FROM omnibridge_messages 
      WHERE tenant_id = $1 
      AND channel_type = 'email'
      ORDER BY created_at DESC 
      LIMIT 10
    `, [tenantId]);
    
    console.log(`📧 [EMAIL-TEST] Found ${recentMessages.rows.length} email messages:`);
    recentMessages.rows.forEach(msg => {
      console.log(`  - ID: ${msg.id}`);
      console.log(`    From: ${msg.from}`);
      console.log(`    Subject: ${msg.subject}`);
      console.log(`    Date: ${msg.created_at}`);
      console.log('');
    });
    
    // Check for alex@lansolver.com specifically
    const alexMessages = await pool.query(`
      SELECT id, channel_type, "from", subject, content, created_at
      FROM omnibridge_messages 
      WHERE tenant_id = $1 
      AND channel_type = 'email'
      AND "from" ILIKE '%alex@lansolver.com%'
      ORDER BY created_at DESC 
      LIMIT 5
    `, [tenantId]);
    
    console.log(`👤 [EMAIL-TEST] Found ${alexMessages.rows.length} messages from alex@lansolver.com:`);
    alexMessages.rows.forEach(msg => {
      console.log(`  - ID: ${msg.id}`);
      console.log(`    Subject: ${msg.subject}`);
      console.log(`    Content: ${msg.content?.substring(0, 100)}...`);
      console.log(`    Date: ${msg.created_at}`);
      console.log('');
    });
    
    // Test Gmail service status
    const { GmailService } = await import('../services/integrations/gmail/GmailService');
    const gmailService = GmailService.getInstance();
    
    console.log('🔍 [EMAIL-TEST] Checking Gmail service monitoring status...');
    const monitoringStatus = gmailService.getMonitoringStatus();
    console.log(`📊 [EMAIL-TEST] Active connections: ${monitoringStatus.activeConnections}`);
    console.log(`📊 [EMAIL-TEST] Monitoring for tenant ${tenantId}: ${monitoringStatus.tenants.includes(tenantId)}`);
    
    await pool.end();
    
  } catch (error) {
    console.error('❌ [EMAIL-TEST] Error testing email ingestion:', error);
  }
}

if (require.main === module) {
  testEmailIngestion();
}

export { testEmailIngestion };
