
import { sql } from 'drizzle-orm';
import { db } from '../db';
import { tenantSchemaAuditor } from '../scripts/TenantSchemaUsageAuditor';

export class TenantSchemaMonitor {
  private static instance: TenantSchemaMonitor;
  private monitoringActive = false;
  private violationCount = 0;
  private lastAuditTime = new Date();

  static getInstance(): TenantSchemaMonitor {
    if (!TenantSchemaMonitor.instance) {
      TenantSchemaMonitor.instance = new TenantSchemaMonitor();
    }
    return TenantSchemaMonitor.instance;
  }

  async startMonitoring(): Promise<void> {
    if (this.monitoringActive) {
      console.log('🔄 [TENANT-SCHEMA-MONITOR] Monitoring already active');
      return;
    }

    this.monitoringActive = true;
    console.log('🔄 [TENANT-SCHEMA-MONITOR] Starting continuous monitoring...');

    // Start periodic audits
    this.schedulePeriodicAudits();

    // Start real-time query monitoring (if available)
    this.startRealTimeMonitoring();

    // Start schema drift detection
    this.startSchemaDriftDetection();
  }

  private async performImmediateAudit(): Promise<void> {
    try {
      console.log('🔍 [IMMEDIATE-AUDIT] Running startup tenant schema audit...');
      
      const auditResult = await tenantSchemaAuditor.auditCompleteSystem();
      
      const criticalViolations = auditResult.violations.filter(v => 
        v.severity === 'critical' || 
        v.violations?.some((vv: any) => vv.severity === 'critical')
      );

      if (criticalViolations.length > 0) {
        console.error(`🚨 [STARTUP-CRITICAL] ${criticalViolations.length} critical tenant schema violations detected at startup!`);
        
        // Log each critical violation for immediate attention
        criticalViolations.forEach((violation, index) => {
          console.error(`🚨 [CRITICAL-${index + 1}] ${violation.file || violation.type} - ${violation.severity}`);
        });
      } else {
        console.log(`✅ [STARTUP-AUDIT] No critical violations found - system clean`);
      }
      
    } catch (error) {
      console.error('❌ [IMMEDIATE-AUDIT] Error during startup audit:', error);
    }
  }

  private schedulePeriodicAudits(): void {
    // Run full audit every hour
    setInterval(async () => {
      try {
        console.log('🔍 [PERIODIC-AUDIT] Running scheduled tenant schema audit...');
        
        const auditResult = await tenantSchemaAuditor.auditCompleteSystem();
        this.lastAuditTime = new Date();
        
        const criticalViolations = auditResult.violations.filter(v => 
          v.severity === 'critical' || 
          v.violations?.some((vv: any) => vv.severity === 'critical')
        );

        if (criticalViolations.length > 0) {
          this.violationCount += criticalViolations.length;
          
          console.error(`🚨 [CRITICAL-ALERT] ${criticalViolations.length} critical tenant schema violations detected!`);
          
          // Send immediate alerts
          await this.sendCriticalAlert(criticalViolations);
        }

        // Log monitoring status
        console.log(`✅ [PERIODIC-AUDIT] Complete. Total violations: ${auditResult.summary.total}, Critical: ${auditResult.summary.critical}`);
        
      } catch (error) {
        console.error('❌ [PERIODIC-AUDIT] Error during scheduled audit:', error);
      }
    }, 60 * 60 * 1000); // Every hour
  }

  private startRealTimeMonitoring(): void {
    // Monitor for inappropriate public schema access
    setInterval(async () => {
      try {
        await this.checkRecentQueries();
      } catch (error) {
        console.error('❌ [REAL-TIME-MONITOR] Error checking recent queries:', error);
      }
    }, 5 * 60 * 1000); // Every 5 minutes
  }

  private async checkRecentQueries(): Promise<void> {
    try {
      // Check for recent queries that hit public schema inappropriately
      const suspiciousQueries = await db.execute(sql`
        SELECT query, calls, last_call
        FROM pg_stat_statements 
        WHERE last_call > NOW() - INTERVAL '5 minutes'
        AND query NOT LIKE '%information_schema%'
        AND query NOT LIKE '%pg_%'
        AND (
          query LIKE '%FROM public.customers%' OR
          query LIKE '%FROM public.tickets%' OR
          query LIKE '%FROM public.users%' OR
          query LIKE '%UPDATE public.customers%' OR
          query LIKE '%UPDATE public.tickets%' OR
          query LIKE '%INSERT INTO public.customers%' OR
          query LIKE '%INSERT INTO public.tickets%'
        )
        ORDER BY last_call DESC
        LIMIT 10
      `);

      if (suspiciousQueries.rows.length > 0) {
        console.warn(`⚠️ [REAL-TIME-MONITOR] Found ${suspiciousQueries.rows.length} suspicious queries hitting public schema`);
        
        for (const query of suspiciousQueries.rows) {
          console.warn(`  🔍 Query: ${(query.query as string).substring(0, 100)}...`);
        }
      }
    } catch (error) {
      // pg_stat_statements might not be available
      console.debug('🔍 [REAL-TIME-MONITOR] pg_stat_statements not available for query monitoring');
    }
  }

