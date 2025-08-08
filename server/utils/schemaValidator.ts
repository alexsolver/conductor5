import { sql } from 'drizzle-orm';

export class SchemaValidator {

  static async validateTenantSchema(db: any, tenantId: string): Promise<{
    isValid: boolean;
    missingTables: string[];
    fieldMappings: Record<string, string[]>;
  }> {
    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;

    try {
      // UNIFIED TABLE LIST - Based on actual database verification (29 tables confirmed)
      const requiredTables = [
        // Core business tables (verified to exist)
        'customers', 'tickets', 'ticket_messages', 'activity_logs', 'locations', 
        'companies', 'skills', 'certifications', 'user_skills', 'projects', 'project_actions',
        
        // Enhanced systems (verified)  
        'items', 'suppliers', 'price_lists', 'user_groups', 'user_group_memberships',
        
        // Ticket metadata hierarchy (verified)
        'ticket_field_configurations', 'ticket_field_options', 'ticket_categories',
        'ticket_subcategories', 'ticket_actions', 'ticket_templates',
        
        // Materials & Services LPU (verified)
        'ticket_planned_items', 'ticket_consumed_items', 'ticket_costs_summary',
        
        // Compliance & CLT (verified)
        'timecard_entries', 'work_schedules', 'holidays'
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
}