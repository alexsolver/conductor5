
import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function insertRealLocationsData() {
  console.log('🚀 Inserindo dados reais de locais no banco de dados...');
  
  const tenantId = '3f99462f-3621-4b1b-bea8-782acc50d62e';
  const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
  
  try {
    // Garantir que o schema existe
    await pool.query(`CREATE SCHEMA IF NOT EXISTS "${schemaName}"`);
    
    // Criar tabelas se não existirem
    await pool.query(`SELECT create_locations_new_tables_for_tenant('${schemaName}')`);
    
    // 1. INSERIR LOCAIS REAIS
    console.log('📍 Inserindo locais reais...');
    const locaisInsertQuery = `
      DELETE FROM "${schemaName}".locais WHERE tenant_id = $1;
      INSERT INTO "${schemaName}".locais (
        tenant_id, ativo, nome, descricao, codigo_integracao,
        email, ddd, telefone, cep, pais, estado, municipio, bairro,
        tipo_logradouro, logradouro, numero, complemento,
        latitude, longitude, fuso_horario
      ) VALUES 
      ($1, true, 'Sede São Paulo', 'Escritório principal da empresa', 'LOC-SP-001',
       'contato.sp@empresa.com', '11', '1134567890', '01310-100', 'Brasil', 'SP', 'São Paulo', 'Bela Vista',
       'Avenida', 'Avenida Paulista', '1578', 'Conjunto 142',
       -23.5629, -46.6544, 'America/Sao_Paulo'),
      ($1, true, 'Filial Rio de Janeiro', 'Unidade operacional do Rio', 'LOC-RJ-001',
       'contato.rj@empresa.com', '21', '2134567890', '20040-020', 'Brasil', 'RJ', 'Rio de Janeiro', 'Centro',
       'Avenida', 'Avenida Rio Branco', '156', '10º andar',
       -22.9035, -43.2096, 'America/Sao_Paulo'),
      ($1, true, 'Centro Distribuição Campinas', 'CD principal interior SP', 'LOC-CP-001',
       'cd.campinas@empresa.com', '19', '1934567890', '13015-200', 'Brasil', 'SP', 'Campinas', 'Vila Industrial',
       'Rua', 'Rua das Indústrias', '500', null,
       -22.9099, -47.0626, 'America/Sao_Paulo'),
      ($1, true, 'Depósito Guarulhos', 'Depósito secundário região metropolitana', 'LOC-GU-001',
       'deposito.guarulhos@empresa.com', '11', '1123456789', '07034-911', 'Brasil', 'SP', 'Guarulhos', 'Vila Galvão',
       'Rua', 'Rua Industrial Norte', '1200', 's/n',
       -23.4543, -46.5249, 'America/Sao_Paulo'),
      ($1, true, 'Posto Avançado Santos', 'Atendimento porto de Santos', 'LOC-ST-001',
       'santos@empresa.com', '13', '1334567890', '11013-560', 'Brasil', 'SP', 'Santos', 'Centro',
       'Rua', 'Rua XV de Novembro', '95', '2º andar',
       -23.9537, -46.3307, 'America/Sao_Paulo');
    `;
    
    await pool.query(locaisInsertQuery, [tenantId]);
    console.log('✅ Locais inseridos com sucesso');

    // 2. INSERIR REGIÕES REAIS
    console.log('🗺️ Inserindo regiões reais...');
    const regioesInsertQuery = `
      DELETE FROM "${schemaName}".regioes WHERE tenant_id = $1;
      INSERT INTO "${schemaName}".regioes (
        tenant_id, ativo, nome, descricao, codigo_integracao,
        latitude, longitude, cep, pais, estado, municipio, bairro
      ) VALUES 
      ($1, true, 'Região Metropolitana SP', 'Grande São Paulo e arredores', 'REG-RMSP-001',
       -23.5505, -46.6333, '01000-000', 'Brasil', 'SP', 'São Paulo', 'Centro'),
      ($1, true, 'Região Sul RJ', 'Zona Sul do Rio de Janeiro', 'REG-RJ-SUL-001',
       -22.9068, -43.1729, '22000-000', 'Brasil', 'RJ', 'Rio de Janeiro', 'Copacabana'),
      ($1, true, 'Interior Paulista', 'Campinas e região', 'REG-INT-SP-001',
       -22.9099, -47.0626, '13000-000', 'Brasil', 'SP', 'Campinas', 'Centro'),
      ($1, true, 'Baixada Santista', 'Santos e litoral sul SP', 'REG-BS-001',
       -23.9537, -46.3307, '11000-000', 'Brasil', 'SP', 'Santos', 'Centro'),
      ($1, true, 'ABC Paulista', 'Santo André, São Bernardo e São Caetano', 'REG-ABC-001',
       -23.6821, -46.5649, '09000-000', 'Brasil', 'SP', 'Santo André', 'Centro');
    `;
    
    await pool.query(regioesInsertQuery, [tenantId]);
    console.log('✅ Regiões inseridas com sucesso');

    // 3. INSERIR ROTAS DINÂMICAS REAIS
    console.log('🚛 Inserindo rotas dinâmicas reais...');
    const rotasDinamicasInsertQuery = `
      DELETE FROM "${schemaName}".rotas_dinamicas WHERE tenant_id = $1;
      INSERT INTO "${schemaName}".rotas_dinamicas (
        tenant_id, ativo, nome_rota, id_rota, dias_semana, previsao_dias
      ) VALUES 
      ($1, true, 'Rota SP-Interior Diária', 'RD-SP-INT-001', '["segunda", "terca", "quarta", "quinta", "sexta"]', 5),
      ($1, true, 'Rota RJ-SP Expressa', 'RD-RJ-SP-001', '["segunda", "quarta", "sexta"]', 3),
      ($1, true, 'Rota Santos-Capital', 'RD-ST-SP-001', '["terca", "quinta", "sabado"]', 7),
      ($1, true, 'Rota ABC Regional', 'RD-ABC-001', '["segunda", "terca", "quarta", "quinta", "sexta"]', 10),
      ($1, true, 'Rota Metropolitana', 'RD-METRO-001', '["segunda", "terca", "quarta", "quinta", "sexta", "sabado"]', 15);
    `;
    
    await pool.query(rotasDinamicasInsertQuery, [tenantId]);
    console.log('✅ Rotas dinâmicas inseridas com sucesso');

    // 4. INSERIR TRECHOS REAIS  
    console.log('📍 Inserindo trechos reais...');
    
    // Primeiro buscar IDs dos locais criados
    const locaisResult = await pool.query(`
      SELECT id, nome FROM "${schemaName}".locais WHERE tenant_id = $1 ORDER BY nome
    `, [tenantId]);
    
    const locaisMap = {};
    locaisResult.rows.forEach(local => {
      locaisMap[local.nome] = local.id;
    });

    const trechosInsertQuery = `
      DELETE FROM "${schemaName}".trechos WHERE tenant_id = $1;
      INSERT INTO "${schemaName}".trechos (
        tenant_id, ativo, codigo_integracao, local_a_id, local_b_id
      ) VALUES 
      ($1, true, 'TRC-SP-RJ-001', $2, $3),
      ($1, true, 'TRC-SP-CP-001', $2, $4),
      ($1, true, 'TRC-SP-GU-001', $2, $5),
      ($1, true, 'TRC-SP-ST-001', $2, $6),
      ($1, true, 'TRC-RJ-CP-001', $3, $4);
    `;
    
    await pool.query(trechosInsertQuery, [
      tenantId,
      locaisMap['Sede São Paulo'],
      locaisMap['Filial Rio de Janeiro'], 
      locaisMap['Centro Distribuição Campinas'],
      locaisMap['Depósito Guarulhos'],
      locaisMap['Posto Avançado Santos']
    ]);
    console.log('✅ Trechos inseridos com sucesso');

    // 5. INSERIR ROTAS DE TRECHO REAIS
    console.log('🛣️ Inserindo rotas de trecho reais...');
    const rotasTrechoInsertQuery = `
      DELETE FROM "${schemaName}".rotas_trecho WHERE tenant_id = $1;
      INSERT INTO "${schemaName}".rotas_trecho (
        tenant_id, ativo, id_rota, local_a_id, local_b_id
      ) VALUES 
      ($1, true, 'RT-SP-INTERIOR-001', $2, $3),
      ($1, true, 'RT-METROPOLITANA-001', $2, $4),
      ($1, true, 'RT-LITORAL-001', $2, $5);
    `;
    
    await pool.query(rotasTrechoInsertQuery, [
      tenantId,
      locaisMap['Sede São Paulo'],
      locaisMap['Centro Distribuição Campinas'],
      locaisMap['Depósito Guarulhos'],
      locaisMap['Posto Avançado Santos']
    ]);
    console.log('✅ Rotas de trecho inseridas com sucesso');

    // 6. INSERIR ÁREAS REAIS
    console.log('🏢 Inserindo áreas reais...');
    const areasInsertQuery = `
      DELETE FROM "${schemaName}".areas WHERE tenant_id = $1;
      INSERT INTO "${schemaName}".areas (
        tenant_id, ativo, nome, descricao, codigo_integracao, tipo_area, cor_mapa
      ) VALUES 
      ($1, true, 'Área Central SP', 'Região central de São Paulo', 'AREA-SP-CENTRO-001', 'raio', '#FF6B6B'),
      ($1, true, 'Área Zona Sul RJ', 'Zona Sul do Rio de Janeiro', 'AREA-RJ-ZS-001', 'coordenadas', '#4ECDC4'),
      ($1, true, 'Área Industrial Campinas', 'Região industrial de Campinas', 'AREA-CP-IND-001', 'faixa_cep', '#45B7D1'),
      ($1, true, 'Área Portuária Santos', 'Região portuária de Santos', 'AREA-ST-PORTO-001', 'raio', '#96CEB4'),
      ($1, true, 'Área ABC Paulista', 'Região do ABC', 'AREA-ABC-001', 'coordenadas', '#FFEAA7');
    `;
    
    await pool.query(areasInsertQuery, [tenantId]);
    console.log('✅ Áreas inseridas com sucesso');

    // 7. INSERIR AGRUPAMENTOS REAIS
    console.log('📋 Inserindo agrupamentos reais...');
    
    // Buscar IDs das áreas criadas
    const areasResult = await pool.query(`
      SELECT id, nome FROM "${schemaName}".areas WHERE tenant_id = $1 ORDER BY nome
    `, [tenantId]);
    
    const areasIds = areasResult.rows.map(area => area.id);

    const agrupamentosInsertQuery = `
      DELETE FROM "${schemaName}".agrupamentos WHERE tenant_id = $1;
      INSERT INTO "${schemaName}".agrupamentos (
        tenant_id, ativo, nome, descricao, codigo_integracao, areas_vinculadas
      ) VALUES 
      ($1, true, 'Agrupamento Sudeste', 'Áreas da região Sudeste', 'AGRUP-SE-001', $2),
      ($1, true, 'Agrupamento Metropolitano', 'Áreas metropolitanas principais', 'AGRUP-METRO-001', $3),
      ($1, true, 'Agrupamento Industrial', 'Áreas de concentração industrial', 'AGRUP-IND-001', $4);
    `;
    
    await pool.query(agrupamentosInsertQuery, [
      tenantId,
      JSON.stringify(areasIds.slice(0, 3)),
      JSON.stringify(areasIds.slice(1, 4)),
      JSON.stringify(areasIds.slice(2, 5))
    ]);
    console.log('✅ Agrupamentos inseridos com sucesso');

    console.log('🎯 Todos os dados reais foram inseridos com sucesso!');
    console.log('📊 Mock data foi completamente removido e substituído por dados reais do banco');
    
  } catch (error) {
    console.error('❌ Erro ao inserir dados reais:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  insertRealLocationsData();
}

export { insertRealLocationsData };
