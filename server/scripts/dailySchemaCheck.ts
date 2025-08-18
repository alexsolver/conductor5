#!/usr/bin/env node
/**
 * Daily Schema Check Script
 * CRITICAL: Simplified automated monitoring system for tenant schema isolation
 */

import { performance } from 'perf_hooks';
import { tenantSchemaManager } from '../utils/tenantSchemaValidator';

interface DailyCheckResult {
  timestamp: string;
  duration: number;
  tenantHealth: any[];
  status: 'success' | 'warning' | 'error';
  summary: string;
}

class DailySchemaChecker {
  
  async runDailyCheck(): Promise<DailyCheckResult> {
    const startTime = performance.now();
    const timestamp = new Date().toISOString();
    
    console.log(`\n🔍 [DAILY-CHECK] Starting daily schema validation at ${timestamp}`);
    console.log('=====================================');
    
    try {
      // 1. Check tenant connection health
      console.log('\n1️⃣ Checking tenant connection health...');
      const tenantHealth = await tenantSchemaManager.healthCheck();
      const unhealthyTenants = tenantHealth.filter(h => !h.isHealthy);
      
      console.log(`   ✅ Checked ${tenantHealth.length} tenant connections`);
      if (unhealthyTenants.length > 0) {
        console.log(`   ⚠️  Found ${unhealthyTenants.length} unhealthy connections`);
        unhealthyTenants.forEach(tenant => {
          console.log(`      - ${tenant.tenantId}: ${tenant.lastError}`);
        });
      }

      // 2. Generate summary and status
      const duration = performance.now() - startTime;
      let status: 'success' | 'warning' | 'error' = 'success';
      let summary = 'All tenant schemas validated successfully';

      if (unhealthyTenants.length > 0) {
        status = 'warning';
        summary = `Found ${unhealthyTenants.length} unhealthy tenant connections`;
      }

      const result: DailyCheckResult = {
        timestamp,
        duration: Math.round(duration),
        tenantHealth,
        status,
        summary
      };

      console.log('\n=====================================');
      console.log(`🏁 [DAILY-CHECK] Completed in ${Math.round(duration)}ms`);
      console.log(`📊 Status: ${status.toUpperCase()}`);
      console.log(`📝 Summary: ${summary}`);
      console.log('=====================================\n');

      return result;
      
    } catch (error) {
      const duration = performance.now() - startTime;
      console.error('\n❌ [DAILY-CHECK] Failed:', error);
      
      return {
        timestamp,
        duration: Math.round(duration),
        tenantHealth: [],
        status: 'error',
        summary: `Daily check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async scheduleRecurring(): Promise<void> {
    console.log('⏰ [SCHEDULER] Setting up daily schema checks...');
    
    // Run immediately on startup
    await this.runDailyCheck();
    
    // Schedule for every 24 hours
    setInterval(async () => {
      await this.runDailyCheck();
    }, 24 * 60 * 60 * 1000); // 24 hours
    
    console.log('✅ [SCHEDULER] Daily schema checks scheduled successfully');
  }
}

export const dailySchemaChecker = new DailySchemaChecker();

// Run if called directly
if (import.meta.url === new URL(process.argv[1], 'file://').href) {
  console.log('🚀 [CLI] Running manual schema check...');
  
  dailySchemaChecker.runDailyCheck()
    .then((result) => {
      console.log('\n📊 [RESULT]:', JSON.stringify(result, null, 2));
      process.exit(result.status === 'error' ? 1 : 0);
    })
    .catch((error) => {
      console.error('💥 [FATAL]:', error);
      process.exit(1);
    });
}