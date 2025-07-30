
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
    
    // Verificar se a tabela existe e tem dados
    const existing = await db.execute(sql`
      SELECT COUNT(*) as count 
      FROM tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.ticket_field_options 
      WHERE field_name = 'status'
    `);
    
    console.log('📈 Registros status existentes:', existing.rows[0]?.count || 0);
    
    if ((existing.rows[0]?.count || 0) === 0) {
      console.log('📝 Inserindo dados básicos de configuração...');
      
      await db.execute(sql`
        INSERT INTO tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.ticket_field_options 
        (id, tenant_id, customer_id, field_name, value, label, is_active, display_order, created_at, updated_at)
        VALUES 
        (gen_random_uuid(), '3f99462f-3621-4b1b-bea8-782acc50d62e', '3f99462f-3621-4b1b-bea8-782acc50d62e', 'status', 'new', 'Novo', true, 1, NOW(), NOW()),
        (gen_random_uuid(), '3f99462f-3621-4b1b-bea8-782acc50d62e', '3f99462f-3621-4b1b-bea8-782acc50d62e', 'status', 'in_progress', 'Em Progresso', true, 2, NOW(), NOW()),
        (gen_random_uuid(), '3f99462f-3621-4b1b-bea8-782acc50d62e', '3f99462f-3621-4b1b-bea8-782acc50d62e', 'status', 'resolved', 'Resolvido', true, 3, NOW(), NOW()),
        (gen_random_uuid(), '3f99462f-3621-4b1b-bea8-782acc50d62e', '3f99462f-3621-4b1b-bea8-782acc50d62e', 'priority', 'low', 'Baixa', true, 1, NOW(), NOW()),
        (gen_random_uuid(), '3f99462f-3621-4b1b-bea8-782acc50d62e', '3f99462f-3621-4b1b-bea8-782acc50d62e', 'priority', 'medium', 'Média', true, 2, NOW(), NOW()),
        (gen_random_uuid(), '3f99462f-3621-4b1b-bea8-782acc50d62e', '3f99462f-3621-4b1b-bea8-782acc50d62e', 'priority', 'high', 'Alta', true, 3, NOW(), NOW()),
        (gen_random_uuid(), '3f99462f-3621-4b1b-bea8-782acc50d62e', '3f99462f-3621-4b1b-bea8-782acc50d62e', 'category', 'hardware', 'Hardware', true, 1, NOW(), NOW()),
        (gen_random_uuid(), '3f99462f-3621-4b1b-bea8-782acc50d62e', '3f99462f-3621-4b1b-bea8-782acc50d62e', 'category', 'software', 'Software', true, 2, NOW(), NOW()),
        (gen_random_uuid(), '3f99462f-3621-4b1b-bea8-782acc50d62e', '3f99462f-3621-4b1b-bea8-782acc50d62e', 'category', 'network', 'Rede', true, 3, NOW(), NOW())
        ON CONFLICT (tenant_id, customer_id, field_name, value) DO NOTHING
      `);
      
      console.log('✅ Dados básicos inseridos com sucesso!');
    } else {
      console.log('✅ Dados já existem na tabela');
    }
    
    // Verificar resultado final
    const final = await db.execute(sql`
      SELECT field_name, value, label, display_order 
      FROM tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.ticket_field_options 
      WHERE field_name IN ('status', 'priority', 'category')
      ORDER BY field_name, display_order
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

populateTicketFieldOptions();
