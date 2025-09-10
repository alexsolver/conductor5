
import { db } from '../db';
import { sql } from 'drizzle-orm';

async function checkLanSolverMembers() {
  try {
    console.log('🔍 Checking members of "lan solver" group...');

    // Get all tenants first
    const tenantsQuery = `SELECT id, name FROM public.tenants WHERE is_active = true`;
    const tenantsResult = await db.execute(sql.raw(tenantsQuery));

    for (const tenant of tenantsResult.rows) {
      const tenantId = tenant.id;
      const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;

      console.log(`\n📋 Checking tenant: ${tenant.name} (${tenantId})`);

      try {
        // Find the "lan solver" group
        const groupQuery = `
          SELECT id, name FROM "${schemaName}".user_groups 
          WHERE tenant_id = $1 AND name ILIKE '%lan solver%' AND is_active = true
        `;
        const groupResult = await db.execute(sql.raw(groupQuery, [tenantId]));

        if (!groupResult.rows.length) {
          console.log(`   ℹ️ No "lan solver" group found in this tenant`);
          continue;
        }

        for (const group of groupResult.rows) {
          console.log(`   📂 Found group: "${group.name}" (ID: ${group.id})`);

          // Get group members
          const membersQuery = `
            SELECT 
              u.id,
              u.first_name,
              u.last_name,
              u.email,
              u.role,
              u.is_active,
              ugm.role as group_role,
              ugm.added_at
            FROM public.users u
            INNER JOIN "${schemaName}".user_group_memberships ugm 
              ON u.id = ugm.user_id
            WHERE ugm.group_id = $1 
              AND ugm.is_active = true 
              AND u.is_active = true
              AND u.tenant_id = $2
            ORDER BY u.first_name, u.last_name
          `;

          const membersResult = await db.execute(sql.raw(membersQuery, [group.id, tenantId]));

          if (membersResult.rows.length === 0) {
            console.log(`   👤 No active members found in group "${group.name}"`);
          } else {
            console.log(`   👥 Members in group "${group.name}" (${membersResult.rows.length} total):`);
            membersResult.rows.forEach((member: any) => {
              console.log(`      • ${member.first_name} ${member.last_name} (${member.email})`);
              console.log(`        Role: ${member.role} | Group Role: ${member.group_role}`);
              console.log(`        Added: ${new Date(member.added_at).toLocaleString()}`);
              console.log(`        User ID: ${member.id}`);
              console.log('');
            });
          }
        }
      } catch (schemaError) {
        console.log(`   ⚠️ Schema "${schemaName}" not accessible or doesn't exist`);
      }
    }

    console.log('\n✅ Finished checking all tenants');
  } catch (error) {
    console.error('❌ Error checking lan solver members:', error);
  } finally {
    process.exit(0);
  }
}

checkLanSolverMembers();
