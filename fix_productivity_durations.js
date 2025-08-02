// Script para corrigir durações das atividades de produtividade
import { db } from './server/db/index.js';
import { sql } from 'drizzle-orm';

async function fixProductivityDurations() {
  const tenantId = '3f99462f-3621-4b1b-bea8-782acc50d62e';
  const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
  
  console.log('🔧 Iniciando correção de durações de produtividade...');
  
  try {
    // 1. Corrigir atividades que têm start_time e end_time mas duration_seconds = 0
    const result1 = await db.execute(sql`
      UPDATE ${sql.identifier(schemaName)}.user_activity_tracking 
      SET duration_seconds = EXTRACT(EPOCH FROM (end_time - start_time))::integer
      WHERE duration_seconds = 0 
        AND start_time IS NOT NULL 
        AND end_time IS NOT NULL
        AND end_time > start_time
    `);
    
    console.log(`✅ Corrigidas ${result1.rowCount || 0} atividades com start/end time válidos`);
    
    // 2. Para atividades sem end_time, definir uma duração padrão baseada no tipo
    const defaultDurations = {
      'view_ticket': 30,      // 30 segundos
      'view_actions': 15,     // 15 segundos  
      'view_notes': 20,       // 20 segundos
      'edit_ticket': 120,     // 2 minutos
      'create_ticket': 180,   // 3 minutos
      'create_note': 60       // 1 minuto
    };
    
    let totalFixed = 0;
    
    for (const [activityType, defaultSeconds] of Object.entries(defaultDurations)) {
      const result = await db.execute(sql`
        UPDATE ${sql.identifier(schemaName)}.user_activity_tracking 
        SET duration_seconds = ${defaultSeconds},
            end_time = start_time + INTERVAL '${defaultSeconds} seconds'
        WHERE (duration_seconds = 0 OR duration_seconds IS NULL)
          AND activity_type = ${activityType}
          AND start_time IS NOT NULL
      `);
      
      const fixed = result.rowCount || 0;
      totalFixed += fixed;
      
      if (fixed > 0) {
        console.log(`✅ ${activityType}: ${fixed} atividades corrigidas com ${defaultSeconds}s`);
      }
    }
    
    console.log(`✅ Total de atividades corrigidas: ${totalFixed}`);
    
    // 3. Verificar resultados
    const verification = await db.execute(sql`
      SELECT 
        activity_type,
        COUNT(*) as total,
        SUM(duration_seconds) as total_duration,
        AVG(duration_seconds) as avg_duration
      FROM ${sql.identifier(schemaName)}.user_activity_tracking 
      WHERE user_id = '550e8400-e29b-41d4-a716-446655440001'
        AND created_at >= '2025-08-01'
      GROUP BY activity_type
      ORDER BY total DESC
    `);
    
    console.log('\n📊 Verificação dos resultados:');
    for (const row of verification.rows) {
      console.log(`${row.activity_type}: ${row.total} atividades, ${row.total_duration}s total, ${Math.round(row.avg_duration)}s média`);
    }
    
  } catch (error) {
    console.error('❌ Erro na correção:', error);
  }
}

// Executar a correção
fixProductivityDurations();