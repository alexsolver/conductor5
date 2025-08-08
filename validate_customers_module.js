
const { Pool } = require('pg');

async function validateCustomersModule() {
  console.log('🔍 VALIDAÇÃO COMPLETA DO MÓDULO CLIENTES\n');

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    // 1. Get all tenant schemas
    const schemasResult = await pool.query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name LIKE 'tenant_%'
      ORDER BY schema_name
    `);

    console.log(`📋 Validando ${schemasResult.rows.length} tenant schemas...\n`);

    for (const schema of schemasResult.rows) {
      const schemaName = schema.schema_name;
      console.log(`🏢 SCHEMA: ${schemaName}`);

      // 2. Check core customer tables
      const customerTablesResult = await pool.query(`
        SELECT table_name, 
               (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = $1 AND table_name = t.table_name) as column_count
        FROM information_schema.tables t
        WHERE table_schema = $1
          AND table_name IN ('customers', 'beneficiaries', 'companies', 'customer_company_memberships', 'customer_item_mappings')
          AND table_type = 'BASE TABLE'
        ORDER BY table_name
      `, [schemaName]);

      console.log('  📊 Tabelas do módulo clientes:');
      customerTablesResult.rows.forEach(table => {
        console.log(`    ✅ ${table.table_name} (${table.column_count} colunas)`);
      });

      // 3. Check critical fields in customers table
      const customersFieldsResult = await pool.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_schema = $1 AND table_name = 'customers'
        ORDER BY ordinal_position
      `, [schemaName]);

      const criticalFields = ['tenant_id', 'first_name', 'last_name', 'email', 'customer_type', 'is_active', 'created_at', 'updated_at'];
      const missingCriticalFields = [];

      console.log('  📋 Campos críticos da tabela customers:');
      criticalFields.forEach(field => {
        const fieldInfo = customersFieldsResult.rows.find(f => f.column_name === field);
        if (fieldInfo) {
          console.log(`    ✅ ${field}: ${fieldInfo.data_type} ${fieldInfo.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
        } else {
          missingCriticalFields.push(field);
          console.log(`    ❌ FALTANDO: ${field}`);
        }
      });

      // 4. Check foreign key constraints
      const fkResult = await pool.query(`
        SELECT
          tc.constraint_name,
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
          AND tc.table_name IN ('customers', 'beneficiaries', 'customer_company_memberships', 'customer_item_mappings')
      `, [schemaName]);

      console.log('  🔗 Foreign Keys:');
      if (fkResult.rows.length > 0) {
        fkResult.rows.forEach(fk => {
          console.log(`    ✅ ${fk.table_name}.${fk.column_name} → ${fk.foreign_table_name}.${fk.foreign_column_name}`);
        });
      } else {
        console.log('    ⚠️  Nenhuma foreign key encontrada');
      }

      // 5. Check indexes
      const indexResult = await pool.query(`
        SELECT 
          schemaname,
          tablename,
          indexname,
          indexdef
        FROM pg_indexes
        WHERE schemaname = $1
          AND tablename IN ('customers', 'beneficiaries', 'companies')
        ORDER BY tablename, indexname
      `, [schemaName]);

      console.log('  📇 Índices:');
      indexResult.rows.forEach(idx => {
        console.log(`    ✅ ${idx.tablename}: ${idx.indexname}`);
      });

      // 6. Data validation
      if (customersFieldsResult.rows.length > 0) {
        try {
          const dataValidationResult = await pool.query(`
            SELECT 
              COUNT(*) as total_customers,
              COUNT(CASE WHEN customer_type IN ('PF', 'PJ') THEN 1 END) as valid_customer_types,
              COUNT(CASE WHEN is_active = true THEN 1 END) as active_customers,
              COUNT(CASE WHEN email IS NOT NULL AND email != '' THEN 1 END) as customers_with_email
            FROM ${schemaName}.customers
          `);

          const stats = dataValidationResult.rows[0];
          console.log('  📊 Estatísticas dos dados:');
          console.log(`    📈 Total de clientes: ${stats.total_customers}`);
          console.log(`    ✅ Tipos válidos (PF/PJ): ${stats.valid_customer_types}`);
          console.log(`    🟢 Clientes ativos: ${stats.active_customers}`);
          console.log(`    📧 Com email: ${stats.customers_with_email}`);

          // Data integrity warnings
          if (stats.total_customers > 0 && stats.valid_customer_types !== stats.total_customers) {
            console.log(`    ⚠️  ${stats.total_customers - stats.valid_customer_types} clientes com customer_type inválido`);
          }
        } catch (error) {
          console.log('    ❌ Erro ao validar dados:', error.message);
        }
      }

      console.log('');
    }

    console.log('✅ Validação do módulo clientes concluída!\n');

  } catch (error) {
    console.error('❌ Erro durante a validação:', error);
  } finally {
    await pool.end();
  }
}

// Execute if run directly
if (require.main === module) {
  validateCustomersModule().catch(console.error);
}

module.exports = { validateCustomersModule };
