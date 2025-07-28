
import { neon } from '@neondatabase/serverless';

async function createTicketRelationships() {
  const sql = neon(process.env.DATABASE_URL);
  
  try {
    // Buscar todos os schemas de tenant
    const schemas = await sql`
      SELECT DISTINCT schemaname 
      FROM pg_tables 
      WHERE schemaname LIKE 'tenant_%'
    `;
    
    console.log(`Encontrados ${schemas.length} schemas de tenant`);
    
    for (const schema of schemas) {
      const schemaName = schema.schemaname;
      console.log(`Criando ticket_relationships no schema: ${schemaName}`);
      
      // Construir SQL como string e executar
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS "${schemaName}".ticket_relationships (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          tenant_id UUID NOT NULL,
          source_ticket_id UUID NOT NULL,
          target_ticket_id UUID NOT NULL,
          relationship_type VARCHAR(50) NOT NULL,
          description TEXT,
          created_by_id UUID,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW(),
          is_active BOOLEAN DEFAULT true,

          CONSTRAINT fk_ticket_relationships_source_${schemaName.replace(/-/g, '_')} 
            FOREIGN KEY (source_ticket_id) REFERENCES "${schemaName}".tickets(id) ON DELETE CASCADE,
          CONSTRAINT fk_ticket_relationships_target_${schemaName.replace(/-/g, '_')} 
            FOREIGN KEY (target_ticket_id) REFERENCES "${schemaName}".tickets(id) ON DELETE CASCADE,
          CONSTRAINT fk_ticket_relationships_created_by_${schemaName.replace(/-/g, '_')} 
            FOREIGN KEY (created_by_id) REFERENCES public.users(id),

          CONSTRAINT chk_no_self_reference_${schemaName.replace(/-/g, '_')} 
            CHECK (source_ticket_id != target_ticket_id),

          CONSTRAINT uk_ticket_relationships_${schemaName.replace(/-/g, '_')} 
            UNIQUE (tenant_id, source_ticket_id, target_ticket_id, relationship_type)
        )
      `;
      
      await sql.unsafe(createTableSQL);
      
      // Criar índices
      const indexQueries = [
        `CREATE INDEX IF NOT EXISTS idx_ticket_relationships_source_${schemaName.replace(/-/g, '_')} ON "${schemaName}".ticket_relationships(tenant_id, source_ticket_id)`,
        `CREATE INDEX IF NOT EXISTS idx_ticket_relationships_target_${schemaName.replace(/-/g, '_')} ON "${schemaName}".ticket_relationships(tenant_id, target_ticket_id)`,
        `CREATE INDEX IF NOT EXISTS idx_ticket_relationships_type_${schemaName.replace(/-/g, '_')} ON "${schemaName}".ticket_relationships(relationship_type)`,
        `CREATE INDEX IF NOT EXISTS idx_ticket_relationships_active_${schemaName.replace(/-/g, '_')} ON "${schemaName}".ticket_relationships(tenant_id, is_active)`
      ];
      
      for (const indexQuery of indexQueries) {
        await sql.unsafe(indexQuery);
      }
      
      console.log(`✅ Tabela criada com sucesso no schema: ${schemaName}`);
    }
    
    console.log('✅ Todas as tabelas ticket_relationships foram criadas com sucesso');
  } catch (error) {
    console.error('❌ Erro ao criar tabela:', error.message);
    console.error(error);
  }
}

createTicketRelationships();
