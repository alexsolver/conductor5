/**
 * MIGRATION SCRIPT: Sync Existing Users to Tenant Schemas
 * 
 * This script synchronizes all existing users from public.users to their respective tenant_XXX.users schemas
 * 
 * Usage: Can be triggered via admin API endpoint or run directly
 */

import { db } from '../db';
import { sql } from 'drizzle-orm';

interface UserToSync {
  id: string;
  tenant_id: string;
  email: string;
  password_hash: string;
  role: string;
  first_name: string | null;
  last_name: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export async function syncExistingUsersToTenants(): Promise<{
  success: boolean;
  totalUsers: number;
  syncedUsers: number;
  skippedUsers: number;
  errors: Array<{ userId: string; error: string }>;
}> {
  const results = {
    success: true,
    totalUsers: 0,
    syncedUsers: 0,
    skippedUsers: 0,
    errors: [] as Array<{ userId: string; error: string }>
  };

  try {
    console.log('[SYNC-USERS] 🔄 Starting user synchronization to tenant schemas...');

    // Get all active users with tenant_id
    const usersResult = await db.execute(sql`
      SELECT 
        id, tenant_id, email, password_hash, role,
        first_name, last_name, is_active, created_at, updated_at
      FROM public.users
      WHERE tenant_id IS NOT NULL
        AND is_active = true
      ORDER BY created_at ASC
    `);

    const users = usersResult.rows as unknown as UserToSync[];
    results.totalUsers = users.length;

    console.log(`[SYNC-USERS] Found ${results.totalUsers} users to sync`);

    for (const user of users) {
      try {
        const tenantSchema = `tenant_${user.tenant_id.replace(/-/g, '_')}`;

        // Check if user already exists in tenant schema
        const existingCheck = await db.execute(sql`
          SELECT id FROM ${sql.identifier(tenantSchema)}.users 
          WHERE id = ${user.id}
          LIMIT 1
        `);

        if (existingCheck.rows.length > 0) {
          console.log(`[SYNC-USERS] ⏭️  User ${user.id} already exists in ${tenantSchema}, skipping`);
          results.skippedUsers++;
          continue;
        }

        // Insert user into tenant schema
        await db.execute(sql`
          INSERT INTO ${sql.identifier(tenantSchema)}.users (
            id, tenant_id, email, password_hash, role, 
            first_name, last_name, is_active, created_at, updated_at
          )
          VALUES (
            ${user.id}, ${user.tenant_id}, ${user.email.toLowerCase()}, ${user.password_hash}, ${user.role},
            ${user.first_name || ''}, ${user.last_name || ''}, ${user.is_active}, ${user.created_at}, ${user.updated_at}
          )
        `);

        console.log(`[SYNC-USERS] ✅ Synced user ${user.id} (${user.email}) to ${tenantSchema}`);
        results.syncedUsers++;

      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`[SYNC-USERS] ❌ Error syncing user ${user.id}:`, errorMsg);
        results.errors.push({ userId: user.id, error: errorMsg });
      }
    }

    console.log(`[SYNC-USERS] 🎉 Synchronization completed!`);
    console.log(`[SYNC-USERS] Total: ${results.totalUsers}, Synced: ${results.syncedUsers}, Skipped: ${results.skippedUsers}, Errors: ${results.errors.length}`);

    return results;

  } catch (error) {
    console.error('[SYNC-USERS] ❌ Fatal error during synchronization:', error);
    results.success = false;
    throw error;
  }
}
