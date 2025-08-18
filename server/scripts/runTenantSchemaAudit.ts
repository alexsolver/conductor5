#!/usr/bin/env node

/**
 * CRITICAL SECURITY SCRIPT: Execute comprehensive tenant schema audit
 * Runs all security tools to detect and fix tenant isolation violations
 */

import { TenantSchemaUsageAuditor } from './TenantSchemaUsageAuditor.js';
import { TenantSchemaMonitor } from '../services/TenantSchemaMonitor.js';

async function runCriticalSecurityAudit() {
  console.log('🚨 [CRITICAL-SECURITY] Starting comprehensive tenant isolation audit...');
  
  try {
    // 1. Execute usage auditor for violations
    console.log('🔍 [STEP-1] Running TenantSchemaUsageAuditor...');
    const auditor = TenantSchemaUsageAuditor.getInstance();
    const auditResult = await auditor.auditCompleteSystem();
    
    console.log('\n📊 [AUDIT-RESULTS] Security Status:');
    console.log('- Critical Violations:', auditResult.summary?.critical || 0);
    console.log('- High Violations:', auditResult.summary?.high || 0);
    console.log('- Total Violations:', auditResult.summary?.total || 0);
    
    if (auditResult.violations?.length > 0) {
      console.log('\n🚨 [VIOLATIONS-FOUND]:');
      auditResult.violations.slice(0, 5).forEach((violation, i) => {
        console.log(`${i + 1}. ${violation.file || violation.type} - ${violation.severity}`);
      });
    }
    
    // 2. Activate continuous monitoring
    console.log('\n🔄 [STEP-2] Activating TenantSchemaMonitor...');
    const monitor = TenantSchemaMonitor.getInstance();
    await monitor.startMonitoring();
    console.log('✅ [MONITOR] Continuous tenant schema monitoring ACTIVATED');
    
    // 3. Report final status
    const status = auditResult.summary?.total === 0 ? '✅ SECURE' : '🚨 VIOLATIONS DETECTED';
    console.log(`\n${status} [FINAL-STATUS] Tenant isolation audit complete`);
    
    if (auditResult.fixes?.length > 0) {
      console.log('\n🔧 [RECOMMENDED-FIXES]:');
      auditResult.fixes.slice(0, 3).forEach((fix, i) => {
        console.log(`${i + 1}. ${fix}`);
      });
    }
    
  } catch (error) {
    console.error('❌ [AUDIT-ERROR] Failed to complete security audit:', error);
    process.exit(1);
  }
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runCriticalSecurityAudit();
}

export { runCriticalSecurityAudit };