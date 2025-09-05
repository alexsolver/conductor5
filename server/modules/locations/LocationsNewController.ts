// ✅ CLEAN ARCHITECTURE CONTROLLER per 1qa.md
import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/jwtAuth';
import { pool } from '../../db';
import { v4 as uuidv4 } from 'uuid'; // Import uuid here

/**
 * LocationsNewController - Simplified controller for locations endpoints
 * Following 1qa.md Clean Architecture specifications
 */
export class LocationsNewController {
  constructor() {
    console.log('🏗️ [LOCATIONS-NEW-CONTROLLER] Initialized following Clean Architecture');
  }

  /**
   * Get clientes for integration
   */
  async getClientes(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user?.tenantId) {
        res.status(400).json({ success: false, message: 'Tenant ID required' });
        return;
      }

      const schemaName = `tenant_${req.user.tenantId.replace(/-/g, '_')}`;

      const result = await pool.query(`
        SELECT id, first_name as nome, last_name as sobrenome, email, phone as telefone
        FROM "${schemaName}".customers 
        WHERE is_active = true 
        ORDER BY first_name ASC
        LIMIT 100
      `, []);

      res.json({
        success: true,
        data: result.rows,
        total: result.rows.length
      });
    } catch (error) {
      console.error('Error fetching clientes:', error);
      res.status(500).json({ success: false, message: 'Error fetching clientes' });
    }
  }

  /**
   * Get tecnicos da equipe
   */
  async getTecnicosEquipe(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user?.tenantId) {
        res.status(400).json({ success: false, message: 'Tenant ID required' });
        return;
      }

      const schemaName = `tenant_${req.user.tenantId.replace(/-/g, '_')}`;

      const result = await pool.query(`
        SELECT id, first_name as nome, last_name as sobrenome, email
        FROM "${schemaName}".users 
        WHERE is_active = true 
        ORDER BY first_name ASC
        LIMIT 100
      `, []);

      res.json({
        success: true,
        data: result.rows,
        total: result.rows.length
      });
    } catch (error) {
      console.error('Error fetching tecnicos:', error);
      res.status(500).json({ success: false, message: 'Error fetching tecnicos' });
    }
  }

  /**
   * Get grupos da equipe
   */
  async getGruposEquipe(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      res.json({
        success: true,
        data: [
          { id: '1', nome: 'Equipe Técnica', descricao: 'Equipe de técnicos' },
          { id: '2', nome: 'Suporte', descricao: 'Equipe de suporte' }
        ],
        total: 2
      });
    } catch (error) {
      console.error('Error fetching grupos:', error);
      res.status(500).json({ success: false, message: 'Error fetching grupos' });
    }
  }

  /**
   * Get locais de atendimento
   */
  async getLocaisAtendimento(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user?.tenantId) {
        res.status(400).json({ success: false, message: 'Tenant ID required' });
        return;
      }

      const schemaName = `tenant_${req.user.tenantId.replace(/-/g, '_')}`;

      // Check if locais table exists first
      const tableExists = await pool.query(`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.tables 
          WHERE table_schema = $1 AND table_name = 'locais'
        ) as exists
      `, [schemaName]);

      if (!tableExists.rows[0]?.exists) {
        res.json({
          success: true,
          data: [],
          total: 0,
          message: 'Locais table not yet created'
        });
        return;
      }

      const result = await pool.query(`
        SELECT id, nome, endereco, cidade, estado, cep
        FROM "${schemaName}".locais 
        WHERE ativo = true 
        ORDER BY nome ASC
        LIMIT 100
      `, []);

      res.json({
        success: true,
        data: result.rows,
        total: result.rows.length
      });
    } catch (error) {
      console.error('Error fetching locais:', error);
      res.status(500).json({ success: false, message: 'Error fetching locais' });
    }
  }

  /**
   * CEP Lookup service - ✅ 1qa.md compliant implementation
   */
  async lookupCep(req: Request, res: Response): Promise<void> {
    try {
      const { cep } = req.params;

      console.log('🔍 [CEP-LOOKUP] Request received for CEP:', cep);

      // Validate CEP format
      const cleanCep = cep.replace(/\D/g, '');
      if (!cleanCep || cleanCep.length !== 8 || !/^\d{8}$/.test(cleanCep)) {
        console.error('❌ [CEP-LOOKUP] Invalid CEP format:', cep, 'cleaned:', cleanCep);
        res.status(400).json({ 
          success: false, 
          message: 'CEP deve conter exatamente 8 dígitos numéricos',
          error: 'INVALID_CEP_FORMAT'
        });
        return;
      }

      console.log('🔍 [CEP-LOOKUP] Clean CEP:', cleanCep);

      // ViaCEP API call with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

      try {
        const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`, {
          signal: controller.signal,
          headers: {
            'User-Agent': 'Conductor-Platform/1.0',
            'Accept': 'application/json'
          }
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`ViaCEP API returned ${response.status}`);
        }

        const data = await response.json();
        console.log('📡 [CEP-LOOKUP] ViaCEP response:', data);

        // Check if CEP was found
        if (data.erro || !data.cep) {
          console.error('❌ [CEP-LOOKUP] CEP not found:', cleanCep);
          res.status(404).json({ 
            success: false, 
            message: 'CEP não encontrado na base de dados dos Correios',
            error: 'CEP_NOT_FOUND'
          });
          return;
        }

        // Return successful result following 1qa.md response pattern
        const result = {
          success: true,
          message: 'CEP encontrado com sucesso',
          data: {
            cep: data.cep || cleanCep,
            logradouro: data.logradouro || '',
            bairro: data.bairro || '',
            localidade: data.localidade || '',
            uf: data.uf || '',
            complemento: data.complemento || '',
            ibge: data.ibge || null,
            gia: data.gia || null,
            ddd: data.ddd || null,
            siafi: data.siafi || null
          }
        };

        console.log('✅ [CEP-LOOKUP] Success response:', result);
        res.json(result);

      } catch (fetchError) {
        clearTimeout(timeoutId);

        if (fetchError.name === 'AbortError') {
          console.error('❌ [CEP-LOOKUP] Timeout error');
          res.status(408).json({ 
            success: false, 
            message: 'Timeout ao consultar CEP. Tente novamente.',
            error: 'REQUEST_TIMEOUT'
          });
        } else {
          throw fetchError; // Re-throw to be handled by outer catch
        }
      }

    } catch (error) {
      console.error('❌ [CEP-LOOKUP] Unexpected error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erro interno do servidor ao buscar CEP',
        error: process.env.NODE_ENV === 'development' ? error.message : 'INTERNAL_ERROR'
      });
    }
  }

  /**
   * Holidays lookup service - ✅ 1qa.md compliant implementation
   */
  async lookupHolidays(req: Request, res: Response): Promise<void> {
    try {
      const { municipio, estado, ano } = req.query;
      const currentYear = parseInt(ano as string) || new Date().getFullYear();

      console.log('🔍 [HOLIDAYS-LOOKUP] Request received:', { municipio, estado, ano: currentYear });

      if (!municipio || !estado) {
        res.status(400).json({
          success: false,
          message: 'Município e estado são obrigatórios',
          error: 'MISSING_REQUIRED_PARAMS'
        });
        return;
      }

      // Feriados Federais (aplicam-se a todo o Brasil)
      const feriadosFederais = [
        { data: `${currentYear}-01-01`, nome: 'Confraternização Universal', incluir: true },
        { data: `${currentYear}-04-21`, nome: 'Tiradentes', incluir: true },
        { data: `${currentYear}-09-07`, nome: 'Independência do Brasil', incluir: true },
        { data: `${currentYear}-10-12`, nome: 'Nossa Senhora Aparecida', incluir: true },
        { data: `${currentYear}-11-02`, nome: 'Finados', incluir: true },
        { data: `${currentYear}-11-15`, nome: 'Proclamação da República', incluir: true },
        { data: `${currentYear}-12-25`, nome: 'Natal', incluir: true }
      ];

      // Feriados Estaduais (baseado no estado)
      let feriadosEstaduais: any[] = [];
      const estadoUpper = (estado as string).toUpperCase();

      if (estadoUpper === 'SP' || estadoUpper === 'SÃO PAULO') {
        feriadosEstaduais = [
          { data: `${currentYear}-07-09`, nome: 'Revolução Constitucionalista', incluir: true }
        ];
      } else if (estadoUpper === 'RJ' || estadoUpper === 'RIO DE JANEIRO') {
        feriadosEstaduais = [
          { data: `${currentYear}-04-23`, nome: 'São Jorge', incluir: true },
          { data: `${currentYear}-11-20`, nome: 'Zumbi dos Palmares', incluir: true }
        ];
      } else if (estadoUpper === 'MG' || estadoUpper === 'MINAS GERAIS') {
        feriadosEstaduais = [
          { data: `${currentYear}-04-21`, nome: 'Tiradentes', incluir: true }
        ];
      }

      // Feriados Municipais (exemplos baseados em algumas capitais)
      let feriadosMunicipais: any[] = [];
      const municipioUpper = (municipio as string).toUpperCase();

      if (municipioUpper.includes('SÃO PAULO')) {
        feriadosMunicipais = [
          { data: `${currentYear}-01-25`, nome: 'Aniversário de São Paulo', incluir: true }
        ];
      } else if (municipioUpper.includes('RIO DE JANEIRO')) {
        feriadosMunicipais = [
          { data: `${currentYear}-03-01`, nome: 'Aniversário do Rio de Janeiro', incluir: true }
        ];
      } else if (municipioUpper.includes('BELO HORIZONTE')) {
        feriadosMunicipais = [
          { data: `${currentYear}-12-12`, nome: 'Aniversário de Belo Horizonte', incluir: true }
        ];
      }

      const result = {
        success: true,
        message: 'Feriados encontrados com sucesso',
        data: {
          federais: feriadosFederais,
          estaduais: feriadosEstaduais,
          municipais: feriadosMunicipais
        },
        total: feriadosFederais.length + feriadosEstaduais.length + feriadosMunicipais.length
      };

      console.log('✅ [HOLIDAYS-LOOKUP] Success response:', {
        federais: feriadosFederais.length,
        estaduais: feriadosEstaduais.length,
        municipais: feriadosMunicipais.length
      });

      res.json(result);
    } catch (error) {
      console.error('❌ [HOLIDAYS-LOOKUP] Error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erro interno do servidor ao buscar feriados',
        error: process.env.NODE_ENV === 'development' ? error.message : 'INTERNAL_ERROR'
      });
    }
  }

  /**
   * Geocode address service
   */
  async geocodeAddress(req: Request, res: Response): Promise<void> {
    try {
      const { address } = req.body;

      console.log('🗺️ [GEOCODING] Request received for address:', address);

      if (!address) {
        res.status(400).json({ success: false, message: 'Endereço é obrigatório' });
        return;
      }

      try {
        // Try Nominatim for geocoding
        const nominatimResponse = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`
        );
        const nominatimData = await nominatimResponse.json();

        if (nominatimData && nominatimData[0]) {
          const result = {
            success: true,
            data: {
              address,
              latitude: parseFloat(nominatimData[0].lat),
              longitude: parseFloat(nominatimData[0].lon),
              formatted_address: nominatimData[0].display_name
            }
          };

          console.log('✅ [GEOCODING] Nominatim success:', result);
          res.json(result);
          return;
        }
      } catch (nominatimError) {
        console.error('⚠️ [GEOCODING] Nominatim failed:', nominatimError);
      }

      // Fallback to default coordinates (Brasília center)
      const fallbackResult = {
        success: true,
        data: {
          address,
          latitude: -15.7942,
          longitude: -47.8822,
          formatted_address: address
        }
      };

      console.log('🔄 [GEOCODING] Using fallback coordinates:', fallbackResult);
      res.json(fallbackResult);
    } catch (error) {
      console.error('❌ [GEOCODING] Error:', error);
      res.status(500).json({ success: false, message: 'Erro interno do servidor ao buscar coordenadas' });
    }
  }

  /**
   * Get records by type - ✅ 1qa.md compliant implementation
   */
  async getRecordsByType(req: any, res: Response): Promise<void> {
    try {
      const { recordType } = req.params;

      if (!req.user?.tenantId) {
        res.status(400).json({ success: false, message: 'Tenant ID required' });
        return;
      }

      const schemaName = `tenant_${req.user.tenantId.replace(/-/g, '_')}`;
      console.log(`🔍 [GET-RECORDS] Fetching ${recordType} for tenant: ${req.user.tenantId}`);
      console.log(`🔍 [GET-RECORDS] Using schema: ${schemaName}`);

      // Map record types to table names following Clean Architecture
      const tableMap: Record<string, string> = {
        'local': 'locais',
        'regiao': 'regioes', 
        'rota-dinamica': 'rotas_dinamicas',
        'trecho': 'trechos',
        'rota-trecho': 'rotas_trechos',
        'area': 'areas',
        'agrupamento': 'agrupamentos'
      };

      const tableName = tableMap[recordType];
      if (!tableName) {
        res.status(400).json({ 
          success: false, 
          message: `Invalid record type: ${recordType}` 
        });
        return;
      }

      // Check if table exists first per 1qa.md validation pattern
      const tableExists = await pool.query(`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.tables 
          WHERE table_schema = $1 AND table_name = $2
        ) as exists
      `, [schemaName, tableName]);

      if (!tableExists.rows[0]?.exists) {
        console.log(`⚠️ [GET-RECORDS] Table ${tableName} does not exist in schema ${schemaName}`);
        res.json({
          success: true,
          data: [],
          total: 0,
          message: `Table ${tableName} not yet created for this tenant`
        });
        return;
      }

      // Fetch records with Clean Architecture column mapping per 1qa.md
      let selectQuery;
      let orderByColumn = 'created_at';

      // Define table-specific queries following schema structure
      switch (recordType) {
        case 'rota-dinamica':
          selectQuery = `
            SELECT 
              id, 
              nome_rota as nome, 
              id_rota as codigo_integracao,
              ativo,
              previsao_dias,
              created_at, 
              updated_at
            FROM "${schemaName}"."${tableName}" 
            WHERE tenant_id = $1 AND ativo = true
            ORDER BY created_at DESC
            LIMIT 100
          `;
          break;

        case 'trecho':
          selectQuery = `
            SELECT 
              id, 
              CONCAT('Trecho ', id::text) as nome,
              codigo_integracao,
              ativo,
              local_a_id,
              local_b_id,
              created_at, 
              updated_at
            FROM "${schemaName}"."${tableName}" 
            WHERE tenant_id = $1 AND ativo = true
            ORDER BY created_at DESC
            LIMIT 100
          `;
          break;

        case 'rota-trecho':
          selectQuery = `
            SELECT 
              id, 
              id_rota as nome,
              ativo,
              local_a_id,
              local_b_id,
              created_at, 
              updated_at
            FROM "${schemaName}"."${tableName}" 
            WHERE tenant_id = $1 AND ativo = true
            ORDER BY created_at DESC
            LIMIT 100
          `;
          break;

        case 'local':
          selectQuery = `
            SELECT 
              id, 
              nome, 
              descricao, 
              codigo_integracao,
              ativo,
              created_at, 
              updated_at
            FROM "${schemaName}"."${tableName}" 
            WHERE tenant_id = $1 AND ativo = true
            ORDER BY nome ASC
            LIMIT 100
          `;
          break;

        case 'regiao':
          selectQuery = `
            SELECT 
              id, 
              nome, 
              descricao, 
              codigo_integracao,
              ativo,
              created_at, 
              updated_at
            FROM "${schemaName}"."${tableName}" 
            WHERE tenant_id = $1 AND ativo = true
            ORDER BY nome ASC
            LIMIT 100
          `;
          break;

        case 'area':
          selectQuery = `
            SELECT 
              id, 
              nome, 
              descricao, 
              codigo_integracao,
              ativo,
              created_at, 
              updated_at
            FROM "${schemaName}"."${tableName}" 
            WHERE tenant_id = $1 AND ativo = true
            ORDER BY nome ASC
            LIMIT 100
          `;
          break;

        case 'agrupamento':
          selectQuery = `
            SELECT 
              id, 
              nome, 
              descricao, 
              codigo_integracao,
              ativo,
              created_at, 
              updated_at
            FROM "${schemaName}"."${tableName}" 
            WHERE tenant_id = $1 AND ativo = true
            ORDER BY nome ASC
            LIMIT 100
          `;
          break;

        default:
          // For tables with standard 'nome' column
          selectQuery = `
            SELECT 
              id, 
              nome,
              descricao,
              codigo_integracao,
              ativo,
              created_at, 
              updated_at
            FROM "${schemaName}"."${tableName}" 
            WHERE tenant_id = $1 AND ativo = true
            ORDER BY nome ASC
            LIMIT 100
          `;
      }

      const result = await pool.query(selectQuery, [req.user.tenantId]);

      console.log(`✅ [GET-RECORDS] Found ${result.rows.length} records of type ${recordType}`);

      res.json({
        success: true,
        data: result.rows,
        total: result.rows.length,
        recordType: recordType,
        tableName: tableName
      });
    } catch (error) {
      console.error(`❌ [GET-RECORDS] Error fetching ${req.params?.recordType}:`, error);
      res.status(500).json({ 
        success: false, 
        message: 'Error fetching records',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Create record by type - ✅ 1qa.md compliant implementation
   */
  async createRecord(req: any, res: Response): Promise<void> {
    try {
      const { recordType } = req.params;

      if (!req.user?.tenantId) {
        res.status(400).json({ success: false, message: 'Tenant ID required' });
        return;
      }

      const schemaName = `tenant_${req.user.tenantId.replace(/-/g, '_')}`;

      // Map record types to table names following Clean Architecture
      const tableMap: Record<string, string> = {
        'local': 'locais',
        'regiao': 'regioes', 
        'rota-dinamica': 'rotas_dinamicas',
        'trecho': 'trechos',
        'rota-trecho': 'rotas_trechos',
        'area': 'areas',
        'agrupamento': 'agrupamentos'
      };

      const tableName = tableMap[recordType];
      if (!tableName) {
        res.status(400).json({ 
          success: false, 
          message: `Invalid record type: ${recordType}` 
        });
        return;
      }

      console.log(`🔍 [CREATE-RECORD] Creating ${recordType} in table ${tableName}`);

      // Generate UUID and add tenantId to the data
      const recordData = {
        id: uuidv4(), // Generate UUID for the record
        ...req.body,
        tenantId: req.user.tenantId,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      console.log(`🔍 [CREATE-RECORD] Data:`, recordData);

      // Prepare data for insertion, mapping camelCase to snake_case where necessary
      let dbData: any = {};
      if (recordType === 'local' || recordType === 'regiao' || recordType === 'area' || recordType === 'agrupamento') {
        // Convert camelCase to snake_case for database
        dbData = {
          ...recordData,
          tenant_id: req.user.tenantId,
          created_at: new Date(),
          updated_at: new Date(),
          codigo_integracao: recordData.codigoIntegracao,
          tipo_cliente_favorecido: recordData.tipoClienteFavorecido,
          tecnico_principal_id: recordData.tecnicoPrincipalId,
          fuso_horario: recordData.fusoHorario,
          feriados_incluidos: recordData.feriadosIncluidos,
          tipo_logradouro: recordData.tipoLogradouro,
          geo_coordenadas: recordData.geoCoordenadas
        };
        // Remove camelCase fields that are now properly mapped
        delete dbData.codigoIntegracao;
        delete dbData.tipoClienteFavorecido;
        delete dbData.tecnicoPrincipalId;
        delete dbData.fusoHorario;
        delete dbData.feriadosIncluidos;
        delete dbData.tenantId; // tenantId is already handled
        delete dbData.tipoLogradouro;
        delete dbData.geoCoordenadas;
        delete dbData.createdAt;
        delete dbData.updatedAt;
      } else {
        // For other record types, assume snake_case or direct mapping is handled
        dbData = { ...recordData, tenant_id: req.user.tenantId, created_at: new Date(), updated_at: new Date() };


  /**
   * Get locals (locais) - specific endpoint for listing locations
   */
  async getLocals(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user?.tenantId) {
        res.status(400).json({ success: false, message: 'Tenant ID required' });
        return;
      }

      const schemaName = `tenant_${req.user.tenantId.replace(/-/g, '_')}`;
      console.log(`🔍 [GET-LOCALS] Fetching locais for tenant: ${req.user.tenantId}`);
      console.log(`🔍 [GET-LOCALS] Using schema: ${schemaName}`);

      // Check if locais table exists first
      const tableExists = await pool.query(`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.tables 
          WHERE table_schema = $1 AND table_name = 'locais'
        ) as exists
      `, [schemaName]);

      if (!tableExists.rows[0]?.exists) {
        console.log(`⚠️ [GET-LOCALS] Table locais does not exist in schema ${schemaName}`);
        res.json({
          success: true,
          data: [],
          total: 0,
          message: `Table locais not yet created for this tenant`
        });
        return;
      }

      // Fetch locais with all fields
      const result = await pool.query(`
        SELECT 
          id, 
          nome, 
          descricao, 
          codigo_integracao,
          ativo,
          latitude,
          longitude,
          email,
          telefone,
          cep,
          estado,
          municipio,
          bairro,
          logradouro,
          numero,
          complemento,
          created_at, 
          updated_at
        FROM "${schemaName}".locais 
        WHERE tenant_id = $1 
        ORDER BY nome ASC
        LIMIT 100
      `, [req.user.tenantId]);

      console.log(`✅ [GET-LOCALS] Found ${result.rows.length} locais`);

      res.json({
        success: true,
        data: result.rows,
        total: result.rows.length
      });
    } catch (error) {
      console.error('❌ [GET-LOCALS] Error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erro interno do servidor ao buscar locais' 
      });
    }
  }

        delete dbData.tenantId; // tenantId is already handled
      }

      // Create record using raw SQL with proper column mapping
      const columns = Object.keys(dbData);
      const values = Object.values(dbData);
      const placeholders = values.map((_, index) => `$${index + 1}`).join(', ');

      const insertQuery = `
        INSERT INTO "${schemaName}"."${tableName}" (${columns.map(col => `"${col}"`).join(', ')})
        VALUES (${placeholders})
        RETURNING *
      `;

      const result = await pool.query(insertQuery, values);

      console.log(`✅ [CREATE-RECORD] Successfully created ${recordType}:`, result.rows[0]);

      res.status(201).json({
        success: true,
        message: `${recordType} created successfully`,
        data: result.rows[0]
      });

    } catch (error) {
      console.error(`❌ [CREATE-RECORD] Error creating ${req.params.recordType}:`, error);
      res.status(500).json({ 
        success: false, 
        message: 'Error creating record',
        error: process.env.NODE_ENV === 'development' ? error.message : 'INTERNAL_ERROR'
      });
    }
  }

  /**
   * Get stats by type
   */
  async getStatsByType(req: Request, res: Response): Promise<void> {
    try {
      const { recordType } = req.params;

      res.json({
        success: true,
        data: {
          total: 0,
          active: 0,
          inactive: 0
        },
        message: `Stats for type ${recordType} (placeholder)`
      });
    } catch (error) {
      console.error('Error fetching stats by type:', error);
      res.status(500).json({ success: false, message: 'Error fetching stats' });
    }
  }
}