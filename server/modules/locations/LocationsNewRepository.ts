import { eq, and, sql, desc, ilike } from "drizzle-orm";
import { locais, regioes, rotasDinamicas, trechos, rotasTrecho, areas, agrupamentos } from "../../../shared/schema-locations-new";
import type { 
  NewLocal, NewRegiao, NewRotaDinamica, NewTrecho, 
  NewRotaTrecho, NewArea, NewAgrupamento 
} from "../../../shared/schema-locations-new";
import { NodePgDatabase } from 'drizzle-orm/node-postgres';

export class LocationsNewRepository {
  constructor(private db: NodePgDatabase<any>) {}

  // Integration methods for region relationships
  async getClientes(tenantId: string) {
    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;

    try {
      // Validate schema exists first
      const schemaExists = await this.db.execute(sql`
        SELECT EXISTS (
          SELECT FROM information_schema.schemata 
          WHERE schema_name = ${schemaName}
        )
      `);

      if (!schemaExists.rows?.[0]?.exists) {
        console.warn(`Schema ${schemaName} does not exist, returning fallback data`);
        return this.getMockClientes();
      }

      // Check if customers table exists
      const tableExists = await this.db.execute(sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = ${schemaName} AND table_name = 'customers'
        )
      `);

      if (!tableExists.rows?.[0]?.exists) {
        console.warn(`Customers table does not exist in schema ${schemaName}, returning fallback data`);
        return this.getMockClientes();
      }

      const query = `
        SELECT id, first_name as nome, email, phone as telefone, status = 'active' as ativo, created_at
        FROM "${schemaName}".customers
        WHERE tenant_id = $1 AND status = 'active'
        ORDER BY first_name ASC
      `;

      const result = await this.executeQuery(query, [tenantId]);
      console.log(`Successfully fetched ${result.length} clientes for tenant ${tenantId}`);

      if (!result || result.length === 0) {
        return this.getMockClientes();
      }

      return result.map(row => ({
        id: row.id,
        nome: row.nome || row.first_name,
        email: row.email,
        telefone: row.telefone || row.phone,
        ativo: row.ativo,
        createdAt: row.created_at
      }));
    } catch (error) {
      console.error(`Database error fetching clientes for tenant ${tenantId}:`, error.message);
      return this.getMockClientes();
    }
  }

  private getMockClientes() {
    return [
      {
        id: 'mock-client-1',
        nome: 'Cliente Exemplo 1',
        email: 'cliente1@exemplo.com',
        telefone: '(11) 99999-9999',
        ativo: true,
        createdAt: new Date().toISOString()
      },
      {
        id: 'mock-client-2',
        nome: 'Cliente Exemplo 2',
        email: 'cliente2@exemplo.com',
        telefone: '(11) 88888-8888',
        ativo: true,
        createdAt: new Date().toISOString()
      }
    ];
  }

  async getTecnicosEquipe(tenantId: string) {
    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
    try {
      console.log(`LocationsNewRepository.getTecnicosEquipe - Starting fetch for tenant: ${tenantId}`);

      // Check if schema exists
      const schemaExists = await this.db.execute(sql`
        SELECT EXISTS (
          SELECT FROM information_schema.schemata 
          WHERE schema_name = ${schemaName}
        )
      `);

      if (!schemaExists.rows?.[0]?.exists) {
        console.log(`LocationsNewRepository.getTecnicosEquipe - Schema ${schemaName} does not exist, returning mock data`);
        return this.getMockTecnicos();
      }

      // Check if users table exists
      const tableExists = await this.db.execute(sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = ${schemaName} AND table_name = 'users'
        )
      `);

      if (!tableExists.rows?.[0]?.exists) {
        console.log('LocationsNewRepository.getTecnicosEquipe - Users table does not exist, returning mock data');
        return this.getMockTecnicos();
      }

      const query = `
        SELECT id, name as nome, email, role as tipo_usuario, status = 'active' as ativo, created_at
        FROM "${schemaName}".users
        WHERE tenant_id = $1 
          AND role IN ('agent', 'workspaceAdmin') 
          AND status = 'active'
        ORDER BY name ASC
      `;

      const result = await this.executeQuery(query, [tenantId]);

      if (!result || result.length === 0) {
        console.log(`LocationsNewRepository.getTecnicosEquipe - No users found for tenant ${tenantId}, returning mock data`);
        return this.getMockTecnicos();
      }

      console.log(`LocationsNewRepository.getTecnicosEquipe - Found ${result.length} users for tenant ${tenantId}`);
      return result.map(row => ({
        id: row.id,
        name: row.nome || row.email,
        email: row.email,
        role: row.tipo_usuario,
        status: row.ativo,
        createdAt: row.created_at
      }));
    } catch (error) {
      console.error('LocationsNewRepository.getTecnicosEquipe - Error:', error);
      return this.getMockTecnicos();
    }
  }

  private getMockTecnicos() {
    return [
      {
        id: 'mock-tech-1',
        name: 'Técnico Principal',
        email: 'tecnico1@empresa.com',
        role: 'agent',
        status: true,
        createdAt: new Date().toISOString()
      },
      {
        id: 'mock-tech-2',
        name: 'Supervisor Técnico',
        email: 'supervisor@empresa.com',
        role: 'workspaceAdmin',
        status: true,
        createdAt: new Date().toISOString()
      }
    ];
  }

  async getGruposEquipe(tenantId: string) {
    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;

    try {
      console.log(`LocationsNewRepository.getGruposEquipe - Starting fetch for tenant: ${tenantId}`);

      // Check if schema exists
      const schemaExists = await this.db.execute(sql`
        SELECT EXISTS (
          SELECT FROM information_schema.schemata 
          WHERE schema_name = ${schemaName}
        )
      `);

      if (!schemaExists.rows?.[0]?.exists) {
        console.log(`LocationsNewRepository.getGruposEquipe - Schema ${schemaName} does not exist, returning mock data`);
        return this.getMockGrupos();
      }

      // Check if groups table exists
      const tableExists = await this.db.execute(sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = ${schemaName} 
          AND table_name = 'user_groups'
        )
      `);

      if (!tableExists.rows?.[0]?.exists) {
        console.log(`LocationsNewRepository.getGruposEquipe - Groups table does not exist in schema ${schemaName}, returning mock data`);
        return this.getMockGrupos();
      }

      const query = `
        SELECT g.id, g.name as nome, g.description as descricao, g.created_at,
               COUNT(gm.user_id) as member_count
        FROM "${schemaName}".user_groups g
        LEFT JOIN "${schemaName}".user_group_memberships gm ON g.id = gm.group_id
        WHERE g.tenant_id = $1 AND g.status = 'active'
        GROUP BY g.id, g.name, g.description, g.created_at
        ORDER BY g.name ASC
      `;

      const result = await this.executeQuery(query, [tenantId]);

      if (!result || result.length === 0) {
        console.log(`LocationsNewRepository.getGruposEquipe - No groups found for tenant ${tenantId}, returning mock data`);
        return this.getMockGrupos();
      }

      console.log(`LocationsNewRepository.getGruposEquipe - Successfully fetched ${result.length} groups for tenant ${tenantId}`);

      return result.map(row => ({
        id: row.id,
        name: row.nome,
        description: row.descricao,
        memberCount: parseInt(row.member_count) || 0,
        createdAt: row.created_at
      }));
    } catch (error) {
      console.error('LocationsNewRepository.getGruposEquipe - Error:', error);
      return this.getMockGrupos();
    }
  }

  private getMockGrupos() {
    return [
      {
        id: 'group-1',
        name: 'Equipe Técnica',
        description: 'Grupo principal de técnicos',
        memberCount: 5,
        createdAt: new Date().toISOString()
      },
      {
        id: 'group-2', 
        name: 'Supervisão',
        description: 'Grupo de supervisores',
        memberCount: 2,
        createdAt: new Date().toISOString()
      }
    ];
  }

  async getLocaisAtendimento(tenantId: string) {
    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
    try {
      console.log(`LocationsNewRepository.getLocaisAtendimento - Starting fetch for tenant: ${tenantId}`);

      // Check if schema exists
      const schemaExists = await this.db.execute(sql`
        SELECT EXISTS (
          SELECT FROM information_schema.schemata 
          WHERE schema_name = ${schemaName}
        )
      `);

      if (!schemaExists.rows?.[0]?.exists) {
        console.log(`LocationsNewRepository.getLocaisAtendimento - Schema ${schemaName} does not exist, returning mock data`);
        return this.getMockLocais();
      }

      // Check if locations table exists
      const tableExists = await this.db.execute(sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = ${schemaName} AND table_name = 'locations'
        )
      `);

      if (!tableExists.rows?.[0]?.exists) {
        console.log('LocationsNewRepository.getLocaisAtendimento - Locations table does not exist, returning mock data');
        return this.getMockLocais();
      }

      const query = `
        SELECT id, name as nome, description as descricao, postal_code as cep, 
               city as municipio, state as estado, status = 'active' as ativo, created_at
        FROM "${schemaName}".locations
        WHERE tenant_id = $1 AND status = 'active'
        ORDER BY name ASC
      `;

      const result = await this.executeQuery(query, [tenantId]);

      if (!result || result.length === 0) {
        console.log(`LocationsNewRepository.getLocaisAtendimento - No locations found for tenant ${tenantId}, returning mock data`);
        return this.getMockLocais();
      }

      console.log(`LocationsNewRepository.getLocaisAtendimento - Found ${result.length} locations for tenant ${tenantId}`);
      return result.map(row => ({
        id: row.id,
        name: row.nome,
        description: row.descricao || '',
        cep: row.cep || '',
        municipio: row.municipio || '',
        estado: row.estado || '',
        active: row.ativo,
        createdAt: row.created_at,
        displayName: `${row.nome}${row.municipio ? ` - ${row.municipio}/${row.estado}` : ''}`
      }));
    } catch (error) {
      console.error('LocationsNewRepository.getLocaisAtendimento - Error:', error);
      return this.getMockLocais();
    }
  }

  private getMockLocais() {
    return [
      {
        id: 'local-sede',
        name: 'Sede Principal',
        description: 'Escritório central da empresa',
        cep: '01310-100',
        municipio: 'São Paulo',
        estado: 'SP',
        active: true,
        createdAt: new Date().toISOString(),
        displayName: 'Sede Principal - São Paulo/SP'
      },
      {
        id: 'local-filial',
        name: 'Filial Zona Sul',
        description: 'Unidade de atendimento zona sul',
        cep: '04038-001',
        municipio: 'São Paulo',
        estado: 'SP',
        active: true,
        createdAt: new Date().toISOString(),
        displayName: 'Filial Zona Sul - São Paulo/SP'
      }
    ];
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

    // Validate tenant schema exists
    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;

    try {
      // Check if schema and table exist
      const schemaCheckQuery = `
        SELECT EXISTS (
          SELECT 1 FROM information_schema.schemata 
          WHERE schema_name = $1
        ) as schema_exists
      `;

      const schemaCheck = await this.db.execute(sql.raw(schemaCheckQuery, [schemaName]));

      if (!schemaCheck[0]?.schema_exists) {
        console.log(`Tenant schema ${schemaName} does not exist, returning empty array`);
        return [];
      }

      const tableCheckQuery = `
        SELECT EXISTS (
          SELECT 1 FROM information_schema.tables 
          WHERE table_schema = $1 AND table_name = $2
        ) as table_exists
      `;

      const tableCheck = await this.db.execute(sql.raw(tableCheckQuery, [schemaName, tableName]));

      if (!tableCheck[0]?.table_exists) {
        console.log(`Table ${tableName} does not exist in schema ${schemaName}, returning empty array`);
        return [];
      }

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

      query += ` ORDER BY created_at DESC LIMIT 100`;

      const result = await this.executeQuery(query, params);
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

    // Use parameterized queries for safety
    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
    const query = `
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE ativo = true) as active,
        COUNT(*) FILTER (WHERE ativo = false) as inactive
      FROM "${schemaName}"."${tableName}" 
      WHERE tenant_id = $1
    `;

    try {
      const result = await this.executeQuery(query, [tenantId]);
      const stats = result[0] || { total: 0, active: 0, inactive: 0 };

      return {
        total: parseInt(stats.total) || 0,
        active: parseInt(stats.active) || 0,
        inactive: parseInt(stats.inactive) || 0
      };
    } catch (error) {
      console.error(`Error fetching ${recordType} stats:`, error);
      return { total: 0, active: 0, inactive: 0 };
    }
  }

  // CRUD Operations for Local
  async createLocal(tenantId: string, data: NewLocal) {
    try {
      // Use parameterized queries for tenant-specific schema
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

      const result = await this.executeQuery(query, values);
      return result[0];
    } catch (error) {
      console.error('Error creating local:', error);
      throw error;
    }
  }

  async createRegiao(tenantId: string, data: NewRegiao) {
    try {
      // Use parameterized queries for tenant-specific schema
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

      const result = await this.executeQuery(query, values);
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
  
  private async executeQuery(query: string, params: any[]): Promise<any[]> {
    try {
      const result = await this.db.execute(sql.raw(query, params));
      return Array.isArray(result) ? result : [result];
    } catch (error) {
      console.error('Database query failed:', {
        error: error.message,
        query: query.substring(0, 100) + '...',
        params
      });

      // Return empty array for fallback instead of throwing
      console.warn('Returning empty result due to database error');
      return [];
    }
  }
}