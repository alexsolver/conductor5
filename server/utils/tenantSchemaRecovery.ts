
export class TenantSchemaRecovery {
  static async validateAndRecoverSchema(tenantId: string): Promise<boolean> {
    try {
      const { pool } = await import('../db');
      const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
      
      // Check if schema exists
      const schemaCheck = await pool.query(
        'SELECT 1 FROM information_schema.schemata WHERE schema_name = $1',
        [schemaName]
      );
      
      if (schemaCheck.rows.length === 0) {
        console.error(`❌ [SCHEMA-RECOVERY] Schema ${schemaName} does not exist`);
        
        // Try to create basic schema structure
        await this.createBasicTenantSchema(pool, schemaName);
        console.log(`✅ [SCHEMA-RECOVERY] Basic schema ${schemaName} created`);
        
        return true;
      }
      
      // Validate critical tables exist
      const criticalTables = ['tickets', 'users', 'customers', 'companies'];
      for (const table of criticalTables) {
        const tableCheck = await pool.query(
          `SELECT 1 FROM information_schema.tables 
           WHERE table_schema = $1 AND table_name = $2`,
          [schemaName, table]
        );
        
        if (tableCheck.rows.length === 0) {
          console.error(`❌ [SCHEMA-RECOVERY] Critical table ${table} missing in ${schemaName}`);
          return false;
        }
      }
      
      console.log(`✅ [SCHEMA-RECOVERY] Schema ${schemaName} validation passed`);
      return true;
      
    } catch (error) {
      console.error('❌ [SCHEMA-RECOVERY] Recovery failed:', {
        tenantId,
        error: error.message
      });
      return false;
    }
  }
  
  private static async createBasicTenantSchema(pool: any, schemaName: string) {
    await pool.query(`CREATE SCHEMA IF NOT EXISTS "${schemaName}"`);
    
    // Create basic tickets table structure
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "${schemaName}".tickets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id VARCHAR(36) NOT NULL,
        number VARCHAR(50) NOT NULL,
        subject TEXT NOT NULL,
        description TEXT,
        status VARCHAR(50) DEFAULT 'new',
        priority VARCHAR(50) DEFAULT 'medium',
        urgency VARCHAR(50) DEFAULT 'medium',
        impact VARCHAR(50) DEFAULT 'low',
        category VARCHAR(100),
        subcategory VARCHAR(100),
        action VARCHAR(100),
        caller_id UUID,
        assigned_to_id UUID,
        company_id UUID,
        beneficiary_id UUID,
        customer_id UUID,
        tags JSONB DEFAULT '[]'::jsonb,
        custom_fields JSONB DEFAULT '{}'::jsonb,
        updated_by UUID,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
    
    // Create basic indexes
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_${schemaName.replace(/[^a-zA-Z0-9]/g, '_')}_tickets_tenant_id 
      ON "${schemaName}".tickets(tenant_id)
    `);
    
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_${schemaName.replace(/[^a-zA-Z0-9]/g, '_')}_tickets_status 
      ON "${schemaName}".tickets(status) WHERE is_active = true
    `);
  }
}
