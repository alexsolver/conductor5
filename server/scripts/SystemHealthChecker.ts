
import { readFileSync } from 'fs';
import { join } from 'path';
import { Pool } from '@neondatabase/serverless';

interface HealthCheckResult {
  component: string;
  status: 'healthy' | 'warning' | 'error';
  message: string;
  details?: any;
}

export class SystemHealthChecker {
  private pool: Pool;
  private results: HealthCheckResult[] = [];

  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL
    });
  }

  async runFullHealthCheck(): Promise<HealthCheckResult[]> {
    console.log('🔍 Starting comprehensive system health check...\n');
    
    this.results = [];
    
    // Check database connection
    await this.checkDatabaseConnection();
    
    // Check schema consistency
    await this.checkSchemaConsistency();
    
    // Check tenant schemas
    await this.checkTenantSchemas();
    
    // Check critical tables
    await this.checkCriticalTables();
    
    // Check frontend-backend API connectivity
    await this.checkAPIEndpoints();
    
    // Generate summary report
    this.generateSummaryReport();
    
    return this.results;
  }

  private async checkDatabaseConnection(): Promise<void> {
    try {
      const result = await this.pool.query('SELECT NOW() as current_time');
      this.results.push({
        component: 'Database Connection',
        status: 'healthy',
        message: 'Database connection successful',
        details: { timestamp: result.rows[0].current_time }
      });
    } catch (error) {
      this.results.push({
        component: 'Database Connection',
        status: 'error',
        message: 'Failed to connect to database',
        details: { error: error.message }
      });
    }
  }

  private async checkSchemaConsistency(): Promise<void> {
    try {
      // Check public schema tables
      const publicTables = await this.pool.query(`
        SELECT table_name FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('sessions', 'tenants', 'users')
      `);

      const expectedPublicTables = ['sessions', 'tenants', 'users'];
      const foundPublicTables = publicTables.rows.map(row => row.table_name);
      const missingPublicTables = expectedPublicTables.filter(table => !foundPublicTables.includes(table));

      if (missingPublicTables.length === 0) {
        this.results.push({
          component: 'Public Schema',
          status: 'healthy',
          message: 'All required public tables exist',
          details: { tables: foundPublicTables }
        });
      } else {
        this.results.push({
          component: 'Public Schema',
          status: 'error',
          message: 'Missing required public tables',
          details: { missing: missingPublicTables, found: foundPublicTables }
        });
      }
    } catch (error) {
      this.results.push({
        component: 'Public Schema',
        status: 'error',
        message: 'Failed to check public schema',
        details: { error: error.message }
      });
    }
  }

  private async checkTenantSchemas(): Promise<void> {
    try {
      // Get all tenant schemas
      const tenantSchemas = await this.pool.query(`
        SELECT schema_name FROM information_schema.schemata 
        WHERE schema_name LIKE 'tenant_%'
      `);

      const schemaNames = tenantSchemas.rows.map(row => row.schema_name);
      
      if (schemaNames.length === 0) {
        this.results.push({
          component: 'Tenant Schemas',
          status: 'warning',
          message: 'No tenant schemas found',
          details: { count: 0 }
        });
        return;
      }

      // Check each tenant schema
      const requiredTables = [
        'customers', 'tickets', 'ticket_messages', 'activity_logs',
        'locations', 'customer_companies', 'skills', 'certifications',
        'user_skills', 'favorecidos', 'projects', 'project_actions'
      ];

      let healthyTenants = 0;
      const tenantDetails = [];

      for (const schemaName of schemaNames) {
        const tableCount = await this.pool.query(`
          SELECT COUNT(*) as count FROM information_schema.tables 
          WHERE table_schema = $1 AND table_name = ANY($2)
        `, [schemaName, requiredTables]);

        const foundTables = parseInt(tableCount.rows[0].count);
        const isHealthy = foundTables >= requiredTables.length;
        
        if (isHealthy) healthyTenants++;
        
        tenantDetails.push({
          schema: schemaName,
          tables: foundTables,
          required: requiredTables.length,
          healthy: isHealthy
        });
      }

      this.results.push({
        component: 'Tenant Schemas',
        status: healthyTenants === schemaNames.length ? 'healthy' : 'warning',
        message: `${healthyTenants}/${schemaNames.length} tenant schemas are healthy`,
        details: { tenants: tenantDetails }
      });

    } catch (error) {
      this.results.push({
        component: 'Tenant Schemas',
        status: 'error',
        message: 'Failed to check tenant schemas',
        details: { error: error.message }
      });
    }
  }

  private async checkCriticalTables(): Promise<void> {
    try {
      // Check if critical tables have proper structure
      const checks = [
        {
          table: 'users',
          schema: 'public',
          requiredColumns: ['id', 'email', 'tenant_id', 'is_active']
        },
        {
          table: 'tenants',
          schema: 'public', 
          requiredColumns: ['id', 'name', 'is_active']
        }
      ];

      for (const check of checks) {
        const columns = await this.pool.query(`
          SELECT column_name FROM information_schema.columns 
          WHERE table_schema = $1 AND table_name = $2
        `, [check.schema, check.table]);

        const foundColumns = columns.rows.map(row => row.column_name);
        const missingColumns = check.requiredColumns.filter(col => !foundColumns.includes(col));

        this.results.push({
          component: `Table: ${check.schema}.${check.table}`,
          status: missingColumns.length === 0 ? 'healthy' : 'error',
          message: missingColumns.length === 0 
            ? 'Table structure is correct' 
            : `Missing columns: ${missingColumns.join(', ')}`,
          details: { found: foundColumns, missing: missingColumns }
        });
      }

    } catch (error) {
      this.results.push({
        component: 'Critical Tables',
        status: 'error',
        message: 'Failed to check table structures',
        details: { error: error.message }
      });
    }
  }

  private async checkAPIEndpoints(): Promise<void> {
    // This would check if critical API endpoints are properly configured
    // For now, we'll check if the route files exist
    const criticalRoutes = [
      'server/modules/auth/routes.ts',
      'server/modules/customers/routes.ts',
      'server/modules/tickets/routes.ts'
    ];

    for (const routeFile of criticalRoutes) {
      try {
        const content = readFileSync(join(process.cwd(), routeFile), 'utf-8');
        this.results.push({
          component: `API Routes: ${routeFile}`,
          status: 'healthy',
          message: 'Route file exists and readable',
          details: { size: content.length }
        });
      } catch (error) {
        this.results.push({
          component: `API Routes: ${routeFile}`,
          status: 'error',
          message: 'Route file not found or not readable',
          details: { error: error.message }
        });
      }
    }
  }

  private generateSummaryReport(): void {
    const summary = {
      total: this.results.length,
      healthy: this.results.filter(r => r.status === 'healthy').length,
      warnings: this.results.filter(r => r.status === 'warning').length,
      errors: this.results.filter(r => r.status === 'error').length
    };

    console.log('\n' + '='.repeat(60));
    console.log('🏥 SYSTEM HEALTH CHECK SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Healthy: ${summary.healthy}`);
    console.log(`⚠️  Warnings: ${summary.warnings}`);
    console.log(`❌ Errors: ${summary.errors}`);
    console.log(`📊 Total Checks: ${summary.total}`);
    console.log('='.repeat(60));

    // Print detailed results
    this.results.forEach(result => {
      const icon = result.status === 'healthy' ? '✅' : 
                   result.status === 'warning' ? '⚠️' : '❌';
      console.log(`${icon} ${result.component}: ${result.message}`);
    });

    console.log('\n🎯 OVERALL SYSTEM STATUS:', 
      summary.errors === 0 ? '✅ HEALTHY' : 
      summary.errors < 3 ? '⚠️ NEEDS ATTENTION' : '❌ CRITICAL ISSUES');
  }

  async cleanup(): Promise<void> {
    await this.pool.end();
  }
}

// Execute health check if run directly
if (require.main === module) {
  const checker = new SystemHealthChecker();
  checker.runFullHealthCheck()
    .then(() => checker.cleanup())
    .catch(error => {
      console.error('❌ Health check failed:', error);
      process.exit(1);
    });
}
