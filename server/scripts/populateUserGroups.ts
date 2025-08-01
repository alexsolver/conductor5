
import { pool } from '../db';

async function populateDefaultUserGroups() {
  try {
    console.log('🔧 Iniciando população de grupos de usuários padrão...');

    // Buscar todos os tenants
    const tenantsResult = await pool.query('SELECT id FROM public.tenants WHERE is_active = true');
    
    for (const tenant of tenantsResult.rows) {
      const tenantId = tenant.id;
      const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
      
      console.log(`📊 Processando tenant: ${tenantId}`);
      
      // Verificar se a tabela user_groups existe
      const tableExists = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = $1 AND table_name = 'user_groups'
        )
      `, [schemaName]);
      
      if (!tableExists.rows[0].exists) {
        console.log(`⚠️ Tabela user_groups não existe para tenant ${tenantId}, criando...`);
        
        // Criar tabela user_groups
        await pool.query(`
          CREATE TABLE IF NOT EXISTS "${schemaName}".user_groups (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id UUID NOT NULL,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW(),
            created_by UUID,
            CONSTRAINT fk_user_groups_tenant FOREIGN KEY (tenant_id) REFERENCES public.tenants(id)
          )
        `);
      }
      
      // Verificar se já existem grupos
      const existingGroups = await pool.query(`
        SELECT COUNT(*) as count FROM "${schemaName}".user_groups WHERE tenant_id = $1 AND is_active = true
      `, [tenantId]);
      
      if (parseInt(existingGroups.rows[0].count) === 0) {
        console.log(`➕ Inserindo grupos padrão para tenant ${tenantId}`);
        
        const defaultGroups = [
          { id: 'level1-' + tenantId, name: 'Nível 1 - Suporte', description: 'Suporte de primeiro nível' },
          { id: 'level2-' + tenantId, name: 'Nível 2 - Técnico', description: 'Suporte técnico especializado' },
          { id: 'level3-' + tenantId, name: 'Nível 3 - Especialista', description: 'Especialistas e engenheiros' },
          { id: 'network-' + tenantId, name: 'Equipe de Rede', description: 'Especialistas em infraestrutura de rede' },
          { id: 'security-' + tenantId, name: 'Equipe de Segurança', description: 'Especialistas em segurança da informação' },
          { id: 'development-' + tenantId, name: 'Desenvolvimento', description: 'Equipe de desenvolvimento de software' }
        ];
        
        for (const group of defaultGroups) {
          await pool.query(`
            INSERT INTO "${schemaName}".user_groups (id, tenant_id, name, description, is_active, created_at)
            VALUES ($1, $2, $3, $4, true, NOW())
            ON CONFLICT (id) DO NOTHING
          `, [group.id, tenantId, group.name, group.description]);
        }
        
        console.log(`✅ ${defaultGroups.length} grupos criados para tenant ${tenantId}`);
      } else {
        console.log(`ℹ️ Tenant ${tenantId} já possui ${existingGroups.rows[0].count} grupos`);
      }
    }
    
    console.log('✅ População de grupos de usuários concluída!');
    
  } catch (error) {
    console.error('❌ Erro ao popular grupos de usuários:', error);
    throw error;
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  populateDefaultUserGroups()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export { populateDefaultUserGroups };
