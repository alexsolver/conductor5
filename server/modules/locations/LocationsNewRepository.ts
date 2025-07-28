import { eq, and, sql, desc, ilike } from "drizzle-orm";
import { locais, regioes, rotasDinamicas, trechos, rotasTrecho, areas, agrupamentos } from "../../../shared/schema-locations-new";
import type { 
  NewLocal, NewRegiao, NewRotaDinamica, NewTrecho, 
  NewRotaTrecho, NewArea, NewAgrupamento 
} from "../../../shared/schema-locations-new";

export class LocationsNewRepository {
  private db: any;

  constructor(db: any) {
    this.db = db;
  }

  // Integration methods for region relationships
  async getClientes(tenantId: string) {
    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
    const query = `
      SELECT id, nome, email, telefone, ativo, created_at
      FROM "${schemaName}".locais
      WHERE tenant_id = $1 AND ativo = true
      ORDER BY nome ASC
    `;

    const result = await this.db.execute(sql`${sql.raw(query)}`, [tenantId]);
    return result.rows.map(row => ({
      id: row.id,
      nome: row.nome,
      email: row.email,
      telefone: row.telefone,
      ativo: row.ativo,
      createdAt: row.created_at
    }));
  }

  async getTecnicosEquipe(tenantId: string) {
    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
    const query = `
      SELECT id, nome, email, tipo_usuario, ativo, created_at
      FROM "${schemaName}".usuarios
      WHERE tenant_id = $1 
        AND tipo_usuario IN ('agent', 'workspaceAdmin') 
        AND ativo = true
      ORDER BY nome ASC
    `;

    const result = await this.db.execute(sql`${sql.raw(query)}`, [tenantId]);
    return result.rows.map(row => ({
      id: row.id,
      name: row.nome,
      email: row.email,
      role: row.tipo_usuario,
      status: row.ativo,
      createdAt: row.created_at
    }));
  }

  async getGruposEquipe(tenantId: string) {
    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
    const query = `
      SELECT g.id, g.nome, g.descricao, g.created_at,
             COUNT(gm.usuario_id) as member_count
      FROM "${schemaName}".grupos g
      LEFT JOIN "${schemaName}".grupo_membros gm ON g.id = gm.grupo_id
      WHERE g.tenant_id = $1 AND g.ativo = true
      GROUP BY g.id, g.nome, g.descricao, g.created_at
      ORDER BY g.nome ASC
    `;

    const result = await this.db.execute(sql`${sql.raw(query)}`, [tenantId]);
    return result.rows.map(row => ({
      id: row.id,
      name: row.nome,
      description: row.descricao,
      memberCount: parseInt(row.member_count) || 0,
      createdAt: row.created_at
    }));
  }

  async getLocaisAtendimento(tenantId: string) {
    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
    const query = `
      SELECT id, nome, descricao, cep, municipio, estado, 
             ativo, created_at
      FROM "${schemaName}".locais
      WHERE tenant_id = $1 AND ativo = true
      ORDER BY nome ASC
    `;

    const result = await this.db.execute(sql`${sql.raw(query)}`, [tenantId]);
    return result.rows.map(row => ({
      id: row.id,
      name: row.nome,
      description: row.descricao,
      cep: row.cep,
      municipio: row.municipio,
      estado: row.estado,
      active: row.ativo,
      createdAt: row.created_at,
      displayName: `${row.nome}${row.municipio ? ` - ${row.municipio}/${row.estado}` : ''}`
    }));
  }

  // Get records by type with filtering
  async getRecordsByType(tenantId: string, recordType: string, filters?: { search?: string; status?: string }) {
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

    // Use raw SQL with tenant schema
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
      const result = await this.db.execute(sql.raw(query, params));
      return result || [];
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

    // Use raw SQL with tenant schema
    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
    const query = `
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE ativo = true) as active,
        COUNT(*) FILTER (WHERE ativo = false) as inactive
      FROM "${schemaName}"."${tableName}" 
      WHERE tenant_id = $1
    `;

    const result = await this.db.execute(sql`${sql.raw(query)}`, [tenantId]);
    const stats = result[0] || { total: 0, active: 0, inactive: 0 };

    return {
      total: parseInt(stats.total) || 0,
      active: parseInt(stats.active) || 0,
      inactive: parseInt(stats.inactive) || 0
    };
  }

