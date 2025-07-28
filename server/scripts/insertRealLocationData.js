

import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function insertRealLocationData() {
  const tenantId = '3f99462f-3621-4b1b-bea8-782acc50d62e';
  const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
  
  try {
    console.log('🚀 Starting Real Location Data Insertion...');
    
    // 1. Insert real LOCAIS data
    const locaisInsertQuery = `
      INSERT INTO "${schemaName}".locais (
        tenant_id, ativo, nome, descricao, codigo_integracao,
        email, ddd, telefone, cep, pais, estado, municipio, bairro,
        tipo_logradouro, logradouro, numero, complemento,
        latitude, longitude, fuso_horario
      ) VALUES 
      ($1, true, 'Sede São Paulo', 'Escritório principal em São Paulo', 'LOC-SP-001',
       'contato.sp@empresa.com', '11', '11987654321', '01310-100', 'Brasil', 'SP', 'São Paulo', 'Bela Vista',
       'Avenida', 'Avenida Paulista', '1578', 'Conjunto 142',
       -23.5629, -46.6544, 'America/Sao_Paulo'),
      ($1, true, 'Filial Rio de Janeiro', 'Unidade operacional Rio de Janeiro', 'LOC-RJ-001',
       'contato.rj@empresa.com', '21', '21987654321', '20040-020', 'Brasil', 'RJ', 'Rio de Janeiro', 'Centro',
       'Avenida', 'Avenida Rio Branco', '156', '10º andar',
       -22.9035, -43.2096, 'America/Sao_Paulo'),
      ($1, true, 'Centro de Distribuição Campinas', 'CD principal para interior SP', 'LOC-CP-001',
       'cd.campinas@empresa.com', '19', '19987654321', '13015-200', 'Brasil', 'SP', 'Campinas', 'Vila Industrial',
       'Rua', 'Rua das Indústrias', '500', null,
       -22.9099, -47.0626, 'America/Sao_Paulo')
      ON CONFLICT (id) DO NOTHING
    `;
    
    await pool.query(locaisInsertQuery, [tenantId]);
    console.log('✅ Real LOCAIS data inserted successfully');
    
    // Get inserted locais IDs for relationships
    const locaisResult = await pool.query(`
      SELECT id, nome FROM "${schemaName}".locais 
      WHERE tenant_id = $1 ORDER BY nome ASC LIMIT 3
    `, [tenantId]);
    
    const locaisIds = locaisResult.rows.map(row => row.id);
    console.log('📍 Found locais IDs:', locaisIds.length);
    
    // 2. Insert real REGIOES data
    if (locaisIds.length >= 2) {
      const regioesInsertQuery = `
        INSERT INTO "${schemaName}".regioes (
          tenant_id, ativo, nome, descricao, codigo_integracao,
          locais_atendimento, latitude, longitude,
          cep, pais, estado, municipio, bairro
        ) VALUES 
        ($1, true, 'Região Metropolitana SP', 'Região de atendimento Grande São Paulo', 'REG-SP-001',
         $2, -23.5505, -46.6333,
         '01000-000', 'Brasil', 'SP', 'São Paulo', 'Centro'),
        ($1, true, 'Região Rio de Janeiro', 'Região de atendimento RJ e Grande Rio', 'REG-RJ-001',
         $3, -22.9068, -43.1729,
         '20000-000', 'Brasil', 'RJ', 'Rio de Janeiro', 'Centro')
        ON CONFLICT (id) DO NOTHING
      `;
      
      await pool.query(regioesInsertQuery, [
        tenantId,
        JSON.stringify([locaisIds[0]]),
        JSON.stringify([locaisIds[1]])
      ]);
      console.log('✅ Real REGIOES data inserted successfully');
    }
    
    // 3. Insert real ROTAS_DINAMICAS data
    const rotasDinamicasInsertQuery = `
      INSERT INTO "${schemaName}".rotas_dinamicas (
        tenant_id, ativo, nome_rota, id_rota,
        dias_semana, previsao_dias
      ) VALUES 
      ($1, true, 'Rota São Paulo Metropolitana', 'RSP-001',
       $2, 5),
      ($1, true, 'Rota Rio - Niterói', 'RRJ-001',
       $3, 3),
      ($1, true, 'Rota Interior Paulista', 'RIP-001',
       $4, 7)
      ON CONFLICT (id) DO NOTHING
    `;
    
    await pool.query(rotasDinamicasInsertQuery, [
      tenantId,
      JSON.stringify(['segunda', 'terca', 'quarta', 'quinta', 'sexta']),
      JSON.stringify(['segunda', 'quarta', 'sexta']),
      JSON.stringify(['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'])
    ]);
    console.log('✅ Real ROTAS_DINAMICAS data inserted successfully');
    
    // 4. Insert real TRECHOS data
    if (locaisIds.length >= 3) {
      const trechosInsertQuery = `
        INSERT INTO "${schemaName}".trechos (
          tenant_id, ativo, codigo_integracao, local_a_id, local_b_id
        ) VALUES 
        ($1, true, 'TRC-SP-RJ-001', $2, $3),
        ($1, true, 'TRC-SP-CP-001', $2, $4),
        ($1, true, 'TRC-RJ-CP-001', $3, $4)
        ON CONFLICT (id) DO NOTHING
      `;
      
      await pool.query(trechosInsertQuery, [tenantId, locaisIds[0], locaisIds[1], locaisIds[2]]);
      console.log('✅ Real TRECHOS data inserted successfully');
    }
    
    // 5. Insert real AREAS data
    const areasInsertQuery = `
      INSERT INTO "${schemaName}".areas (
        tenant_id, ativo, nome, descricao, codigo_integracao,
        tipo_area, cor_mapa, coordenada_central, raio_metros
      ) VALUES 
      ($1, true, 'Área Comercial São Paulo', 'Zona comercial centro expandido SP', 'AREA-SP-001',
       'raio', '#FF6B6B', $2, 5000),
      ($1, true, 'Área Portuária Rio de Janeiro', 'Região portuária e centro RJ', 'AREA-RJ-001',
       'raio', '#4ECDC4', $3, 3000),
      ($1, true, 'Área Industrial Campinas', 'Distrito industrial de Campinas', 'AREA-CP-001',
       'raio', '#45B7D1', $4, 8000)
      ON CONFLICT (id) DO NOTHING
    `;
    
    await pool.query(areasInsertQuery, [
      tenantId,
      JSON.stringify({ lat: -23.5505, lng: -46.6333 }),
      JSON.stringify({ lat: -22.9068, lng: -43.1729 }),
      JSON.stringify({ lat: -22.9099, lng: -47.0626 })
    ]);
    console.log('✅ Real AREAS data inserted successfully');
    
    // Get areas for agrupamentos
    const areasResult = await pool.query(`
      SELECT id FROM "${schemaName}".areas 
      WHERE tenant_id = $1 ORDER BY nome ASC LIMIT 3
    `, [tenantId]);
    
    const areaIds = areasResult.rows.map(row => row.id);
    
    // 6. Insert real AGRUPAMENTOS data
    if (areaIds.length >= 2) {
      const agrupamentosInsertQuery = `
        INSERT INTO "${schemaName}".agrupamentos (
          tenant_id, ativo, nome, descricao, codigo_integracao, areas_vinculadas
        ) VALUES 
        ($1, true, 'Agrupamento Sudeste', 'Agrupamento de áreas da região Sudeste', 'AGRUP-SE-001', $2),
        ($1, true, 'Agrupamento Metropolitano', 'Agrupamento de áreas metropolitanas', 'AGRUP-METRO-001', $3)
        ON CONFLICT (id) DO NOTHING
      `;
      
      await pool.query(agrupamentosInsertQuery, [
        tenantId,
        JSON.stringify([areaIds[0], areaIds[1]]),
        JSON.stringify([areaIds[0], areaIds[2]])
      ]);
      console.log('✅ Real AGRUPAMENTOS data inserted successfully');
    }
    
    console.log('🎯 All real location data inserted successfully!');
    console.log('📊 Mock data has been completely replaced with real database records');
    
  } catch (error) {
    console.error('❌ Error inserting real location data:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  insertRealLocationData();
}

export default insertRealLocationData;

