
import { db } from '../db.js';

export async function createOmniBridgeAutomationTables() {
  try {
    console.log('🔧 [OMNIBRIDGE-AUTOMATION] Creating automation tables...');

    // Create omnibridge_rules table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS omnibridge_rules (
        id VARCHAR(36) PRIMARY KEY,
        tenant_id VARCHAR(36) NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        is_enabled BOOLEAN DEFAULT true,
        trigger_type VARCHAR(50) NOT NULL,
        trigger_conditions JSONB DEFAULT '{}',
        action_type VARCHAR(50) NOT NULL,
        action_parameters JSONB DEFAULT '{}',
        priority INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
        created_by VARCHAR(36),
        updated_by VARCHAR(36)
      );
    `);

    // Create omnibridge_automation_logs table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS omnibridge_automation_logs (
        id VARCHAR(36) PRIMARY KEY,
        tenant_id VARCHAR(36) NOT NULL,
        rule_id VARCHAR(36) NOT NULL,
        message_id VARCHAR(36),
        execution_status VARCHAR(20) NOT NULL DEFAULT 'pending',
        execution_result JSONB DEFAULT '{}',
        error_message TEXT,
        executed_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);

    // Create omnibridge_templates table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS omnibridge_templates (
        id VARCHAR(36) PRIMARY KEY,
        tenant_id VARCHAR(36) NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        content TEXT NOT NULL,
        template_type VARCHAR(50) NOT NULL DEFAULT 'message',
        variables JSONB DEFAULT '[]',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
        created_by VARCHAR(36),
        updated_by VARCHAR(36)
      );
    `);

    // Create omnibridge_chatbots table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS omnibridge_chatbots (
        id VARCHAR(36) PRIMARY KEY,
        tenant_id VARCHAR(36) NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        configuration JSONB DEFAULT '{}',
        is_enabled BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
        created_by VARCHAR(36),
        updated_by VARCHAR(36)
      );
    `);

    // Add indexes for better performance
    await db.execute(`
      CREATE INDEX IF NOT EXISTS idx_omnibridge_rules_tenant_id ON omnibridge_rules(tenant_id);
    `);

    await db.execute(`
      CREATE INDEX IF NOT EXISTS idx_omnibridge_rules_enabled ON omnibridge_rules(is_enabled);
    `);

    await db.execute(`
      CREATE INDEX IF NOT EXISTS idx_omnibridge_automation_logs_tenant_id ON omnibridge_automation_logs(tenant_id);
    `);

    await db.execute(`
      CREATE INDEX IF NOT EXISTS idx_omnibridge_automation_logs_rule_id ON omnibridge_automation_logs(rule_id);
    `);

    await db.execute(`
      CREATE INDEX IF NOT EXISTS idx_omnibridge_templates_tenant_id ON omnibridge_templates(tenant_id);
    `);

    await db.execute(`
      CREATE INDEX IF NOT EXISTS idx_omnibridge_chatbots_tenant_id ON omnibridge_chatbots(tenant_id);
    `);

    console.log('✅ [OMNIBRIDGE-AUTOMATION] All automation tables created successfully');
    return true;
  } catch (error) {
    console.error('❌ [OMNIBRIDGE-AUTOMATION] Failed to create automation tables:', error);
    return false;
  }
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  createOmniBridgeAutomationTables()
    .then(success => {
      console.log(success ? '✅ Tables created successfully' : '❌ Table creation failed');
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Script execution failed:', error);
      process.exit(1);
    });
}

export { createOmniBridgeAutomationTables };
