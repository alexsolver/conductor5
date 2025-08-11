
import { sql } from 'drizzle-orm';

class SchemaValidator {

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
        'ticket_subcategories', 'ticket_actions', 'users'
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
            ORDER BY ordinal_position
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
      'last_name': ['surname', 'family_name'],
      'address': ['street_address', 'full_address', 'location_address'],
      'assigned_to_id': ['assignee_id', 'responsible_id', 'agent_id'],
      'tenant_id': ['tenant', 'organization_id', 'company_id']
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
    let tableCount = 0;
    let indexCount = 0; 
    let constraintCount = 0;
    let foreignKeyCount = 0;

    try {
      const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;

      // Validate table count
      const tableResult = await db.execute(sql`
        SELECT COUNT(*) as count 
        FROM information_schema.tables 
        WHERE table_schema = ${schemaName}
      `);
      tableCount = parseInt(tableResult.rows[0]?.count as string || "0");

      // Validate indexes
      const indexResult = await db.execute(sql`
        SELECT COUNT(*) as count 
        FROM pg_indexes 
        WHERE schemaname = ${schemaName}
      `);
      indexCount = parseInt(indexResult.rows[0]?.count as string || "0");

      // Validate constraints
      const constraintResult = await db.execute(sql`
        SELECT COUNT(*) as count 
        FROM information_schema.table_constraints 
        WHERE table_schema = ${schemaName}
      `);
      constraintCount = parseInt(constraintResult.rows[0]?.count as string || "0");

      // Validate foreign keys
      const fkResult = await db.execute(sql`
        SELECT COUNT(*) as count 
        FROM information_schema.table_constraints 
        WHERE table_schema = ${schemaName}
        AND constraint_type = 'FOREIGN KEY'
      `);
      foreignKeyCount = parseInt(fkResult.rows[0]?.count as string || "0");

      // Health criteria (enhanced with FK validation)
      const isHealthy = tableCount >= 15 && indexCount >= 10 && constraintCount >= 5 && foreignKeyCount >= 3;

      if (tableCount < 15) issues.push(`Low table count: ${tableCount}/15 minimum`);
      if (indexCount < 10) issues.push(`Low index count: ${indexCount}/10 minimum`);
      if (constraintCount < 5) issues.push(`Low constraint count: ${constraintCount}/5 minimum`);
      if (foreignKeyCount < 3) issues.push(`Low FK count: ${foreignKeyCount}/3 minimum`);

      return {
        isHealthy,
        tableCount,
        indexCount,
        constraintCount,
        foreignKeyCount,
        issues
      };
    } catch (error) {
      issues.push(`Validation error: ${(error as Error).message}`);
      return {
        isHealthy: false,
        tableCount,
        indexCount,
        constraintCount,
        foreignKeyCount,
        issues
      };
    }
  }

  // Add validation for field consistency
  static async validateFieldConsistency(db: any, tenantId: string): Promise<{
    isConsistent: boolean;
    fieldIssues: string[];
  }> {
    const fieldIssues: string[] = [];
    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;

    try {
      // Check critical field consistency
      const criticalFields = [
        { table: 'users', field: 'tenant_id' },
        { table: 'tickets', field: 'tenant_id' },
        { table: 'customers', field: 'tenant_id' },
        { table: 'users', field: 'is_active' },
        { table: 'tickets', field: 'assigned_to_id' }
      ];

      for (const { table, field } of criticalFields) {
        const fieldExists = await db.execute(sql`
          SELECT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = ${schemaName} 
            AND table_name = ${table}
            AND column_name = ${field}
          ) as exists
        `);

        if (!fieldExists.rows?.[0]?.exists) {
          fieldIssues.push(`Missing critical field: ${table}.${field}`);
        }
      }

      return {
        isConsistent: fieldIssues.length === 0,
        fieldIssues
      };
    } catch (error) {
      fieldIssues.push(`Field validation error: ${(error as Error).message}`);
      return {
        isConsistent: false,
        fieldIssues
      };
    }
  }
}

export { SchemaValidator };
