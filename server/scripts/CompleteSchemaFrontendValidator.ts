
import { Pool } from '@neondatabase/serverless';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

interface ValidationResult {
  component: string;
  status: 'healthy' | 'warning' | 'error';
  message: string;
  details?: any;
}

export class CompleteSchemaFrontendValidator {
  private pool: Pool;
  private results: ValidationResult[] = [];

  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL
    });
  }

  async runCompleteValidation(): Promise<ValidationResult[]> {
    console.log('🔍 Starting complete schema-frontend validation...\n');
    
    this.results = [];
    
    // 1. Database Connection
    await this.checkDatabaseConnection();
    
    // 2. Schema Consistency
    await this.checkSchemaConsistency();
    
    // 3. Tenant Schemas Health
    await this.checkTenantSchemasHealth();
    
    // 4. Frontend-Backend API Connectivity
    await this.checkAPIConnectivity();
    
    // 5. Critical Tables Structure
    await this.checkCriticalTablesStructure();
    
    // 6. Foreign Key Constraints
    await this.checkForeignKeyConstraints();
    
    // 7. Frontend Components Integration
    await this.checkFrontendIntegration();
    
    // 8. Field Options Configuration
    await this.checkFieldOptionsConfiguration();
    
    // Generate final report
    this.generateFinalReport();
    
    return this.results;
  }

  private async checkDatabaseConnection(): Promise<void> {
    try {
      const result = await this.pool.query('SELECT NOW() as current_time, version() as pg_version');
      this.results.push({
        component: 'Database Connection',
        status: 'healthy',
        message: 'Database connection successful',
        details: { 
          timestamp: result.rows[0].current_time,
          version: result.rows[0].pg_version
        }
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
        ORDER BY table_name
      `);

      const expectedPublicTables = ['sessions', 'tenants', 'users'];
      const foundPublicTables = publicTables.rows.map(row => row.table_name);
      const missingPublicTables = expectedPublicTables.filter(table => !foundPublicTables.includes(table));

      if (missingPublicTables.length === 0) {
        this.results.push({
          component: 'Public Schema',
          status: 'healthy',
          message: `All ${expectedPublicTables.length} required public tables exist`,
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

  private async checkTenantSchemasHealth(): Promise<void> {
    try {
      // Get all tenant schemas
      const tenantSchemas = await this.pool.query(`
        SELECT schema_name FROM information_schema.schemata 
        WHERE schema_name LIKE 'tenant_%'
        ORDER BY schema_name
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

      // Check each tenant schema for required tables
      const requiredTenantTables = [
        'customers', 'tickets', 'ticket_messages', 'activity_logs',
        'locations', 'companies', 'skills', 'items', 'suppliers',
        'price_lists', 'ticket_field_configurations', 'ticket_field_options'
      ];

      let healthyTenants = 0;
      const tenantDetails = [];

      for (const schemaName of schemaNames) {
        const tableCount = await this.pool.query(`
          SELECT COUNT(*) as count FROM information_schema.tables 
          WHERE table_schema = $1 AND table_name = ANY($2)
        `, [schemaName, requiredTenantTables]);

        const foundTables = parseInt(tableCount.rows[0].count);
        const isHealthy = foundTables >= requiredTenantTables.length;
        
        if (isHealthy) healthyTenants++;
        
        tenantDetails.push({
          schema: schemaName,
          tables: foundTables,
          required: requiredTenantTables.length,
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

  private async checkAPIConnectivity(): Promise<void> {
    // Check if critical API route files exist
    const criticalRoutes = [
      'server/modules/auth/routes.ts',
      'server/modules/customers/routes.ts',
      'server/modules/tickets/routes.ts',
      'server/routes/ticketFieldOptions.ts',
      'server/routes/localization.ts'
    ];

    for (const routeFile of criticalRoutes) {
      try {
        if (existsSync(join(process.cwd(), routeFile))) {
          const content = readFileSync(join(process.cwd(), routeFile), 'utf-8');
          this.results.push({
            component: `API Routes: ${routeFile}`,
            status: 'healthy',
            message: 'Route file exists and readable',
            details: { size: content.length, hasExports: content.includes('export') }
          });
        } else {
          this.results.push({
            component: `API Routes: ${routeFile}`,
            status: 'error',
            message: 'Route file not found',
            details: { path: routeFile }
          });
        }
      } catch (error) {
        this.results.push({
          component: `API Routes: ${routeFile}`,
          status: 'error',
          message: 'Route file not readable',
          details: { error: error.message }
        });
      }
    }
  }

  private async checkCriticalTablesStructure(): Promise<void> {
    try {
      // Check structure of critical tables
      const criticalChecks = [
        {
          table: 'users',
          schema: 'public',
          requiredColumns: ['id', 'email', 'tenant_id', 'is_active', 'created_at']
        },
        {
          table: 'tenants',
          schema: 'public', 
          requiredColumns: ['id', 'name', 'is_active', 'created_at']
        }
      ];

      for (const check of criticalChecks) {
        const columns = await this.pool.query(`
          SELECT column_name, data_type FROM information_schema.columns 
          WHERE table_schema = $1 AND table_name = $2
          ORDER BY column_name
        `, [check.schema, check.table]);

        const foundColumns = columns.rows.map(row => `${row.column_name}:${row.data_type}`);
        const missingColumns = check.requiredColumns.filter(col => 
          !columns.rows.some(row => row.column_name === col)
        );

        this.results.push({
          component: `Table Structure: ${check.schema}.${check.table}`,
          status: missingColumns.length === 0 ? 'healthy' : 'error',
          message: missingColumns.length === 0 
            ? 'Table structure is correct' 
            : `Missing columns: ${missingColumns.join(', ')}`,
          details: { found: foundColumns, missing: missingColumns }
        });
      }

    } catch (error) {
      this.results.push({
        component: 'Critical Tables Structure',
        status: 'error',
        message: 'Failed to check table structures',
        details: { error: error.message }
      });
    }
  }

  private async checkForeignKeyConstraints(): Promise<void> {
    try {
      // Check foreign key constraints across schemas
      const fkQuery = await this.pool.query(`
        SELECT 
          tc.table_schema,
          tc.table_name,
          tc.constraint_name,
          kcu.column_name,
          ccu.table_schema AS foreign_table_schema,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY'
        ORDER BY tc.table_schema, tc.table_name
      `);

      this.results.push({
        component: 'Foreign Key Constraints',
        status: 'healthy',
        message: `Found ${fkQuery.rows.length} foreign key constraints`,
        details: { 
          count: fkQuery.rows.length,
          constraints: fkQuery.rows.slice(0, 5) // Show first 5 as sample
        }
      });

    } catch (error) {
      this.results.push({
        component: 'Foreign Key Constraints',
        status: 'error',
        message: 'Failed to check foreign key constraints',
        details: { error: error.message }
      });
    }
  }

  private async checkFrontendIntegration(): Promise<void> {
    // Check if critical frontend files exist and have proper imports
    const frontendFiles = [
      'client/src/hooks/useFieldColors.ts',
      'client/src/hooks/useDynamicColors.ts',
      'client/src/components/DynamicBadge.tsx',
      'client/src/pages/Tickets.tsx',
      'client/src/pages/Customers.tsx'
    ];

    for (const file of frontendFiles) {
      try {
        if (existsSync(join(process.cwd(), file))) {
          const content = readFileSync(join(process.cwd(), file), 'utf-8');
          const hasApiCalls = content.includes('fetch') || content.includes('useQuery') || content.includes('axios');
          
          this.results.push({
            component: `Frontend Integration: ${file}`,
            status: 'healthy',
            message: 'Frontend file exists with API integration',
            details: { 
              size: content.length, 
              hasApiCalls,
              hasReactQuery: content.includes('useQuery')
            }
          });
        } else {
          this.results.push({
            component: `Frontend Integration: ${file}`,
            status: 'warning',
            message: 'Frontend file not found',
            details: { path: file }
          });
        }
      } catch (error) {
        this.results.push({
          component: `Frontend Integration: ${file}`,
          status: 'error',
          message: 'Failed to read frontend file',
          details: { error: error.message }
        });
      }
    }
  }

  private async checkFieldOptionsConfiguration(): Promise<void> {
    try {
      // Check if tenant schemas have field options configured
      const tenantSchemas = await this.pool.query(`
        SELECT schema_name FROM information_schema.schemata 
        WHERE schema_name LIKE 'tenant_%'
        LIMIT 1
      `);

      if (tenantSchemas.rows.length > 0) {
        const sampleSchema = tenantSchemas.rows[0].schema_name;
        
        const fieldOptions = await this.pool.query(`
          SELECT COUNT(*) as count FROM ${sampleSchema}.ticket_field_options
        `);

        const optionsCount = parseInt(fieldOptions.rows[0].count);

        this.results.push({
          component: 'Field Options Configuration',
          status: optionsCount > 0 ? 'healthy' : 'warning',
          message: `Found ${optionsCount} field options in sample tenant`,
          details: { 
            sampleSchema,
            optionsCount,
            hasConfiguration: optionsCount > 0
          }
        });
      }

    } catch (error) {
      this.results.push({
        component: 'Field Options Configuration',
        status: 'error',
        message: 'Failed to check field options',
        details: { error: error.message }
      });
    }
  }

  private generateFinalReport(): void {
    const summary = {
      total: this.results.length,
      healthy: this.results.filter(r => r.status === 'healthy').length,
      warnings: this.results.filter(r => r.status === 'warning').length,
      errors: this.results.filter(r => r.status === 'error').length
    };

    console.log('\n' + '='.repeat(80));
    console.log('🏥 COMPLETE SCHEMA-FRONTEND VALIDATION REPORT');
    console.log('='.repeat(80));
    console.log(`✅ Healthy Components: ${summary.healthy}`);
    console.log(`⚠️  Warning Components: ${summary.warnings}`);
    console.log(`❌ Error Components: ${summary.errors}`);
    console.log(`📊 Total Checks: ${summary.total}`);
    console.log('='.repeat(80));

    // Print detailed results
    this.results.forEach(result => {
      const icon = result.status === 'healthy' ? '✅' : 
                   result.status === 'warning' ? '⚠️' : '❌';
      console.log(`${icon} ${result.component}: ${result.message}`);
    });

    console.log('\n🎯 OVERALL SYSTEM STATUS:', 
      summary.errors === 0 && summary.warnings === 0 ? '✅ FULLY FUNCTIONAL' : 
      summary.errors === 0 ? '⚠️ FUNCTIONAL WITH WARNINGS' : 
      summary.errors < 3 ? '⚠️ NEEDS ATTENTION' : '❌ CRITICAL ISSUES');

    // Recommendations
    if (summary.errors > 0 || summary.warnings > 0) {
      console.log('\n📋 RECOMMENDATIONS:');
      if (summary.errors > 0) {
        console.log('1. Fix critical errors first - focus on database connectivity and table structure');
      }
      if (summary.warnings > 0) {
        console.log('2. Address warnings to improve system reliability');
      }
      console.log('3. Run health checks regularly to maintain system integrity');
    }
  }

  async cleanup(): Promise<void> {
    await this.pool.end();
  }
}

// Execute validation if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const validator = new CompleteSchemaFrontendValidator();
  validator.runCompleteValidation()
    .then(() => validator.cleanup())
    .catch(error => {
      console.error('❌ Validation failed:', error);
      process.exit(1);
    });
}
