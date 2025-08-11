
import { db } from '../db';
import { sql } from 'drizzle-orm';

export async function createTicketInfrastructureTables(tenantId: string) {
  const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
  
  console.log(`🏗️ Creating ticket infrastructure tables for tenant: ${tenantId}`);
  
  try {
    // Create ticket_field_options table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "${sql.raw(schemaName)}"."ticket_field_options" (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id uuid NOT NULL,
        customer_id uuid NOT NULL,
        field_name varchar(100) NOT NULL,
        value varchar(255) NOT NULL,
        label varchar(255) NOT NULL,
        color varchar(7) DEFAULT '#3b82f6',
        sort_order integer DEFAULT 0,
        is_active boolean DEFAULT true,
        is_default boolean DEFAULT false,
        status_type varchar(50),
        created_at timestamp DEFAULT NOW(),
        updated_at timestamp DEFAULT NOW(),
        UNIQUE(tenant_id, customer_id, field_name, value)
      )
    `);

    // Create ticket_list_views table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "${sql.raw(schemaName)}"."ticket_list_views" (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id uuid NOT NULL,
        name varchar(255) NOT NULL,
        description text,
        created_by_id uuid NOT NULL,
        is_public boolean DEFAULT false,
        is_default boolean DEFAULT false,
        is_active boolean DEFAULT true,
        columns jsonb NOT NULL DEFAULT '[]',
        filters jsonb DEFAULT '[]',
        sorting jsonb DEFAULT '[]',
        page_size integer DEFAULT 25,
        created_at timestamp DEFAULT NOW(),
        updated_at timestamp DEFAULT NOW()
      )
    `);

    // Create user_view_preferences table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "${sql.raw(schemaName)}"."user_view_preferences" (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id uuid NOT NULL,
        user_id uuid NOT NULL,
        active_view_id uuid,
        personal_settings jsonb DEFAULT '{}',
        last_used_at timestamp DEFAULT NOW(),
        created_at timestamp DEFAULT NOW(),
        updated_at timestamp DEFAULT NOW(),
        UNIQUE(tenant_id, user_id)
      )
    `);

    // Insert default field options for status
    await db.execute(sql`
      INSERT INTO "${sql.raw(schemaName)}"."ticket_field_options" 
      (tenant_id, customer_id, field_name, value, label, color, sort_order, is_active, is_default, status_type)
      VALUES 
      (${tenantId}, '00000000-0000-0000-0000-000000000001', 'status', 'new', 'Novo', '#22c55e', 1, true, true, 'open'),
      (${tenantId}, '00000000-0000-0000-0000-000000000001', 'status', 'open', 'Aberto', '#3b82f6', 2, true, false, 'open'),
      (${tenantId}, '00000000-0000-0000-0000-000000000001', 'status', 'in_progress', 'Em Progresso', '#f59e0b', 3, true, false, 'open'),
      (${tenantId}, '00000000-0000-0000-0000-000000000001', 'status', 'resolved', 'Resolvido', '#8b5cf6', 4, true, false, 'closed'),
      (${tenantId}, '00000000-0000-0000-0000-000000000001', 'status', 'closed', 'Fechado', '#6b7280', 5, true, false, 'closed')
      ON CONFLICT (tenant_id, customer_id, field_name, value) DO NOTHING
    `);

    // Insert default field options for priority
    await db.execute(sql`
      INSERT INTO "${sql.raw(schemaName)}"."ticket_field_options" 
      (tenant_id, customer_id, field_name, value, label, color, sort_order, is_active, is_default)
      VALUES 
      (${tenantId}, '00000000-0000-0000-0000-000000000001', 'priority', 'low', 'Baixa', '#10b981', 1, true, false),
      (${tenantId}, '00000000-0000-0000-0000-000000000001', 'priority', 'medium', 'Média', '#f59e0b', 2, true, true),
      (${tenantId}, '00000000-0000-0000-0000-000000000001', 'priority', 'high', 'Alta', '#f97316', 3, true, false),
      (${tenantId}, '00000000-0000-0000-0000-000000000001', 'priority', 'critical', 'Crítica', '#ef4444', 4, true, false)
      ON CONFLICT (tenant_id, customer_id, field_name, value) DO NOTHING
    `);

    // Insert default field options for categories
    await db.execute(sql`
      INSERT INTO "${sql.raw(schemaName)}"."ticket_field_options" 
      (tenant_id, customer_id, field_name, value, label, color, sort_order, is_active, is_default)
      VALUES 
      (${tenantId}, '00000000-0000-0000-0000-000000000001', 'category', 'support', 'Suporte', '#3b82f6', 1, true, true),
      (${tenantId}, '00000000-0000-0000-0000-000000000001', 'category', 'hardware', 'Hardware', '#8b5cf6', 2, true, false),
      (${tenantId}, '00000000-0000-0000-0000-000000000001', 'category', 'software', 'Software', '#06b6d4', 3, true, false),
      (${tenantId}, '00000000-0000-0000-0000-000000000001', 'category', 'network', 'Rede', '#10b981', 4, true, false),
      (${tenantId}, '00000000-0000-0000-0000-000000000001', 'category', 'access', 'Acesso', '#f59e0b', 5, true, false),
      (${tenantId}, '00000000-0000-0000-0000-000000000001', 'category', 'other', 'Outros', '#6b7280', 6, true, false)
      ON CONFLICT (tenant_id, customer_id, field_name, value) DO NOTHING
    `);

    console.log(`✅ Ticket infrastructure tables created successfully for tenant: ${tenantId}`);
    
  } catch (error) {
    console.error(`❌ Error creating ticket infrastructure tables:`, error);
    throw error;
  }
}

// Execute for mock tenant if called directly
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Check if this is the main module being executed
if (import.meta.url === `file://${process.argv[1]}`) {
  createTicketInfrastructureTables('mock-tenant-id')
    .then(() => {
      console.log('✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}
