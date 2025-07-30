
import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool } from '@neondatabase/serverless';
import { sql } from 'drizzle-orm';
import ws from "ws";

console.log('🔧 INSERINDO DADOS CRÍTICOS: ticket_field_options');
console.log('📊 Tenant: 3f99462f-3621-4b1b-bea8-782acc50d62e');

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:password@aws-0-us-east-1.pooler.supabase.com:6543/postgres';

async function populateTicketFieldOptions() {
  // Configurar Neon WebSocket
  const { neonConfig } = await import('@neondatabase/serverless');
  neonConfig.webSocketConstructor = ws;
  
  const pool = new Pool({ connectionString: DATABASE_URL });
  const db = drizzle({ client: pool });
  
  try {
    console.log('📝 Verificando dados existentes...');
    
    const tenantId = '3f99462f-3621-4b1b-bea8-782acc50d62e';
    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
    
    // Verificar se dados já existem
    const existing = await db.execute(sql`
      SELECT COUNT(*) as count 
      FROM "${schemaName}".ticket_field_options 
      WHERE field_name = 'status'
    `);
    
    if (existing.rows[0].count > 0) {
      console.log('✅ Dados já existem, pulando inserção');
      await pool.end();
      return;
    }
    
    console.log('🔄 Inserindo opções de status...');
    
    const statusOptions = [
      { value: 'open', label: 'Aberto', color: '#3b82f6', is_default: true },
      { value: 'in_progress', label: 'Em Andamento', color: '#f59e0b', is_default: false },
      { value: 'pending', label: 'Pendente', color: '#8b5cf6', is_default: false },
      { value: 'resolved', label: 'Resolvido', color: '#10b981', is_default: false },
      { value: 'closed', label: 'Fechado', color: '#6b7280', is_default: false }
    ];
    
    for (const option of statusOptions) {
      await db.execute(sql`
        INSERT INTO "${schemaName}".ticket_field_options 
        (tenant_id, field_name, value, label, color, is_default, is_active, created_at, updated_at)
        VALUES (${tenantId}, 'status', ${option.value}, ${option.label}, ${option.color}, ${option.is_default}, true, NOW(), NOW())
        ON CONFLICT (tenant_id, field_name, value) DO NOTHING
      `);
    }
    
    console.log('🔄 Inserindo opções de prioridade...');
    
    const priorityOptions = [
      { value: 'low', label: 'Baixa', color: '#10b981', is_default: false },
      { value: 'medium', label: 'Média', color: '#f59e0b', is_default: true },
      { value: 'high', label: 'Alta', color: '#ef4444', is_default: false },
      { value: 'urgent', label: 'Urgente', color: '#dc2626', is_default: false }
    ];
    
    for (const option of priorityOptions) {
      await db.execute(sql`
        INSERT INTO "${schemaName}".ticket_field_options 
        (tenant_id, field_name, value, label, color, is_default, is_active, created_at, updated_at)
        VALUES (${tenantId}, 'priority', ${option.value}, ${option.label}, ${option.color}, ${option.is_default}, true, NOW(), NOW())
        ON CONFLICT (tenant_id, field_name, value) DO NOTHING
      `);
    }
    
    console.log('📊 Verificando dados inseridos...');
    
    const final = await db.execute(sql`
      SELECT field_name, value, label, color, is_default 
      FROM "${schemaName}".ticket_field_options 
      WHERE tenant_id = ${tenantId}
      ORDER BY field_name, value
    `);
    
    console.log('📊 DADOS INSERIDOS:');
    console.table(final.rows);
    
    await pool.end();
    console.log('🎉 CORREÇÃO CONCLUÍDA - DynamicSelect deve funcionar agora');
    
  } catch (error) {
    console.error('❌ ERRO:', error.message);
    await pool.end();
    process.exit(1);
  }
}

populateTicketFieldOptions().catch(console.error);
