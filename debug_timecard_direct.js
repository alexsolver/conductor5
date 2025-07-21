// Debug script to test timecard repository directly
import { db } from './server/db.js';

async function testTimecardRepository() {
  try {
    console.log('🔍 Testing timecard repository directly...');
    
    // Test 1: Import the repository
    console.log('📋 Step 1: Importing DrizzleTimecardRepository...');
    const { DrizzleTimecardRepository } = await import('./server/modules/timecard/infrastructure/repositories/DrizzleTimecardRepository.js');
    console.log('✅ Repository imported successfully');
    
    // Test 2: Create repository instance
    console.log('📋 Step 2: Creating repository instance...');
    const repository = new DrizzleTimecardRepository();
    console.log('✅ Repository instance created');
    
    // Test 3: Simple database query
    console.log('📋 Step 3: Testing simple DB query...');
    const result = await db.execute(sql`SELECT NOW() as current_time`);
    console.log('✅ Database query successful:', result.rows[0]);
    
    // Test 4: Test a simple repository method
    console.log('📋 Step 4: Testing repository method...');
    
    const tenantId = '3f99462f-3621-4b1b-bea8-782acc50d62e';
    
    // Try to call findAbsenceRequestsByUser
    const absenceRequests = await repository.findAbsenceRequestsByUser(
      tenantId, 
      '550e8400-e29b-41d4-a716-446655440002',
      { status: 'pending' }
    );
    
    console.log('✅ Repository method called successfully:', absenceRequests.length, 'requests found');
    
  } catch (error) {
    console.error('❌ Error during timecard repository test:', error);
    console.error('Stack trace:', error.stack);
  }
}

// Add SQL import
import { sql } from 'drizzle-orm';

testTimecardRepository();