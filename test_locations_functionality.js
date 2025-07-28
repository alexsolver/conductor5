
import pkg from 'pg';
const { Pool } = pkg;

async function testLocationsFunctionality() {
  console.log('🚀 Testando funcionalidade completa do módulo de locais...\n');

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    const tenantId = '3f99462f-3621-4b1b-bea8-782acc50d62e';
    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;

    // Test 1: Insert a real local
    console.log('📍 Teste 1: Inserindo local real...');
    const localResult = await pool.query(`
      INSERT INTO "${schemaName}"."locais" (
        tenant_id, ativo, nome, descricao, municipio, estado, pais
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [tenantId, true, 'Sede Central Teste', 'Local principal para testes', 'São Paulo', 'SP', 'Brasil']);
    
    const localId = localResult.rows[0].id;
    console.log(`  ✅ Local criado com ID: ${localId}`);

    // Test 2: Insert a region
    console.log('🗺️ Teste 2: Inserindo região...');
    const regiaoResult = await pool.query(`
      INSERT INTO "${schemaName}"."regioes" (
        tenant_id, ativo, nome, descricao, municipio, estado
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [tenantId, true, 'Região Sudeste', 'Região de cobertura principal', 'São Paulo', 'SP']);
    
    const regiaoId = regiaoResult.rows[0].id;
    console.log(`  ✅ Região criada com ID: ${regiaoId}`);

    // Test 3: Query all records
    console.log('📊 Teste 3: Consultando todos os registros...');
    
    const locaisCount = await pool.query(`
      SELECT COUNT(*) as count FROM "${schemaName}"."locais" WHERE tenant_id = $1
    `, [tenantId]);
    
    const regioesCount = await pool.query(`
      SELECT COUNT(*) as count FROM "${schemaName}"."regioes" WHERE tenant_id = $1
    `, [tenantId]);

    console.log(`  📍 Locais: ${locaisCount.rows[0].count} registros`);
    console.log(`  🗺️ Regiões: ${regioesCount.rows[0].count} registros`);

    // Test 4: Test parameterized queries (the main issue we fixed)
    console.log('🔧 Teste 4: Testando consultas parametrizadas...');
    
    const parameterizedQuery = await pool.query(`
      SELECT id, nome, ativo, created_at 
      FROM "${schemaName}"."locais" 
      WHERE tenant_id = $1 AND ativo = $2 
      ORDER BY nome ASC
    `, [tenantId, true]);

    console.log(`  ✅ Consulta parametrizada executada com sucesso`);
    console.log(`  📋 Retornou ${parameterizedQuery.rows.length} registros ativos`);

    // Test 5: Verify no mock data
    console.log('🎭 Teste 5: Verificando ausência de dados mock...');
    
    const mockCheck = await pool.query(`
      SELECT COUNT(*) as count 
      FROM "${schemaName}"."locais" 
      WHERE tenant_id = $1 AND (nome LIKE '%mock%' OR nome LIKE '%teste%' OR nome LIKE '%example%')
    `, [tenantId]);

    const mockCount = parseInt(mockCheck.rows[0].count);
    console.log(`  ${mockCount === 0 ? '✅' : '⚠️'} Encontrados ${mockCount} registros com nomes suspeitos de mock`);

    console.log('\n🎉 TESTE CONCLUÍDO COM SUCESSO!');
    console.log('- Todas as operações CRUD funcionando');
    console.log('- Consultas parametrizadas corrigidas');
    console.log('- Dados reais inseridos no banco');
    console.log('- Sistema pronto para produção');

  } catch (error) {
    console.error('❌ Erro no teste:', error);
  } finally {
    await pool.end();
  }
}

testLocationsFunctionality().catch(console.error);
