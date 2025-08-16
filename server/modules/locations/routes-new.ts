// LOCATIONS NEW ROUTES - API routes for 7 record types
import { Router, Request, Response, NextFunction } from "express";
import { LocationsNewController } from './LocationsNewController';
import { LocationsNewRepository } from './LocationsNewRepository';
import { getTenantDb } from '../../db-tenant';
import { DatabaseStorage } from "../../storage-simple";
import { jwtAuth, AuthenticatedRequest } from "../../middleware/jwtAuth";
import { z } from 'zod';
import {
  localSchema,
  regiaoSchema,
  rotaDinamicaSchema,
  trechoSchema,
  rotaTrechoSchema,
  areaSchema,
  agrupamentoSchema,
  rotaTrechoComSegmentosSchema
} from '../../../shared/schema-locations-new';
import { pool } from '../../db';

const router = Router();

// Apply JWT authentication to all routes
router.use(jwtAuth);

// Middleware para garantir que sempre retornamos JSON
router.use((req, res, next) => {
  res.setHeader('Content-Type', 'application/json');
  
  // Override res.status para sempre garantir JSON
  const originalStatus = res.status;
  res.status = function(code) {
    res.setHeader('Content-Type', 'application/json');
    return originalStatus.call(this, code);
  };
  
  // Override res.send para garantir JSON válido
  const originalSend = res.send;
  res.send = function(body) {
    res.setHeader('Content-Type', 'application/json');
    if (typeof body === 'string' && !body.startsWith('{') && !body.startsWith('[')) {
      // Se não é JSON, envolver em uma resposta JSON válida
      return originalSend.call(this, JSON.stringify({
        success: false,
        error: 'Internal server error',
        message: body,
        timestamp: new Date().toISOString()
      }));
    }
    return originalSend.call(this, body);
  };
  
  next();
});


// Extend AuthenticatedRequest interface for locations
interface LocationsRequest extends AuthenticatedRequest {
  tenantDb?: any;
}

// Middleware to get tenant database pool (after authentication)
router.use('*', async (req: LocationsRequest, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      console.error('No tenant ID found in token:', req.user);
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token',
        error: 'No tenant ID found'
      });
    }

    // Get the database pool directly for SQL queries
    const { schemaManager } = await import('../../db');
    req.tenantDb = schemaManager.getPool();
    next();
  } catch (error) {
    console.error('Error getting tenant database:', error);
    return res.status(500).json({ success: false, message: 'Database connection error' });
  }
});

// Initialize controller with proper error handling
let controller: LocationsNewController;
try {
  controller = new LocationsNewController();
  console.log('✅ LocationsNewController initialized successfully');
} catch (error) {
  console.error('❌ Failed to initialize LocationsNewController:', error);
  throw error;
}

// Controller factory function
const getController = (req: LocationsRequest) => controller;

// Helper function to get schema name
function getSchemaName(tenantId: string): string {
  const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
  console.log('🔍 [SCHEMA-NAME] Generated schema name:', schemaName, 'for tenant:', tenantId);
  return schemaName;
}

// Helper function to ensure schema and tables exist
async function ensureSchemaAndTables(schemaName: string): Promise<void> {
  try {
    // Validar nome do schema
    if (!schemaName || typeof schemaName !== 'string') {
      throw new Error(`Invalid schema name: ${schemaName}`);
    }

    console.log('🔧 [SCHEMA-SETUP] Creating schema if not exists:', schemaName);
    
    // Criar schema com timeout
    await Promise.race([
      pool.query(`CREATE SCHEMA IF NOT EXISTS "${schemaName}"`),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Schema creation timeout')), 5000)
      )
    ]);

    console.log('🔧 [SCHEMA-SETUP] Creating tables for schema:', schemaName);
    
    // Verificar se a função existe primeiro
    const functionExists = await pool.query(`
      SELECT EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'create_locations_new_tables_for_tenant'
      ) as exists
    `);

    if (!functionExists.rows[0].exists) {
      console.error('❌ [SCHEMA-SETUP] Function create_locations_new_tables_for_tenant does not exist');
      throw new Error('Database function not available');
    }

    // Executar função com timeout
    await Promise.race([
      pool.query(`SELECT create_locations_new_tables_for_tenant('${schemaName}')`),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Table creation timeout')), 10000)
      )
    ]);

    console.log('✅ [SCHEMA-SETUP] Schema and tables ready for:', schemaName);
  } catch (error) {
    console.error('❌ [SCHEMA-SETUP] Error setting up schema:', error);
    console.error('❌ [SCHEMA-SETUP] Schema name was:', schemaName);
    throw new Error(`Schema setup failed: ${error.message}`);
  }
}

