
import { TenantAutoProvisioningService } from '../services/TenantAutoProvisioningService';

async function testTenantProvisioning() {
  console.log('🧪 [TEST] Testing tenant provisioning with ticket configurations...');
  
  try {
    const provisioningService = new TenantAutoProvisioningService();
    
    const testEmail = `test_${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';
    
    console.log(`📧 [TEST] Creating test tenant with email: ${testEmail}`);
    
    const result = await provisioningService.provisionTenant({
      email: testEmail,
      password: testPassword,
      companyName: 'Test Company',
      industry: 'Testing',
      size: 'small'
    });
    
    console.log('✅ [TEST] Tenant provisioned successfully:', result);
    
    // Test if ticket configurations were created
    const { db } = await import('../db');
    const schemaName = `tenant_${result.tenantId.replace(/-/g, '_')}`;
    
    // Check field configurations
    const configsResult = await db.execute(`
      SELECT COUNT(*) as count FROM "${schemaName}"."ticket_field_configurations"
      WHERE tenant_id = '${result.tenantId}'
    `);
    
    // Check field options
    const optionsResult = await db.execute(`
      SELECT COUNT(*) as count FROM "${schemaName}"."ticket_field_options"
      WHERE tenant_id = '${result.tenantId}'
    `);
    
    // Check categories
    const categoriesResult = await db.execute(`
      SELECT COUNT(*) as count FROM "${schemaName}"."ticket_categories"
      WHERE tenant_id = '${result.tenantId}'
    `);
    
    // Check subcategories
    const subcategoriesResult = await db.execute(`
      SELECT COUNT(*) as count FROM "${schemaName}"."ticket_subcategories"
      WHERE tenant_id = '${result.tenantId}'
    `);
    
    // Check actions
    const actionsResult = await db.execute(`
      SELECT COUNT(*) as count FROM "${schemaName}"."ticket_actions"
      WHERE tenant_id = '${result.tenantId}'
    `);
    
    console.log('📊 [TEST] Ticket configurations created:', {
      fieldConfigurations: configsResult.rows[0]?.count || 0,
      fieldOptions: optionsResult.rows[0]?.count || 0,
      categories: categoriesResult.rows[0]?.count || 0,
      subcategories: subcategoriesResult.rows[0]?.count || 0,
      actions: actionsResult.rows[0]?.count || 0
    });
    
    if (Number(configsResult.rows[0]?.count || 0) > 0) {
      console.log('🎉 [TEST] SUCCESS: Ticket configurations were automatically populated!');
    } else {
      console.log('❌ [TEST] FAILURE: No ticket configurations were created');
    }
    
  } catch (error) {
    console.error('❌ [TEST] Error testing tenant provisioning:', error);
  }
}

// Execute if run directly
if (require.main === module) {
  testTenantProvisioning()
    .then(() => {
      console.log('✅ [TEST] Test completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ [TEST] Test failed:', error);
      process.exit(1);
    });
}
