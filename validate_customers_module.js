
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function validateCustomersModule() {
  console.log('🔍 INICIANDO ANÁLISE COMPLETA DO MÓDULO CLIENTES\n');
  console.log('='*80);
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    // 1. ANÁLISE DO SCHEMA
    console.log('📋 1. ANÁLISE DO SCHEMA - SHARED/SCHEMA-MASTER.TS\n');
    
    const schemaMasterPath = path.join(process.cwd(), 'shared', 'schema-master.ts');
    const schemaPath = path.join(process.cwd(), 'shared', 'schema.ts');
    
    if (fs.existsSync(schemaMasterPath)) {
      console.log('✅ shared/schema-master.ts encontrado');
      const schemaContent = fs.readFileSync(schemaMasterPath, 'utf8');
      
      // Check for customers table definition
      if (schemaContent.includes('customers')) {
        console.log('✅ Tabela customers definida no schema');
      } else {
        console.log('❌ PROBLEMA: Tabela customers não encontrada no schema');
      }
      
      // Check for key fields
      const requiredFields = [
        'tenant_id',
        'created_at', 
        'updated_at',
        'is_active',
        'customer_type',
        'first_name',
        'last_name',
        'email'
      ];
      
      console.log('\n🔍 Verificando campos obrigatórios na tabela customers:');
      requiredFields.forEach(field => {
        if (schemaContent.includes(field)) {
          console.log(`  ✅ ${field}`);
        } else {
          console.log(`  ❌ FALTANDO: ${field}`);
        }
      });
    } else {
      console.log('❌ CRÍTICO: shared/schema-master.ts não encontrado');
    }

    if (fs.existsSync(schemaPath)) {
      console.log('✅ shared/schema.ts encontrado');
    } else {
      console.log('❌ PROBLEMA: shared/schema.ts não encontrado');
    }

    // 2. VALIDAÇÃO DRIZZLE
    console.log('\n📋 2. VALIDAÇÃO DRIZZLE - SERVER/DB.TS\n');
    
    const dbPath = path.join(process.cwd(), 'server', 'db.ts');
    if (fs.existsSync(dbPath)) {
      console.log('✅ server/db.ts encontrado');
      const dbContent = fs.readFileSync(dbPath, 'utf8');
      
      if (dbContent.includes('requiredTables')) {
        console.log('✅ requiredTables definido');
      } else {
        console.log('❌ PROBLEMA: requiredTables não encontrado');
      }
      
      if (dbContent.includes('customers')) {
        console.log('✅ customers incluído na validação');
      } else {
        console.log('❌ PROBLEMA: customers não incluído na validação');
      }
    } else {
      console.log('❌ CRÍTICO: server/db.ts não encontrado');
    }

    // 3. TESTE DE CONEXÃO E VALIDAÇÃO DE SCHEMA
    console.log('\n📋 3. TESTE DE CONEXÃO E VALIDAÇÃO DE SCHEMA\n');
    
    try {
      // Test database connection
      const connectionTest = await pool.query('SELECT NOW() as current_time');
      console.log('✅ Conexão com banco de dados estabelecida');
      console.log(`   Horário do servidor: ${connectionTest.rows[0].current_time}`);
      
      // Check for tenant schemas
      const tenantSchemas = await pool.query(`
        SELECT schema_name 
        FROM information_schema.schemata 
        WHERE schema_name LIKE 'tenant_%'
        ORDER BY schema_name
      `);
      
      console.log(`\n📊 Encontrados ${tenantSchemas.rows.length} schemas tenant:`);
      
      if (tenantSchemas.rows.length > 0) {
        for (const schema of tenantSchemas.rows) {
          console.log(`\n🏢 Validando schema: ${schema.schema_name}`);
          
          // Check if customers table exists in this tenant
          const customersTableCheck = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = $1 AND table_name = 'customers'
          `, [schema.schema_name]);
          
          if (customersTableCheck.rows.length > 0) {
            console.log('  ✅ Tabela customers existe');
            
            // Check table structure
            const tableStructure = await pool.query(`
              SELECT column_name, data_type, is_nullable, column_default
              FROM information_schema.columns 
              WHERE table_schema = $1 AND table_name = 'customers'
              ORDER BY ordinal_position
            `, [schema.schema_name]);
            
            console.log(`  📋 Estrutura da tabela (${tableStructure.rows.length} colunas):`);
            tableStructure.rows.forEach((col, index) => {
              console.log(`    ${index + 1}. ${col.column_name} (${col.data_type}) ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULLABLE'}`);
            });
            
            // Check for required fields
            const existingColumns = tableStructure.rows.map(row => row.column_name);
            const missingFields = requiredFields.filter(field => !existingColumns.includes(field));
            
            if (missingFields.length > 0) {
              console.log(`  ❌ CAMPOS FALTANTES: ${missingFields.join(', ')}`);
            } else {
              console.log('  ✅ Todos os campos obrigatórios estão presentes');
            }
            
            // Check data types consistency
            const typeInconsistencies = [];
            tableStructure.rows.forEach(col => {
              if (col.column_name.includes('_id') && !col.data_type.includes('uuid') && col.data_type !== 'character varying') {
                typeInconsistencies.push(`${col.column_name}: ${col.data_type} (esperado UUID)`);
              }
            });
            
            if (typeInconsistencies.length > 0) {
              console.log(`  ⚠️  INCONSISTÊNCIAS DE TIPO:`);
              typeInconsistencies.forEach(inconsistency => {
                console.log(`    - ${inconsistency}`);
              });
            }
            
          } else {
            console.log('  ❌ CRÍTICO: Tabela customers não existe neste tenant');
          }
        }
      } else {
        console.log('❌ CRÍTICO: Nenhum schema tenant encontrado');
      }
      
    } catch (error) {
      console.log(`❌ ERRO na validação de schema: ${error.message}`);
    }

    // 4. VALIDAÇÃO DAS ROTAS
    console.log('\n📋 4. VALIDAÇÃO DAS ROTAS - CUSTOMERS MODULE\n');
    
    const routesPath = path.join(process.cwd(), 'server', 'modules', 'customers', 'routes.ts');
    if (fs.existsSync(routesPath)) {
      console.log('✅ server/modules/customers/routes.ts encontrado');
      const routesContent = fs.readFileSync(routesPath, 'utf8');
      
      const expectedRoutes = ['GET /', 'POST /', 'PUT /', 'DELETE /'];
      console.log('\n🔍 Verificando rotas CRUD:');
      
      expectedRoutes.forEach(route => {
        const [method] = route.split(' ');
        if (routesContent.includes(`router.${method.toLowerCase()}`)) {
          console.log(`  ✅ ${route}`);
        } else {
          console.log(`  ❌ FALTANDO: ${route}`);
        }
      });
      
    } else {
      console.log('❌ PROBLEMA: server/modules/customers/routes.ts não encontrado');
    }

    // 5. RELATÓRIO FINAL
    console.log('\n' + '='*80);
    console.log('📊 RELATÓRIO FINAL - MÓDULO CLIENTES\n');
    
    console.log('🎯 PROBLEMAS IDENTIFICADOS:');
    console.log('1. Verificar se todos os campos obrigatórios estão presentes na tabela customers');
    console.log('2. Validar consistência de tipos (UUID vs VARCHAR)');
    console.log('3. Confirmar se requiredTables está atualizado no db.ts');
    console.log('4. Verificar se todas as rotas CRUD estão implementadas');
    
    console.log('\n🔧 PRÓXIMOS PASSOS:');
    console.log('1. Executar migrations para corrigir schema se necessário');
    console.log('2. Atualizar server/db.ts com tabelas corretas');
    console.log('3. Implementar rotas faltantes');
    console.log('4. Testar integração frontend-backend');

  } catch (error) {
    console.error('❌ Erro na análise do módulo clientes:', error);
  } finally {
    await pool.end();
    console.log('\n✅ Análise concluída!');
  }
}

// Execute if run directly
if (require.main === module) {
  validateCustomersModule().catch(console.error);
}

module.exports = { validateCustomersModule };
