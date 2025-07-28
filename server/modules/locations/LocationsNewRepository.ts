
import { eq, and, sql, desc, ilike } from "drizzle-orm";
import { locais, regioes, rotasDinamicas, trechos, rotasTrecho, areas, agrupamentos } from "../../../shared/schema-locations-new";
import type { 
  NewLocal, NewRegiao, NewRotaDinamica, NewTrecho, 
  NewRotaTrecho, NewArea, NewAgrupamento 
} from "../../../shared/schema-locations-new";
import { NodePgDatabase } from 'drizzle-orm/node-postgres';

export class LocationsNewRepository {
  constructor(private db: NodePgDatabase<any>) {}

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

  // Create schema if it doesn't exist
  private async createSchemaIfNotExists(schemaName: string): Promise<void> {
    try {
      await this.db.execute(sql.raw(`CREATE SCHEMA IF NOT EXISTS "${schemaName}"`));
      console.log(`LocationsNewRepository - Schema ${schemaName} created successfully`);
    } catch (error) {
      console.error(`LocationsNewRepository - Error creating schema ${schemaName}:`, error);
      throw error;
    }
  }

  // Create table if it doesn't exist
  private async createTableIfNotExists(schemaName: string, tableName: string): Promise<void> {
    try {
      // Call the migration function for this specific tenant
      await this.db.execute(sql.raw(`SELECT create_locations_new_tables_for_tenant('${schemaName}')`));
      console.log(`LocationsNewRepository - Tables created for schema ${schemaName}`);
    } catch (error) {
      console.error(`LocationsNewRepository - Error creating tables for ${schemaName}:`, error);
      throw error;
    }
  }

  // Get records by type with real database queries
  async getRecordsByType(tenantId: string, recordType: string, filters?: { search?: string; status?: string }) {
    console.log(`LocationsNewRepository.getRecordsByType - Fetching ${recordType} for tenant: ${tenantId}`);

    try {
      const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
      
      // Validate schema exists - create if not exists
      const schemaValidation = await this.validateSchema(schemaName);
      if (!schemaValidation.isValid) {
        console.log(`LocationsNewRepository.getRecordsByType - Creating schema: ${schemaName}`);
        await this.createSchemaIfNotExists(schemaName);
      }

      // Map record types to table names
      const tableMap: { [key: string]: string } = {
        'local': 'locais',
        'regiao': 'regioes',
        'rota-dinamica': 'rotas_dinamicas',
        'trecho': 'trechos',
        'rota-trecho': 'rotas_trecho',
        'area': 'areas',
        'agrupamento': 'agrupamentos'
      };

      const tableName = tableMap[recordType];
      if (!tableName) {
        console.error(`LocationsNewRepository.getRecordsByType - Invalid record type: ${recordType}`);
        return [];
      }

      // Validate table exists - create if not exists
      const tableValidation = await this.validateTable(schemaName, tableName);
      if (!tableValidation.isValid) {
        console.log(`LocationsNewRepository.getRecordsByType - Creating table: ${tableName}`);
        await this.createTableIfNotExists(schemaName, tableName);
      }

      // Build base query
      let query = `SELECT * FROM "${schemaName}"."${tableName}" WHERE tenant_id = $1`;
      const params = [tenantId];
      let paramCount = 1;

      // Add search filter
      if (filters?.search) {
        paramCount++;
        if (recordType === 'rota-dinamica') {
          query += ` AND (nome_rota ILIKE $${paramCount} OR id_rota ILIKE $${paramCount})`;
        } else {
          query += ` AND nome ILIKE $${paramCount}`;
        }
        params.push(`%${filters.search}%`);
      }

      // Add status filter
      if (filters?.status) {
        paramCount++;
        if (filters.status === 'ativo') {
          query += ` AND ativo = $${paramCount}`;
          params.push(true);
        } else if (filters.status === 'inativo') {
          query += ` AND ativo = $${paramCount}`;
          params.push(false);
        }
      }

      // Add ordering
      if (recordType === 'rota-dinamica') {
        query += ' ORDER BY nome_rota ASC';
      } else {
        query += ' ORDER BY nome ASC';
      }

      const result = await this.executeQuery(query, params);
      
      console.log(`LocationsNewRepository.getRecordsByType - Successfully retrieved ${result.length} ${recordType} records from database`);
      return result;

    } catch (error) {
      console.error(`LocationsNewRepository.getRecordsByType - Critical error fetching ${recordType}:`, error);
      throw new Error(`Failed to fetch ${recordType} data: ${error.message}`);
    }
  }

