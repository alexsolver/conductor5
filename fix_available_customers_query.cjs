const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function testAvailableCustomersQuery() {
  try {
    const tenantId = '3f99462f-3621-4b1b-bea8-782acc50d62e';
    const schema = `tenant_${tenantId.replace(/-/g, '_')}`;
    const companyId = '503389ff-7616-48e0-8759-c6b98faf5608'; // Hospital São João
    
    console.log('🔍 Testing available customers query for Hospital São João...');
    
    // Current problematic query (excludes ALL customers with any membership)
    console.log('\n❌ Current problematic query results:');
    const currentQuery = `
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
    
    const currentResult = await pool.query(currentQuery, [tenantId, companyId]);
    console.log(`  Found ${currentResult.rows.length} available customers:`);
    currentResult.rows.forEach(row => {
      console.log(`    - ${row.firstName} ${row.lastName} (${row.email})`);
    });
    
    // Fixed query (excludes only customers with ACTIVE memberships)
    console.log('\n✅ Fixed query results (shows customers without ACTIVE memberships):');
    const fixedQuery = `
      SELECT DISTINCT c.id, c.first_name as "firstName", c.last_name as "lastName", 
             c.email, c.phone, c.company
      FROM "${schema}"."customers" c
      WHERE c.tenant_id = $1
      AND c.id NOT IN (
        SELECT ccm.customer_id 
        FROM "${schema}"."customer_company_memberships" ccm
        WHERE ccm.company_id = $2 AND ccm.tenant_id = $1 AND ccm.is_active = true
      )
      ORDER BY c.first_name, c.last_name
    `;
    
    const fixedResult = await pool.query(fixedQuery, [tenantId, companyId]);
    console.log(`  Found ${fixedResult.rows.length} available customers:`);
    fixedResult.rows.forEach(row => {
      console.log(`    - ${row.firstName} ${row.lastName} (${row.email})`);
    });
    
    // Show the difference
    console.log('\n📊 Analysis:');
    console.log(`  Current query: ${currentResult.rows.length} customers`);
    console.log(`  Fixed query: ${fixedResult.rows.length} customers`);
    console.log(`  Difference: ${fixedResult.rows.length - currentResult.rows.length} additional customers available`);
    
    // Show all customers and their membership status with Hospital São João
    console.log('\n👥 All customers and their Hospital São João membership status:');
    const allCustomersQuery = `
      SELECT 
        c.id,
        c.first_name as "firstName", 
        c.last_name as "lastName",
        c.email,
        CASE 
          WHEN ccm.is_active = true THEN '✅ ATIVO'
          WHEN ccm.is_active = false THEN '❌ INATIVO'
          ELSE '⚪ SEM MEMBERSHIP'
        END as membership_status
      FROM "${schema}"."customers" c
      LEFT JOIN "${schema}"."customer_company_memberships" ccm 
        ON c.id = ccm.customer_id AND ccm.company_id = $2 AND ccm.tenant_id = $1
      WHERE c.tenant_id = $1
      ORDER BY c.first_name, c.last_name
    `;
    
    const allCustomersResult = await pool.query(allCustomersQuery, [tenantId, companyId]);
    allCustomersResult.rows.forEach(row => {
      console.log(`  - ${row.firstName} ${row.lastName}: ${row.membership_status}`);
    });
    
    console.log('\n🎯 The fix will allow customers with inactive memberships to be reassociated!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error testing available customers query:', error);
    process.exit(1);
  }
}

testAvailableCustomersQuery();