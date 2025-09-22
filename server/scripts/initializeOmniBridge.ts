
const { db } = require('../db');
const { omnibridgeChannels, omnibridgeMessages } = require('../../shared/schema');

export async function initializeOmniBridgeTables() {
  try {
    console.log('🔧 [OMNIBRIDGE-INIT] Creating OmniBridge tables...');

    // Create tables if they don't exist
    await db.execute(`
      CREATE TABLE IF NOT EXISTS omnibridge_channels (
        id VARCHAR(36) PRIMARY KEY,
        tenant_id VARCHAR(36) NOT NULL,
        integration_id VARCHAR(100),
        name VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'inactive',
        config JSONB DEFAULT '{}',
        features JSONB DEFAULT '[]',
        description TEXT,
        icon VARCHAR(50),
        last_sync TIMESTAMP,
        metrics JSONB DEFAULT '{}',
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS omnibridge_messages (
        id VARCHAR(36) PRIMARY KEY,
        tenant_id VARCHAR(36) NOT NULL,
        channel_id VARCHAR(100) NOT NULL,
        channel_type VARCHAR(50) NOT NULL,
        from_address TEXT,
        to_address TEXT,
        subject TEXT,
        content TEXT,
        metadata JSONB DEFAULT '{}',
        status VARCHAR(20) DEFAULT 'unread',
        priority VARCHAR(20) DEFAULT 'medium',
        tags JSONB DEFAULT '[]',
        timestamp TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS omnibridge_messages (
        id VARCHAR(36) PRIMARY KEY,
        tenant_id VARCHAR(36) NOT NULL,
        channel_id VARCHAR(36) NOT NULL,
        channel_type VARCHAR(50) NOT NULL,
        from_address TEXT,
        to_address TEXT,
        subject TEXT,
        content TEXT,
        timestamp TIMESTAMP DEFAULT NOW() NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'unread',
        priority VARCHAR(20) NOT NULL DEFAULT 'medium',
        tags JSONB DEFAULT '[]',
        attachments INTEGER DEFAULT 0,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);

    console.log('✅ [OMNIBRIDGE-INIT] OmniBridge tables created successfully');
    return true;
  } catch (error) {
    console.error('❌ [OMNIBRIDGE-INIT] Failed to create OmniBridge tables:', error);
    return false;
  }
}

// Execute if run directly
if (require.main === module) {
  initializeOmniBridgeTables()
    .then(success => {
      console.log(success ? '✅ Initialization completed' : '❌ Initialization failed');
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Script execution failed:', error);
      process.exit(1);
    });
}
