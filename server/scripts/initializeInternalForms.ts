
/**
 * Initialize Internal Forms Tables - Phase 10 Implementation
 * 
 * Script para inicializar tabelas do módulo Internal Forms
 * Segue padrões estabelecidos no 1qa.md para multitenant
 * 
 * @module InitializeInternalForms
 * @version 1.0.0
 * @created 2025-09-24 - Phase 10 Clean Architecture Implementation
 */

import { Pool } from 'pg';
import { readFileSync } from 'fs';
import { join } from 'path';

async function initializeInternalForms() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  try {
    console.log('🚀 [InitializeInternalForms] Starting Internal Forms tables initialization...');

    // Get all tenant schemas
    const tenantSchemasQuery = `
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name LIKE 'tenant_%'
      ORDER BY schema_name
    `;

    const tenantsResult = await pool.query(tenantSchemasQuery);
    console.log(`📋 [InitializeInternalForms] Found ${tenantsResult.rows.length} tenant schemas`);

    for (const tenant of tenantsResult.rows) {
      const schemaName = tenant.schema_name;
      
      // Extract tenant ID from schema name (tenant_uuid_with_underscores -> uuid-with-dashes)
      const tenantId = schemaName.replace('tenant_', '').replace(/_/g, '-');
      
      console.log(`🔧 [InitializeInternalForms] Processing tenant: ${schemaName} (${tenantId})`);

      // Read and prepare SQL script
      const sqlScript = readFileSync(join(__dirname, 'createInternalFormsTables.sql'), 'utf8');
      
      // Replace placeholders
      const processedScript = sqlScript
        .replace(/\{TENANT_SCHEMA\}/g, schemaName)
        .replace(/\{TENANT_ID\}/g, tenantId);

      // Execute script
      await pool.query(processedScript);
      
      console.log(`✅ [InitializeInternalForms] Successfully initialized Internal Forms for tenant: ${schemaName}`);
    }

    console.log('🎉 [InitializeInternalForms] Internal Forms initialization completed successfully!');
    
  } catch (error) {
    console.error('❌ [InitializeInternalForms] Error during initialization:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Execute if run directly
if (require.main === module) {
  initializeInternalForms().catch(console.error);
}

export { initializeInternalForms };
