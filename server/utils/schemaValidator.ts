import { sql } from 'drizzle-orm';
import * as schema from '@shared/schema';

export class SchemaValidator {

  static async validateTenantSchema(db: any, tenantId: string): Promise<{
    isValid: boolean;
    missingTables: string[];
    fieldMappings: Record<string, string[]>;
  }> {
    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;

    try {
      // ENTERPRISE VALIDATION STANDARD - Essential core tables only
      const requiredTables = [
        // Essential business tables (minimum for operation)
        'customers', 'tickets', 'ticket_messages', 'activity_logs', 'locations', 
        'companies', 'skills', 'items', 'suppliers', 'price_lists',

        // Core ticket system (essential)
        'ticket_field_configurations', 'ticket_field_options', 'ticket_categories',
        'ticket_subcategories', 'ticket_actions'
      ];
      const missingTables: string[] = [];
      const fieldMappings: Record<string, string[]> = {};

      for (const table of requiredTables) {
        const tableExists = await db.execute(sql`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = ${schemaName} AND table_name = ${table}
          ) as exists
        `);

        if (!tableExists.rows?.[0]?.exists) {
          missingTables.push(table);
        } else {
          // Get column mappings for existing tables
          const columns = await db.execute(sql`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_schema = ${schemaName} AND table_name = ${table}
          `);

          fieldMappings[table] = columns.rows.map((row: any) => row.column_name);
        }
      }

      return {
        isValid: missingTables.length === 0,
        missingTables,
        fieldMappings
      };
    } catch (error) {
      console.error('Schema validation failed:', error);
      return {
        isValid: false,
        missingTables: [],
        fieldMappings: {}
      };
    }
  }

  static mapFieldName(originalField: string, availableFields: string[]): string {
    // Common field name mappings
    const mappings: Record<string, string[]> = {
      'is_active': ['active', 'is_enabled', 'enabled'],
      'first_name': ['name', 'full_name', 'display_name'],
      'address': ['street_address', 'full_address', 'location_address']
    };

    if (availableFields.includes(originalField)) {
      return originalField;
    }

    const alternatives = mappings[originalField] || [];
    for (const alt of alternatives) {
      if (availableFields.includes(alt)) {
        return alt;
      }
    }

    return originalField; // Fallback to original
  }

  static async validateSchemaHealth(db: any, tenantId: string): Promise<{
    isHealthy: boolean;
    tableCount: number;
    indexCount: number;
    constraintCount: number;
    foreignKeyCount: number;
    issues: string[];
  }> {
    const issues: string[] = [];

    try {
      // Validate table count
      const tableResult = await db.execute(sql`
        SELECT COUNT(*) as count 
        FROM information_schema.tables 
        WHERE table_schema = ${`tenant_${tenantId.replace(/-/g, '_')}`}
      `);
      const tableCount = parseInt(tableResult.rows[0]?.count as string || "0");

      // Validate indexes
      const indexResult = await db.execute(sql`
        SELECT COUNT(*) as count 
        FROM pg_indexes 
        WHERE schemaname = ${`tenant_${tenantId.replace(/-/g, '_')}`}
      `);
      const indexCount = parseInt(indexResult.rows[0]?.count as string || "0");

      // Validate constraints
      const constraintResult = await db.execute(sql`
        SELECT COUNT(*) as count 
        FROM information_schema.table_constraints 
        WHERE table_schema = ${`tenant_${tenantId.replace(/-/g, '_')}`}
      `);
      const constraintCount = parseInt(constraintResult.rows[0]?.count as string || "0");

      // Validate foreign keys
      const fkResult = await db.execute(sql`
        SELECT COUNT(*) as count 
        FROM information_schema.table_constraints 
        WHERE table_schema = ${`tenant_${tenantId.replace(/-/g, '_')}`}
        AND constraint_type = 'FOREIGN KEY'
      `);
      const foreignKeyCount = parseInt(fkResult.rows[0]?.count as string || "0");

      // Health criteria (enhanced with FK validation)
      const isHealthy = tableCount >= 60 && indexCount >= 50 && constraintCount >= 30 && foreignKeyCount >= 15;

      if (tableCount < 60) issues.push(`Low table count: ${tableCount}/60`);
      if (indexCount < 50) issues.push(`Low index count: ${indexCount}/50`);
      if (constraintCount < 30) issues.push(`Low constraint count: ${constraintCount}/30`);

      return {
        isHealthy,
        tableCount,
        indexCount,
        constraintCount,
        issues
      };
    } catch (error) {
      issues.push(`Validation error: ${error.message}`);
      return {
        isHealthy: false,
        tableCount: 0,
        indexCount: 0,
        constraintCount: 0,
        issues
      };
    }
  }
}