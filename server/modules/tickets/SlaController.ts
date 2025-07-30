import { Request, Response } from 'express';
import { slaRepository } from '../../repositories/SlaRepository';
import { 
  insertTicketSlaSchema,
  insertSlaRuleSchema,
  insertSlaStatusTimeoutSchema,
  insertSlaEscalationSchema,
  insertSlaMetricSchema 
} from '../../../shared/schema.js';
import { z } from 'zod';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    tenantId: string;
    email: string;
    role: string;
  };
}

export class SlaController {
  // ========================================
  // TICKET SLA ENDPOINTS
  // ========================================

  async createTicketSla(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.user!.tenantId;
      const validatedData = insertTicketSlaSchema.parse(req.body);

      const sla = await slaRepository.createTicketSla(validatedData, tenantId);

      res.status(201).json({
        success: true,
        data: sla,
        message: 'SLA criado com sucesso'
      });
    } catch (error) {
      console.error('Error creating SLA:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Dados inválidos',
          errors: error.errors
        });
      }
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  async getTicketSlas(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.user!.tenantId;
      const slas = await slaRepository.getTicketSlas(tenantId);

      res.json({
        success: true,
        data: slas
      });
    } catch (error) {
      console.error('Error fetching SLAs:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao buscar SLAs'
      });
    }
  }

  async getTicketSlaById(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const tenantId = req.user!.tenantId;

      const sla = await slaRepository.getTicketSlaById(id, tenantId);

      if (!sla) {
        return res.status(404).json({
          success: false,
          message: 'SLA não encontrado'
        });
      }

      res.json({
        success: true,
        data: sla
      });
    } catch (error) {
      console.error('Error fetching SLA:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao buscar SLA'
      });
    }
  }

  async updateTicketSla(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const tenantId = req.user!.tenantId;
      const validatedData = insertTicketSlaSchema.partial().parse(req.body);

      const sla = await slaRepository.updateTicketSla(id, validatedData, tenantId);

      if (!sla) {
        return res.status(404).json({
          success: false,
          message: 'SLA não encontrado'
        });
      }

      res.json({
        success: true,
        data: sla,
        message: 'SLA atualizado com sucesso'
      });
    } catch (error) {
      console.error('Error updating SLA:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Dados inválidos',
          errors: error.errors
        });
      }
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  async deleteTicketSla(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const tenantId = req.user!.tenantId;

      const deleted = await slaRepository.deleteTicketSla(id, tenantId);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'SLA não encontrado'
        });
      }

      res.json({
        success: true,
        message: 'SLA removido com sucesso'
      });
    } catch (error) {
      console.error('Error deleting SLA:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao remover SLA'
      });
    }
  }

  // ========================================
  // SLA RULES ENDPOINTS
  // ========================================

  async createSlaRule(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.user!.tenantId;
      const validatedData = insertSlaRuleSchema.parse(req.body);

      const rule = await slaRepository.createSlaRule(validatedData, tenantId);

      res.status(201).json({
        success: true,
        data: rule,
        message: 'Regra SLA criada com sucesso'
      });
    } catch (error) {
      console.error('Error creating SLA rule:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Dados inválidos',
          errors: error.errors
        });
      }
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  async getSlaRules(req: AuthenticatedRequest, res: Response) {
    try {
      const { slaId } = req.params;
      const tenantId = req.user!.tenantId;

      const rules = await slaRepository.getSlaRules(slaId, tenantId);

      res.json({
        success: true,
        data: rules
      });
    } catch (error) {
      console.error('Error fetching SLA rules:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao buscar regras SLA'
      });
    }
  }

  async updateSlaRule(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const tenantId = req.user!.tenantId;
      const validatedData = insertSlaRuleSchema.partial().parse(req.body);

      const rule = await slaRepository.updateSlaRule(id, validatedData, tenantId);

      if (!rule) {
        return res.status(404).json({
          success: false,
          message: 'Regra SLA não encontrada'
        });
      }

      res.json({
        success: true,
        data: rule,
        message: 'Regra SLA atualizada com sucesso'
      });
    } catch (error) {
      console.error('Error updating SLA rule:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Dados inválidos',
          errors: error.errors
        });
      }
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  async deleteSlaRule(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const tenantId = req.user!.tenantId;

      const deleted = await slaRepository.deleteSlaRule(id, tenantId);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Regra SLA não encontrada'
        });
      }

      res.json({
        success: true,
        message: 'Regra SLA removida com sucesso'
      });
    } catch (error) {
      console.error('Error deleting SLA rule:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao remover regra SLA'
      });
    }
  }

  // ========================================
  // STATUS TIMEOUT ENDPOINTS
  // ========================================

  async createStatusTimeout(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.user!.tenantId;
      const validatedData = insertSlaStatusTimeoutSchema.parse(req.body);

      const timeout = await slaRepository.createStatusTimeout(validatedData, tenantId);

      res.status(201).json({
        success: true,
        data: timeout,
        message: 'Timeout de status criado com sucesso'
      });
    } catch (error) {
      console.error('Error creating status timeout:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Dados inválidos',
          errors: error.errors
        });
      }
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  async getStatusTimeouts(req: AuthenticatedRequest, res: Response) {
    try {
      const { slaId } = req.params;
      const tenantId = req.user!.tenantId;

      const timeouts = await slaRepository.getStatusTimeouts(slaId, tenantId);

      res.json({
        success: true,
        data: timeouts
      });
    } catch (error) {
      console.error('Error fetching status timeouts:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao buscar timeouts de status'
      });
    }
  }

  async updateStatusTimeout(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const tenantId = req.user!.tenantId;
      const validatedData = insertSlaStatusTimeoutSchema.partial().parse(req.body);

      const timeout = await slaRepository.updateStatusTimeout(id, validatedData, tenantId);

      if (!timeout) {
        return res.status(404).json({
          success: false,
          message: 'Timeout de status não encontrado'
        });
      }

      res.json({
        success: true,
        data: timeout,
        message: 'Timeout de status atualizado com sucesso'
      });
    } catch (error) {
      console.error('Error updating status timeout:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Dados inválidos',
          errors: error.errors
        });
      }
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  async deleteStatusTimeout(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const tenantId = req.user!.tenantId;

      const deleted = await slaRepository.deleteStatusTimeout(id, tenantId);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Timeout de status não encontrado'
        });
      }

      res.json({
        success: true,
        message: 'Timeout de status removido com sucesso'
      });
    } catch (error) {
      console.error('Error deleting status timeout:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao remover timeout de status'
      });
    }
  }

  // ========================================
  // ESCALATION ENDPOINTS
  // ========================================

  async getTicketEscalations(req: AuthenticatedRequest, res: Response) {
    try {
      const { ticketId } = req.params;
      const tenantId = req.user!.tenantId;

      const escalations = await slaRepository.getTicketEscalations(ticketId, tenantId);

      res.json({
        success: true,
        data: escalations
      });
    } catch (error) {
      console.error('Error fetching escalations:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao buscar escalações'
      });
    }
  }

  async getPendingEscalations(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.user!.tenantId;

      const escalations = await slaRepository.getPendingEscalations(tenantId);

      res.json({
        success: true,
        data: escalations
      });
    } catch (error) {
      console.error('Error fetching pending escalations:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao buscar escalações pendentes'
      });
    }
  }

  async acknowledgeEscalation(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const tenantId = req.user!.tenantId;
      const acknowledgedBy = req.user!.id;

      const escalation = await slaRepository.acknowledgeEscalation(id, acknowledgedBy, tenantId);

      if (!escalation) {
        return res.status(404).json({
          success: false,
          message: 'Escalação não encontrada'
        });
      }

      res.json({
        success: true,
        data: escalation,
        message: 'Escalação reconhecida com sucesso'
      });
    } catch (error) {
      console.error('Error acknowledging escalation:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao reconhecer escalação'
      });
    }
  }

  // ========================================
  // METRICS AND COMPLIANCE ENDPOINTS
  // ========================================

  async getTicketMetrics(req: AuthenticatedRequest, res: Response) {
    try {
      const { ticketId } = req.params;
      const tenantId = req.user!.tenantId;

      const metrics = await slaRepository.getTicketMetrics(ticketId, tenantId);

      res.json({
        success: true,
        data: metrics
      });
    } catch (error) {
      console.error('Error fetching ticket metrics:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao buscar métricas do ticket'
      });
    }
  }

  async getSlaComplianceStats(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.user!.tenantId;
      const { startDate, endDate } = req.query;

      const start = startDate ? new Date(startDate as string) : undefined;
      const end = endDate ? new Date(endDate as string) : undefined;

      const stats = await slaRepository.getSlaComplianceStats(tenantId, start, end);

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error fetching compliance stats:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao buscar estatísticas de compliance'
      });
    }
  }

  // ========================================
  // METADATA INTEGRATION ENDPOINTS
  // ========================================

  async getApplicableSlaRules(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.user!.tenantId;
      const ticketData = req.body;

      const rules = await slaRepository.getApplicableSlaRules(ticketData, tenantId);

      res.json({
        success: true,
        data: rules
      });
    } catch (error) {
      console.error('Error fetching applicable SLA rules:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao buscar regras SLA aplicáveis'
      });
    }
  }

  async calculateTicketSlaMetrics(req: AuthenticatedRequest, res: Response) {
    try {
      const { ticketId } = req.params;
      const tenantId = req.user!.tenantId;

      await slaRepository.calculateSlaMetrics(ticketId, tenantId);

      res.json({
        success: true,
        message: 'Métricas SLA calculadas com sucesso'
      });
    } catch (error) {
      console.error('Error calculating SLA metrics:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao calcular métricas SLA'
      });
    }
  }
}

export const slaController = new SlaController();