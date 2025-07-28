// LOCATIONS NEW CONTROLLER - Support for 7 Record Types
import { Request, Response } from "express";
import { AuthenticatedRequest } from "../../middleware/auth";
import { LocationsNewRepository } from "./LocationsNewRepository";
import { sendSuccess, sendError, sendValidationError } from "../../utils/standardResponse";
import { z } from "zod";
import { localSchema, regiaoSchema, rotaDinamicaSchema, trechoSchema, rotaTrechoSchema, areaSchema, agrupamentoSchema } from "../../../shared/schema-locations-new";

export class LocationsNewController {
  private repository: LocationsNewRepository;

  constructor(pool: any) {
    this.repository = new LocationsNewRepository(pool);
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
        return sendError(res, "Tenant ID required", 401);
      }

      const { recordType } = req.params;
      const { search, status } = req.query;

      const records = await this.repository.getRecordsByType(
        tenantId,
        recordType as string,
        {
          search: search as string,
          status: status as string
        }
      );

      return sendSuccess(res, records, `${recordType} records retrieved successfully`);
    } catch (error) {
      console.error('Error fetching records by type:', error);
      return sendError(res, "Failed to fetch records", 500);
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

  // Get statistics by record type
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

  // Create Local
  async createLocal(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return sendError(res, "Tenant ID required", 401);
      }

      const validation = localSchema.safeParse(req.body);
      if (!validation.success) {
        return sendValidationError(res, validation.error);
      }

      const local = await this.repository.createLocal(tenantId, validation.data);
      return sendSuccess(res, local, "Local created successfully", 201);
    } catch (error) {
      console.error('Error creating local:', error);
      return sendError(res, "Failed to create local", 500);
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
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return sendError(res, "Tenant ID required", 401);
      }

      const validation = rotaDinamicaSchema.safeParse(req.body);
      if (!validation.success) {
        return sendValidationError(res, validation.error);
      }

      const rota = await this.repository.createRotaDinamica(tenantId, validation.data);
      return sendSuccess(res, rota, "Rota dinâmica created successfully", 201);
    } catch (error) {
      console.error('Error creating rota dinâmica:', error);
      return sendError(res, "Failed to create rota dinâmica", 500);
    }
  }

  // Create Trecho
  async createTrecho(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return sendError(res, "Tenant ID required", 401);
      }

      const validation = trechoSchema.safeParse(req.body);
      if (!validation.success) {
        return sendValidationError(res, validation.error);
      }

      const trecho = await this.repository.createTrecho(tenantId, validation.data);
      return sendSuccess(res, trecho, "Trecho created successfully", 201);
    } catch (error) {
      console.error('Error creating trecho:', error);
      return sendError(res, "Failed to create trecho", 500);
    }
  }

  // Create Rota de Trecho
  async createRotaTrecho(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return sendError(res, "Tenant ID required", 401);
      }

      const validation = rotaTrechoSchema.safeParse(req.body);
      if (!validation.success) {
        return sendValidationError(res, validation.error);
      }

      const rotaTrecho = await this.repository.createRotaTrecho(tenantId, validation.data);
      return sendSuccess(res, rotaTrecho, "Rota de trecho created successfully", 201);
    } catch (error) {
      console.error('Error creating rota de trecho:', error);
      return sendError(res, "Failed to create rota de trecho", 500);
    }
  }

  // Create Área
  async createArea(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return sendError(res, "Tenant ID required", 401);
      }

      const validation = areaSchema.safeParse(req.body);
      if (!validation.success) {
        return sendValidationError(res, validation.error);
      }

      const area = await this.repository.createArea(tenantId, validation.data);
      return sendSuccess(res, area, "Área created successfully", 201);
    } catch (error) {
      console.error('Error creating área:', error);
      return sendError(res, "Failed to create área", 500);
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
        return sendError(res, "Tenant ID required", 401);
      }

      const clientes = await this.repository.getClientes(tenantId);
      return sendSuccess(res, clientes, "Clientes retrieved successfully");
    } catch (error) {
      console.error('Error fetching clientes:', error);
      return sendError(res, "Failed to fetch clientes", 500);
    }
  }

  async getTecnicosEquipe(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return sendError(res, "Tenant ID required", 401);
      }

      const tecnicos = await this.repository.getTecnicosEquipe(tenantId);
      return sendSuccess(res, tecnicos, "Técnicos retrieved successfully");
    } catch (error) {
      console.error('Error fetching técnicos:', error);
      return sendError(res, "Failed to fetch técnicos", 500);
    }
  }

  async getGruposEquipe(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return sendError(res, "Tenant ID required", 401);
      }

      const grupos = await this.repository.getGruposEquipe(tenantId);
      return sendSuccess(res, grupos, "Grupos retrieved successfully");
    } catch (error) {
      console.error('Error fetching grupos:', error);
      return sendError(res, "Failed to fetch grupos", 500);
    }
  }

  async getLocaisAtendimento(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return sendError(res, "Tenant ID required", 401);
      }

      const locais = await this.repository.getLocaisAtendimento(tenantId);
      return sendSuccess(res, locais, "Locais retrieved successfully");
    } catch (error) {
      console.error('Error fetching locais:', error);
      return sendError(res, "Failed to fetch locais", 500);
    }
  }
}