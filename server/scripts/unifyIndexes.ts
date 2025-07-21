// SCRIPT TO UNIFY INDEXES - CRITICAL PERFORMANCE FIX
import { indexManager } from '../database/IndexManager';

async function main() {
  console.log('🚀 Starting index unification process...');
  
  try {
    // 1. Generate initial report
    console.log('\n1️⃣ Generating initial index report...');
    const initialReport = await indexManager.generateIndexReport();
    console.log('📊 Initial Report:', initialReport);
    
    // 2. Validate current state
    console.log('\n2️⃣ Validating current index consistency...');
    const validation = await indexManager.validateIndexConsistency();
    
    if (validation.valid) {
      console.log('✅ All indexes are already consistent!');
      return;
    }
    
    console.log(`❌ Found ${validation.issues.length} index issues:`);
    validation.issues.forEach(issue => console.log(`  ${issue}`));
    
    // 3. Unify all indexes
    console.log('\n3️⃣ Unifying indexes across all schemas...');
    await indexManager.unifyAllIndexes();
    
    // 4. Generate final report
    console.log('\n4️⃣ Generating final index report...');
    const finalReport = await indexManager.generateIndexReport();
    console.log('📊 Final Report:', finalReport);
    
    // 5. Final validation
    console.log('\n5️⃣ Final validation...');
    const finalValidation = await indexManager.validateIndexConsistency();
    
    if (finalValidation.valid) {
      console.log('✅ All indexes successfully unified!');
      console.log(`📊 Summary:`, finalValidation.summary);
    } else {
      console.log('❌ Some issues remain:');
      finalValidation.issues.forEach(issue => console.log(`  ${issue}`));
    }
    
  } catch (error) {
    console.error('❌ Error during index unification:', error);
    process.exit(1);
  }
}

main();