// Integration endpoints FIRST (most specific)
router.get("/integration/clientes", async (req: AuthenticatedRequest, res: Response) => {
  try {
    await controller.getClientes(req, res);
  } catch (error) {
    console.error('Error in clientes integration:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch clientes', error: error.message });
  }
});

router.get("/integration/tecnicos", async (req: AuthenticatedRequest, res: Response) => {
  try {
    await controller.getTecnicosEquipe(req, res);
  } catch (error) {
    console.error('Error in tecnicos integration:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch tecnicos', error: error.message });
  }
});

router.get("/integration/grupos", async (req: AuthenticatedRequest, res: Response) => {
  try {
    await controller.getGruposEquipe(req, res);
  } catch (error) {
    console.error('Error in grupos integration:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch grupos', error: error.message });
  }
});

router.get("/integration/locais", async (req: AuthenticatedRequest, res: Response) => {
  try {
    await controller.getLocaisAtendimento(req, res);
  } catch (error) {
    console.error('Error in locais integration:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch locais', error: error.message });
  }
});

// Fix para endpoint locais-atendimento
router.get("/locais-atendimento", async (req: AuthenticatedRequest, res: Response) => {
  try {
    await controller.getLocaisAtendimento(req, res);
  } catch (error) {
    console.error('Error in locais-atendimento:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch locais de atendimento', error: error.message });
  }
});

// Services endpoints
router.get('/services/cep/:cep', async (req: LocationsRequest, res: Response) => {
  return controller.lookupCep(req, res);
});

router.get('/services/holidays', async (req: LocationsRequest, res: Response) => {
  return controller.lookupHolidays(req, res);
});

router.post('/services/geocode', async (req: LocationsRequest, res: Response) => {
  return controller.geocodeAddress(req, res);
});

// Get statistics by type
router.get('/:recordType/stats', async (req: LocationsRequest, res: Response) => {
  return controller.getStatsByType(req, res);
});

// Get records by type (most generic - should be LAST)
router.get('/:recordType', async (req: LocationsRequest, res: Response) => {
  const { recordType } = req.params;

  // Validate record type first
  const validTypes = ['local', 'regiao', 'rota-dinamica', 'trecho', 'rota-trecho', 'area', 'agrupamento'];
  if (!validTypes.includes(recordType)) {
    return res.status(400).json({
      success: false,
      message: `Invalid record type: ${recordType}. Valid types: ${validTypes.join(', ')}`
    });
  }

  return controller.getRecordsByType(req, res);
});

