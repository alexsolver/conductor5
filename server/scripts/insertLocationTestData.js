
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function insertLocationTestData() {
  console.log('🚀 Starting insertion of real location test data...');
  
  const tenantId = '3f99462f-3621-4b1b-bea8-782acc50d62e';
  const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
  
  try {
    // Ensure schema exists
    await pool.query(`CREATE SCHEMA IF NOT EXISTS "${schemaName}"`);
    
    // Call migration function to create tables
    await pool.query(`SELECT create_locations_new_tables_for_tenant('${schemaName}')`);
    
    // Insert real local data
    const localInsertQuery = `
      INSERT INTO "${schemaName}".locais (
        tenant_id, ativo, nome, descricao, codigo_integracao,
        cep, pais, estado, municipio, bairro, tipo_logradouro, logradouro, numero,
        latitude, longitude, fuso_horario
      ) VALUES 
      ($1, true, 'Sede São Paulo', 'Escritório principal da empresa', 'SP-SEDE-001',
       '01310-100', 'Brasil', 'SP', 'São Paulo', 'Bela Vista', 'Avenida', 'Avenida Paulista', '1000',
       -23.5505, -46.6333, 'America/Sao_Paulo'),
      ($1, true, 'Filial Rio de Janeiro', 'Unidade regional Rio de Janeiro', 'RJ-FILIAL-001',
       '20040-020', 'Brasil', 'RJ', 'Rio de Janeiro', 'Centro', 'Avenida', 'Avenida Rio Branco', '500',
       -22.9068, -43.1729, 'America/Sao_Paulo'),
      ($1, true, 'Centro de Distribuição Guarulhos', 'CD principal para distribuição', 'SP-CD-001',
       '07034-911', 'Brasil', 'SP', 'Guarulhos', 'Vila Galvão', 'Rua', 'Rua das Indústrias', '2500',
       -23.4543, -46.5249, 'America/Sao_Paulo')
      ON CONFLICT (id) DO NOTHING
    `;
    
    await pool.query(localInsertQuery, [tenantId]);
    console.log('✅ Local test data inserted successfully');
    
    // Insert real region data
    const regiaoInsertQuery = `
      INSERT INTO "${schemaName}".regioes (
        tenant_id, ativo, nome, descricao, codigo_integracao,
        cep, pais, estado, municipio, bairro, latitude, longitude
      ) VALUES 
      ($1, true, 'Região Sudeste', 'Cobertura completa região sudeste', 'REG-SUDESTE-001',
       '01310-100', 'Brasil', 'SP', 'São Paulo', 'Centro', -23.5505, -46.6333),
      ($1, true, 'Região Sul', 'Cobertura estados do sul', 'REG-SUL-001',
       '80010-000', 'Brasil', 'PR', 'Curitiba', 'Centro', -25.4284, -49.2733)
      ON CONFLICT (id) DO NOTHING
    `;
    
    await pool.query(regiaoInsertQuery, [tenantId]);
    console.log('✅ Region test data inserted successfully');
    
    // Insert real dynamic route data
    const rotaDinamicaInsertQuery = `
      INSERT INTO "${schemaName}".rotas_dinamicas (
        tenant_id, ativo, nome_rota, id_rota, previsao_dias
      ) VALUES 
      ($1, true, 'Rota São Paulo Central', 'SP-CENTRAL-001', 5),
      ($1, true, 'Rota Grande São Paulo', 'SP-GRANDE-001', 7),
      ($1, true, 'Rota Interior SP', 'SP-INTERIOR-001', 10)
      ON CONFLICT (id) DO NOTHING
    `;
    
    await pool.query(rotaDinamicaInsertQuery, [tenantId]);
    console.log('✅ Dynamic route test data inserted successfully');
    
    // Get inserted local IDs for foreign key references
    const locaisResult = await pool.query(`
      SELECT id, nome FROM "${schemaName}".locais 
      WHERE tenant_id = $1 
      ORDER BY nome
    `, [tenantId]);
    
    if (locaisResult.rows.length >= 2) {
      const [local1, local2] = locaisResult.rows;
      
      // Insert real trecho data
      const trechoInsertQuery = `
        INSERT INTO "${schemaName}".trechos (
          tenant_id, ativo, codigo_integracao, local_a_id, local_b_id
        ) VALUES 
        ($1, true, 'TRECHO-SP-RJ-001', $2, $3)
        ON CONFLICT (id) DO NOTHING
      `;
      
      await pool.query(trechoInsertQuery, [tenantId, local1.id, local2.id]);
      console.log('✅ Trecho test data inserted successfully');
    }
    
    // Insert real area data
    const areaInsertQuery = `
      INSERT INTO "${schemaName}".areas (
        tenant_id, ativo, nome, descricao, codigo_integracao, tipo_area, cor_mapa
      ) VALUES 
      ($1, true, 'Área Centro SP', 'Área de cobertura centro de São Paulo', 'AREA-SP-CENTRO-001', 'coordenadas', '#3B82F6'),
      ($1, true, 'Área Zona Sul SP', 'Cobertura zona sul São Paulo', 'AREA-SP-ZS-001', 'raio', '#10B981')
      ON CONFLICT (id) DO NOTHING
    `;
    
    await pool.query(areaInsertQuery, [tenantId]);
    console.log('✅ Area test data inserted successfully');
    
    // Get area IDs for agrupamento
    const areasResult = await pool.query(`
      SELECT id FROM "${schemaName}".areas 
      WHERE tenant_id = $1 
      LIMIT 2
    `, [tenantId]);
    
    if (areasResult.rows.length > 0) {
      const areaIds = areasResult.rows.map(row => row.id);
      
      // Insert real agrupamento data
      const agrupamentoInsertQuery = `
        INSERT INTO "${schemaName}".agrupamentos (
          tenant_id, ativo, nome, descricao, codigo_integracao, areas_vinculadas
        ) VALUES 
        ($1, true, 'Agrupamento São Paulo', 'Agrupamento de áreas de São Paulo', 'AGRUP-SP-001', $2)
        ON CONFLICT (id) DO NOTHING
      `;
      
      await pool.query(agrupamentoInsertQuery, [tenantId, JSON.stringify(areaIds)]);
      console.log('✅ Agrupamento test data inserted successfully');
    }
    
    console.log('🎯 All real location test data inserted successfully!');
    console.log('📊 Mock data has been replaced with real database records');
    
  } catch (error) {
    console.error('❌ Error inserting location test data:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  insertLocationTestData();
}

export default insertLocationTestData;
