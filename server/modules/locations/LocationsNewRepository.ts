// LOCATIONS NEW REPOSITORY - Database operations for 7 record types
import { DatabaseStorage } from "../../storage-simple";
import { NewLocal, NewRegiao, NewRotaDinamica, NewTrecho, NewRotaTrecho, NewArea, NewAgrupamento } from "../../../shared/schema-locations-new";

export class LocationsNewRepository {
  private storage: DatabaseStorage;

  constructor(storage: DatabaseStorage) {
    this.storage = storage;
  }

  // Get records by type with filters
  async getRecordsByType(tenantId: string, recordType: string, filters: { search?: string; status?: string }) {
    const tableName = this.getTableName(recordType);
    let query = `SELECT * FROM tenant_${tenantId.replace(/-/g, '_')}.${tableName} WHERE tenant_id = $1`;
    const params: any[] = [tenantId];
    let paramIndex = 2;

    if (filters.search) {
      const searchFields = this.getSearchFields(recordType);
      const searchConditions = searchFields.map(field => `${field} ILIKE $${paramIndex}`).join(' OR ');
      query += ` AND (${searchConditions})`;
      searchFields.forEach(() => {
        params.push(`%${filters.search}%`);
        paramIndex++;
      });
    }

    if (filters.status && filters.status !== 'all') {
      if (recordType === 'local') {
        query += ` AND status = $${paramIndex}`;
      } else {
        query += ` AND ativo = $${paramIndex}`;
      }
      params.push(filters.status === 'active' ? (recordType === 'local' ? 'active' : true) : false);
      paramIndex++;
    }

    query += ' ORDER BY created_at DESC';

    const result = await this.storage.pool.query(query, params);
    return result.rows;
  }

  // Get statistics by record type
  async getStatsByType(tenantId: string, recordType: string) {
    const tableName = this.getTableName(recordType);
    
    let query: string;
    if (recordType === 'local') {
      query = `
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN status = 'active' THEN 1 END) as active,
          COUNT(CASE WHEN status = 'inactive' THEN 1 END) as inactive,
          COUNT(CASE WHEN status = 'maintenance' THEN 1 END) as maintenance
        FROM tenant_${tenantId.replace(/-/g, '_')}.${tableName} WHERE tenant_id = $1
      `;
    } else {
      query = `
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN ativo = true THEN 1 END) as active,
          COUNT(CASE WHEN ativo = false THEN 1 END) as inactive,
          0 as maintenance
        FROM tenant_${tenantId.replace(/-/g, '_')}.${tableName} WHERE tenant_id = $1
      `;
    }

    const result = await this.storage.pool.query(query, [tenantId]);
    return result.rows[0];
  }

  // Create Local
  async createLocal(tenantId: string, data: NewLocal) {
    const query = `
      INSERT INTO tenant_${tenantId.replace(/-/g, '_')}.locais (
        tenant_id, ativo, descricao, codigo_integracao, cliente_favorecido_id, 
        tecnico_principal_id, email, ddd, telefone, cep, pais, estado, municipio, 
        bairro, tipo_logradouro, logradouro, numero, complemento, latitude, longitude, 
        fuso_horario, horario_funcionamento, intervalos_funcionamento, 
        feriados_incluidos, indisponibilidades, status
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26
      ) RETURNING *
    `;
    
    const params = [
      tenantId, data.ativo, data.descricao, data.codigoIntegracao, data.clienteFavorecidoId,
      data.tecnicoPrincipalId, data.email, data.ddd, data.telefone, data.cep, data.pais,
      data.estado, data.municipio, data.bairro, data.tipoLogradouro, data.logradouro,
      data.numero, data.complemento, data.latitude, data.longitude, data.fusoHorario,
      JSON.stringify(data.horarioFuncionamento), JSON.stringify(data.intervalosFuncionamento),
      JSON.stringify(data.feriadosIncluidos), JSON.stringify(data.indisponibilidades), data.status
    ];

    const result = await this.storage.pool.query(query, params);
    return result.rows[0];
  }

  // Create Região
  async createRegiao(tenantId: string, data: NewRegiao) {
    const query = `
      INSERT INTO tenant_${tenantId.replace(/-/g, '_')}.regioes (
        tenant_id, ativo, nome, descricao, codigo_integracao, clientes_vinculados,
        tecnico_principal_id, grupos_vinculados, locais_atendimento, latitude, longitude,
        ceps_abrangidos, cep, pais, estado, municipio, bairro, tipo_logradouro,
        logradouro, numero, complemento
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21
      ) RETURNING *
    `;
    
    const params = [
      tenantId, data.ativo, data.nome, data.descricao, data.codigoIntegracao,
      JSON.stringify(data.clientesVinculados), data.tecnicoPrincipalId,
      JSON.stringify(data.gruposVinculados), JSON.stringify(data.locaisAtendimento),
      data.latitude, data.longitude, JSON.stringify(data.cepsAbrangidos), data.cep,
      data.pais, data.estado, data.municipio, data.bairro, data.tipoLogradouro,
      data.logradouro, data.numero, data.complemento
    ];

    const result = await this.storage.pool.query(query, params);
    return result.rows[0];
  }

