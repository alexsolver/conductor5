
import { db } from '../db';

export async function createNotificationsTables() {
  try {
    console.log('🔔 [NOTIFICATIONS] Creating notifications tables for tenants...');

    // Get all tenants
    const tenants = await db.execute(`
      SELECT id FROM tenants WHERE deleted_at IS NULL
    `);

    console.log(`📋 [NOTIFICATIONS] Found ${tenants.length} tenants`);

    for (const tenant of tenants) {
      const tenantId = tenant.id;
      const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;

      try {
        console.log(`🔧 [NOTIFICATIONS] Creating notifications table for tenant: ${tenantId}`);

        // Create notifications table
        await db.execute(`
          CREATE TABLE IF NOT EXISTS ${schemaName}.notifications (
            id VARCHAR(36) PRIMARY KEY,
            user_id VARCHAR(36) NOT NULL,
            type VARCHAR(50) NOT NULL,
            title VARCHAR(255) NOT NULL,
            message TEXT NOT NULL,
            channel VARCHAR(50) NOT NULL DEFAULT 'in_app',
            priority VARCHAR(20) NOT NULL DEFAULT 'medium',
            status VARCHAR(20) NOT NULL DEFAULT 'pending',
            is_active BOOLEAN DEFAULT true,
            retry_count INTEGER DEFAULT 0,
            max_retries INTEGER DEFAULT 3,
            data JSONB DEFAULT '{}',
            scheduled_at TIMESTAMP,
            sent_at TIMESTAMP,
            read_at TIMESTAMP,
            expires_at TIMESTAMP,
            failure_reason TEXT,
            source_id VARCHAR(36),
            source_type VARCHAR(50),
            created_at TIMESTAMP DEFAULT NOW() NOT NULL,
            updated_at TIMESTAMP DEFAULT NOW() NOT NULL
          );
        `);

        // Create indexes for better performance
        await db.execute(`
          CREATE INDEX IF NOT EXISTS idx_${schemaName}_notifications_user_id 
          ON ${schemaName}.notifications(user_id);
        `);

        await db.execute(`
          CREATE INDEX IF NOT EXISTS idx_${schemaName}_notifications_type 
          ON ${schemaName}.notifications(type);
        `);

        await db.execute(`
          CREATE INDEX IF NOT EXISTS idx_${schemaName}_notifications_status 
          ON ${schemaName}.notifications(status);
        `);

        await db.execute(`
          CREATE INDEX IF NOT EXISTS idx_${schemaName}_notifications_created_at 
          ON ${schemaName}.notifications(created_at);
        `);

        console.log(`✅ [NOTIFICATIONS] Notifications table created for tenant: ${tenantId}`);

      } catch (error) {
        console.error(`❌ [NOTIFICATIONS] Error creating notifications table for tenant ${tenantId}:`, error);
      }
    }

    console.log('✅ [NOTIFICATIONS] Notifications tables creation completed');
    
  } catch (error) {
    console.error('❌ [NOTIFICATIONS] Error creating notifications tables:', error);
    throw error;
  }
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  createNotificationsTables()
    .then(() => {
      console.log('🏁 [NOTIFICATIONS] Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 [NOTIFICATIONS] Script failed:', error);
      process.exit(1);
    });
}