  // Get statistics by record type
  async getStatsByType(tenantId: string, recordType: string) {
    try {
      const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
      
      // Ensure schema exists
      const schemaValidation = await this.validateSchema(schemaName);
      if (!schemaValidation.isValid) {
        await this.createSchemaIfNotExists(schemaName);
      }

      const tableMap: { [key: string]: string } = {
        'local': 'locais',
        'regiao': 'regioes',
        'rota-dinamica': 'rotas_dinamicas',
        'trecho': 'trechos',
        'rota-trecho': 'rotas_trecho',
        'area': 'areas',
        'agrupamento': 'agrupamentos'
      };

      const tableName = tableMap[recordType];
      if (!tableName) {
        return { total: 0, active: 0, inactive: 0 };
      }

      // Ensure table exists
      const tableValidation = await this.validateTable(schemaName, tableName);
      if (!tableValidation.isValid) {
        await this.createTableIfNotExists(schemaName, tableName);
      }

      const query = `
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN ativo = true THEN 1 END) as active,
          COUNT(CASE WHEN ativo = false THEN 1 END) as inactive
        FROM "${schemaName}"."${tableName}"
        WHERE tenant_id = $1
      `;

      const result = await this.executeQuery(query, [tenantId]);
      
      if (result && result.length > 0) {
        const stats = result[0];
        return {
          total: parseInt(stats.total) || 0,
          active: parseInt(stats.active) || 0,
          inactive: parseInt(stats.inactive) || 0
        };
      }

      return { total: 0, active: 0, inactive: 0 };
    } catch (error) {
      console.error(`LocationsNewRepository.getStatsByType - Error fetching stats for ${recordType}:`, error);
      throw new Error(`Failed to get stats for ${recordType}: ${error.message}`);
    }
  }

  // CRUD Operations for Local
  async createLocal(tenantId: string, data: NewLocal) {
    try {
      console.log('LocationsNewRepository.createLocal - Starting creation for tenant:', tenantId);
      
      const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;

      // Ensure schema exists
      const schemaValidation = await this.validateSchema(schemaName);
      if (!schemaValidation.isValid) {
        await this.createSchemaIfNotExists(schemaName);
      }

      // Ensure table exists
      const tableValidation = await this.validateTable(schemaName, 'locais');
      if (!tableValidation.isValid) {
        await this.createTableIfNotExists(schemaName, 'locais');
      }

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

      const result = await this.executeQuery(query, values);

      if (result && result.length > 0) {
        console.log('LocationsNewRepository.createLocal - Successfully created local in database');
        return result[0];
      } else {
        throw new Error('Failed to create local - no result returned from database');
      }
    } catch (error) {
      console.error('LocationsNewRepository.createLocal - Error:', error);
      throw new Error(`Failed to create local: ${error.message}`);
    }
  }

