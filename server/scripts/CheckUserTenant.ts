
import { sql } from 'drizzle-orm';
import { db } from '../db';

// ===========================
// VERIFICAÇÃO DE TENANT PARA USUÁRIO ESPECÍFICO
// ===========================

async function checkUserTenant() {
  console.log('🔍 Verificando tenant para alex@lansolver.com...\n');

  try {
    // 1. Verificar usuário na tabela pública
    console.log('1️⃣ Verificando usuário na tabela public.users...');
    const userResult = await db.execute(sql`
      SELECT id, email, tenant_id, first_name, last_name, is_active, created_at
      FROM public.users 
      WHERE email = 'alex@lansolver.com'
      ORDER BY created_at DESC
    `);

    if (userResult.rows.length === 0) {
      console.log('❌ Usuário alex@lansolver.com não encontrado na tabela public.users');
    } else {
      console.log('✅ Usuário encontrado:');
      userResult.rows.forEach((user: any, index: number) => {
        console.log(`   ${index + 1}. ID: ${user.id}`);
        console.log(`      Email: ${user.email}`);
        console.log(`      Tenant ID: ${user.tenant_id}`);
        console.log(`      Nome: ${user.first_name} ${user.last_name}`);
        console.log(`      Ativo: ${user.is_active}`);
        console.log(`      Criado em: ${user.created_at}`);
        console.log('');
      });
    }

    // 2. Verificar tenants na tabela pública
    console.log('\n2️⃣ Verificando tenants disponíveis...');
    const tenantsResult = await db.execute(sql`
      SELECT id, name, subdomain, is_active, created_at
      FROM public.tenants 
      ORDER BY created_at DESC
      LIMIT 10
    `);

    if (tenantsResult.rows.length === 0) {
      console.log('❌ Nenhum tenant encontrado na tabela public.tenants');
    } else {
      console.log('✅ Tenants encontrados:');
      tenantsResult.rows.forEach((tenant: any, index: number) => {
        console.log(`   ${index + 1}. ID: ${tenant.id}`);
        console.log(`      Nome: ${tenant.name}`);
        console.log(`      Subdomínio: ${tenant.subdomain}`);
        console.log(`      Ativo: ${tenant.is_active}`);
        console.log(`      Criado em: ${tenant.created_at}`);
        console.log('');
      });
    }

    // 3. Verificar schemas de tenant existentes
    console.log('\n3️⃣ Verificando schemas de tenant no banco...');
    const schemasResult = await db.execute(sql`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name LIKE 'tenant_%'
      ORDER BY schema_name
    `);

    if (schemasResult.rows.length === 0) {
      console.log('❌ Nenhum schema de tenant encontrado');
    } else {
      console.log('✅ Schemas de tenant encontrados:');
      schemasResult.rows.forEach((schema: any, index: number) => {
        console.log(`   ${index + 1}. ${schema.schema_name}`);
      });
    }

    // 4. Tentar encontrar o tenant real do usuário
    if (userResult.rows.length > 0) {
      const user = userResult.rows[0];
      const tenantId = user.tenant_id;
      
      if (tenantId && tenantId !== 'mock-tenant-id') {
        console.log(`\n4️⃣ Verificando tenant específico: ${tenantId}`);
        
        const tenantDetailsResult = await db.execute(sql`
          SELECT id, name, subdomain, is_active, created_at, updated_at
          FROM public.tenants 
          WHERE id = ${tenantId}
        `);

        if (tenantDetailsResult.rows.length > 0) {
          const tenant = tenantDetailsResult.rows[0];
          console.log('✅ Detalhes do tenant do usuário:');
          console.log(`   ID: ${tenant.id}`);
          console.log(`   Nome: ${tenant.name}`);
          console.log(`   Subdomínio: ${tenant.subdomain}`);
          console.log(`   Ativo: ${tenant.is_active}`);
          console.log(`   Criado em: ${tenant.created_at}`);
          console.log(`   Atualizado em: ${tenant.updated_at}`);

          // Verificar se o schema existe
          const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
          const schemaExistsResult = await db.execute(sql`
            SELECT 1 FROM information_schema.schemata 
            WHERE schema_name = ${schemaName}
          `);

          if (schemaExistsResult.rows.length > 0) {
            console.log(`✅ Schema ${schemaName} existe no banco`);
            
            // Verificar tabelas no schema
            const tablesResult = await db.execute(sql`
              SELECT table_name 
              FROM information_schema.tables 
              WHERE table_schema = ${schemaName}
              ORDER BY table_name
            `);

            console.log(`📊 Tabelas no schema (${tablesResult.rows.length} encontradas):`);
            tablesResult.rows.forEach((table: any, index: number) => {
              console.log(`   ${index + 1}. ${table.table_name}`);
            });
          } else {
            console.log(`❌ Schema ${schemaName} NÃO existe no banco`);
          }
        } else {
          console.log(`❌ Tenant ${tenantId} não encontrado na tabela tenants`);
        }
      } else {
        console.log('\n4️⃣ Usuário está usando tenant mock (desenvolvimento)');
      }
    }

  } catch (error) {
    console.error('❌ Erro ao verificar tenant:', error);
  }
}

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  checkUserTenant()
    .then(() => {
      console.log('\n✅ Verificação de tenant concluída');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erro na verificação:', error);
      process.exit(1);
    });
}

export { checkUserTenant };
