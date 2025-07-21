// SCRIPT TO UNIFY TENANT CONSTRAINTS - CRITICAL SECURITY FIX
import { tenantConstraintsUnifier } from '../database/TenantConstraintsUnifier';

async function main() {
  console.log('🚀 Starting tenant constraints unification process...');
  
  try {
    // 1. Validate current state
    console.log('\n1️⃣ Validating current constraint consistency...');
    const validation = await tenantConstraintsUnifier.validateConstraintConsistency();
    
    if (validation.valid) {
      console.log('✅ All constraints are already consistent!');
      return;
    }
    
    console.log(`❌ Found ${validation.issues.length} constraint issues:`);
    validation.issues.forEach(issue => console.log(`  ${issue}`));
    
    // 2. Unify all constraints
    console.log('\n2️⃣ Unifying tenant constraints across all schemas...');
    await tenantConstraintsUnifier.unifyAllTenantConstraints();
    
    // 3. Re-validate
    console.log('\n3️⃣ Re-validating constraint consistency...');
    const finalValidation = await tenantConstraintsUnifier.validateConstraintConsistency();
    
    if (finalValidation.valid) {
      console.log('✅ All tenant constraints successfully unified!');
      console.log(`📊 Final Report:`, finalValidation.report);
    } else {
      console.log('❌ Some issues remain:');
      finalValidation.issues.forEach(issue => console.log(`  ${issue}`));
    }
    
  } catch (error) {
    console.error('❌ Error during constraints unification:', error);
    process.exit(1);
  }
}

main();