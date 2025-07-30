const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function testDifferentCompany() {
  try {
    const tenantId = '3f99462f-3621-4b1b-bea8-782acc50d62e';
    const schema = `tenant_${tenantId.replace(/-/g, '_')}`;
    const techCorpId = 'f1230573-c09c-4e54-8291-73a3b58c3b6b'; // TechCorp Solutions
    
    console.log('🔍 Testing available customers for TechCorp Solutions...');
    
    // Check available customers for TechCorp
    const availableQuery = `
      SELECT DISTINCT c.id, c.first_name as "firstName", c.last_name as "lastName", 
             c.email, c.phone, c.company
      FROM "${schema}"."customers" c
      WHERE c.tenant_id = $1
      AND c.id NOT IN (
        SELECT ccm.customer_id 
        FROM "${schema}"."customer_company_memberships" ccm
        WHERE ccm.company_id = $2 AND ccm.tenant_id = $1
      )
      ORDER BY c.first_name, c.last_name
    `;
    
    const availableResult = await pool.query(availableQuery, [tenantId, techCorpId]);
    console.log(`\n✅ Available customers for TechCorp (${availableResult.rows.length} found):`);
    availableResult.rows.forEach(row => {
      console.log(`  - ${row.firstName} ${row.lastName} (${row.email})`);
    });
    
    // Check who is already associated with TechCorp
    const associatedQuery = `
      SELECT c.first_name as "firstName", c.last_name as "lastName", c.email,
             ccm.is_active
      FROM "${schema}"."customers" c
      INNER JOIN "${schema}"."customer_company_memberships" ccm 
        ON c.id = ccm.customer_id 
      WHERE ccm.company_id = $2 AND ccm.tenant_id = $1
      ORDER BY c.first_name, c.last_name
    `;
    
    const associatedResult = await pool.query(associatedQuery, [tenantId, techCorpId]);
    console.log(`\n📋 Customers already associated with TechCorp (${associatedResult.rows.length} found):`);
    associatedResult.rows.forEach(row => {
      const status = row.is_active ? '✅ ATIVO' : '❌ INATIVO';
      console.log(`  - ${row.firstName} ${row.lastName} (${row.email}) - ${status}`);
    });
    
    console.log('\n📊 Summary:');
    console.log(`  Total customers in system: 5`);
    console.log(`  Available for TechCorp: ${availableResult.rows.length}`);
    console.log(`  Already associated: ${associatedResult.rows.length}`);
    console.log(`  Total accounted for: ${availableResult.rows.length + associatedResult.rows.length}`);
    
    if (availableResult.rows.length + associatedResult.rows.length < 5) {
      console.log('⚠️  Missing customers detected - some customers may not be appearing!');
    } else {
      console.log('✅ All customers are accounted for - system is working correctly');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error testing different company:', error);
    process.exit(1);
  }
}

testDifferentCompany();