  private startSchemaDriftDetection(): void {
    // Detect when tenant schemas drift from expected structure
    setInterval(async () => {
      try {
        await this.detectSchemaDrift();
      } catch (error) {
        console.error('❌ [SCHEMA-DRIFT] Error detecting schema drift:', error);
      }
    }, 30 * 60 * 1000); // Every 30 minutes
  }

  private async detectSchemaDrift(): Promise<void> {
    try {
      // Get all tenant schemas
      const tenantSchemas = await db.execute(sql`
        SELECT schema_name 
        FROM information_schema.schemata 
        WHERE schema_name LIKE 'tenant_%'
      `);

      for (const schema of tenantSchemas.rows) {
        const schemaName = schema.schema_name as string;
        
        // Check table count consistency
        const tableCount = await db.execute(sql`
          SELECT COUNT(*) as count
          FROM information_schema.tables 
          WHERE table_schema = ${schemaName}
        `);

        const count = parseInt(tableCount.rows[0]?.count as string || '0');
        
        // Expected minimum table count for a healthy tenant schema
        const expectedMinTables = 15;
        
        if (count < expectedMinTables) {
          console.warn(`⚠️ [SCHEMA-DRIFT] Schema ${schemaName} has only ${count} tables (expected min: ${expectedMinTables})`);
        }
      }
    } catch (error) {
      console.error('❌ [SCHEMA-DRIFT] Error checking schema consistency:', error);
    }
  }

  private async sendCriticalAlert(violations: any[]): Promise<void> {
    const alertMessage = `
🚨 CRITICAL TENANT SCHEMA VIOLATIONS DETECTED 🚨
Time: ${new Date().toISOString()}
Count: ${violations.length}
Details: ${violations.map(v => `${v.type} in ${v.file || 'runtime'}`).join(', ')}
`;

    console.error(alertMessage);
    
    // Here you could integrate with:
    // - Slack notifications
    // - Email alerts
    // - PagerDuty
    // - Discord webhooks
    // etc.
  }

  async getMonitoringStatus(): Promise<{
    active: boolean;
    lastAudit: Date;
    violationCount: number;
    uptime: number;
  }> {
    return {
      active: this.monitoringActive,
      lastAudit: this.lastAuditTime,
      violationCount: this.violationCount,
      uptime: this.monitoringActive ? Date.now() - this.lastAuditTime.getTime() : 0
    };
  }

  async stopMonitoring(): Promise<void> {
    this.monitoringActive = false;
    console.log('⏹️ [TENANT-SCHEMA-MONITOR] Monitoring stopped');
  }

  // CRITICAL: Emergency schema isolation
  async emergencySchemaIsolation(tenantId: string): Promise<void> {
    console.log(`🚨 [EMERGENCY-ISOLATION] Initiating emergency schema isolation for tenant: ${tenantId}`);
    
    try {
      // 1. Validate tenant exists and is active
      const tenant = await db.execute(sql`
        SELECT id, is_active FROM tenants WHERE id = ${tenantId}
      `);

      if (tenant.rows.length === 0) {
        throw new Error(`Tenant ${tenantId} not found`);
      }

      // 2. Check schema exists
      const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
      const schemaExists = await db.execute(sql`
        SELECT schema_name FROM information_schema.schemata 
        WHERE schema_name = ${schemaName}
      `);

      if (schemaExists.rows.length === 0) {
        throw new Error(`Schema ${schemaName} not found`);
      }

      // 3. Force all connections to use tenant schema
      await db.execute(sql`
        ALTER DATABASE ${process.env.DB_NAME || 'postgres'} 
        SET search_path TO ${schemaName}, public
      `);

      console.log(`✅ [EMERGENCY-ISOLATION] Emergency isolation complete for tenant: ${tenantId}`);
      
    } catch (error) {
      console.error(`❌ [EMERGENCY-ISOLATION] Failed for tenant ${tenantId}:`, error);
      throw error;
    }
  }
}

// Export singleton
export const tenantSchemaMonitor = TenantSchemaMonitor.getInstance();
