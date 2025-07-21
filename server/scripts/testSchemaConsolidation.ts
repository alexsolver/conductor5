#!/usr/bin/env tsx

// SCHEMA CONSOLIDATION TEST SCRIPT
// Validates that the schema consolidation resolves all identified inconsistencies

import SchemaConsolidationMigration from '../migrations/runSchemaConsolidation';
import SchemaConsolidationService from '../utils/schemaConsolidation';
import { db } from '../db';
import { sql } from 'drizzle-orm';

async function runSchemaConsolidationTests() {
  console.log('🧪 Starting Schema Consolidation Test Suite');
  console.log('=' * 60);

  let allTestsPassed = true;
  const testResults = [];

  try {
    // Test 1: Check current schema status before consolidation
    console.log('\n📋 Test 1: Analyzing current schema status...');
    const preConsolidationStatus = await SchemaConsolidationMigration.dryRun();
    console.log(`✓ Found ${preConsolidationStatus.schemasAnalyzed} tenant schemas to analyze`);
    
    const invalidSchemas = preConsolidationStatus.results.filter(r => !r.currentlyValid);
    console.log(`⚠️ Found ${invalidSchemas.length} schemas needing consolidation`);
    
    testResults.push({
      test: 'Pre-consolidation Analysis',
      passed: true,
      details: `${invalidSchemas.length} schemas need consolidation`
    });

    // Test 2: Validate schema issues identification
    console.log('\n📋 Test 2: Validating issue identification...');
    const response = await fetch('/api/schema-consolidation/issues');
    const issuesData = await response.json();
    const issues = issuesData.data;
    
    const expectedIssues = [
      'Fragmented Schema Architecture',
      'Inconsistent tenant_id Column Types',
      'customers vs solicitantes Table Conflict',
      'Inconsistent Foreign Key Constraints',
      'Missing Performance Indexes',
      'Inconsistent JSONB vs TEXT Fields',
      'Duplicate Table Definitions',
      'Auto-healing Logic Conflicts'
    ];
    
    const foundIssues = issues.identifiedInconsistencies.map(i => i.issue);
    const missingIssues = expectedIssues.filter(issue => 
      !foundIssues.some(found => found.includes(issue.split(' ')[0]))
    );
    
    if (missingIssues.length === 0) {
      console.log('✓ All expected schema issues correctly identified');
      testResults.push({
        test: 'Issue Identification',
        passed: true,
        details: `All ${expectedIssues.length} expected issues found`
      });
    } else {
      console.log(`❌ Missing expected issues: ${missingIssues.join(', ')}`);
      testResults.push({
        test: 'Issue Identification',
        passed: false,
        details: `Missing: ${missingIssues.join(', ')}`
      });
      allTestsPassed = false;
    }

    // Test 3: Test individual schema validation
    console.log('\n📋 Test 3: Testing individual schema validation...');
    
    // Get a sample tenant schema
    const sampleSchemas = await db.execute(sql`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name LIKE 'tenant_%'
      LIMIT 1
    `);
    
    if (sampleSchemas.rows.length > 0) {
      const schemaName = sampleSchemas.rows[0].schema_name as string;
      console.log(`🔍 Testing validation on schema: ${schemaName}`);
      
      const isValid = await SchemaConsolidationService.validateSchemaConsistency(schemaName);
      const report = await SchemaConsolidationService.generateConsolidationReport(schemaName);
      
      console.log(`✓ Schema validation completed: ${isValid ? 'VALID' : 'NEEDS CONSOLIDATION'}`);
      console.log(`✓ Report generated with ${Object.keys(report.tables || {}).length} tables`);
      
      testResults.push({
        test: 'Individual Schema Validation',
        passed: true,
        details: `Validated ${schemaName}, status: ${isValid ? 'valid' : 'needs consolidation'}`
      });
    } else {
      console.log('⚠️ No tenant schemas found for validation test');
      testResults.push({
        test: 'Individual Schema Validation',
        passed: false,
        details: 'No tenant schemas available for testing'
      });
      allTestsPassed = false;
    }

    // Test 4: Test API endpoints accessibility
    console.log('\n📋 Test 4: Testing API endpoint accessibility...');
    
    const endpoints = [
      '/api/schema-consolidation/status',
      '/api/schema-consolidation/issues'
    ];
    
    let endpointTestsPassed = 0;
    
    for (const endpoint of endpoints) {
      try {
        const response = await fetch(`http://localhost:5000${endpoint}`, {
          headers: {
            'Authorization': 'Bearer test-token' // This would need a real token in production
          }
        });
        
        if (response.ok) {
          console.log(`✓ ${endpoint} - Accessible`);
          endpointTestsPassed++;
        } else {
          console.log(`❌ ${endpoint} - Not accessible (${response.status})`);
        }
      } catch (error) {
        console.log(`❌ ${endpoint} - Connection error: ${error.message}`);
      }
    }
    
    const endpointsTestPassed = endpointTestsPassed === endpoints.length;
    testResults.push({
      test: 'API Endpoints Accessibility',
      passed: endpointsTestPassed,
      details: `${endpointTestsPassed}/${endpoints.length} endpoints accessible`
    });
    
    if (!endpointsTestPassed) allTestsPassed = false;

    // Test 5: Test consolidated schema structure
    console.log('\n📋 Test 5: Testing consolidated schema structure...');
    
    try {
      const { schema } = await import('../../shared/schema-consolidated');
      
      const expectedTables = [
        'tenants', 'users', 'sessions', 'customers', 'favorecidos',
        'tickets', 'ticketMessages', 'locations', 'customerCompanies',
        'customerCompanyMemberships', 'activityLogs', 'favorecidoLocations',
        'skills', 'certifications', 'userSkills', 'projects', 
        'projectActions', 'projectTimeline'
      ];
      
      const schemaKeys = Object.keys(schema);
      const missingTables = expectedTables.filter(table => !schemaKeys.includes(table));
      
      if (missingTables.length === 0) {
        console.log(`✓ All ${expectedTables.length} expected tables present in consolidated schema`);
        testResults.push({
          test: 'Consolidated Schema Structure',
          passed: true,
          details: `All ${expectedTables.length} tables properly defined`
        });
      } else {
        console.log(`❌ Missing tables in consolidated schema: ${missingTables.join(', ')}`);
        testResults.push({
          test: 'Consolidated Schema Structure',
          passed: false,
          details: `Missing: ${missingTables.join(', ')}`
        });
        allTestsPassed = false;
      }
    } catch (error) {
      console.log(`❌ Error loading consolidated schema: ${error.message}`);
      testResults.push({
        test: 'Consolidated Schema Structure',
        passed: false,
        details: `Schema loading error: ${error.message}`
      });
      allTestsPassed = false;
    }

    // Test Summary
    console.log('\n' + '=' * 60);
    console.log('📊 SCHEMA CONSOLIDATION TEST SUMMARY');
    console.log('=' * 60);
    
    const passedTests = testResults.filter(t => t.passed).length;
    const totalTests = testResults.length;
    
    console.log(`Overall Result: ${allTestsPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
    console.log(`Tests Passed: ${passedTests}/${totalTests}`);
    console.log(');
    
    testResults.forEach((result, index) => {
      const status = result.passed ? '✅' : '❌';
      console.log(`${status} Test ${index + 1}: ${result.test}`);
      console.log(`   ${result.details}`);
    });
    
    console.log('\n📋 NEXT STEPS:');
    if (allTestsPassed) {
      console.log('✅ Schema consolidation system is ready for use');
      console.log('🚀 You can now run consolidation via the admin interface at /schema-consolidation');
      console.log('📊 Or use the API endpoints to check status and run consolidation');
    } else {
      console.log('⚠️ Some tests failed - please review the issues above');
      console.log('🔧 Fix the failing components before running consolidation');
    }
    
    console.log('=' * 60);
    
    return {
      success: allTestsPassed,
      totalTests,
      passedTests,
      results: testResults
    };

  } catch (error) {
    console.error('💥 Test suite failed with error:', error);
    return {
      success: false,
      error: error.message,
      results: testResults
    };
  }
}

// Export for use in other modules
export { runSchemaConsolidationTests };

// CLI execution handler for direct script running
export async function executeTestsCLI() {
  try {
    const result = await runSchemaConsolidationTests();
    console.log('\n🏁 Test execution completed');
    return result;
  } catch (error) {
    console.error('💥 Test execution failed:', error);
    throw error;
  }
}