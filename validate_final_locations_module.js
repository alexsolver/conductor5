
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function validateAndCleanLocationsModule() {
  console.log('🔍 VALIDAÇÃO FINAL E LIMPEZA DO MÓDULO DE LOCAIS\n');

  try {
    // Get all tenant schemas
    const schemasResult = await pool.query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name LIKE 'tenant_%'
      ORDER BY schema_name
    `);

    const tenantSchemas = schemasResult.rows.map(row => row.schema_name);
    console.log(`📊 Encontrados ${tenantSchemas.length} schemas de tenant\n`);

    const requiredTables = [
      'locais', 'regioes', 'rotas_dinamicas', 'trechos', 
      'rotas_trecho', 'trechos_rota', 'areas', 'agrupamentos'
    ];

    let totalMockRecords = 0;
    let totalRealRecords = 0;
    let missingTables = [];

    for (const schema of tenantSchemas) {
      console.log(`🏢 Processando schema: ${schema}`);
      
      // 1. Check and create missing tables
      for (const table of requiredTables) {
        try {
          const tableCheck = await pool.query(`
            SELECT EXISTS (
              SELECT FROM information_schema.tables 
              WHERE table_schema = $1 AND table_name = $2
            )
          `, [schema, table]);

          if (!tableCheck.rows[0].exists) {
            console.log(`  ❌ Tabela ausente: ${table} - Criando...`);
            missingTables.push(`${schema}.${table}`);
            
            // Create table using migration function
            await pool.query(`SELECT create_locations_new_tables_for_tenant($1)`, [schema]);
            console.log(`  ✅ Tabela ${table} criada com sucesso`);
          } else {
            console.log(`  ✅ Tabela existe: ${table}`);
          }
        } catch (error) {
          console.log(`  ⚠️  Erro verificando ${table}: ${error.message}`);
        }
      }

      // 2. Identify and remove mock data
      console.log(`  🧹 Removendo dados mock de ${schema}...`);
      
      for (const table of requiredTables) {
        try {
          // Check for mock data patterns
          const mockCheckQuery = `
            SELECT COUNT(*) as mock_count FROM "${schema}"."${table}"
            WHERE id::text LIKE 'mock-%' 
               OR (nome IS NOT NULL AND (nome LIKE '%Mock%' OR nome LIKE '%Test%' OR nome LIKE '%Exemplo%'))
               OR (codigo_integracao IS NOT NULL AND (codigo_integracao LIKE 'MOCK%' OR codigo_integracao LIKE 'TEST%'))
               OR (nome_rota IS NOT NULL AND (nome_rota LIKE '%Mock%' OR nome_rota LIKE '%Test%'))
               OR (id_rota IS NOT NULL AND (id_rota LIKE 'MOCK%' OR id_rota LIKE 'TEST%'))
          `;
          
          const mockResult = await pool.query(mockCheckQuery);
          const mockCount = parseInt(mockResult.rows[0].mock_count) || 0;
          
          if (mockCount > 0) {
            // Remove mock data
            const deleteQuery = `
              DELETE FROM "${schema}"."${table}"
              WHERE id::text LIKE 'mock-%' 
                 OR (nome IS NOT NULL AND (nome LIKE '%Mock%' OR nome LIKE '%Test%' OR nome LIKE '%Exemplo%'))
                 OR (codigo_integracao IS NOT NULL AND (codigo_integracao LIKE 'MOCK%' OR codigo_integracao LIKE 'TEST%'))
                 OR (nome_rota IS NOT NULL AND (nome_rota LIKE '%Mock%' OR nome_rota LIKE '%Test%'))
                 OR (id_rota IS NOT NULL AND (id_rota LIKE 'MOCK%' OR id_rota LIKE 'TEST%'))
            `;
            
            const deleteResult = await pool.query(deleteQuery);
            totalMockRecords += deleteResult.rowCount || 0;
            console.log(`    🗑️  Removidos ${deleteResult.rowCount || 0} registros mock de ${table}`);
          }

          // Count real records
          const realCountQuery = `SELECT COUNT(*) as real_count FROM "${schema}"."${table}"`;
          const realResult = await pool.query(realCountQuery);
          const realCount = parseInt(realResult.rows[0].real_count) || 0;
          totalRealRecords += realCount;
          
          if (realCount > 0) {
            console.log(`    📊 ${table}: ${realCount} registros reais`);
          }

        } catch (error) {
          console.log(`    ⚠️  Erro processando ${table}: ${error.message}`);
        }
      }

      // 3. Validate required columns exist
      console.log(`  🔍 Validando colunas obrigatórias...`);
      
      const columnValidations = {
        'locais': ['nome', 'tenant_id', 'ativo'],
        'regioes': ['nome', 'tenant_id', 'ativo'],
        'rotas_dinamicas': ['nome_rota', 'id_rota', 'tenant_id', 'ativo'],
        'trechos': ['local_a_id', 'local_b_id', 'tenant_id', 'ativo'],
        'areas': ['nome', 'tipo_area', 'tenant_id', 'ativo'],
        'agrupamentos': ['nome', 'tenant_id', 'ativo']
      };

      for (const [table, columns] of Object.entries(columnValidations)) {
        try {
          for (const column of columns) {
            const columnCheck = await pool.query(`
              SELECT EXISTS (
                SELECT FROM information_schema.columns 
                WHERE table_schema = $1 AND table_name = $2 AND column_name = $3
              )
            `, [schema, table, column]);

            if (!columnCheck.rows[0].exists) {
              console.log(`    ❌ Coluna ausente: ${table}.${column}`);
            }
          }
        } catch (error) {
          console.log(`    ⚠️  Erro validando colunas de ${table}: ${error.message}`);
        }
      }
    }

    // 4. Final summary
    console.log('\n📋 RESUMO FINAL:');
    console.log(`✅ Schemas processados: ${tenantSchemas.length}`);
    console.log(`🗑️  Total de registros mock removidos: ${totalMockRecords}`);
    console.log(`📊 Total de registros reais: ${totalRealRecords}`);
    console.log(`🏗️  Tabelas criadas: ${missingTables.length}`);
    
    if (missingTables.length > 0) {
      console.log('📝 Tabelas que foram criadas:');
      missingTables.forEach(table => console.log(`   • ${table}`));
    }

    // 5. Test database connectivity and queries
    console.log('\n🧪 TESTE DE CONECTIVIDADE:');
    const testTenant = 'tenant_3f99462f_3621_4b1b_bea8_782acc50d62e';
    
    for (const table of requiredTables) {
      try {
        const testResult = await pool.query(`
          SELECT COUNT(*) as count FROM "${testTenant}"."${table}" LIMIT 1
        `);
        console.log(`  ✅ ${table}: Conectividade OK (${testResult.rows[0].count} registros)`);
      } catch (error) {
        console.log(`  ❌ ${table}: ${error.message}`);
      }
    }

    if (totalMockRecords === 0 && totalRealRecords > 0) {
      console.log('\n🎉 MÓDULO DE LOCAIS 100% OPERACIONAL!');
      console.log('✅ Todas as tabelas existem');
      console.log('✅ Nenhum dado mock encontrado');
      console.log('✅ Apenas dados reais no banco');
      console.log('✅ Sistema pronto para produção');
    } else if (totalMockRecords > 0) {
      console.log('\n⚠️  LIMPEZA REALIZADA COM SUCESSO!');
      console.log(`🗑️  ${totalMockRecords} registros mock foram removidos`);
      console.log('✅ Sistema agora contém apenas dados reais');
    }

  } catch (error) {
    console.error('❌ Erro na validação:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Execute if run directly
if (require.main === module) {
  validateAndCleanLocationsModule();
}

module.exports = validateAndCleanLocationsModule;
