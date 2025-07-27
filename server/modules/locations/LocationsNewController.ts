// LOCATIONS NEW CONTROLLER - Support for 7 Record Types
import { Request, Response } from "express";
import { AuthenticatedRequest } from "../../middleware/auth";
import { LocationsNewRepository } from "./LocationsNewRepository";
import { sendSuccess, sendError, sendValidationError } from "../../utils/standardResponse";
import { z } from "zod";
import { localSchema, regiaoSchema, rotaDinamicaSchema, trechoSchema, rotaTrechoSchema, areaSchema, agrupamentoSchema } from "../../../shared/schema-locations-new";

export class LocationsNewController {
  private repository: LocationsNewRepository;

  constructor(repository: LocationsNewRepository) {
    this.repository = repository;
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
}