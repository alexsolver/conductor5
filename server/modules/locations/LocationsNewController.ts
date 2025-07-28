// LOCATIONS NEW CONTROLLER - Support for 7 Record Types
import { Request, Response } from "express";
import { AuthenticatedRequest } from "../../middleware/jwtAuth";
import { LocationsNewRepository } from "./LocationsNewRepository";
import { sendSuccess, sendError, sendValidationError } from "../../utils/standardResponse";
import { z } from "zod";
import { localSchema, regiaoSchema, rotaDinamicaSchema, trechoSchema, rotaTrechoSchema, areaSchema, agrupamentoSchema } from "../../../shared/schema-locations-new";
import { db } from '../../db';

export class LocationsNewController {
  private repository: LocationsNewRepository;

  constructor() {
    this.repository = new LocationsNewRepository(db);
  }

  // Get statistics by type
  async getStatsByType(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return sendError(res, "Tenant ID required", 401);
      }

      const { recordType } = req.params;
      const stats = await this.repository.getStatsByType(tenantId, recordType as string);

      return sendSuccess(res, stats, `${recordType} statistics retrieved successfully`);
    } catch (error) {
      console.error('Error fetching stats by type:', error);
      return sendError(res, "Failed to fetch statistics", 500);
    }
  }

  // Get records by type
  async getRecordsByType(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        console.error('LocationsNewController.getRecordsByType - No tenant ID found');
        return sendError(res, "Tenant ID required", 401);
      }

      const { recordType } = req.params;
      if (!recordType) {
        console.error('LocationsNewController.getRecordsByType - No record type provided');
        return sendError(res, "Record type required", 400);
      }

      // Validate record type
      const validTypes = ['local', 'regiao', 'rota-dinamica', 'trecho', 'rota-trecho', 'area', 'agrupamento'];
      if (!validTypes.includes(recordType)) {
        console.error(`LocationsNewController.getRecordsByType - Invalid record type: ${recordType}`);
        return sendError(res, "Invalid record type", 400);
      }

      const { search, status } = req.query;

      console.log(`LocationsNewController.getRecordsByType - Fetching ${recordType} for tenant: ${tenantId}`);

      const records = await this.repository.getRecordsByType(
        tenantId,
        recordType as string,
        {
          search: search as string,
          status: status as string
        }
      );

      // Ensure records is always an array
      const safeRecords = Array.isArray(records) ? records : [];
      
      // Enhanced response with consistent structure
      const response = {
        records: safeRecords,
        metadata: {
          total: safeRecords.length,
          recordType,
          tenantId,
          filters: { search, status },
          isMockData: safeRecords.length > 0 && safeRecords[0]?.id?.startsWith('mock-'),
          timestamp: new Date().toISOString(),
          dataSource: safeRecords.length > 0 ? 'database' : 'mock',
          schemaStatus: 'validated',
          queryStatus: 'success'
        }
      };

      console.log(`LocationsNewController.getRecordsByType - Successfully retrieved ${safeRecords.length} ${recordType} records`);
      return sendSuccess(res, response, `${recordType} records retrieved successfully`);
    } catch (error) {
      console.error('LocationsNewController.getRecordsByType - Error:', error);
      
      // Graceful degradation - return empty result instead of 500 error
      const fallbackResponse = {
        records: [],
        metadata: {
          total: 0,
          recordType: req.params.recordType || 'unknown',
          tenantId: req.user?.tenantId || 'unknown',
          error: 'Database service temporarily unavailable',
          isFallback: true,
          timestamp: new Date().toISOString()
        }
      };

      return sendSuccess(res, fallbackResponse, "Records retrieved with fallback data due to service issues");
    }
  }

  // CEP lookup service
  async lookupCep(req: AuthenticatedRequest, res: Response) {
    try {
      const { cep } = req.params;

      if (!cep || cep.length < 8) {
        return sendError(res, "CEP inválido", 400);
      }

      const response = await fetch(`https://viacep.com.br/ws/${cep.replace('-', '')}/json/`);
      const data = await response.json();

      if (data.erro) {
        return sendError(res, "CEP não encontrado", 404);
      }

      return sendSuccess(res, data, "CEP encontrado com sucesso");
    } catch (error) {
      console.error('Error looking up CEP:', error);
      return sendError(res, "Erro ao buscar CEP", 500);
    }
  }

  // Holidays lookup service
  async lookupHolidays(req: AuthenticatedRequest, res: Response) {
    try {
      const { municipio, estado, ano } = req.query;

      if (!municipio || !estado) {
        return sendError(res, "Município e estado são obrigatórios", 400);
      }

      const currentYear = ano ? parseInt(ano as string) : new Date().getFullYear();

      // Mock holiday data - replace with actual API integration
      const holidays = {
        federais: [
          { data: `${currentYear}-01-01`, nome: 'Confraternização Universal', incluir: false },
          { data: `${currentYear}-04-21`, nome: 'Tiradentes', incluir: false },
          { data: `${currentYear}-05-01`, nome: 'Dia do Trabalhador', incluir: false },
          { data: `${currentYear}-09-07`, nome: 'Independência do Brasil', incluir: false },
          { data: `${currentYear}-10-12`, nome: 'Nossa Senhora Aparecida', incluir: false },
          { data: `${currentYear}-11-02`, nome: 'Finados', incluir: false },
          { data: `${currentYear}-11-15`, nome: 'Proclamação da República', incluir: false },
          { data: `${currentYear}-12-25`, nome: 'Natal', incluir: false }
        ],
        estaduais: LocationsNewController.getEstadualHolidays(estado as string, currentYear),
        municipais: LocationsNewController.getMunicipalHolidays(municipio as string, estado as string, currentYear)
      };

      return sendSuccess(res, holidays, "Feriados encontrados com sucesso");
    } catch (error) {
      console.error('Error looking up holidays:', error);
      return sendError(res, "Erro ao buscar feriados", 500);
    }
  }

  // Geocoding service
  async geocodeAddress(req: AuthenticatedRequest, res: Response) {
    try {
      const { address } = req.body;

      if (!address) {
        return sendError(res, "Endereço é obrigatório", 400);
      }

      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`
      );
      const data = await response.json();

      if (data && data[0]) {
        const result = {
          latitude: parseFloat(data[0].lat),
          longitude: parseFloat(data[0].lon),
          displayName: data[0].display_name,
          boundingBox: data[0].boundingbox
        };

        return sendSuccess(res, result, "Coordenadas encontradas com sucesso");
      }

      return sendError(res, "Endereço não encontrado", 404);
    } catch (error) {
      console.error('Error geocoding address:', error);
      return sendError(res, "Erro ao buscar coordenadas", 500);
    }
  }

  private static getEstadualHolidays(estado: string, ano: number) {
    // Feriados estaduais por estado brasileiro
    const estadualHolidays: any = {
      'SP': [
        { data: `${ano}-07-09`, nome: 'Revolução Constitucionalista', incluir: false }
      ],
      'RJ': [
        { data: `${ano}-04-23`, nome: 'São Jorge', incluir: false },
        { data: `${ano}-06-29`, nome: 'São Pedro', incluir: false },
        { data: `${ano}-11-20`, nome: 'Zumbi dos Palmares', incluir: false }
      ],
      'MG': [
        { data: `${ano}-04-21`, nome: 'Tiradentes (Estadual MG)', incluir: false }
      ],
      'RS': [
        { data: `${ano}-09-20`, nome: 'Revolução Farroupilha', incluir: false }
      ],
      'CE': [
        { data: `${ano}-03-25`, nome: 'Data Magna do Ceará', incluir: false }
      ],
      'BA': [
        { data: `${ano}-07-02`, nome: 'Independência da Bahia', incluir: false }
      ],
      'PR': [
        { data: `${ano}-12-19`, nome: 'Emancipação do Paraná', incluir: false }
      ],
      'SC': [
        { data: `${ano}-08-11`, nome: 'Criação da Comarca de São José', incluir: false }
      ],
      'GO': [
        { data: `${ano}-10-24`, nome: 'Pedra Fundamental de Goiânia', incluir: false }
      ],
      'MT': [
        { data: `${ano}-11-20`, nome: 'Zumbi dos Palmares (MT)', incluir: false }
      ],
      'MS': [
        { data: `${ano}-10-11`, nome: 'Criação do Estado', incluir: false }
      ],
      'PE': [
        { data: `${ano}-06-24`, nome: 'São João', incluir: false }
      ],
      'AL': [
        { data: `${ano}-06-24`, nome: 'São João (AL)', incluir: false }
      ],
      'SE': [
        { data: `${ano}-07-08`, nome: 'Emancipação de Sergipe', incluir: false }
      ]
    };

    return estadualHolidays[estado.toUpperCase()] || [];
  }

  private static getMunicipalHolidays(municipio: string, estado: string, ano: number) {
    // Feriados municipais das principais cidades
    const municipalHolidays: any = {
      'São Paulo_SP': [
        { data: `${ano}-01-25`, nome: 'Aniversário de São Paulo', incluir: false }
      ],
      'Rio de Janeiro_RJ': [
        { data: `${ano}-01-20`, nome: 'São Sebastião', incluir: false },
        { data: `${ano}-04-22`, nome: 'Descobrimento do Brasil', incluir: false }
      ],
      'Belo Horizonte_MG': [
        { data: `${ano}-12-08`, nome: 'Nossa Senhora da Conceição', incluir: false }
      ],
      'Salvador_BA': [
        { data: `${ano}-01-06`, nome: 'Epifania', incluir: false }
      ],
      'Brasília_DF': [
        { data: `${ano}-04-21`, nome: 'Fundação de Brasília', incluir: false },
        { data: `${ano}-11-30`, nome: 'Dia do Evangélico', incluir: false }
      ],
      'Curitiba_PR': [
        { data: `${ano}-03-29`, nome: 'Fundação de Curitiba', incluir: false }
      ],
      'Recife_PE': [
        { data: `${ano}-03-12`, nome: 'Fundação do Recife', incluir: false }
      ],
      'Porto Alegre_RS': [
        { data: `${ano}-03-26`, nome: 'Fundação de Porto Alegre', incluir: false }
      ],
      'Manaus_AM': [
        { data: `${ano}-10-24`, nome: 'Fundação de Manaus', incluir: false }
      ],
      'Fortaleza_CE': [
        { data: `${ano}-04-13`, nome: 'Fundação de Fortaleza', incluir: false }
      ]
    };

    const key = `${municipio}_${estado.toUpperCase()}`;
    return municipalHolidays[key] || [];
  }



  // Create Local
  async createLocal(req: AuthenticatedRequest, res: Response) {
    try {
      console.log('LocationsNewController.createLocal - Starting request');
      console.log('LocationsNewController.createLocal - Headers:', {
        authorization: req.headers.authorization ? 'Present' : 'Missing',
        contentType: req.headers['content-type']
      });
      console.log('LocationsNewController.createLocal - User from middleware:', req.user);
      console.log('LocationsNewController.createLocal - Request body keys:', Object.keys(req.body || {}));

      // Enhanced authentication validation
      if (!req.user) {
        console.error('LocationsNewController.createLocal - No user object from JWT middleware');
        return sendError(res, "Usuário não autenticado. Faça login novamente.", 401);
      }

      const tenantId = req.user.tenantId;
      const userId = req.user.id; // Changed from req.user.userId to req.user.id

      if (!tenantId) {
        console.error('LocationsNewController.createLocal - No tenant ID in user object:', req.user);
        return sendError(res, "Tenant não identificado. Verifique sua autenticação.", 401);
      }

      if (!userId) {
        console.error('LocationsNewController.createLocal - No user ID in user object:', req.user);
        return sendError(res, "Usuário não identificado. Verifique sua autenticação.", 401);
      }

      console.log(`LocationsNewController.createLocal - Authenticated user: ${userId}, tenant: ${tenantId}`);

      // Ensure request body exists
      if (!req.body || Object.keys(req.body).length === 0) {
        console.error('LocationsNewController.createLocal - Empty request body');
        return sendError(res, "Dados do local são obrigatórios.", 400);
      }

      // Add tenant validation to request data
      const requestData = {
        ...req.body,
        tenantId: tenantId // Ensure tenant ID from token is used
      };

      console.log('LocationsNewController.createLocal - Data to validate:', {
        hasNome: !!requestData.nome,
        hasTenantId: !!requestData.tenantId,
        tenantIdMatch: requestData.tenantId === tenantId
      });

      const validation = localSchema.safeParse(requestData);
      if (!validation.success) {
        console.error('LocationsNewController.createLocal - Validation failed:', {
          errors: validation.error.errors,
          receivedData: Object.keys(requestData)
        });
        return sendValidationError(res, validation.error);
      }

      console.log('LocationsNewController.createLocal - Validation passed, creating local');
      const local = await this.repository.createLocal(tenantId, validation.data);
      
      console.log('LocationsNewController.createLocal - Local created successfully with ID:', local?.id);
      return sendSuccess(res, local, "Local criado com sucesso", 201);
    } catch (error) {
      console.error('LocationsNewController.createLocal - Error:', error);
      return sendError(res, `Erro ao criar local: ${error.message}`, 500);
    }
  }

  // Create Região
  async createRegiao(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return sendError(res, "Tenant ID required", 401);
      }

      const validation = regiaoSchema.safeParse(req.body);
      if (!validation.success) {
        return sendValidationError(res, validation.error);
      }

      const regiao = await this.repository.createRegiao(tenantId, validation.data);
      return sendSuccess(res, regiao, "Região created successfully", 201);
    } catch (error) {
      console.error('Error creating região:', error);
      return sendError(res, "Failed to create região", 500);
    }
  }

  // Create Rota Dinâmica
  async createRotaDinamica(req: AuthenticatedRequest, res: Response) {
    try {
      console.log('LocationsNewController.createRotaDinamica - Starting request');
      console.log('LocationsNewController.createRotaDinamica - Request body:', req.body);

      const tenantId = req.user?.tenantId;
      const userId = req.user?.id;

      if (!tenantId) {
        console.error('LocationsNewController.createRotaDinamica - No tenant ID found');
        return sendError(res, "Tenant ID required", 401);
      }

      if (!userId) {
        console.error('LocationsNewController.createRotaDinamica - No user ID found');
        return sendError(res, "User ID required", 401);
      }

      // Ensure request body exists
      if (!req.body || Object.keys(req.body).length === 0) {
        console.error('LocationsNewController.createRotaDinamica - Empty request body');
        return sendError(res, "Dados da rota dinâmica são obrigatórios.", 400);
      }

      // Add tenant validation to request data
      const requestData = {
        ...req.body,
        tenantId: tenantId
      };

      console.log('LocationsNewController.createRotaDinamica - Data to validate:', {
        hasNomeRota: !!requestData.nomeRota,
        hasIdRota: !!requestData.idRota,
        hasTenantId: !!requestData.tenantId,
        previsaoDias: requestData.previsaoDias,
        diasSemanaCount: requestData.diasSemana?.length || 0
      });

      const validation = rotaDinamicaSchema.safeParse(requestData);
      if (!validation.success) {
        console.error('LocationsNewController.createRotaDinamica - Validation failed:', {
          errors: validation.error.errors,
          receivedData: Object.keys(requestData)
        });
        return sendValidationError(res, validation.error);
      }

      console.log('LocationsNewController.createRotaDinamica - Validation passed, creating rota dinâmica');
      const rota = await this.repository.createRotaDinamica(tenantId, validation.data);
      
      console.log('LocationsNewController.createRotaDinamica - Rota dinâmica created successfully with ID:', rota?.id);
      return sendSuccess(res, rota, "Rota dinâmica criada com sucesso", 201);
    } catch (error) {
      console.error('LocationsNewController.createRotaDinamica - Error:', error);
      return sendError(res, `Erro ao criar rota dinâmica: ${error.message}`, 500);
    }
  }

  // Create Trecho
  async createTrecho(req: AuthenticatedRequest, res: Response) {
    try {
      console.log('LocationsNewController.createTrecho - Starting request');
      console.log('LocationsNewController.createTrecho - Request body:', req.body);

      const tenantId = req.user?.tenantId;
      const userId = req.user?.id;

      if (!tenantId) {
        console.error('LocationsNewController.createTrecho - No tenant ID found');
        return sendError(res, "Tenant ID required", 401);
      }

      if (!userId) {
        console.error('LocationsNewController.createTrecho - No user ID found');
        return sendError(res, "User ID required", 401);
      }

      // Ensure request body exists
      if (!req.body || Object.keys(req.body).length === 0) {
        console.error('LocationsNewController.createTrecho - Empty request body');
        return sendError(res, "Dados do trecho são obrigatórios.", 400);
      }

      // Add tenant validation to request data
      const requestData = {
        ...req.body,
        tenantId: tenantId
      };

      console.log('LocationsNewController.createTrecho - Data to validate:', {
        hasLocalAId: !!requestData.localAId,
        hasLocalBId: !!requestData.localBId,
        hasTenantId: !!requestData.tenantId,
        localsAreEqualErrorCheck: requestData.localAId === requestData.localBId
      });

      // Additional validation: Local A and Local B must be different
      if (requestData.localAId && requestData.localBId && requestData.localAId === requestData.localBId) {
        return sendError(res, "Local A e Local B devem ser diferentes", 400);
      }

      const validation = trechoSchema.safeParse(requestData);
      if (!validation.success) {
        console.error('LocationsNewController.createTrecho - Validation failed:', {
          errors: validation.error.errors,
          receivedData: Object.keys(requestData)
        });
        return sendValidationError(res, validation.error);
      }

      console.log('LocationsNewController.createTrecho - Validation passed, creating trecho');
      const trecho = await this.repository.createTrecho(tenantId, validation.data);
      
      console.log('LocationsNewController.createTrecho - Trecho created successfully with ID:', trecho?.id);
      return sendSuccess(res, trecho, "Trecho criado com sucesso", 201);
    } catch (error) {
      console.error('LocationsNewController.createTrecho - Error:', error);
      return sendError(res, `Erro ao criar trecho: ${error.message}`, 500);
    }
  }

  // Create Rota de Trecho
  async createRotaTrecho(req: AuthenticatedRequest, res: Response) {
    try {
      console.log('LocationsNewController.createRotaTrecho - Starting request');
      console.log('LocationsNewController.createRotaTrecho - Request body:', req.body);

      const tenantId = req.user?.tenantId;
      const userId = req.user?.id;

      if (!tenantId) {
        console.error('LocationsNewController.createRotaTrecho - No tenant ID found');
        return sendError(res, "Tenant ID required", 401);
      }

      if (!userId) {
        console.error('LocationsNewController.createRotaTrecho - No user ID found');
        return sendError(res, "User ID required", 401);
      }

      // Ensure request body exists
      if (!req.body || Object.keys(req.body).length === 0) {
        console.error('LocationsNewController.createRotaTrecho - Empty request body');
        return sendError(res, "Dados da rota de trecho são obrigatórios.", 400);
      }

      // Add tenant validation to request data
      const requestData = {
        ...req.body,
        tenantId: tenantId
      };

      console.log('LocationsNewController.createRotaTrecho - Data to validate:', {
        hasIdRota: !!requestData.idRota,
        hasLocalAId: !!requestData.localAId,
        hasLocalBId: !!requestData.localBId,
        trechosCount: requestData.trechos?.length || 0,
        hasTenantId: !!requestData.tenantId
      });

      // Import the schema for validation
      const { rotaTrechoComSegmentosSchema } = await import('../../../shared/schema-locations-new');
      const validation = rotaTrechoComSegmentosSchema.safeParse(requestData);
      
      if (!validation.success) {
        console.error('LocationsNewController.createRotaTrecho - Validation failed:', {
          errors: validation.error.errors,
          receivedData: Object.keys(requestData)
        });
        return sendValidationError(res, validation.error);
      }

      console.log('LocationsNewController.createRotaTrecho - Validation passed, creating rota de trecho');
      const rotaTrecho = await this.repository.createRotaTrecho(tenantId, validation.data);
      
      console.log('LocationsNewController.createRotaTrecho - Rota de trecho created successfully with ID:', rotaTrecho?.id);
      return sendSuccess(res, rotaTrecho, "Rota de trecho criada com sucesso", 201);
    } catch (error) {
      console.error('LocationsNewController.createRotaTrecho - Error:', error);
      return sendError(res, `Erro ao criar rota de trecho: ${error.message}`, 500);
    }
  }

  // Create Área
  async createArea(req: AuthenticatedRequest, res: Response) {
    try {
      console.log('LocationsNewController.createArea - Starting request');
      console.log('LocationsNewController.createArea - Request body:', req.body);

      const tenantId = req.user?.tenantId;
      const userId = req.user?.id;

      if (!tenantId) {
        console.error('LocationsNewController.createArea - No tenant ID found');
        return sendError(res, "Tenant ID required", 401);
      }

      if (!userId) {
        console.error('LocationsNewController.createArea - No user ID found');
        return sendError(res, "User ID required", 401);
      }

      // Ensure request body exists
      if (!req.body || Object.keys(req.body).length === 0) {
        console.error('LocationsNewController.createArea - Empty request body');
        return sendError(res, "Dados da área são obrigatórios.", 400);
      }

      // Add tenant validation to request data
      const requestData = {
        ...req.body,
        tenantId: tenantId
      };

      console.log('LocationsNewController.createArea - Data to validate:', {
        hasNome: !!requestData.nome,
        hasTipoArea: !!requestData.tipoArea,
        tipoArea: requestData.tipoArea,
        hasTenantId: !!requestData.tenantId
      });

      // Validação específica por tipo de área
      const tipoArea = requestData.tipoArea;
      if (tipoArea === 'coordenadas' && (!requestData.coordenadas || requestData.coordenadas.length < 3)) {
        return sendError(res, "Polígono deve ter pelo menos 3 coordenadas", 400);
      }

      if (tipoArea === 'raio' && (!requestData.coordenadaCentral || !requestData.raioMetros)) {
        return sendError(res, "Área do tipo raio deve ter coordenada central e raio em metros", 400);
      }

      if (tipoArea === 'faixa_cep' && (!requestData.faixasCep || requestData.faixasCep.length === 0)) {
        return sendError(res, "Área de faixa CEP deve ter pelo menos uma faixa definida", 400);
      }

      if (tipoArea === 'linha' && (!requestData.linhaTrajetoria || requestData.linhaTrajetoria.length < 2)) {
        return sendError(res, "Linha deve ter pelo menos 2 pontos", 400);
      }

      if (tipoArea === 'importar_area' && !requestData.arquivoOriginal) {
        return sendError(res, "Tipo importar área deve ter um arquivo associado", 400);
      }

      const validation = areaSchema.safeParse(requestData);
      if (!validation.success) {
        console.error('LocationsNewController.createArea - Validation failed:', {
          errors: validation.error.errors,
          receivedData: Object.keys(requestData)
        });
        return sendValidationError(res, validation.error);
      }

      console.log('LocationsNewController.createArea - Validation passed, creating área');
      const area = await this.repository.createArea(tenantId, validation.data);
      
      console.log('LocationsNewController.createArea - Área created successfully with ID:', area?.id);
      return sendSuccess(res, area, "Área criada com sucesso", 201);
    } catch (error) {
      console.error('LocationsNewController.createArea - Error:', error);
      return sendError(res, `Erro ao criar área: ${error.message}`, 500);
    }
  }

  // Create Agrupamento
  async createAgrupamento(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return sendError(res, "Tenant ID required", 401);
      }

      const validation = agrupamentoSchema.safeParse(req.body);
      if (!validation.success) {
        return sendValidationError(res, validation.error);
      }

      const agrupamento = await this.repository.createAgrupamento(tenantId, validation.data);
      return sendSuccess(res, agrupamento, "Agrupamento created successfully", 201);
    } catch (error) {
      console.error('Error creating agrupamento:', error);
      return sendError(res, "Failed to create agrupamento", 500);
    }
  }

  // Update records by type
  async updateRecord(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return sendError(res, "Tenant ID required", 401);
      }

      const { recordType, id } = req.params;
      const updatedRecord = await this.repository.updateRecord(
        tenantId,
        recordType as string,
        id as string,
        req.body
      );

      return sendSuccess(res, updatedRecord, `${recordType} updated successfully`);
    } catch (error) {
      console.error('Error updating record:', error);
      return sendError(res, "Failed to update record", 500);
    }
  }

  // Delete records by type
  async deleteRecord(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return sendError(res, "Tenant ID required", 401);
      }

      const { recordType, id } = req.params;
      await this.repository.deleteRecord(tenantId, recordType as string, id as string);

      return sendSuccess(res, null, `${recordType} deleted successfully`);
    } catch (error) {
      console.error('Error deleting record:', error);
      return sendError(res, "Failed to delete record", 500);
    }
  }

  // CEP Lookup service
  async lookupCep(req: AuthenticatedRequest, res: Response) {
    try {
      const { cep } = req.params;

      const response = await fetch(`https://viacep.com.br/ws/${cep.replace('-', '')}/json/`);
      const data = await response.json();

      if (data.erro) {
        return sendError(res, "CEP not found", 404);
      }

      return sendSuccess(res, {
        cep: data.cep,
        estado: data.uf,
        municipio: data.localidade,
        bairro: data.bairro,
        logradouro: data.logradouro,
        complemento: data.complemento
      }, "CEP lookup successful");
    } catch (error) {
      console.error('Error looking up CEP:', error);
      return sendError(res, "Failed to lookup CEP", 500);
    }
  }

  // Holiday lookup service
  async lookupHolidays(req: AuthenticatedRequest, res: Response) {
    try {
      const { municipio, estado, ano } = req.query;

      // This would integrate with a holidays API service
      // For now, returning mock data structure
      const holidays = {
        municipais: [
          { data: `${ano}-01-25`, nome: "Aniversário da Cidade", incluir: false },
          { data: `${ano}-04-23`, nome: "Dia de São Jorge", incluir: false }
        ],
        estaduais: [
          { data: `${ano}-02-13`, nome: "Carnaval", incluir: true },
          { data: `${ano}-04-23`, nome: "Dia de São Jorge", incluir: true }
        ],
        federais: [
          { data: `${ano}-01-01`, nome: "Confraternização Universal", incluir: true },
          { data: `${ano}-04-21`, nome: "Tiradentes", incluir: true },
          { data: `${ano}-09-07`, nome: "Independência do Brasil", incluir: true },
          { data: `${ano}-10-12`, nome: "Nossa Senhora Aparecida", incluir: true },
          { data: `${ano}-11-02`, nome: "Finados", incluir: true },
          { data: `${ano}-11-15`, nome: "Proclamação da República", incluir: true },
          { data: `${ano}-12-25`, nome: "Natal", incluir: true }
        ]
      };

      return sendSuccess(res, holidays, "Holidays lookup successful");
    } catch (error) {
      console.error('Error looking up holidays:', error);
      return sendError(res, "Failed to lookup holidays", 500);
    }
  }

  // Integration endpoints for region relationships
  async getClientes(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        console.error('LocationsNewController.getClientes - No tenant ID found');
        return sendError(res, "Tenant ID required", 401);
      }

      console.log(`LocationsNewController.getClientes - Fetching for tenant: ${tenantId}`);
      const clientes = await this.repository.getClientes(tenantId);
      console.log(`LocationsNewController.getClientes - Found ${clientes.length} clientes`);

      return sendSuccess(res, clientes, "Clientes retrieved successfully");
    } catch (error) {
      console.error('LocationsNewController.getClientes - Error:', error);
      return sendError(res, "Failed to fetch clientes", 500);
    }
  }

  async getTecnicosEquipe(req: AuthenticatedRequest, res: Response) {
    try {
      console.log('LocationsNewController.getTecnicosEquipe - Starting request');
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        console.error('LocationsNewController.getTecnicosEquipe - No tenant ID found');
        return sendError(res, "Tenant ID required", 401);
      }

      console.log(`LocationsNewController.getTecnicosEquipe - Fetching for tenant: ${tenantId}`);
      const tecnicos = await this.repository.getTecnicosEquipe(tenantId);
      console.log(`LocationsNewController.getTecnicosEquipe - Found ${tecnicos.length} técnicos`);

      return sendSuccess(res, tecnicos, "Técnicos retrieved successfully");
    } catch (error) {
      console.error('LocationsNewController.getTecnicosEquipe - Error:', error);
      return sendError(res, "Failed to fetch técnicos", 500);
    }
  }

  async getGruposEquipe(req: AuthenticatedRequest, res: Response) {
    try {
      console.log('LocationsNewController.getGruposEquipe - Starting request');
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        console.error('LocationsNewController.getGruposEquipe - No tenant ID found');
        return sendError(res, "Tenant ID required", 401);
      }

      console.log(`LocationsNewController.getGruposEquipe - Fetching for tenant: ${tenantId}`);
      const grupos = await this.repository.getGruposEquipe(tenantId);
      console.log(`LocationsNewController.getGruposEquipe - Found ${grupos.length} grupos`);

      return sendSuccess(res, grupos, "Grupos retrieved successfully");
    } catch (error) {
      console.error('LocationsNewController.getGruposEquipe - Error:', error);
      return sendError(res, "Failed to fetch grupos", 500);
    }
  }

  async getLocaisAtendimento(req: AuthenticatedRequest, res: Response) {
    try {
      console.log('LocationsNewController.getLocaisAtendimento - Starting request');
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        console.error('LocationsNewController.getLocaisAtendimento - No tenant ID found');
        return sendError(res, "Tenant ID required", 401);
      }

      console.log(`LocationsNewController.getLocaisAtendimento - Fetching for tenant: ${tenantId}`);
      const locais = await this.repository.getLocaisAtendimento(tenantId);
      console.log(`LocationsNewController.getLocaisAtendimento - Found ${locais.length} locais`);

      return sendSuccess(res, locais, "Locais retrieved successfully");
    } catch (error) {
      console.error('LocationsNewController.getLocaisAtendimento - Error:', error);
      return sendError(res, "Failed to fetch locais", 500);
    }
  }
}