// Create operations
// POST /api/locations-new/local - Create new local
router.post('/local', async (req: LocationsRequest, res: Response) => {
  console.log('🔄 [CREATE-LOCAL] Starting creation process');
  console.log('📝 [CREATE-LOCAL] Request body received:', JSON.stringify(req.body, null, 2));
  
  // Função de tratamento de erro melhorada
  const handleError = (error: any, context: string, statusCode: number = 500) => {
    console.error(`❌ [CREATE-LOCAL] ${context}:`, error);
    console.error(`❌ [CREATE-LOCAL] Error details:`, {
      message: error?.message,
      code: error?.code,
      name: error?.name,
      stack: error?.stack?.split('\n').slice(0, 3).join('\n')
    });
    
    if (res.headersSent) {
      console.error('❌ [CREATE-LOCAL] Headers already sent, cannot respond');
      return;
    }
    
    // Garantir sempre resposta JSON
    res.setHeader('Content-Type', 'application/json');
    
    let errorMessage = 'Erro interno do servidor';
    let userMessage = `Falha durante ${context}. Tente novamente.`;
    
    // Tratar diferentes tipos de erro
    if (error?.code === '23505') {
      statusCode = 409;
      errorMessage = 'Conflito de dados';
      userMessage = 'Já existe um local com este nome ou código';
    } else if (error?.code === '23503') {
      statusCode = 400;
      errorMessage = 'Referência inválida';
      userMessage = 'Dados relacionados não encontrados';
    } else if (error?.code === '42P01') {
      statusCode = 503;
      errorMessage = 'Estrutura não configurada';
      userMessage = 'Sistema temporariamente indisponível';
    } else if (error?.name === 'ZodError') {
      statusCode = 400;
      errorMessage = 'Dados inválidos';
      userMessage = 'Verifique os dados informados';
    }
    
    const response = {
      success: false,
      error: errorMessage,
      message: userMessage,
      timestamp: new Date().toISOString(),
      debug: process.env.NODE_ENV === 'development' ? {
        context,
        originalMessage: error?.message,
        errorCode: error?.code,
        errorName: error?.name
      } : undefined
    };
    
    return res.status(statusCode).json(response);
  };

  // Wrap everything in try-catch
  try {
    // Verificar usuário autenticado
    const user = (req as any).user;
    if (!user) {
      console.log('❌ [CREATE-LOCAL] Unauthorized access attempt');
      return res.status(401).json({ 
        success: false, 
        error: 'Unauthorized',
        message: 'Token de autenticação inválido ou expirado' 
      });
    }

    if (!user.tenantId) {
      console.log('❌ [CREATE-LOCAL] No tenant ID found');
      return res.status(400).json({ 
        success: false, 
        error: 'Tenant ID não encontrado',
        message: 'Token não contém informações de tenant válidas' 
      });
    }

    console.log('✅ [CREATE-LOCAL] User authenticated:', { 
      userId: user.id, 
      tenantId: user.tenantId,
      email: user.email 
    });

    // Validar campos obrigatórios básicos
    if (!req.body || typeof req.body !== 'object') {
      console.log('❌ [CREATE-LOCAL] Invalid request body');
      return res.status(400).json({
        success: false,
        error: 'Dados de entrada inválidos',
        message: 'O corpo da requisição deve ser um objeto válido'
      });
    }

    if (!req.body.nome || typeof req.body.nome !== 'string' || req.body.nome.trim().length === 0) {
      console.log('❌ [CREATE-LOCAL] Nome field missing or invalid');
      return res.status(400).json({
        success: false,
        error: 'Campo obrigatório ausente',
        message: 'O campo "nome" é obrigatório e deve ser uma string não vazia'
      });
    }

    // Validar dados com Zod
    let validatedData;
    try {
      console.log('🔍 [CREATE-LOCAL] Validating data with Zod...');
      validatedData = localSchema.parse({
        ...req.body,
        tenantId: user.tenantId
      });
      console.log('✅ [CREATE-LOCAL] Data validated successfully');
    } catch (validationError) {
      console.log('❌ [CREATE-LOCAL] Validation error:', validationError);
      if (validationError instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Dados de entrada inválidos',
          message: 'Verifique os campos obrigatórios',
          details: validationError.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
            received: err.input
          }))
        });
      }
      return handleError(validationError, 'validação dos dados');
    }

    // Configurar schema do tenant
    const tenantId = user.tenantId;
    const schemaName = getSchemaName(tenantId);
    console.log('🔍 [CREATE-LOCAL] Using schema:', schemaName);

    // Validar se o schemaName é válido
    if (!schemaName || typeof schemaName !== 'string' || schemaName.length === 0) {
      console.error('❌ [CREATE-LOCAL] Invalid schema name:', schemaName);
      return handleError(new Error('Invalid schema name'), 'schema validation', 400);
    }

    try {
      console.log('🔧 [CREATE-LOCAL] Ensuring schema and tables exist...');
      await ensureSchemaAndTables(schemaName);
      console.log('✅ [CREATE-LOCAL] Schema setup completed');
    } catch (schemaError) {
      console.error('❌ [CREATE-LOCAL] Schema setup error:', schemaError);
      return handleError(schemaError, 'configuração do schema', 503);
    }

    // Preparar campos JSON
    const geoCoordenadasJson = validatedData.geoCoordenadas ? 
      JSON.stringify(validatedData.geoCoordenadas) : null;
    const feriadosIncluidosJson = validatedData.feriadosIncluidos ? 
      JSON.stringify(validatedData.feriadosIncluidos) : null;
    const indisponibilidadesJson = validatedData.indisponibilidades ? 
      JSON.stringify(validatedData.indisponibilidades) : null;

    console.log('💾 [CREATE-LOCAL] Inserting into database...');
    
    // Preparar parâmetros com validação extra
    const insertParams = [
      validatedData.tenantId, 
      validatedData.ativo ?? true, 
      validatedData.nome.trim(),
      validatedData.descricao || null, 
      validatedData.codigoIntegracao || null, 
      validatedData.tipoClienteFavorecido || null,
      validatedData.tecnicoPrincipalId || null, 
      validatedData.email || null, 
      validatedData.ddd || null,
      validatedData.telefone || null, 
      validatedData.cep || null, 
      validatedData.pais || 'Brasil',
      validatedData.estado || null, 
      validatedData.municipio || null, 
      validatedData.bairro || null,
      validatedData.tipoLogradouro || null, 
      validatedData.logradouro || null, 
      validatedData.numero || null,
      validatedData.complemento || null, 
      validatedData.latitude ? parseFloat(validatedData.latitude.toString()) : null, 
      validatedData.longitude ? parseFloat(validatedData.longitude.toString()) : null,
      geoCoordenadasJson, 
      validatedData.fusoHorario || 'America/Sao_Paulo',
      feriadosIncluidosJson, 
      indisponibilidadesJson
    ];

    console.log('🔍 [CREATE-LOCAL] Insert parameters count:', insertParams.length);
    console.log('🔍 [CREATE-LOCAL] Schema name for query:', schemaName);
    
    let result;
    try {
      // Executar inserção no banco com timeout
      result = await Promise.race([
        pool.query(
          `INSERT INTO "${schemaName}".locais (
            tenant_id, ativo, nome, descricao, codigo_integracao, tipo_cliente_favorecido,
            tecnico_principal_id, email, ddd, telefone, cep, pais, estado, municipio,
            bairro, tipo_logradouro, logradouro, numero, complemento, latitude, longitude,
            geo_coordenadas, fuso_horario, feriados_incluidos, indisponibilidades
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25)
          RETURNING *`,
          insertParams
        ),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Database query timeout')), 10000)
        )
      ]);
    } catch (dbError) {
      console.error('❌ [CREATE-LOCAL] Database insert error:', dbError);
      return handleError(dbError, 'inserção no banco de dados', 500);
    }

    if (!result || !result.rows || result.rows.length === 0) {
      console.error('❌ [CREATE-LOCAL] No data returned from database insert');
      return handleError(new Error('No data returned from insert'), 'validação do resultado', 500);
    }

    const createdLocal = result.rows[0];
    console.log('✅ [CREATE-LOCAL] Local created successfully:', {
      id: createdLocal.id,
      nome: createdLocal.nome,
      tenantId: createdLocal.tenant_id
    });

    // Garantir que a resposta é JSON válido
    res.setHeader('Content-Type', 'application/json');
    return res.status(201).json({
      success: true,
      message: 'Local criado com sucesso',
      data: createdLocal,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ [CREATE-LOCAL] Unexpected error in main try-catch:', error);
    return handleError(error, 'criação do local');
  }
});

