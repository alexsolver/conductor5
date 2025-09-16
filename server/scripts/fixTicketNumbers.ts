
import { poolManager } from '../database/ConnectionPoolManager';
import { sql } from 'drizzle-orm';
import { ticketNumberGenerator } from '../utils/ticketNumberGenerator';

export async function fixTicketNumbers(tenantId: string) {
  try {
    console.log(`🔧 [TICKET-NUMBER-FIX] Starting fix for tenant: ${tenantId}`);
    
    const tenantDb = await poolManager.getTenantConnection(tenantId);
    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;

    // Find tickets without numbers
    const ticketsWithoutNumbers = await tenantDb.execute(sql`
      SELECT id, company_id, created_at 
      FROM ${sql.identifier(schemaName)}.tickets 
      WHERE number IS NULL 
      ORDER BY created_at ASC
    `);

    console.log(`🎯 Found ${ticketsWithoutNumbers.rows.length} tickets without numbers`);

    for (const row of ticketsWithoutNumbers.rows) {
      const ticketId = row.id;
      const companyId = row.company_id || '00000000-0000-0000-0000-000000000001';
      
      // Generate new ticket number
      const ticketNumber = await ticketNumberGenerator.generateTicketNumber(tenantId, companyId);
      
      // Update the ticket
      await tenantDb.execute(sql`
        UPDATE ${sql.identifier(schemaName)}.tickets 
        SET number = ${ticketNumber}, updated_at = NOW()
        WHERE id = ${ticketId}
      `);
      
      console.log(`✅ Updated ticket ${ticketId} with number: ${ticketNumber}`);
    }

    console.log(`✅ [TICKET-NUMBER-FIX] Completed fix for tenant: ${tenantId}`);
    return ticketsWithoutNumbers.rows.length;
  } catch (error) {
    console.error('❌ [TICKET-NUMBER-FIX] Error:', error);
    throw error;
  }
}

// Run for specific tenant if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const tenantId = process.argv[2] || '3f99462f-3621-4b1b-bea8-782acc50d62e';
  fixTicketNumbers(tenantId)
    .then(count => console.log(`Fixed ${count} tickets`))
    .catch(console.error);
}
