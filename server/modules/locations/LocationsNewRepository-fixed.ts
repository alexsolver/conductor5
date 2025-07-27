// LOCATIONS NEW REPOSITORY - SQL DIRETO PARA RESOLVER PROBLEMAS DE PARÂMETROS
import { NewLocal } from "../../../shared/schema-locations-new";

export class LocationsNewRepository {
  private pool: any;

  constructor(pool: any) {
    this.pool = pool;
  }

  // Get records by type
  async getRecordsByType(tenantId: string, recordType: string, filters?: any) {
    const tableNames: { [key: string]: string } = {
      'local': 'locais',
      'regiao': 'regioes',
      'rota-dinamica': 'rotas_dinamicas',
      'trecho': 'trechos',
      'rota-trecho': 'rotas_trecho',
      'area': 'areas',
      'agrupamento': 'agrupamentos'
    };

    const tableName = tableNames[recordType];
    if (!tableName) {
      throw new Error(`Invalid record type: ${recordType}`);
    }

    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
    let query = `SELECT * FROM "${schemaName}"."${tableName}" WHERE tenant_id = $1`;
    const params = [tenantId];

    if (filters?.search) {
      query += ` AND (nome ILIKE $${params.length + 1} OR descricao ILIKE $${params.length + 1})`;
      params.push(`%${filters.search}%`);
    }

    if (filters?.status) {
      query += ` AND ativo = $${params.length + 1}`;
      params.push(filters.status === 'active');
    }

    query += ` ORDER BY created_at DESC`;

    try {
      const result = await this.pool.query(query, params);
      return result.rows || [];
    } catch (error) {
      console.error(`Error fetching ${recordType} records:`, error);
      return [];
    }
  }

  // Get statistics by record type
  async getStatsByType(tenantId: string, recordType: string) {
    const tableNames: { [key: string]: string } = {
      'local': 'locais',
      'regiao': 'regioes',
      'rota-dinamica': 'rotas_dinamicas',
      'trecho': 'trechos',
      'rota-trecho': 'rotas_trecho',
      'area': 'areas',
      'agrupamento': 'agrupamentos'
    };

    const tableName = tableNames[recordType];
    if (!tableName) {
      throw new Error(`Invalid record type: ${recordType}`);
    }

    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
    const query = `
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE ativo = true) as active,
        COUNT(*) FILTER (WHERE ativo = false) as inactive
      FROM "${schemaName}"."${tableName}" 
      WHERE tenant_id = $1
    `;

    const result = await this.pool.query(query, [tenantId]);
    const stats = result.rows[0] || { total: 0, active: 0, inactive: 0 };
    
    return {
      total: parseInt(stats.total) || 0,
      active: parseInt(stats.active) || 0,
      inactive: parseInt(stats.inactive) || 0
    };
  }

  // CRUD Operations for Local
  async createLocal(tenantId: string, data: NewLocal) {
    try {
      const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
      const query = `
        INSERT INTO "${schemaName}"."locais" (
          tenant_id, ativo, nome, descricao, codigo_integracao, 
          tipo_cliente_favorecido, tecnico_principal_id, email, ddd, telefone,
          cep, pais, estado, municipio, bairro, tipo_logradouro, logradouro, 
          numero, complemento, latitude, longitude, geo_coordenadas,
          fuso_horario, feriados_incluidos, indisponibilidades
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
          $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
          $21, $22, $23, $24, $25
        ) RETURNING *
      `;

      const values = [
        tenantId, 
        data.ativo ?? true, 
        data.nome, 
        data.descricao || null, 
        data.codigoIntegracao || null,
        data.tipoClienteFavorecido || null, 
        data.tecnicoPrincipalId || null, 
        data.email || null, 
        data.ddd || null, 
        data.telefone || null,
        data.cep || null, 
        data.pais || 'Brasil', 
        data.estado || null, 
        data.municipio || null, 
        data.bairro || null, 
        data.tipoLogradouro || null, 
        data.logradouro || null,
        data.numero || null, 
        data.complemento || null, 
        data.latitude || null, 
        data.longitude || null, 
        data.geoCoordenadas || null,
        data.fusoHorario || 'America/Sao_Paulo', 
        data.feriadosIncluidos || null, 
        data.indisponibilidades || null
      ];

      const result = await this.pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error creating local:', error);
      throw error;
    }
  }

  // Generic create method for other record types
  async createRecordByType(tenantId: string, recordType: string, data: any) {
    const tableNames: { [key: string]: string } = {
      'local': 'locais',
      'regiao': 'regioes',
      'rota-dinamica': 'rotas_dinamicas',
      'trecho': 'trechos',
      'rota-trecho': 'rotas_trecho',
      'area': 'areas',
      'agrupamento': 'agrupamentos'
    };

    const tableName = tableNames[recordType];
    if (!tableName) {
      throw new Error(`Invalid record type: ${recordType}`);
    }

    // For now, only local is fully implemented
    if (recordType === 'local') {
      return this.createLocal(tenantId, data);
    }

    throw new Error(`Creation for ${recordType} not yet implemented`);
  }

  // Get record by ID
  async getRecordById(tenantId: string, recordType: string, id: string) {
    const tableNames: { [key: string]: string } = {
      'local': 'locais',
      'regiao': 'regioes',
      'rota-dinamica': 'rotas_dinamicas',
      'trecho': 'trechos',
      'rota-trecho': 'rotas_trecho',
      'area': 'areas',
      'agrupamento': 'agrupamentos'
    };

    const tableName = tableNames[recordType];
    if (!tableName) {
      throw new Error(`Invalid record type: ${recordType}`);
    }

    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
    const query = `SELECT * FROM "${schemaName}"."${tableName}" WHERE tenant_id = $1 AND id = $2`;

    const result = await this.pool.query(query, [tenantId, id]);
    return result.rows[0] || null;
  }

  // Update record by ID
  async updateRecordById(tenantId: string, recordType: string, id: string, data: any) {
    // Implementation pending based on specific requirements
    throw new Error(`Update for ${recordType} not yet implemented`);
  }

  // Delete record by ID
  async deleteRecordById(tenantId: string, recordType: string, id: string) {
    const tableNames: { [key: string]: string } = {
      'local': 'locais',
      'regiao': 'regioes',
      'rota-dinamica': 'rotas_dinamicas',
      'trecho': 'trechos',
      'rota-trecho': 'rotas_trecho',
      'area': 'areas',
      'agrupamento': 'agrupamentos'
    };

    const tableName = tableNames[recordType];
    if (!tableName) {
      throw new Error(`Invalid record type: ${recordType}`);
    }

    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
    const query = `DELETE FROM "${schemaName}"."${tableName}" WHERE tenant_id = $1 AND id = $2 RETURNING *`;

    const result = await this.pool.query(query, [tenantId, id]);
    return result.rows[0] || null;
  }
}