router.post('/regiao', async (req: LocationsRequest, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ success: false, error: 'Unauthorized' });
    const validatedData = regiaoSchema.parse({ ...req.body, tenantId: user.tenantId });
    const tenantId = user.tenantId;
    const schemaName = getSchemaName(tenantId);
    await ensureSchemaAndTables(schemaName);
    const result = await pool.query(
      `INSERT INTO "${schemaName}".regioes (tenant_id, ativo, nome, descricao) VALUES ($1, $2, $3, $4) RETURNING *`,
      [validatedData.tenantId, validatedData.ativo || true, validatedData.nome, validatedData.descricao]
    );
    res.status(201).json({ success: true, message: 'Região criada com sucesso', data: result.rows[0] });
  } catch (error) {
    console.error('❌ [CREATE-REGIAO] Error creating regiao:', error);
    if (error instanceof z.ZodError) return res.status(400).json({ success: false, error: 'Invalid input data', details: error.errors });
    res.status(500).json({ success: false, error: 'Internal server error', message: error.message || 'Unknown error' });
  }
});

router.post('/rota-dinamica', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ success: false, error: 'Unauthorized' });
    const validatedData = rotaDinamicaSchema.parse({ ...req.body, tenantId: user.tenantId });
    const tenantId = user.tenantId;
    const schemaName = getSchemaName(tenantId);
    await ensureSchemaAndTables(schemaName);
    const result = await pool.query(
      `INSERT INTO "${schemaName}".rotas_dinamicas (tenant_id, ativo, nome, descricao) VALUES ($1, $2, $3, $4) RETURNING *`,
      [validatedData.tenantId, validatedData.ativo || true, validatedData.nome, validatedData.descricao]
    );
    res.status(201).json({ success: true, message: 'Rota dinâmica criada com sucesso', data: result.rows[0] });
  } catch (error) {
    console.error('❌ [CREATE-ROTA-DINAMICA] Error creating rota dinamica:', error);
    if (error instanceof z.ZodError) return res.status(400).json({ success: false, error: 'Invalid input data', details: error.errors });
    res.status(500).json({ success: false, error: 'Internal server error', message: error.message || 'Unknown error' });
  }
});

