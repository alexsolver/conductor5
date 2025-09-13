
import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';

// Configuração do banco de dados
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/conductor'
});

async function createExampleTickets() {
  const client = await pool.connect();
  
  try {
    // Buscar tenant_id e user_id existentes
    const tenantResult = await client.query('SELECT id FROM public.tenants LIMIT 1');
    const userResult = await client.query('SELECT id FROM public.users LIMIT 1');
    const customerResult = await client.query('SELECT id FROM public.customers LIMIT 1');
    
    if (tenantResult.rows.length === 0 || userResult.rows.length === 0 || customerResult.rows.length === 0) {
      console.log('❌ Necessário ter pelo menos 1 tenant, 1 usuário e 1 cliente no sistema');
      return;
    }
    
    const tenantId = tenantResult.rows[0].id;
    const userId = userResult.rows[0].id;
    const customerId = customerResult.rows[0].id;
    
    // Schema do tenant
    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
    
    console.log(`🎯 Criando tickets no schema: ${schemaName}`);
    
    // Ticket 1: Problema Crítico de Sistema
    const ticket1Id = uuidv4();
    const ticket1Number = `T${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    
    await client.query(`
      INSERT INTO ${schemaName}.tickets (
        id, tenant_id, number, subject, description, status, priority, urgency, impact,
        customer_id, assigned_to_id, category, subcategory, action, tags, custom_fields,
        created_at, updated_at, created_by_id, updated_by_id, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
    `, [
      ticket1Id, tenantId, ticket1Number,
      'Sistema de autenticação fora do ar',
      'Usuários não conseguem fazer login no sistema desde às 14:30h. Erro 500 sendo retornado pela API de autenticação. Impacto crítico nos processos operacionais.',
      'open', 'critical', 'critical', 'critical',
      customerId, userId, 'technical', 'authentication', 'investigation',
      ['critical', 'authentication', 'system-down'],
      JSON.stringify({ 
        error_code: 'AUTH_500',
        affected_users: 'all',
        start_time: '14:30',
        systems_affected: ['web', 'mobile', 'api']
      }),
      new Date(), new Date(), userId, userId, true
    ]);
    
    // Ticket 2: Solicitação de Nova Funcionalidade
    const ticket2Id = uuidv4();
    const ticket2Number = `T${Date.now() + 1}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    
    await client.query(`
      INSERT INTO ${schemaName}.tickets (
        id, tenant_id, number, subject, description, status, priority, urgency, impact,
        customer_id, category, subcategory, action, tags, custom_fields,
        created_at, updated_at, created_by_id, updated_by_id, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
    `, [
      ticket2Id, tenantId, ticket2Number,
      'Implementar relatório de produtividade por equipe',
      'Solicitação para criação de um novo relatório que mostre métricas de produtividade por equipe, incluindo tickets resolvidos, tempo médio de resolução e satisfação do cliente.',
      'new', 'medium', 'low', 'medium',
      customerId, 'enhancement', 'reporting', 'development',
      ['enhancement', 'reporting', 'analytics'],
      JSON.stringify({
        requested_by: 'Gerência',
        business_justification: 'Melhorar acompanhamento de performance',
        expected_completion: '30 dias',
        approval_required: true
      }),
      new Date(), new Date(), userId, userId, true
    ]);
    
    // Ticket 3: Problema de Hardware
    const ticket3Id = uuidv4();
    const ticket3Number = `T${Date.now() + 2}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    
    await client.query(`
      INSERT INTO ${schemaName}.tickets (
        id, tenant_id, number, subject, description, status, priority, urgency, impact,
        customer_id, assigned_to_id, category, subcategory, action, tags, custom_fields,
        created_at, updated_at, created_by_id, updated_by_id, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
    `, [
      ticket3Id, tenantId, ticket3Number,
      'Impressora da sala 201 não está funcionando',
      'A impressora multifuncional da sala 201 apresenta erro de papel atolado, mas não há papel atolado visível. Já foi feita limpeza básica sem sucesso.',
      'in_progress', 'low', 'medium', 'low',
      customerId, userId, 'hardware', 'printer', 'repair',
      ['hardware', 'printer', 'maintenance'],
      JSON.stringify({
        location: 'Sala 201',
        equipment_model: 'HP LaserJet Pro MFP M428',
        error_code: 'PAPER_JAM_PHANTOM',
        previous_actions: ['Limpeza básica', 'Verificação de papel'],
        estimated_cost: 150.00
      }),
      new Date(), new Date(), userId, userId, true
    ]);
    
    console.log('✅ 3 tickets de exemplo criados com sucesso!');
    console.log(`📋 Tickets criados:`);
    console.log(`   1. ${ticket1Number} - Sistema de autenticação fora do ar (CRÍTICO)`);
    console.log(`   2. ${ticket2Number} - Implementar relatório de produtividade (ENHANCEMENT)`);
    console.log(`   3. ${ticket3Number} - Impressora da sala 201 não funcionando (HARDWARE)`);
    
  } catch (error) {
    console.error('❌ Erro ao criar tickets:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

// Executar o script
createExampleTickets();