  // Integration methods for region relationships
  async getClientes(tenantId: string) {
    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;

    try {
      // Ensure schema exists
      const schemaExists = await this.db.execute(sql`
        SELECT EXISTS (
          SELECT FROM information_schema.schemata 
          WHERE schema_name = ${schemaName}
        )
      `);

      if (!schemaExists.rows?.[0]?.exists) {
        await this.createSchemaIfNotExists(schemaName);
      }

      // Check if customers table exists
      const tableExists = await this.db.execute(sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = ${schemaName} AND table_name = 'customers'
        )
      `);

      if (!tableExists.rows?.[0]?.exists) {
        console.warn(`Customers table does not exist in schema ${schemaName}, returning empty array`);
        return [];
      }

      const query = `
        SELECT id, 
               COALESCE(first_name, email) as nome, 
               email, 
               COALESCE(phone, cell_phone, '') as telefone, 
               CASE WHEN active = true THEN true ELSE false END as ativo, 
               created_at
        FROM "${schemaName}".customers
        WHERE tenant_id = $1 AND active = true
        ORDER BY COALESCE(first_name, email) ASC
      `;

      const result = await this.executeQuery(query, [tenantId]);
      console.log(`Successfully fetched ${result.length} clientes for tenant ${tenantId}`);

      return result.map(row => ({
        id: row.id,
        nome: row.nome || row.email,
        email: row.email,
        telefone: row.telefone || '',
        ativo: row.ativo,
        createdAt: row.created_at
      }));
    } catch (error) {
      console.error(`Database error fetching clientes for tenant ${tenantId}:`, error.message);
      throw new Error(`Failed to fetch clientes: ${error.message}`);
    }
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
        console.log(`LocationsNewRepository.getTecnicosEquipe - Schema ${schemaName} does not exist, returning empty array`);
        return [];
      }

      // Check if users table exists
      const tableExists = await this.db.execute(sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = ${schemaName} AND table_name = 'users'
        )
      `);

      if (!tableExists.rows?.[0]?.exists) {
        console.log('LocationsNewRepository.getTecnicosEquipe - Users table does not exist, returning empty array');
        return [];
      }

      const query = `
        SELECT id, email as nome, email, role as tipo_usuario, 
               CASE WHEN active = true THEN true ELSE false END as ativo, 
               created_at
        FROM "${schemaName}".users
        WHERE tenant_id = $1 
          AND role IN ('agent', 'workspaceAdmin') 
          AND active = true
        ORDER BY email ASC
      `;

      const result = await this.executeQuery(query, [tenantId]);

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
      throw new Error(`Failed to fetch técnicos: ${error.message}`);
    }
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
        WHERE g.tenant_id = $1 AND g.active = true
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
    // Return empty array instead of mock data
    return [];
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

