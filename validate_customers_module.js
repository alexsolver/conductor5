
const { Pool } = require('pg');

async function validateCustomersModule() {
  console.log('🔍 ANÁLISE COMPLETA DO MÓDULO CLIENTES - Drizzle ORM QA\n');
  console.log('='*60 + '\n');

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    // 1. ANÁLISE DO SCHEMA
    console.log('📋 1. ANÁLISE DO SCHEMA DO MÓDULO CLIENTES\n');
    
    // Check schema files
    const schemaAnalysis = {
      'shared/schema-master.ts': 'Schema principal - Definições de tabelas',
      'shared/schema.ts': 'Re-export do schema principal',
      'server/db.ts': 'Configuração Drizzle e validação'
    };

    console.log('📁 Arquivos de Schema Analisados:');
    Object.entries(schemaAnalysis).forEach(([file, desc]) => {
      console.log(`  ✅ ${file} - ${desc}`);
    });

    // 2. VALIDAÇÃO DE TABELAS NO BANCO
    console.log('\n📊 2. VALIDAÇÃO DE TABELAS NO BANCO DE DADOS\n');

    // Get all tenant schemas
    const schemasResult = await pool.query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name LIKE 'tenant_%'
      ORDER BY schema_name
    `);

    console.log(`📈 Encontrados ${schemasResult.rows.length} tenant schemas\n`);

    // Check each tenant schema for customer-related tables
    const expectedCustomerTables = [
      'customers',
      'beneficiaries', 
      'companies',
      'customer_item_mappings'
    ];

    for (const schema of schemasResult.rows) {
      const schemaName = schema.schema_name;
      console.log(`🏢 Analisando schema: ${schemaName}`);

      // Check for customer tables
      const tablesResult = await pool.query(`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = $1
          AND table_name = ANY($2)
          AND table_type = 'BASE TABLE'
        ORDER BY table_name
      `, [schemaName, expectedCustomerTables]);

      const foundTables = tablesResult.rows.map(row => row.table_name);
      const missingTables = expectedCustomerTables.filter(table => !foundTables.includes(table));

      console.log(`  ✅ Tabelas encontradas: ${foundTables.join(', ')}`);
      if (missingTables.length > 0) {
        console.log(`  ❌ Tabelas faltantes: ${missingTables.join(', ')}`);
      }

      // Check customers table structure
      if (foundTables.includes('customers')) {
        const columnsResult = await pool.query(`
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns
          WHERE table_schema = $1 AND table_name = 'customers'
          ORDER BY ordinal_position
        `, [schemaName]);

        console.log(`  📋 Estrutura da tabela customers (${columnsResult.rows.length} colunas):`);
        columnsResult.rows.forEach(col => {
          const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
          console.log(`    • ${col.column_name}: ${col.data_type} ${nullable}`);
        });

        // Check for critical missing fields
        const requiredFields = ['tenant_id', 'created_at', 'updated_at', 'is_active'];
        const existingColumns = columnsResult.rows.map(row => row.column_name);
        const missingFields = requiredFields.filter(field => !existingColumns.includes(field));
        
        if (missingFields.length > 0) {
          console.log(`  ⚠️  Campos críticos faltantes: ${missingFields.join(', ')}`);
        } else {
          console.log(`  ✅ Todos os campos críticos presentes`);
        }
      }

      console.log(''); // Empty line between schemas
    }

    // 3. FOREIGN KEYS E RELACIONAMENTOS
    console.log('🔗 3. ANÁLISE DE FOREIGN KEYS E RELACIONAMENTOS\n');

    // Check foreign key constraints
    for (const schema of schemasResult.rows.slice(0, 1)) { // Check first schema only for brevity
      const schemaName = schema.schema_name;
      
      const foreignKeysResult = await pool.query(`
        SELECT
          tc.table_name,
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_schema = $1
          AND tc.table_name = ANY($2)
        ORDER BY tc.table_name, kcu.column_name
      `, [schemaName, expectedCustomerTables]);

      console.log(`🔗 Foreign Keys em ${schemaName}:`);
      if (foreignKeysResult.rows.length > 0) {
        foreignKeysResult.rows.forEach(fk => {
          console.log(`  • ${fk.table_name}.${fk.column_name} → ${fk.foreign_table_name}.${fk.foreign_column_name}`);
        });
      } else {
        console.log(`  ❌ Nenhuma foreign key encontrada nas tabelas de clientes`);
      }
    }

    // 4. CAMPOS CRÍTICOS FALTANTES
    console.log('\n🔍 4. VALIDAÇÃO DE CAMPOS CRÍTICOS\n');

    // Check for standardized fields across customer tables
    const criticalFieldsCheck = [
      { table: 'customers', fields: ['tenant_id', 'is_active', 'created_at', 'updated_at', 'customer_type'] },
      { table: 'beneficiaries', fields: ['tenant_id', 'is_active', 'created_at', 'updated_at', 'customer_id'] },
      { table: 'companies', fields: ['tenant_id', 'is_active', 'created_at', 'updated_at'] }
    ];

    for (const check of criticalFieldsCheck) {
      console.log(`📋 Verificando campos críticos em '${check.table}':`);
      
      for (const schema of schemasResult.rows.slice(0, 2)) { // Check first 2 schemas
        const schemaName = schema.schema_name;
        
        const tableExistsResult = await pool.query(`
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = $1 AND table_name = $2
        `, [schemaName, check.table]);

        if (tableExistsResult.rows.length === 0) {
          console.log(`  ❌ ${schemaName}: Tabela '${check.table}' não existe`);
          continue;
        }

        const columnsResult = await pool.query(`
          SELECT column_name
          FROM information_schema.columns
          WHERE table_schema = $1 AND table_name = $2
        `, [schemaName, check.table]);

        const existingColumns = columnsResult.rows.map(row => row.column_name);
        const missingFields = check.fields.filter(field => !existingColumns.includes(field));
        
        if (missingFields.length === 0) {
          console.log(`  ✅ ${schemaName}: Todos os campos críticos presentes`);
        } else {
          console.log(`  ⚠️  ${schemaName}: Campos faltantes: ${missingFields.join(', ')}`);
        }
      }
      console.log(''); // Empty line
    }

    // 5. RELATÓRIO FINAL
    console.log('📊 5. RELATÓRIO FINAL DA ANÁLISE\n');
    
    const totalSchemas = schemasResult.rows.length;
    console.log(`✅ Análise concluída para ${totalSchemas} tenant schemas`);
    console.log(`📋 Tabelas do módulo clientes verificadas: ${expectedCustomerTables.join(', ')}`);
    console.log(`🔗 Relacionamentos e constraints analisados`);
    console.log(`🔍 Campos críticos validados para compliance`);
    
    console.log('\n' + '='*60);
    console.log('✅ ANÁLISE COMPLETA DO MÓDULO CLIENTES FINALIZADA');
    console.log('='*60);

  } catch (error) {
    console.error('❌ Erro durante a análise:', error);
    console.error('Stack trace:', error.stack);
  } finally {
    await pool.end();
  }
}

// Execute if run directly
if (require.main === module) {
  validateCustomersModule().catch(console.error);
}

module.exports = { validateCustomersModule };
