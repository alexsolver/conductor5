/**
 * SYNC USER TO TENANT HANDLER
 * Clean Architecture - Application Layer
 * 
 * Automatically synchronizes newly created users from public.users to tenant_XXX.users
 * Ensures users exist in both schemas for proper authentication flow
 */

import { db } from '../../../../db';
import { sql } from 'drizzle-orm';
import { UserCreatedEvent } from '../../domain/events/UserCreatedEvent';

export class SyncUserToTenantHandler {
  
  async handle(event: UserCreatedEvent): Promise<void> {
    const { userId, email, role, tenantId, passwordHash, firstName, lastName } = event;

    // Skip if no tenantId (shouldn't happen, but safety check)
    if (!tenantId) {
      console.warn('[SYNC-USER-HANDLER] No tenantId provided, skipping sync');
      return;
    }

    try {
      const tenantSchema = `tenant_${tenantId.replace(/-/g, '_')}`;
      const now = new Date();

      console.log(`[SYNC-USER-HANDLER] Syncing user ${userId} to schema ${tenantSchema}`);

      // Check if user already exists in tenant schema
      const existingCheck = await db.execute(sql`
        SELECT id FROM ${sql.identifier(tenantSchema)}.users 
        WHERE id = ${userId}
        LIMIT 1
      `);

      if (existingCheck.rows.length > 0) {
        console.log(`[SYNC-USER-HANDLER] User ${userId} already exists in ${tenantSchema}, skipping`);
        return;
      }

      // Insert user into tenant schema
      await db.execute(sql`
        INSERT INTO ${sql.identifier(tenantSchema)}.users (
          id, tenant_id, email, password_hash, role, 
          first_name, last_name, is_active, created_at, updated_at
        )
        VALUES (
          ${userId}, ${tenantId}, ${email.toLowerCase()}, ${passwordHash}, ${role},
          ${firstName || ''}, ${lastName || ''}, true, ${now}, ${now}
        )
      `);

      console.log(`[SYNC-USER-HANDLER] ✅ Successfully synced user ${userId} to ${tenantSchema}`);
      
    } catch (error) {
      console.error(`[SYNC-USER-HANDLER] ❌ Error syncing user ${userId} to tenant schema:`, error);
      throw error;
    }
  }
}