  // CRUD Operations for Local
  async createLocal(tenantId: string, data: NewLocal) {
    try {
      // Use raw SQL for tenant-specific schema
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
        tenantId, data.ativo, data.nome, data.descricao, data.codigoIntegracao,
        data.tipoClienteFavorecido, data.tecnicoPrincipalId, data.email, data.ddd, data.telefone,
        data.cep, data.pais, data.estado, data.municipio, data.bairro, data.tipoLogradouro, data.logradouro,
        data.numero, data.complemento, data.latitude, data.longitude, data.geoCoordenadas,
        data.fusoHorario, data.feriadosIncluidos, data.indisponibilidades
      ];

      const result = await this.db.execute(sql`${sql.raw(query)}`, values);
      return result[0];
    } catch (error) {
      console.error('Error creating local:', error);
      throw error;
    }
  }

  async createRegiao(tenantId: string, data: NewRegiao) {
    try {
      // Use raw SQL for tenant-specific schema
      const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
      const query = `
        INSERT INTO "${schemaName}"."regioes" (
          tenant_id, ativo, nome, descricao, codigo_integracao,
          clientes_vinculados, tecnico_principal_id, grupos_vinculados, locais_atendimento,
          latitude, longitude, ceps_abrangidos,
          cep, pais, estado, municipio, bairro, tipo_logradouro, logradouro, numero, complemento
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21
        ) RETURNING *
      `;

      const values = [
        tenantId, data.ativo, data.nome, data.descricao, data.codigoIntegracao,
        data.clientesVinculados, data.tecnicoPrincipalId, data.gruposVinculados, data.locaisAtendimento,
        data.latitude, data.longitude, data.cepsAbrangidos,
        data.cep, data.pais, data.estado, data.municipio, data.bairro, data.tipoLogradouro, data.logradouro, data.numero, data.complemento
      ];

      const result = await this.db.execute(sql`${sql.raw(query)}`, values);
      return result[0];
    } catch (error) {
      console.error('Error creating regiao:', error);
      throw error;
    }
  }

  async createRotaDinamica(tenantId: string, data: NewRotaDinamica) {
    const [rota] = await this.db
      .insert(rotasDinamicas)
      .values({ ...data, tenantId })
      .returning();
    return rota;
  }

  async createTrecho(tenantId: string, data: NewTrecho) {
    const [trecho] = await this.db
      .insert(trechos)
      .values({ ...data, tenantId })
      .returning();
    return trecho;
  }

  async createRotaTrecho(tenantId: string, data: NewRotaTrecho) {
    const [rotaTrecho] = await this.db
      .insert(rotasTrecho)
      .values({ ...data, tenantId })
      .returning();
    return rotaTrecho;
  }

  async createArea(tenantId: string, data: NewArea) {
    const [area] = await this.db
      .insert(areas)
      .values({ ...data, tenantId })
      .returning();
    return area;
  }

  async createAgrupamento(tenantId: string, data: NewAgrupamento) {
    const [agrupamento] = await this.db
      .insert(agrupamentos)
      .values({ ...data, tenantId })
      .returning();
    return agrupamento;
  }

  // Integration methods for region relationships
  async getClientes(tenantId: string) {
    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
    const query = `
      SELECT id, nome, email, telefone, ativo, created_at
      FROM "${schemaName}".clientes
      WHERE tenant_id = $1 AND ativo = true
      ORDER BY nome ASC
    `;

    try {
      const result = await this.db.execute(sql.raw(query, [tenantId]));
      return result.map(row => ({
        id: row.id,
        nome: row.nome,
        email: row.email,
        telefone: row.telefone,
        ativo: row.ativo,
        createdAt: row.created_at
      }));
    } catch (error) {
      console.error('Error fetching clientes:', error);
      return [];
    }
  }

  async getTecnicosEquipe(tenantId: string) {
    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
    const query = `
      SELECT id, nome, email, tipo_usuario, ativo, created_at
      FROM "${schemaName}".usuarios
      WHERE tenant_id = $1 
        AND tipo_usuario IN ('agent', 'workspaceAdmin') 
        AND ativo = true
      ORDER BY nome ASC
    `;

    try {
      const result = await this.db.execute(sql.raw(query, [tenantId]));
      return result.map(row => ({
        id: row.id,
        name: row.nome,
        email: row.email,
        role: row.tipo_usuario,
        status: row.ativo,
        createdAt: row.created_at
      }));
    } catch (error) {
      console.error('Error fetching técnicos:', error);
      return [];
    }
  }

  async getGruposEquipe(tenantId: string) {
    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
    const query = `
      SELECT g.id, g.nome, g.descricao, g.created_at,
             COUNT(gm.usuario_id) as member_count
      FROM "${schemaName}".grupos g
      LEFT JOIN "${schemaName}".grupo_membros gm ON g.id = gm.grupo_id
      WHERE g.tenant_id = $1 AND g.ativo = true
      GROUP BY g.id, g.nome, g.descricao, g.created_at
      ORDER BY g.nome ASC
    `;

    try {
      const result = await this.db.execute(sql.raw(query, [tenantId]));
      return result.map(row => ({
        id: row.id,
        name: row.nome,
        description: row.descricao,
        memberCount: parseInt(row.member_count) || 0,
        createdAt: row.created_at
      }));
    } catch (error) {
      console.error('Error fetching grupos:', error);
      return [];
    }
  }

  async getLocaisAtendimento(tenantId: string) {
    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
    const query = `
      SELECT id, nome, descricao, cep, municipio, estado, 
             ativo, created_at
      FROM "${schemaName}".locais
      WHERE tenant_id = $1 AND ativo = true
      ORDER BY nome ASC
    `;

    try {
      const result = await this.db.execute(sql.raw(query, [tenantId]));
      return result.map(row => ({
        id: row.id,
        name: row.nome,
        description: row.descricao,
        cep: row.cep,
        municipio: row.municipio,
        estado: row.estado,
        active: row.ativo,
        createdAt: row.created_at,
        displayName: `${row.nome}${row.municipio ? ` - ${row.municipio}/${row.estado}` : ''}`
      }));
    } catch (error) {
      console.error('Error fetching locais:', error);
      return [];
    }
  }

  // Generic update and delete
  async updateRecord(tenantId: string, recordType: string, id: string, data: any) {
    const tableMap: { [key: string]: any } = {
      'local': locais,
      'regiao': regioes,
      'rota-dinamica': rotasDinamicas,
      'trecho': trechos,
      'rota-trecho': rotasTrecho,
      'area': areas,
      'agrupamento': agrupamentos
    };

    const table = tableMap[recordType];
    if (!table) {
      throw new Error(`Invalid record type: ${recordType}`);
    }

    const [updated] = await this.db
      .update(table)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(table.id, id), eq(table.tenantId, tenantId)))
      .returning();

    return updated;
  }

  async deleteRecord(tenantId: string, recordType: string, id: string) {
    const tableMap: { [key: string]: any } = {
      'local': locais,
      'regiao': regioes,
      'rota-dinamica': rotasDinamicas,
      'trecho': trechos,
      'rota-trecho': rotasTrecho,
      'area': areas,
      'agrupamento': agrupamentos
    };

    const table = tableMap[recordType];
    if (!table) {
      throw new Error(`Invalid record type: ${recordType}`);
    }

    await this.db
      .delete(table)
      .where(and(eq(table.id, id), eq(table.tenantId, tenantId)));
  }
}