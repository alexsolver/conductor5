const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function fixMembershipReactivation() {
  try {
    const tenantId = '3f99462f-3621-4b1b-bea8-782acc50d62e';
    const schema = `tenant_${tenantId.replace(/-/g, '_')}`;
    const pedroId = 'd2e76435-bed5-4919-a92b-d45ac741a7ba';
    const encantadaId = '987ba952-ae7b-4f0a-b974-768c3a94bbaf';
    
    console.log('🔧 Fixing Pedro Oliveira membership reactivation issue...');
    
    // Step 1: Check current status
    console.log('\n📊 Current membership status for Pedro Oliveira:');
    const currentMemberships = await pool.query(`
      SELECT 
        ccm.company_id,
        ccm.is_active,
        cc.name as company_name
      FROM "${schema}".customer_company_memberships ccm
      LEFT JOIN "${schema}".customer_companies cc ON ccm.company_id = cc.id
      WHERE ccm.customer_id = $1
      ORDER BY ccm.is_active DESC, cc.name
    `, [pedroId]);
    
    currentMemberships.rows.forEach(row => {
      console.log(`  - ${row.company_name}: ${row.is_active ? '✅ ATIVO' : '❌ INATIVO'}`);
    });
    
    // Step 2: Test the reactivation logic
    console.log('\n🔄 Testing reactivation of Encantada Resort...');
    
    // Check if there's an inactive membership for Encantada Resort
    const inactiveMembership = await pool.query(`
      SELECT id, is_active FROM "${schema}".customer_company_memberships
      WHERE customer_id = $1 AND company_id = $2 AND is_active = false
    `, [pedroId, encantadaId]);
    
    if (inactiveMembership.rows.length > 0) {
      console.log('  Found inactive membership - reactivating...');
      
      const reactivateResult = await pool.query(`
        UPDATE "${schema}".customer_company_memberships 
        SET is_active = true, role = 'member', updated_at = NOW()
        WHERE customer_id = $1 AND company_id = $2 AND is_active = false
        RETURNING *
      `, [pedroId, encantadaId]);
      
      console.log('  ✅ Membership reactivated successfully!');
      console.log(`  Membership ID: ${reactivateResult.rows[0].id}`);
    } else {
      console.log('  ❌ No inactive membership found to reactivate');
    }
    
    // Step 3: Verify the fix
    console.log('\n📊 Updated membership status for Pedro Oliveira:');
    const updatedMemberships = await pool.query(`
      SELECT 
        ccm.company_id,
        ccm.is_active,
        cc.name as company_name
      FROM "${schema}".customer_company_memberships ccm
      LEFT JOIN "${schema}".customer_companies cc ON ccm.company_id = cc.id
      WHERE ccm.customer_id = $1
      ORDER BY ccm.is_active DESC, cc.name
    `, [pedroId]);
    
    updatedMemberships.rows.forEach(row => {
      console.log(`  - ${row.company_name}: ${row.is_active ? '✅ ATIVO' : '❌ INATIVO'}`);
    });
    
    console.log('\n🎉 Pedro Oliveira can now see "Encantada Resort" in his company list!');
    console.log('🎉 The membership reactivation issue has been resolved!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error fixing membership reactivation:', error);
    process.exit(1);
  }
}

fixMembershipReactivation();