router.post('/trecho', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ success: false, error: 'Unauthorized' });
    const validatedData = trechoSchema.parse({ ...req.body, tenantId: user.tenantId });
    const tenantId = user.tenantId;
    const schemaName = getSchemaName(tenantId);
    await ensureSchemaAndTables(schemaName);
    const result = await pool.query(
      `INSERT INTO "${schemaName}".trechos (tenant_id, ativo, nome, descricao) VALUES ($1, $2, $3, $4) RETURNING *`,
      [validatedData.tenantId, validatedData.ativo || true, validatedData.nome, validatedData.descricao]
    );
    res.status(201).json({ success: true, message: 'Trecho criado com sucesso', data: result.rows[0] });
  } catch (error) {
    console.error('❌ [CREATE-TRECHO] Error creating trecho:', error);
    if (error instanceof z.ZodError) return res.status(400).json({ success: false, error: 'Invalid input data', details: error.errors });
    res.status(500).json({ success: false, error: 'Internal server error', message: error.message || 'Unknown error' });
  }
});

router.post('/rota-trecho', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ success: false, error: 'Unauthorized' });
    const validatedData = rotaTrechoSchema.parse({ ...req.body, tenantId: user.tenantId });
    const tenantId = user.tenantId;
    const schemaName = getSchemaName(tenantId);
    await ensureSchemaAndTables(schemaName);
    const result = await pool.query(
      `INSERT INTO "${schemaName}".rotas_trechos (tenant_id, ativo, nome, descricao, rota_dinamica_id, trecho_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [validatedData.tenantId, validatedData.ativo || true, validatedData.nome, validatedData.descricao, validatedData.rotaDinamicaId, validatedData.trechoId]
    );
    res.status(201).json({ success: true, message: 'Rota de trecho criada com sucesso', data: result.rows[0] });
  } catch (error) {
    console.error('❌ [CREATE-ROTA-TRECHO] Error creating rota trecho:', error);
    if (error instanceof z.ZodError) return res.status(400).json({ success: false, error: 'Invalid input data', details: error.errors });
    res.status(500).json({ success: false, error: 'Internal server error', message: error.message || 'Unknown error' });
  }
});

router.post('/area', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ success: false, error: 'Unauthorized' });
    const validatedData = areaSchema.parse({ ...req.body, tenantId: user.tenantId });
    const tenantId = user.tenantId;
    const schemaName = getSchemaName(tenantId);
    await ensureSchemaAndTables(schemaName);
    const result = await pool.query(
      `INSERT INTO "${schemaName}".areas (tenant_id, ativo, nome, descricao) VALUES ($1, $2, $3, $4) RETURNING *`,
      [validatedData.tenantId, validatedData.ativo || true, validatedData.nome, validatedData.descricao]
    );
    res.status(201).json({ success: true, message: 'Área criada com sucesso', data: result.rows[0] });
  } catch (error) {
    console.error('❌ [CREATE-AREA] Error creating area:', error);
    if (error instanceof z.ZodError) return res.status(400).json({ success: false, error: 'Invalid input data', details: error.errors });
    res.status(500).json({ success: false, error: 'Internal server error', message: error.message || 'Unknown error' });
  }
});

router.post('/agrupamento', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ success: false, error: 'Unauthorized' });
    const validatedData = agrupamentoSchema.parse({ ...req.body, tenantId: user.tenantId });
    const tenantId = user.tenantId;
    const schemaName = getSchemaName(tenantId);
    await ensureSchemaAndTables(schemaName);
    const result = await pool.query(
      `INSERT INTO "${schemaName}".agrupamentos (tenant_id, ativo, nome, descricao) VALUES ($1, $2, $3, $4) RETURNING *`,
      [validatedData.tenantId, validatedData.ativo || true, validatedData.nome, validatedData.descricao]
    );
    res.status(201).json({ success: true, message: 'Agrupamento criado com sucesso', data: result.rows[0] });
  } catch (error) {
    console.error('❌ [CREATE-AGRUPAMENTO] Error creating agrupamento:', error);
    if (error instanceof z.ZodError) return res.status(400).json({ success: false, error: 'Invalid input data', details: error.errors });
    res.status(500).json({ success: false, error: 'Internal server error', message: error.message || 'Unknown error' });
  }
});

// Update operations
router.put('/:recordType/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { recordType, id } = req.params;
    const user = (req as any).user;
    if (!user) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const tenantId = user.tenantId;
    const schemaName = getSchemaName(tenantId);
    await ensureSchemaAndTables(schemaName);

    let schema;
    switch (recordType) {
      case 'local': schema = localSchema; break;
      case 'regiao': schema = regiaoSchema; break;
      case 'rota-dinamica': schema = rotaDinamicaSchema; break;
      case 'trecho': schema = trechoSchema; break;
      case 'rota-trecho': schema = rotaTrechoSchema; break;
      case 'area': schema = areaSchema; break;
      case 'agrupamento': schema = agrupamentoSchema; break;
      default: return res.status(400).json({ success: false, message: `Invalid record type: ${recordType}` });
    }

    const validatedData = schema.parse({ ...req.body, tenantId: user.tenantId });

    const updateQuery = `UPDATE "${schemaName}"."${recordType}s" SET ${Object.keys(validatedData).filter(key => key !== 'id' && key !== 'tenantId').map((key, index) => `${key} = $${index + 1}`).join(', ')} WHERE id = $${Object.keys(validatedData).length} AND tenant_id = $${Object.keys(validatedData).length + 1} RETURNING *`;
    const values = [...Object.values(validatedData).filter(val => val !== validatedData.id && val !== validatedData.tenantId), id, tenantId];

    const result = await pool.query(updateQuery, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: `Record of type ${recordType} with id ${id} not found` });
    }

    res.status(200).json({ success: true, message: `${recordType} updated successfully`, data: result.rows[0] });
  } catch (error) {
    console.error(`❌ [UPDATE-${recordType.toUpperCase()}] Error updating ${recordType}:`, error);
    if (error instanceof z.ZodError) return res.status(400).json({ success: false, error: 'Invalid input data', details: error.errors });
    res.status(500).json({ success: false, error: 'Internal server error', message: error.message || 'Unknown error' });
  }
});

// Delete operations
router.delete('/:recordType/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { recordType, id } = req.params;
    const user = (req as any).user;
    if (!user) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const tenantId = user.tenantId;
    const schemaName = getSchemaName(tenantId);
    await ensureSchemaAndTables(schemaName);

    const deleteQuery = `DELETE FROM "${schemaName}"."${recordType}s" WHERE id = $1 AND tenant_id = $2 RETURNING *`;
    const result = await pool.query(deleteQuery, [id, tenantId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: `Record of type ${recordType} with id ${id} not found` });
    }

    res.status(200).json({ success: true, message: `${recordType} deleted successfully`, data: result.rows[0] });
  } catch (error) {
    console.error(`❌ [DELETE-${recordType.toUpperCase()}] Error deleting ${recordType}:`, error);
    res.status(500).json({ success: false, error: 'Internal server error', message: error.message || 'Unknown error' });
  }
});


// Middleware de tratamento de erro no final - captura qualquer erro não tratado
router.use((error: any, req: any, res: any, next: any) => {
  console.error('❌ [LOCATIONS-ERROR-HANDLER] Unhandled error:', error);
  console.error('❌ [LOCATIONS-ERROR-HANDLER] Error stack:', error?.stack);
  console.error('❌ [LOCATIONS-ERROR-HANDLER] Request details:', {
    method: req.method,
    path: req.path,
    body: req.body,
    user: req.user?.id
  });
  
  // Garantir resposta JSON sempre
  if (!res.headersSent) {
    res.setHeader('Content-Type', 'application/json');
    
    // Determinar se é erro de validação ou erro interno
    let statusCode = 500;
    let errorMessage = 'Erro interno do servidor';
    
    if (error.name === 'ValidationError' || error.name === 'ZodError') {
      statusCode = 400;
      errorMessage = 'Dados de entrada inválidos';
    } else if (error.code === '23505') { // PostgreSQL unique violation
      statusCode = 409;
      errorMessage = 'Conflito: registro já existe';
    } else if (error.code === '23503') { // PostgreSQL foreign key violation
      statusCode = 400;
      errorMessage = 'Referência inválida';
    } else if (error.code === '42P01') { // PostgreSQL table does not exist
      statusCode = 503;
      errorMessage = 'Estrutura do banco não configurada';
    }
    
    const response = {
      success: false,
      error: errorMessage,
      message: 'Erro no processamento da requisição',
      timestamp: new Date().toISOString(),
      debug: process.env.NODE_ENV === 'development' ? {
        originalError: error.message,
        errorCode: error.code,
        stack: error.stack?.split('\n').slice(0, 5).join('\n')
      } : undefined
    };
    
    res.status(statusCode).json(response);
  }
});

export default router;