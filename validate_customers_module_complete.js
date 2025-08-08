
import pkg from 'pg';
const { Pool } = pkg;

async function validateCustomersModule() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  try {
    console.log('🔍 INICIANDO VALIDAÇÃO COMPLETA DO MÓDULO CLIENTES\n');

    // 1. Validar esquemas de tenant existentes
    console.log('📋 1. VALIDANDO ESQUEMAS DE TENANT...');
    const schemas = await pool.query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name LIKE 'tenant_%'
      ORDER BY schema_name
    `);

    console.log(`✅ Encontrados ${schemas.rows.length} esquemas de tenant`);

    for (const { schema_name } of schemas.rows) {
      console.log(`\n🏢 Validando esquema: ${schema_name}`);

      // 2. Verificar tabelas do módulo clientes
      const customerTables = await pool.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = $1
        AND table_name IN ('customers', 'beneficiaries', 'companies', 'customer_company_memberships', 'customer_item_mappings')
        ORDER BY table_name
      `, [schema_name]);

      const existingTables = customerTables.rows.map(r => r.table_name);
      const requiredTables = ['customers', 'beneficiaries', 'companies', 'customer_company_memberships'];
      const missingTables = requiredTables.filter(t => !existingTables.includes(t));

      if (missingTables.length > 0) {
        console.log(`❌ Tabelas faltantes: ${missingTables.join(', ')}`);
      } else {
        console.log(`✅ Todas as tabelas principais existem`);
      }

      // 3. Validar estrutura da tabela customers
      if (existingTables.includes('customers')) {
        const customerFields = await pool.query(`
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns 
          WHERE table_schema = $1 AND table_name = 'customers'
          AND column_name IN ('tenant_id', 'customer_type', 'first_name', 'last_name', 'email', 'is_active', 'created_at', 'updated_at')
          ORDER BY ordinal_position
        `, [schema_name]);

        console.log(`   🔍 Campos customers: ${customerFields.rows.length}/8 obrigatórios`);
        
        // Verificar campos NOT NULL críticos
        const nullableFields = customerFields.rows.filter(f => 
          ['customer_type', 'is_active', 'created_at', 'updated_at'].includes(f.column_name) && 
          f.is_nullable === 'YES'
        );

        if (nullableFields.length > 0) {
          console.log(`   ⚠️  Campos que devem ser NOT NULL: ${nullableFields.map(f => f.column_name).join(', ')}`);
        }
      }

      // 4. Validar estrutura da tabela beneficiaries
      if (existingTables.includes('beneficiaries')) {
        const beneficiaryFields = await pool.query(`
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns 
          WHERE table_schema = $1 AND table_name = 'beneficiaries'
          AND column_name IN ('tenant_id', 'name', 'is_active', 'created_at', 'updated_at')
        `, [schema_name]);

        console.log(`   🔍 Campos beneficiaries: ${beneficiaryFields.rows.length}/5 obrigatórios`);
      }

      // 5. Verificar índices críticos
      const indexes = await pool.query(`
        SELECT indexname, tablename 
        FROM pg_indexes 
        WHERE schemaname = $1
        AND tablename IN ('customers', 'beneficiaries', 'companies', 'customer_company_memberships')
        AND indexname LIKE '%tenant%'
        ORDER BY tablename, indexname
      `, [schema_name]);

      console.log(`   📊 Índices tenant-first: ${indexes.rows.length}`);

      // 6. Verificar foreign keys
      const foreignKeys = await pool.query(`
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
      `, [schema_name]);

      console.log(`   🔗 Foreign keys: ${foreignKeys.rows.length}`);

      // 7. Contar registros por tabela
      for (const table of existingTables) {
        try {
          const count = await pool.query(`SELECT COUNT(*) as count FROM "${schema_name}"."${table}"`);
          console.log(`   📊 ${table}: ${count.rows[0].count} registros`);
        } catch (error) {
          console.log(`   ❌ Erro ao contar ${table}: ${error.message}`);
        }
      }
    }

    // 8. Validação geral de consistency
    console.log('\n🔍 VALIDAÇÕES GERAIS...');
    
    // Verificar tabelas órfãs sem tenant_id
    for (const { schema_name } of schemas.rows) {
      const tablesWithoutTenantId = await pool.query(`
        SELECT table_name
        FROM information_schema.tables t
        WHERE t.table_schema = $1
        AND t.table_name IN ('customers', 'beneficiaries', 'companies', 'customer_company_memberships')
        AND NOT EXISTS (
          SELECT 1 FROM information_schema.columns c
          WHERE c.table_schema = t.table_schema
          AND c.table_name = t.table_name
          AND c.column_name = 'tenant_id'
        )
      `, [schema_name]);

      if (tablesWithoutTenantId.rows.length > 0) {
        console.log(`❌ ${schema_name}: Tabelas sem tenant_id: ${tablesWithoutTenantId.rows.map(r => r.table_name).join(', ')}`);
      }
    }

    console.log('\n✅ VALIDAÇÃO DO MÓDULO CLIENTES CONCLUÍDA!');

  } catch (error) {
    console.error('❌ Erro na validação do módulo clientes:', error);
  } finally {
    await pool.end();
  }
}

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  validateCustomersModule();
}

export { validateCustomersModule };
