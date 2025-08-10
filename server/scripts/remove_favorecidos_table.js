
// Script para remover completamente a tabela favorecidos do banco de dados
// Execute este script para limpar vestígios da migração favorecidos -> beneficiaries

import { db } from '../db.js';
import { sql } from 'drizzle-orm';

async function removeFavorecidosTable() {
  console.log('🗑️ Iniciando remoção da tabela favorecidos...');
  
  try {
    const { schemaManager } = await import('../db.js');
    const pool = schemaManager.getPool();
    
    // Buscar todos os schemas tenant
    const schemasResult = await pool.query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name LIKE 'tenant_%'
    `);
    
    console.log(`📋 Encontrados ${schemasResult.rows.length} schemas tenant para verificar`);
    
    for (const row of schemasResult.rows) {
      const schemaName = row.schema_name;
      
      // Verificar se a tabela favorecidos existe neste schema
      const tableExists = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = $1 AND table_name = 'favorecidos'
        )
      `, [schemaName]);
      
      if (tableExists.rows[0].exists) {
        console.log(`🔍 Tabela favorecidos encontrada em ${schemaName}`);
        
        // Contar registros antes da remoção
        const countResult = await pool.query(`
          SELECT COUNT(*) as total FROM "${schemaName}".favorecidos
        `);
        const recordCount = countResult.rows[0].total;
        
        console.log(`📊 Tabela ${schemaName}.favorecidos contém ${recordCount} registros`);
        
        if (recordCount > 0) {
          console.log(`⚠️ AVISO: ${recordCount} registros serão perdidos em ${schemaName}.favorecidos`);
          console.log(`💡 Verifique se os dados foram migrados para ${schemaName}.beneficiaries`);
        }
        
        // Remover a tabela favorecidos (CASCADE para remover dependências)
        await pool.query(`DROP TABLE IF EXISTS "${schemaName}".favorecidos CASCADE`);
        console.log(`✅ Tabela favorecidos removida de ${schemaName}`);
        
      } else {
        console.log(`✓ Schema ${schemaName} não contém tabela favorecidos`);
      }
    }
    
    // Verificar schema público também
    const publicTableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'favorecidos'
      )
    `);
    
    if (publicTableExists.rows[0].exists) {
      console.log(`🔍 Tabela favorecidos encontrada no schema público`);
      await pool.query(`DROP TABLE IF EXISTS public.favorecidos CASCADE`);
      console.log(`✅ Tabela favorecidos removida do schema público`);
    }
    
    console.log('🎉 Remoção da tabela favorecidos concluída com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro ao remover tabela favorecidos:', error);
    throw error;
  }
}

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  removeFavorecidosTable()
    .then(() => {
      console.log('✅ Script executado com sucesso');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erro na execução:', error);
      process.exit(1);
    });
}

export { removeFavorecidosTable };
