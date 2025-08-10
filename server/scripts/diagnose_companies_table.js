
import { schemaManager } from '../db.js';

async function diagnoseCompaniesTable() {
  try {
    console.log('🔍 [COMPANIES-DIAGNOSIS] Starting companies table diagnosis...');
    
    const pool = schemaManager.getPool();
    
    // Get all tenant IDs
    const tenantsResult = await pool.query(`
      SELECT tenant_id, tenant_name 
      FROM public.tenants 
      ORDER BY tenant_name
    `);
    
    console.log('🏢 [COMPANIES-DIAGNOSIS] Found tenants:', tenantsResult.rows.length);
    
    for (const tenant of tenantsResult.rows) {
      const schemaName = schemaManager.getSchemaName(tenant.tenant_id);
      console.log(`\n📋 [COMPANIES-DIAGNOSIS] Checking tenant: ${tenant.tenant_name} (${tenant.tenant_id})`);
      console.log(`   Schema: ${schemaName}`);
      
      try {
        // Check if companies table exists
        const tableExistsResult = await pool.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = $1 AND table_name = 'companies'
          )
        `, [schemaName]);
        
        const tableExists = tableExistsResult.rows[0].exists;
        console.log(`   ✅ Companies table exists: ${tableExists}`);
        
        if (tableExists) {
          // Get table structure
          const columnsResult = await pool.query(`
            SELECT column_name, data_type, is_nullable 
            FROM information_schema.columns 
            WHERE table_schema = $1 AND table_name = 'companies'
            ORDER BY ordinal_position
          `, [schemaName]);
          
          console.log(`   📊 Columns (${columnsResult.rows.length}):`);
          columnsResult.rows.forEach(col => {
            console.log(`      - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? '(nullable)' : '(not null)'}`);
          });
          
          // Count records
          const countResult = await pool.query(`
            SELECT COUNT(*) as total 
            FROM "${schemaName}".companies 
            WHERE tenant_id = $1
          `, [tenant.tenant_id]);
          
          const totalCompanies = countResult.rows[0].total;
          console.log(`   📈 Total companies: ${totalCompanies}`);
          
          if (totalCompanies > 0) {
            // Get sample data
            const sampleResult = await pool.query(`
              SELECT id, name, status, is_active, created_at 
              FROM "${schemaName}".companies 
              WHERE tenant_id = $1 
              ORDER BY created_at DESC 
              LIMIT 3
            `, [tenant.tenant_id]);
            
            console.log(`   📝 Sample companies:`);
            sampleResult.rows.forEach((company, index) => {
              console.log(`      ${index + 1}. ${company.name} (${company.id}) - Status: ${company.status}, Active: ${company.is_active}`);
            });
          }
        } else {
          console.log(`   ❌ Companies table does not exist in schema ${schemaName}`);
        }
      } catch (schemaError) {
        console.error(`   💥 Error checking schema ${schemaName}:`, schemaError.message);
      }
    }
    
    console.log('\n✅ [COMPANIES-DIAGNOSIS] Diagnosis complete');
    
  } catch (error) {
    console.error('💥 [COMPANIES-DIAGNOSIS] Fatal error:', error);
  } finally {
    process.exit(0);
  }
}

diagnoseCompaniesTable();
