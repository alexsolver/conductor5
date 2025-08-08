
const { Pool } = require('pg');

async function listAllDatabaseTables() {
  console.log('🔍 Listando todas as tabelas do banco de dados...\n');

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    // 1. First, get all schemas
    console.log('📋 1. LISTANDO SCHEMAS DISPONÍVEIS...');
    const schemasResult = await pool.query(`
      SELECT schema_name, 
             CASE 
               WHEN schema_name LIKE 'tenant_%' THEN 'Tenant Schema'
               WHEN schema_name = 'public' THEN 'Public Schema'
               ELSE 'System Schema'
             END as schema_type
      FROM information_schema.schemata 
      WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
      ORDER BY 
        CASE 
          WHEN schema_name = 'public' THEN 1
          WHEN schema_name LIKE 'tenant_%' THEN 2
          ELSE 3
        END,
        schema_name
    `);

    console.log(`\n📊 Encontrados ${schemasResult.rows.length} schemas:\n`);
    schemasResult.rows.forEach(schema => {
      console.log(`  ${schema.schema_type === 'Public Schema' ? '🌐' : schema.schema_type === 'Tenant Schema' ? '🏢' : '⚙️'} ${schema.schema_name} (${schema.schema_type})`);
    });

    // 2. Get all tables from public schema
    console.log('\n📋 2. TABELAS DO SCHEMA PUBLIC...');
    const publicTablesResult = await pool.query(`
      SELECT 
        table_name,
        table_type,
        (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'public' AND table_name = t.table_name) as column_count
      FROM information_schema.tables t
      WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);

    if (publicTablesResult.rows.length > 0) {
      console.log(`\n  ✅ ${publicTablesResult.rows.length} tabelas públicas encontradas:\n`);
      publicTablesResult.rows.forEach((table, index) => {
        console.log(`    ${index + 1}. ${table.table_name} (${table.column_count} colunas)`);
      });
    } else {
      console.log('  ❌ Nenhuma tabela encontrada no schema public');
    }

    // 3. Get tables from each tenant schema
    const tenantSchemas = schemasResult.rows.filter(row => row.schema_name.startsWith('tenant_'));
    
    if (tenantSchemas.length > 0) {
      console.log('\n📋 3. TABELAS DOS SCHEMAS TENANT...');
      
      for (const tenantSchema of tenantSchemas) {
        const schemaName = tenantSchema.schema_name;
        console.log(`\n  🏢 Schema: ${schemaName}`);
        
        const tenantTablesResult = await pool.query(`
          SELECT 
            table_name,
            (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = $1 AND table_name = t.table_name) as column_count
          FROM information_schema.tables t
          WHERE table_schema = $1
            AND table_type = 'BASE TABLE'
          ORDER BY table_name
        `, [schemaName]);

        if (tenantTablesResult.rows.length > 0) {
          console.log(`    ✅ ${tenantTablesResult.rows.length} tabelas encontradas:\n`);
          tenantTablesResult.rows.forEach((table, index) => {
            console.log(`      ${index + 1}. ${table.table_name} (${table.column_count} colunas)`);
          });
        } else {
          console.log(`    ❌ Nenhuma tabela encontrada no schema ${schemaName}`);
        }
      }

      // 4. Get a consolidated list of unique table names across all tenant schemas
      console.log('\n📋 4. TABELAS ÚNICAS CONSOLIDADAS (TODOS OS TENANTS)...');
      const consolidatedTablesResult = await pool.query(`
        SELECT 
          table_name,
          COUNT(DISTINCT table_schema) as schema_count,
          array_agg(DISTINCT table_schema ORDER BY table_schema) as schemas
        FROM information_schema.tables
        WHERE table_schema LIKE 'tenant_%'
          AND table_type = 'BASE TABLE'
        GROUP BY table_name
        ORDER BY table_name
      `);

      if (consolidatedTablesResult.rows.length > 0) {
        console.log(`\n  ✅ ${consolidatedTablesResult.rows.length} tipos de tabelas únicos encontrados:\n`);
        consolidatedTablesResult.rows.forEach((table, index) => {
          console.log(`    ${index + 1}. ${table.table_name} (presente em ${table.schema_count} tenant(s))`);
        });

        // 5. Show statistics
        console.log('\n📊 5. ESTATÍSTICAS GERAIS...');
        const totalTenants = tenantSchemas.length;
        const totalUniqueTableTypes = consolidatedTablesResult.rows.length;
        
        console.log(`\n  📈 Resumo:`);
        console.log(`    • Schemas tenant ativos: ${totalTenants}`);
        console.log(`    • Tipos de tabelas únicos: ${totalUniqueTableTypes}`);
        console.log(`    • Tabelas públicas: ${publicTablesResult.rows.length}`);
        
        // Find tables not present in all tenants
        const incompleteTableDistribution = consolidatedTablesResult.rows.filter(table => table.schema_count < totalTenants);
        if (incompleteTableDistribution.length > 0) {
          console.log(`\n  ⚠️  Tabelas com distribuição incompleta (${incompleteTableDistribution.length}):`);
          incompleteTableDistribution.forEach(table => {
            console.log(`    • ${table.table_name}: presente em ${table.schema_count}/${totalTenants} tenants`);
          });
        } else {
          console.log(`\n  ✅ Todas as tabelas estão presentes em todos os ${totalTenants} tenant schemas`);
        }
      }
    }

    console.log('\n✅ Listagem de tabelas concluída com sucesso!');

  } catch (error) {
    console.error('❌ Erro ao listar tabelas:', error);
  } finally {
    await pool.end();
  }
}

// Execute if run directly
if (require.main === module) {
  listAllDatabaseTables().catch(console.error);
}

module.exports = { listAllDatabaseTables };