  // Create Rota Dinâmica
  async createRotaDinamica(tenantId: string, data: NewRotaDinamica) {
    const query = `
      INSERT INTO tenant_${tenantId.replace(/-/g, '_')}.rotas_dinamicas (
        tenant_id, ativo, nome_rota, id_rota, clientes_vinculados,
        regioes_atendidas, dias_semana, previsao_dias
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *
    `;
    
    const params = [
      tenantId, data.ativo, data.nomeRota, data.idRota,
      JSON.stringify(data.clientesVinculados), JSON.stringify(data.regioesAtendidas),
      JSON.stringify(data.diasSemana), data.previsaoDias
    ];

    const result = await this.storage.pool.query(query, params);
    return result.rows[0];
  }

  // Create Trecho
  async createTrecho(tenantId: string, data: NewTrecho) {
    const query = `
      INSERT INTO tenant_${tenantId.replace(/-/g, '_')}.trechos (tenant_id, ativo, codigo_integracao, local_a_id, local_b_id)
      VALUES ($1, $2, $3, $4, $5) RETURNING *
    `;
    
    const params = [tenantId, data.ativo, data.codigoIntegracao, data.localAId, data.localBId];
    const result = await this.storage.pool.query(query, params);
    return result.rows[0];
  }

  // Create Rota de Trecho
  async createRotaTrecho(tenantId: string, data: NewRotaTrecho) {
    const query = `
      INSERT INTO tenant_${tenantId.replace(/-/g, '_')}.rotas_trecho (tenant_id, ativo, id_rota, trechos_ids)
      VALUES ($1, $2, $3, $4) RETURNING *
    `;
    
    const params = [tenantId, data.ativo, data.idRota, JSON.stringify([])]; // Start with empty trechos array
    const result = await this.storage.pool.query(query, params);
    return result.rows[0];
  }

  // Create Área
  async createArea(tenantId: string, data: NewArea) {
    const query = `
      INSERT INTO tenant_${tenantId.replace(/-/g, '_')}.areas (
        tenant_id, ativo, nome, descricao, codigo_integracao,
        tipo_area, cor_mapa, dados_geograficos
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *
    `;
    
    const params = [
      tenantId, data.ativo, data.nome, data.descricao, data.codigoIntegracao,
      data.tipoArea, data.corMapa, JSON.stringify(data.dadosGeograficos)
    ];

    const result = await this.storage.pool.query(query, params);
    return result.rows[0];
  }

  // Create Agrupamento
  async createAgrupamento(tenantId: string, data: NewAgrupamento) {
    const query = `
      INSERT INTO tenant_${tenantId.replace(/-/g, '_')}.agrupamentos (
        tenant_id, ativo, nome, descricao, codigo_integracao, areas_vinculadas
      ) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *
    `;
    
    const params = [
      tenantId, data.ativo, data.nome, data.descricao, 
      data.codigoIntegracao, JSON.stringify(data.areasVinculadas)
    ];

    const result = await this.storage.pool.query(query, params);
    return result.rows[0];
  }

  // Update record by type
  async updateRecord(tenantId: string, recordType: string, id: string, data: any) {
    const tableName = this.getTableName(recordType);
    const fields = Object.keys(data);
    const setClause = fields.map((field, index) => `${field} = $${index + 3}`).join(', ');
    
    const query = `UPDATE tenant_${tenantId.replace(/-/g, '_')}.${tableName} SET ${setClause}, updated_at = NOW() WHERE tenant_id = $1 AND id = $2 RETURNING *`;
    const params = [tenantId, id, ...Object.values(data)];

    const result = await this.storage.pool.query(query, params);
    return result.rows[0];
  }

  // Delete record by type
  async deleteRecord(tenantId: string, recordType: string, id: string) {
    const tableName = this.getTableName(recordType);
    const query = `DELETE FROM tenant_${tenantId.replace(/-/g, '_')}.${tableName} WHERE tenant_id = $1 AND id = $2`;
    await this.storage.pool.query(query, [tenantId, id]);
  }

  // Helper methods
  private getTableName(recordType: string): string {
    const tableMap: { [key: string]: string } = {
      local: 'locais',
      regiao: 'regioes',
      rota_dinamica: 'rotas_dinamicas',
      trecho: 'trechos',
      rota_trecho: 'rotas_trecho',
      area: 'areas',
      agrupamento: 'agrupamentos'
    };
    return tableMap[recordType] || 'locais';
  }

  private getSearchFields(recordType: string): string[] {
    const searchFieldsMap: { [key: string]: string[] } = {
      local: ['descricao', 'codigo_integracao', 'logradouro'],
      regiao: ['nome', 'descricao', 'codigo_integracao'],
      rota_dinamica: ['nome_rota', 'id_rota'],
      trecho: ['codigo_integracao'],
      rota_trecho: ['id_rota'],
      area: ['nome', 'descricao', 'codigo_integracao'],
      agrupamento: ['nome', 'descricao', 'codigo_integracao']
    };
    return searchFieldsMap[recordType] || ['nome', 'descricao'];
  }
}