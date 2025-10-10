/**
 * Initialize Ticket Sequences
 * 
 * This script initializes the ticket_sequences table with current values
 * from existing tickets to prevent number duplication
 */

import { db } from '../db';
import { sql } from 'drizzle-orm';

export async function initializeTicketSequences(): Promise<{
  success: boolean;
  totalTenants: number;
  initialized: number;
  errors: Array<{ tenant: string; error: string }>;
}> {
  const results = {
    success: true,
    totalTenants: 0,
    initialized: 0,
    errors: [] as Array<{ tenant: string; error: string }>
  };

  try {
    console.log('[INIT-SEQUENCES] 🔄 Starting ticket sequences initialization...');

    // Get all tenants
    const tenantsResult = await db.execute(sql`
      SELECT id, name FROM public.tenants 
      WHERE is_active = true
      ORDER BY name
    `);

    const tenants = tenantsResult.rows as Array<{ id: string; name: string }>;
    results.totalTenants = tenants.length;

    console.log(`[INIT-SEQUENCES] Found ${results.totalTenants} tenants`);

    for (const tenant of tenants) {
      try {
        const schemaName = `tenant_${tenant.id.replace(/-/g, '_')}`;
        
        // Get distinct prefixes and years from existing tickets
        const prefixesResult = await db.execute(sql`
          SELECT DISTINCT 
            LEFT(number, POSITION('-' IN number) - 1) as prefix,
            EXTRACT(YEAR FROM created_at) as year,
            MAX(number) as last_number
          FROM ${sql.identifier(schemaName)}.tickets
          WHERE number LIKE '%-%'
          GROUP BY LEFT(number, POSITION('-' IN number) - 1), EXTRACT(YEAR FROM created_at)
        `);

        for (const row of prefixesResult.rows) {
          const prefix = String(row.prefix);
          const year = Number(row.year);
          const lastNumber = String(row.last_number);

          // Extract sequential part
          const sequentialMatch = lastNumber.match(/(\d+)$/);
          if (!sequentialMatch) continue;

          const currentValue = parseInt(sequentialMatch[1]);
          const sequenceKey = `${prefix}-${year}`;

          // Get company_id from ticket_numbering_config
          const configResult = await db.execute(sql`
            SELECT company_id FROM ${sql.identifier(schemaName)}.ticket_numbering_config
            WHERE prefix = ${prefix}
            LIMIT 1
          `);

          const companyId = configResult.rows[0]?.company_id || '00000000-0000-0000-0000-000000000000';

          // Insert sequence
          await db.execute(sql`
            INSERT INTO ${sql.identifier(schemaName)}.ticket_sequences 
              (tenant_id, company_id, sequence_key, current_value, year)
            VALUES 
              (${tenant.id}, ${companyId}, ${sequenceKey}, ${currentValue}, ${year})
            ON CONFLICT (tenant_id, company_id, sequence_key, year) 
            DO UPDATE SET 
              current_value = GREATEST(${sql.identifier(schemaName)}.ticket_sequences.current_value, ${currentValue})
          `);

          console.log(`[INIT-SEQUENCES] ✅ ${schemaName}: ${sequenceKey} = ${currentValue}`);
        }

        results.initialized++;

      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`[INIT-SEQUENCES] ❌ Error for tenant ${tenant.name}:`, errorMsg);
        results.errors.push({ tenant: tenant.name, error: errorMsg });
      }
    }

    console.log(`[INIT-SEQUENCES] 🎉 Initialization completed!`);
    console.log(`[INIT-SEQUENCES] Total: ${results.totalTenants}, Initialized: ${results.initialized}, Errors: ${results.errors.length}`);

    return results;

  } catch (error) {
    console.error('[INIT-SEQUENCES] ❌ Fatal error:', error);
    results.success = false;
    throw error;
  }
}
