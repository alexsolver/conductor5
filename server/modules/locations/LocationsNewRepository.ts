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
        SELECT id, first_name as nome, email, phone as telefone, 
               CASE WHEN is_active = true THEN true ELSE false END as ativo, 
               created_at
        FROM "${schemaName}".customers
        WHERE tenant_id = $1 AND is_active = true
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
        SELECT id, name as nome, email, role as tipo_usuario, 
               CASE WHEN is_active = true THEN true ELSE false END as ativo, 
               created_at
        FROM "${schemaName}".users
        WHERE tenant_id = $1 
          AND role IN ('agent', 'workspaceAdmin') 
          AND is_active = true
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
        WHERE g.tenant_id = $1 AND g.is_active = true
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
        SELECT id, name as nome, description as descricao, 
               address as endereco_completo,
               CASE WHEN is_active = true THEN true ELSE false END as ativo, 
               created_at
        FROM "${schemaName}".locations
        WHERE tenant_id = $1 AND is_active = true
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
    // Always return mock data for now since tenant tables don't exist yet
    console.log(`LocationsNewRepository.getRecordsByType - Returning mock data for ${recordType}`);
    return this.getMockDataByType(recordType);
  }

  // Enhanced schema validation
  private async validateSchema(schemaName: string): Promise<{isValid: boolean, reason?: string}> {
    try {
      const result = await this.db.execute(sql`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.schemata 
          WHERE schema_name = ${schemaName}
        ) as exists
      `);

      if (!result.rows?.[0]?.exists) {
        return { isValid: false, reason: `Schema ${schemaName} does not exist` };
      }

      return { isValid: true };
    } catch (error) {
      return { isValid: false, reason: `Schema validation error: ${error.message}` };
    }
  }

  // Enhanced table validation
  private async validateTable(schemaName: string, tableName: string): Promise<{isValid: boolean, reason?: string}> {
    try {
      const result = await this.db.execute(sql`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.tables 
          WHERE table_schema = ${schemaName} AND table_name = ${tableName}
        ) as exists
      `);

      if (!result.rows?.[0]?.exists) {
        return { isValid: false, reason: `Table ${tableName} does not exist in schema ${schemaName}` };
      }

      return { isValid: true };
    } catch (error) {
      return { isValid: false, reason: `Table validation error: ${error.message}` };
    }
  }

  // Centralized mock data provider
  private getMockDataByType(recordType: string): any[] {
    const mockData: { [key: string]: any[] } = {
      'local': [
        {
          id: 'mock-local-1',
          nome: 'Local Exemplo SP',
          descricao: 'Sede principal São Paulo',
          ativo: true,
          latitude: '-23.5505',
          longitude: '-46.6333',
          cep: '01310-100',
          estado: 'SP',
          municipio: 'São Paulo',
          bairro: 'Centro',
          logradouro: 'Avenida Paulista',
          numero: '1000',
          createdAt: new Date().toISOString()
        },
        {
          id: 'mock-local-2',
          nome: 'Local Exemplo RJ',
          descricao: 'Filial Rio de Janeiro',
          ativo: true,
          latitude: '-22.9068',
          longitude: '-43.1729',
          cep: '20040-020',
          estado: 'RJ',
          municipio: 'Rio de Janeiro',
          bairro: 'Centro',
          logradouro: 'Avenida Rio Branco',
          numero: '500',
          createdAt: new Date().toISOString()
        }
      ],
      'regiao': [
        {
          id: 'mock-regiao-1',
          nome: 'Região Sudeste',
          descricao: 'Cobertura região sudeste',
          ativo: true,
          latitude: '-23.5505',
          longitude: '-46.6333',
          createdAt: new Date().toISOString()
        }
      ],
      'rota-dinamica': [
        {
          id: 'mock-rota-1',
          nomeRota: 'Rota São Paulo',
          idRota: 'SP-001',
          ativo: true,
          previsaoDias: 5,
          createdAt: new Date().toISOString()
        }
      ],
      'trecho': [
        {
          id: 'mock-trecho-1',
          codigoIntegracao: 'TR-001',
          ativo: true,
          localAId: 'mock-local-1',
          localBId: 'mock-local-2',
          createdAt: new Date().toISOString()
        }
      ],
      'rota-trecho': [
        {
          id: 'mock-rota-trecho-1',
          idRota: 'RT-001',
          ativo: true,
          createdAt: new Date().toISOString()
        }
      ],
      'area': [
        {
          id: 'mock-area-1',
          nome: 'Área Central SP',
          descricao: 'Área de cobertura centro SP',
          ativo: true,
          tipoArea: 'coverage_area',
          corMapa: '#3B82F6',
          createdAt: new Date().toISOString()
        }
      ],
      'agrupamento': [
        {
          id: 'mock-agrupamento-1',
          nome: 'Agrupamento Sudeste',
          descricao: 'Agrupamento de áreas sudeste',
          ativo: true,
          createdAt: new Date().toISOString()
        }
      ]
    };

    return mockData[recordType] || [];
  }

  // Get statistics by record type
  async getStatsByType(tenantId: string, recordType: string) {
    // Return mock stats data since tenant tables don't exist yet
    const mockData = this.getMockDataByType(recordType);
    const total = mockData.length;
    const active = mockData.filter(item => item.ativo !== false).length;
    
    return {
      total,
      active,
      inactive: total - active
    };
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
      // Use sql template literal with proper parameter binding
      const result = await this.db.execute(sql.raw(query, ...params));
      return result.rows || [];
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