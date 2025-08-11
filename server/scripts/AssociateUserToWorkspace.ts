
import { schemaManager } from '../db';

const associateUserToWorkspace = async () => {
  const targetEmail = 'alex@lansolver.com';
  const targetTenantId = '3f99462f-3621-4b1b-bea8-782acc50d62e'; // Workspace Lan Solver
  const targetWorkspaceName = 'Lan Solver';
  
  console.log('\n🔗 ASSOCIANDO USUÁRIO À WORKSPACE ORIGINAL');
  console.log('==========================================');
  console.log(`📧 Email: ${targetEmail}`);
  console.log(`🏢 Workspace: ${targetWorkspaceName}`);
  console.log(`🆔 Tenant ID: ${targetTenantId}`);
  
  try {
    const pool = schemaManager.getPool();
    
    // 1. Verificar se o usuário existe
    console.log('\n🔍 Verificando usuário...');
    const userCheck = await pool.query(
      'SELECT id, email, tenant_id, first_name, last_name, role FROM public.users WHERE email = $1',
      [targetEmail]
    );
    
    if (userCheck.rows.length === 0) {
      console.log('❌ Usuário não encontrado. Criando usuário...');
      
      // Criar usuário se não existir
      const createResult = await pool.query(`
        INSERT INTO public.users (
          id, email, tenant_id, first_name, last_name, role, 
          password_hash, is_active, created_at, updated_at
        ) VALUES (
          '550e8400-e29b-41d4-a716-446655440001', $1, $2, 'Alex', 'Silva', 'workspace_admin',
          '$2b$10$default.hash.for.admin', true, NOW(), NOW()
        )
        RETURNING id, email, tenant_id, first_name, last_name, role
      `, [targetEmail, targetTenantId]);
      
      console.log('✅ Usuário criado com sucesso:', createResult.rows[0]);
    } else {
      const user = userCheck.rows[0];
      console.log('📋 Usuário encontrado:', {
        id: user.id,
        email: user.email,
        currentTenantId: user.tenant_id,
        name: `${user.first_name} ${user.last_name}`,
        role: user.role
      });
      
      // 2. Verificar se já está na workspace correta
      if (user.tenant_id === targetTenantId) {
        console.log('✅ Usuário já está associado à workspace correta!');
      } else {
        console.log(`🔄 Atualizando tenant de ${user.tenant_id} para ${targetTenantId}...`);
        
        // Atualizar tenant do usuário
        const updateResult = await pool.query(`
          UPDATE public.users 
          SET tenant_id = $1, updated_at = NOW()
          WHERE email = $2
          RETURNING id, email, tenant_id, first_name, last_name, role
        `, [targetTenantId, targetEmail]);
        
        console.log('✅ Usuário atualizado:', updateResult.rows[0]);
      }
    }
    
    // 3. Verificar se o schema do tenant existe
    console.log('\n🗄️ Verificando schema do tenant...');
    const schemaName = schemaManager.getSchemaName(targetTenantId);
    
    const schemaCheck = await pool.query(
      `SELECT schema_name FROM information_schema.schemata WHERE schema_name = $1`,
      [schemaName]
    );
    
    if (schemaCheck.rows.length === 0) {
      console.log(`❌ Schema ${schemaName} não existe. Criando...`);
      await schemaManager.initializeTenantSchema(targetTenantId);
      console.log(`✅ Schema ${schemaName} criado com sucesso!`);
    } else {
      console.log(`✅ Schema ${schemaName} existe e está ativo`);
    }
    
    // 4. Verificar tabelas no schema do tenant
    const tableCount = await pool.query(
      `SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = $1`,
      [schemaName]
    );
    
    console.log(`📊 Tabelas no schema: ${tableCount.rows[0].count}`);
    
    // 5. Verificar se há dados nas principais tabelas
    console.log('\n📋 Verificando dados principais...');
    
    try {
      const customersCount = await pool.query(`SELECT COUNT(*) as count FROM "${schemaName}".customers`);
      console.log(`👥 Clientes: ${customersCount.rows[0].count}`);
    } catch (error) {
      console.log('❌ Tabela customers não existe ou está vazia');
    }
    
    try {
      const ticketsCount = await pool.query(`SELECT COUNT(*) as count FROM "${schemaName}".tickets`);
      console.log(`🎫 Tickets: ${ticketsCount.rows[0].count}`);
    } catch (error) {
      console.log('❌ Tabela tickets não existe ou está vazia');
    }
    
    try {
      const companiesCount = await pool.query(`SELECT COUNT(*) as count FROM "${schemaName}".companies`);
      console.log(`🏢 Empresas: ${companiesCount.rows[0].count}`);
    } catch (error) {
      console.log('❌ Tabela companies não existe ou está vazia');
    }
    
    console.log('\n🎯 RESULTADO FINAL:');
    console.log('==================');
    console.log(`✅ Usuário ${targetEmail} associado à workspace ${targetWorkspaceName}`);
    console.log(`✅ Tenant ID: ${targetTenantId}`);
    console.log(`✅ Schema ativo: ${schemaName}`);
    console.log('\n📋 PRÓXIMOS PASSOS:');
    console.log('1. Use o token JWT gerado anteriormente');
    console.log('2. Faça login no sistema');
    console.log('3. Verifique se os dados aparecem corretamente');
    
    // 6. Gerar novo token atualizado
    console.log('\n🔑 Gerando token JWT atualizado...');
    const jwt = await import('jsonwebtoken');
    
    const payload = {
      userId: '550e8400-e29b-41d4-a716-446655440001',
      email: targetEmail,
      tenantId: targetTenantId,
      role: 'workspace_admin',
      firstName: 'Alex',
      lastName: 'Silva',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 dias
    };

    const secret = process.env.JWT_SECRET || 'your-secret-key';
    const token = jwt.sign(payload, secret);

    console.log('\n🔑 NOVO TOKEN JWT:');
    console.log(token);
    console.log('\n✅ Associação concluída com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro durante a associação:', error);
    throw error;
  }
};

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  associateUserToWorkspace()
    .then(() => {
      console.log('\n✅ Script concluído com sucesso');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Erro no script:', error);
      process.exit(1);
    });
}

export { associateUserToWorkspace };