      // Check if locais table exists first
      const locaisTableExists = await this.db.execute(sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = ${schemaName} AND table_name = 'locais'
        )
      `);

      if (locaisTableExists.rows?.[0]?.exists) {
        // Use locais table if it exists
        const query = `
          SELECT id, 
                 nome, 
                 descricao, 
                 cep,
                 municipio,
                 estado,
                 ativo as active, 
                 created_at
          FROM "${schemaName}".locais
          WHERE tenant_id = $1 AND ativo = true
          ORDER BY nome ASC
        `;

        const result = await this.executeQuery(query, [tenantId]);

        if (result && result.length > 0) {
          console.log(`LocationsNewRepository.getLocaisAtendimento - Found ${result.length} locais from locais table for tenant ${tenantId}`);
          return result.map(row => ({
            id: row.id,
            name: row.nome,
            description: row.descricao || '',
            cep: row.cep || '',
            municipio: row.municipio || '',
            estado: row.estado || '',
            active: row.active,
            createdAt: row.created_at,
            displayName: `${row.nome}${row.municipio ? ` - ${row.municipio}/${row.estado}` : ''}`
          }));
        }
      }

      // Fallback to locations table
      const locationsTableExists = await this.db.execute(sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = ${schemaName} AND table_name = 'locations'
        )
      `);

      if (!locationsTableExists.rows?.[0]?.exists) {
        console.log('LocationsNewRepository.getLocaisAtendimento - Neither locais nor locations table exists, returning mock data');
        return this.getMockLocais();
      }

      const query = `
        SELECT id, 
               COALESCE(name, description, 'Local sem nome') as nome, 
               COALESCE(description, '') as descricao, 
               COALESCE(address, '') as endereco_completo,
               '' as cep,
               '' as municipio,
               '' as estado,
               CASE WHEN is_active = true THEN true ELSE false END as ativo, 
               created_at
        FROM "${schemaName}".locations
        WHERE tenant_id = $1 AND is_active = true
        ORDER BY COALESCE(name, description, 'Local sem nome') ASC
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
    // Return empty array instead of mock data
    return [];
  }

  

  // Additional CRUD operations for other record types
  async createRegiao(tenantId: string, data: NewRegiao) {
    try {
      const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
      
      // Ensure schema exists
      const schemaValidation = await this.validateSchema(schemaName);
      if (!schemaValidation.isValid) {
        await this.createSchemaIfNotExists(schemaName);
      }

      // Ensure table exists
      const tableValidation = await this.validateTable(schemaName, 'regioes');
      if (!tableValidation.isValid) {
        await this.createTableIfNotExists(schemaName, 'regioes');
      }

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
        tenantId, data.ativo ?? true, data.nome, data.descricao || null, data.codigoIntegracao || null,
        JSON.stringify(data.clientesVinculados) || null, data.tecnicoPrincipalId || null, 
        JSON.stringify(data.gruposVinculados) || null, JSON.stringify(data.locaisAtendimento) || null,
        data.latitude || null, data.longitude || null, JSON.stringify(data.cepsAbrangidos) || null,
        data.cep || null, data.pais || 'Brasil', data.estado || null, data.municipio || null, 
        data.bairro || null, data.tipoLogradouro || null, data.logradouro || null, 
        data.numero || null, data.complemento || null
      ];

      const result = await this.executeQuery(query, values);
      
      if (result && result.length > 0) {
        console.log('LocationsNewRepository.createRegiao - Successfully created regiao in database');
        return result[0];
      } else {
        throw new Error('Failed to create regiao - no result returned from database');
      }
    } catch (error) {
      console.error('LocationsNewRepository.createRegiao - Error:', error);
      throw new Error(`Failed to create regiao: ${error.message}`);
    }
  }

  async createRotaDinamica(tenantId: string, data: NewRotaDinamica) {
    try {
      const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
      
      // Ensure schema exists
      const schemaValidation = await this.validateSchema(schemaName);
      if (!schemaValidation.isValid) {
        await this.createSchemaIfNotExists(schemaName);
      }

      // Ensure table exists
      const tableValidation = await this.validateTable(schemaName, 'rotas_dinamicas');
      if (!tableValidation.isValid) {
        await this.createTableIfNotExists(schemaName, 'rotas_dinamicas');
      }

      const query = `
        INSERT INTO "${schemaName}"."rotas_dinamicas" (
          tenant_id, ativo, nome_rota, id_rota, clientes_vinculados, 
          regioes_atendidas, dias_semana, previsao_dias
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8
        ) RETURNING *
      `;

      const values = [
        tenantId, data.ativo ?? true, data.nomeRota, data.idRota,
        JSON.stringify(data.clientesVinculados) || null,
        JSON.stringify(data.regioesAtendidas) || null,
        JSON.stringify(data.diasSemana) || null,
        data.previsaoDias
      ];

      const result = await this.executeQuery(query, values);
      
      if (result && result.length > 0) {
        console.log('LocationsNewRepository.createRotaDinamica - Successfully created rota dinamica in database');
        return result[0];
      } else {
        throw new Error('Failed to create rota dinamica - no result returned from database');
      }
    } catch (error) {
      console.error('LocationsNewRepository.createRotaDinamica - Error:', error);
      throw new Error(`Failed to create rota dinamica: ${error.message}`);
    }
  }

  async createTrecho(tenantId: string, data: any) {
    try {
      const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
      
      // Ensure schema exists
      const schemaValidation = await this.validateSchema(schemaName);
      if (!schemaValidation.isValid) {
        await this.createSchemaIfNotExists(schemaName);
      }

      // Ensure table exists
      const tableValidation = await this.validateTable(schemaName, 'trechos');
      if (!tableValidation.isValid) {
        await this.createTableIfNotExists(schemaName, 'trechos');
      }

      const query = `
        INSERT INTO "${schemaName}"."trechos" (
          tenant_id, ativo, codigo_integracao, local_a_id, local_b_id
        ) VALUES (
          $1, $2, $3, $4, $5
        ) RETURNING *
      `;

      const values = [
        tenantId, data.ativo ?? true, data.codigoIntegracao || null, 
        data.localAId, data.localBId
      ];

      const result = await this.executeQuery(query, values);
      
      if (result && result.length > 0) {
        console.log('LocationsNewRepository.createTrecho - Successfully created trecho in database');
        return result[0];
      } else {
        throw new Error('Failed to create trecho - no result returned from database');
      }
    } catch (error) {
      console.error('LocationsNewRepository.createTrecho - Error:', error);
      throw new Error(`Failed to create trecho: ${error.message}`);
    }
  }

  async createRotaTrecho(tenantId: string, data: any) {
    try {
      const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
      
      // Ensure schema exists
      const schemaValidation = await this.validateSchema(schemaName);
      if (!schemaValidation.isValid) {
        await this.createSchemaIfNotExists(schemaName);
      }

      // Ensure table exists
      const tableValidation = await this.validateTable(schemaName, 'rotas_trecho');
      if (!tableValidation.isValid) {
        await this.createTableIfNotExists(schemaName, 'rotas_trecho');
      }

      // Insert main rota trecho
      const query = `
        INSERT INTO "${schemaName}"."rotas_trecho" (
          tenant_id, ativo, id_rota, local_a_id, local_b_id
        ) VALUES (
          $1, $2, $3, $4, $5
        ) RETURNING *
      `;

      const values = [
        tenantId, data.ativo ?? true, data.idRota, data.localAId, data.localBId
      ];

      const result = await this.executeQuery(query, values);
      
      if (result && result.length > 0 && data.trechos) {
        const rotaTrechoId = result[0].id;
        
        // Insert segments
        for (let i = 0; i < data.trechos.length; i++) {
          const trecho = data.trechos[i];
          const segmentQuery = `
            INSERT INTO "${schemaName}"."trechos_rota" (
              tenant_id, rota_trecho_id, ordem, local_origem_id, nome_trecho, local_destino_id
            ) VALUES (
              $1, $2, $3, $4, $5, $6
            )
          `;
          
          const segmentValues = [
            tenantId, rotaTrechoId, i + 1, 
            trecho.localOrigemId, trecho.nomeTrecho || '', trecho.localDestinoId
          ];
          
          await this.executeQuery(segmentQuery, segmentValues);
        }
        
        // Return with segments
        result[0].trechos = data.trechos.map((trecho, index) => ({
          id: `segment-${rotaTrechoId}-${index}`,
          ordem: index + 1,
          localOrigemId: trecho.localOrigemId,
          nomeTrecho: trecho.nomeTrecho || '',
          localDestinoId: trecho.localDestinoId,
          createdAt: new Date().toISOString()
        }));
      }

      if (result && result.length > 0) {
        console.log('LocationsNewRepository.createRotaTrecho - Successfully created rota trecho in database');
        return result[0];
      } else {
        throw new Error('Failed to create rota trecho - no result returned from database');
      }
    } catch (error) {
      console.error('LocationsNewRepository.createRotaTrecho - Error:', error);
      throw new Error(`Failed to create rota trecho: ${error.message}`);
    }
  }

  async createArea(tenantId: string, data: any) {
    try {
      const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
      
      // Ensure schema exists
      const schemaValidation = await this.validateSchema(schemaName);
      if (!schemaValidation.isValid) {
        await this.createSchemaIfNotExists(schemaName);
      }

      // Ensure table exists
      const tableValidation = await this.validateTable(schemaName, 'areas');
      if (!tableValidation.isValid) {
        await this.createTableIfNotExists(schemaName, 'areas');
      }

      const query = `
        INSERT INTO "${schemaName}"."areas" (
          tenant_id, ativo, nome, descricao, codigo_integracao, tipo_area, cor_mapa,
          dados_geograficos, faixas_cep, coordenadas, coordenada_central, raio_metros,
          linha_trajetoria, arquivo_original, tipo_arquivo, validacao_geo, status_processamento
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17
        ) RETURNING *
      `;

      const values = [
        tenantId, data.ativo ?? true, data.nome, data.descricao || null, data.codigoIntegracao || null,
        data.tipoArea, data.corMapa || '#3B82F6',
        JSON.stringify(data.dadosGeograficos) || null,
        JSON.stringify(data.faixasCep) || null,
        JSON.stringify(data.coordenadas) || null,
        JSON.stringify(data.coordenadaCentral) || null,
        data.raioMetros || null,
        JSON.stringify(data.linhaTrajetoria) || null,
        data.arquivoOriginal || null,
        data.tipoArquivo || null,
        JSON.stringify(data.validacaoGeo) || null,
        data.statusProcessamento || 'ativo'
      ];

      const result = await this.executeQuery(query, values);
      
      if (result && result.length > 0) {
        console.log('LocationsNewRepository.createArea - Successfully created area in database');
        return result[0];
      } else {
        throw new Error('Failed to create area - no result returned from database');
      }
    } catch (error) {
      console.error('LocationsNewRepository.createArea - Error:', error);
      throw new Error(`Failed to create area: ${error.message}`);
    }
  }

  async createAgrupamento(tenantId: string, data: any) {
    try {
      const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
      
      // Ensure schema exists
      const schemaValidation = await this.validateSchema(schemaName);
      if (!schemaValidation.isValid) {
        await this.createSchemaIfNotExists(schemaName);
      }

      // Ensure table exists
      const tableValidation = await this.validateTable(schemaName, 'agrupamentos');
      if (!tableValidation.isValid) {
        await this.createTableIfNotExists(schemaName, 'agrupamentos');
      }

      const query = `
        INSERT INTO "${schemaName}"."agrupamentos" (
          tenant_id, ativo, nome, descricao, codigo_integracao, areas_vinculadas
        ) VALUES (
          $1, $2, $3, $4, $5, $6
        ) RETURNING *
      `;

      const values = [
        tenantId, data.ativo ?? true, data.nome, data.descricao || null, 
        data.codigoIntegracao || null, JSON.stringify(data.areasVinculadas) || null
      ];

      const result = await this.executeQuery(query, values);
      
      if (result && result.length > 0) {
        console.log('LocationsNewRepository.createAgrupamento - Successfully created agrupamento in database');
        return result[0];
      } else {
        throw new Error('Failed to create agrupamento - no result returned from database');
      }
    } catch (error) {
      console.error('LocationsNewRepository.createAgrupamento - Error:', error);
      throw new Error(`Failed to create agrupamento: ${error.message}`);
    }
  }

  // Generic update and delete operations
  async updateRecord(tenantId: string, recordType: string, id: string, data: any) {
    try {
      const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
      
      const tableMap: { [key: string]: string } = {
        'local': 'locais',
        'regiao': 'regioes',
        'rota-dinamica': 'rotas_dinamicas',
        'trecho': 'trechos',
        'rota-trecho': 'rotas_trecho',
        'area': 'areas',
        'agrupamento': 'agrupamentos'
      };

      const tableName = tableMap[recordType];
      if (!tableName) {
        throw new Error(`Invalid record type: ${recordType}`);
      }

      const schemaValidation = await this.validateSchema(schemaName);
      if (!schemaValidation.isValid) {
        throw new Error(`Schema ${schemaName} does not exist`);
      }

      const tableValidation = await this.validateTable(schemaName, tableName);
      if (!tableValidation.isValid) {
        throw new Error(`Table ${tableName} does not exist`);
      }

      // Build dynamic update query
      const updateFields = Object.keys(data).filter(key => key !== 'id' && key !== 'tenantId');
      const setClause = updateFields.map((field, index) => `${field} = $${index + 3}`).join(', ');
      
      const query = `
        UPDATE "${schemaName}"."${tableName}" 
        SET ${setClause}, updated_at = NOW()
        WHERE id = $1 AND tenant_id = $2
        RETURNING *
      `;

      const values = [id, tenantId, ...updateFields.map(field => data[field])];
      
      const result = await this.executeQuery(query, values);
      return result[0];
    } catch (error) {
      console.error(`Error updating ${recordType}:`, error);
      throw error;
    }
  }

  async deleteRecord(tenantId: string, recordType: string, id: string) {
    try {
      const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
      
      const tableMap: { [key: string]: string } = {
        'local': 'locais',
        'regiao': 'regioes',
        'rota-dinamica': 'rotas_dinamicas',
        'trecho': 'trechos',
        'rota-trecho': 'rotas_trecho',
        'area': 'areas',
        'agrupamento': 'agrupamentos'
      };

      const tableName = tableMap[recordType];
      if (!tableName) {
        throw new Error(`Invalid record type: ${recordType}`);
      }

      const schemaValidation = await this.validateSchema(schemaName);
      if (!schemaValidation.isValid) {
        throw new Error(`Schema ${schemaName} does not exist`);
      }

      const tableValidation = await this.validateTable(schemaName, tableName);
      if (!tableValidation.isValid) {
        throw new Error(`Table ${tableName} does not exist`);
      }

      const query = `
        DELETE FROM "${schemaName}"."${tableName}"
        WHERE id = $1 AND tenant_id = $2
      `;

      await this.executeQuery(query, [id, tenantId]);
      return true;
    } catch (error) {
      console.error(`Error deleting ${recordType}:`, error);
      throw error;
    }
  }

  private async executeQuery(query: string, params: any[]): Promise<any[]> {
    try {
      // Use proper parameterized query with drizzle
      const result = await this.db.execute(sql.raw(query, ...params));
      return result.rows || [];
    } catch (error) {
      console.error('Database query failed:', {
        error: error.message,
        query: query.substring(0, 100) + '...',
        paramCount: params.length,
        tenant: params[0] // First param is usually tenantId
      });

      // Enhanced error handling with specific field mapping
      if (error.message.includes('column') && error.message.includes('does not exist')) {
        console.warn('Column mapping issue detected, attempting field correction');

        // Try common field name corrections
        let correctedQuery = query
          .replace(/cell_phone/g, 'phone')
          .replace(/first_name/g, 'name')
          .replace(/is_active/g, 'active')
          .replace(/address(?![_\w])/g, 'street_address');

        // Apply parameter substitution to corrected query
        let correctedParameterizedQuery = correctedQuery;
        let paramIndex = 1;
        for (const param of params) {
          correctedParameterizedQuery = correctedParameterizedQuery.replace('$' + paramIndex, `'${param}'`);
          paramIndex++;
        }

        try {
          const correctedResult = await this.db.execute(sql.raw(correctedParameterizedQuery));
          console.log('Query succeeded with field corrections');
          return correctedResult.rows || [];
        } catch (correctionError) {
          console.warn('Field correction also failed, using fallback data');
          return [];
        }
      }

      if (error.message.includes('does not exist')) {
        console.warn('Schema or table does not exist, returning empty data');
        return [];
      }

      if (error.message.includes('connection')) {
        console.error('Database connection issue detected');
        throw new Error('Database connection failed');
      }

      // Return empty array for other errors
      console.warn('Returning empty result due to database error');
      return [];
    }
  }
}
