
// Script de validação para confirmar que a tabela favorecidos foi completamente removida

import { db } from '../db.js';

async function validateFavorecidosRemoval() {
  console.log('🔍 Validando remoção completa da tabela favorecidos...');
  
  try {
    const { schemaManager } = await import('../db.js');
    const pool = schemaManager.getPool();
    
    // Buscar qualquer vestígio da tabela favorecidos em todos os schemas
    const searchResult = await pool.query(`
      SELECT table_schema, table_name 
      FROM information_schema.tables 
      WHERE table_name = 'favorecidos'
    `);
    
    if (searchResult.rows.length === 0) {
      console.log('✅ Confirmado: Nenhuma tabela favorecidos encontrada no banco');
      
      // Verificar se existem referências em constraints
      const constraintCheck = await pool.query(`
        SELECT constraint_name, table_schema, table_name 
        FROM information_schema.constraint_column_usage 
        WHERE column_name LIKE '%favorecido%'
      `);
      
      if (constraintCheck.rows.length === 0) {
        console.log('✅ Confirmado: Nenhuma constraint referenciando favorecidos encontrada');
      } else {
        console.log('⚠️ Constraints remanescentes encontradas:');
        constraintCheck.rows.forEach(row => {
          console.log(`   - ${row.constraint_name} em ${row.table_schema}.${row.table_name}`);
        });
      }
      
    } else {
      console.log('❌ Tabelas favorecidos ainda encontradas:');
      searchResult.rows.forEach(row => {
        console.log(`   - ${row.table_schema}.${row.table_name}`);
      });
    }
    
    // Verificar se beneficiaries está funcionando corretamente
    const schemasResult = await pool.query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name LIKE 'tenant_%'
      LIMIT 1
    `);
    
    if (schemasResult.rows.length > 0) {
      const testSchema = schemasResult.rows[0].schema_name;
      
      const beneficiariesExists = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = $1 AND table_name = 'beneficiaries'
        )
      `, [testSchema]);
      
      if (beneficiariesExists.rows[0].exists) {
        console.log(`✅ Tabela beneficiaries confirmada em ${testSchema}`);
        
        // Contar registros em beneficiaries
        const beneficiariesCount = await pool.query(`
          SELECT COUNT(*) as total FROM "${testSchema}".beneficiaries
        `);
        console.log(`📊 Beneficiaries contém ${beneficiariesCount.rows[0].total} registros`);
      } else {
        console.log(`❌ Tabela beneficiaries não encontrada em ${testSchema}`);
      }
    }
    
    console.log('🎉 Validação concluída!');
    
  } catch (error) {
    console.error('❌ Erro na validação:', error);
    throw error;
  }
}

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  validateFavorecidosRemoval()
    .then(() => {
      console.log('✅ Validação executada com sucesso');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erro na validação:', error);
      process.exit(1);
    });
}

export { validateFavorecidosRemoval };
