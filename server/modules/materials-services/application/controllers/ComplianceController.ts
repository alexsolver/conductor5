import { Request, Response } from 'express';
import { ComplianceRepository } from '../../infrastructure/repositories/ComplianceRepository';
import { IComplianceRepository } from '../../domain/repositories/IComplianceRepository';

export class ComplianceController {
  private complianceRepository: IComplianceRepository;

  constructor(complianceRepository: IComplianceRepository) {
    this.complianceRepository = complianceRepository;
  }

  // GESTÃO DE AUDITORIAS
  async getAllAudits(req: Request, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(400).json({ error: 'Tenant ID é obrigatório' });
      }

      const audits = await this.complianceRepository.getAllAudits(tenantId);
      res.json(audits);
    } catch (error) {
      console.error('Erro ao buscar auditorias:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async getAuditById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        return res.status(400).json({ error: 'Tenant ID é obrigatório' });
      }

      const audit = await this.complianceRepository.getAuditById(id, tenantId);
      if (!audit) {
        return res.status(404).json({ error: 'Auditoria não encontrada' });
      }

      res.json(audit);
    } catch (error) {
      console.error('Erro ao buscar auditoria:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async createAudit(req: Request, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(400).json({ error: 'Tenant ID é obrigatório' });
      }

      const auditData = {
        ...req.body,
        tenantId
      };

      const audit = await this.complianceRepository.createAudit(auditData);
      res.status(201).json(audit);
    } catch (error) {
      console.error('Erro ao criar auditoria:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async updateAudit(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        return res.status(400).json({ error: 'Tenant ID é obrigatório' });
      }

      const audit = await this.complianceRepository.updateAudit(id, tenantId, req.body);
      if (!audit) {
        return res.status(404).json({ error: 'Auditoria não encontrada' });
      }

      res.json(audit);
    } catch (error) {
      console.error('Erro ao atualizar auditoria:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async deleteAudit(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        return res.status(400).json({ error: 'Tenant ID é obrigatório' });
      }

      await this.complianceRepository.deleteAudit(id, tenantId);
      res.status(204).send();
    } catch (error) {
      console.error('Erro ao excluir auditoria:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // GESTÃO DE CERTIFICAÇÕES
  async getAllCertifications(req: Request, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(400).json({ error: 'Tenant ID é obrigatório' });
      }

      const certifications = await this.complianceRepository.getAllCertifications(tenantId);
      res.json(certifications);
    } catch (error) {
      console.error('Erro ao buscar certificações:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async getCertificationById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        return res.status(400).json({ error: 'Tenant ID é obrigatório' });
      }

      const certification = await this.complianceRepository.getCertificationById(id, tenantId);
      if (!certification) {
        return res.status(404).json({ error: 'Certificação não encontrada' });
      }

      res.json(certification);
    } catch (error) {
      console.error('Erro ao buscar certificação:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async createCertification(req: Request, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(400).json({ error: 'Tenant ID é obrigatório' });
      }

      const certificationData = {
        ...req.body,
        tenantId
      };

      const certification = await this.complianceRepository.createCertification(certificationData);
      res.status(201).json(certification);
    } catch (error) {
      console.error('Erro ao criar certificação:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async updateCertification(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        return res.status(400).json({ error: 'Tenant ID é obrigatório' });
      }

      const certification = await this.complianceRepository.updateCertification(id, tenantId, req.body);
      if (!certification) {
        return res.status(404).json({ error: 'Certificação não encontrada' });
      }

      res.json(certification);
    } catch (error) {
      console.error('Erro ao atualizar certificação:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async deleteCertification(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        return res.status(400).json({ error: 'Tenant ID é obrigatório' });
      }

      await this.complianceRepository.deleteCertification(id, tenantId);
      res.status(204).send();
    } catch (error) {
      console.error('Erro ao excluir certificação:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async getExpiringCertifications(req: Request, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      const { daysAhead } = req.query;

      if (!tenantId) {
        return res.status(400).json({ error: 'Tenant ID é obrigatório' });
      }

      const certifications = await this.complianceRepository.getExpiringCertifications(
        tenantId,
        daysAhead ? parseInt(daysAhead as string) : 30
      );
      res.json(certifications);
    } catch (error) {
      console.error('Erro ao buscar certificações vencendo:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // GESTÃO DE EVIDÊNCIAS
  async getAllEvidence(req: Request, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      const { auditId, certificationId } = req.query;

      if (!tenantId) {
        return res.status(400).json({ error: 'Tenant ID é obrigatório' });
      }

      const evidence = await this.complianceRepository.getAllEvidence(
        tenantId,
        auditId as string,
        certificationId as string
      );
      res.json(evidence);
    } catch (error) {
      console.error('Erro ao buscar evidências:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async createEvidence(req: Request, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(400).json({ error: 'Tenant ID é obrigatório' });
      }

      const evidenceData = {
        ...req.body,
        tenantId,
        collectedBy: req.user?.id
      };

      const evidence = await this.complianceRepository.createEvidence(evidenceData);
      res.status(201).json(evidence);
    } catch (error) {
      console.error('Erro ao criar evidência:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async updateEvidence(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        return res.status(400).json({ error: 'Tenant ID é obrigatório' });
      }

      const evidence = await this.complianceRepository.updateEvidence(id, tenantId, req.body);
      if (!evidence) {
        return res.status(404).json({ error: 'Evidência não encontrada' });
      }

      res.json(evidence);
    } catch (error) {
      console.error('Erro ao atualizar evidência:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async deleteEvidence(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        return res.status(400).json({ error: 'Tenant ID é obrigatório' });
      }

      await this.complianceRepository.deleteEvidence(id, tenantId);
      res.status(204).send();
    } catch (error) {
      console.error('Erro ao excluir evidência:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async verifyEvidence(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        return res.status(400).json({ error: 'Tenant ID é obrigatório' });
      }

      const evidence = await this.complianceRepository.verifyEvidence(id, tenantId, req.user?.id!);
      res.json(evidence);
    } catch (error) {
      console.error('Erro ao verificar evidência:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // GESTÃO DE ALERTAS
  async getAllAlerts(req: Request, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      const { status } = req.query;

      if (!tenantId) {
        return res.status(400).json({ error: 'Tenant ID é obrigatório' });
      }

      const alerts = await this.complianceRepository.getAllAlerts(tenantId, status as string);
      res.json(alerts);
    } catch (error) {
      console.error('Erro ao buscar alertas:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async createAlert(req: Request, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(400).json({ error: 'Tenant ID é obrigatório' });
      }

      const alertData = {
        ...req.body,
        tenantId
      };

      const alert = await this.complianceRepository.createAlert(alertData);
      res.status(201).json(alert);
    } catch (error) {
      console.error('Erro ao criar alerta:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async acknowledgeAlert(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        return res.status(400).json({ error: 'Tenant ID é obrigatório' });
      }

      const alert = await this.complianceRepository.acknowledgeAlert(id, tenantId, req.user?.id!);
      res.json(alert);
    } catch (error) {
      console.error('Erro ao reconhecer alerta:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async resolveAlert(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { resolution } = req.body;
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        return res.status(400).json({ error: 'Tenant ID é obrigatório' });
      }

      if (!resolution) {
        return res.status(400).json({ error: 'Resolução é obrigatória' });
      }

      const alert = await this.complianceRepository.resolveAlert(id, tenantId, req.user?.id!, resolution);
      res.json(alert);
    } catch (error) {
      console.error('Erro ao resolver alerta:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // SISTEMA DE SCORES
  async getAllScores(req: Request, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      const { entityType } = req.query;

      if (!tenantId) {
        return res.status(400).json({ error: 'Tenant ID é obrigatório' });
      }

      const scores = await this.complianceRepository.getAllScores(tenantId, entityType as string);
      res.json(scores);
    } catch (error) {
      console.error('Erro ao buscar scores:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async getScoreByEntity(req: Request, res: Response) {
    try {
      const { entityId, entityType } = req.params;
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        return res.status(400).json({ error: 'Tenant ID é obrigatório' });
      }

      const score = await this.complianceRepository.getScoreByEntity(entityId, entityType, tenantId);
      res.json(score);
    } catch (error) {
      console.error('Erro ao buscar score da entidade:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async createScore(req: Request, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(400).json({ error: 'Tenant ID é obrigatório' });
      }

      const scoreData = {
        ...req.body,
        tenantId,
        assessedBy: req.user?.id
      };

      const score = await this.complianceRepository.createScore(scoreData);
      res.status(201).json(score);
    } catch (error) {
      console.error('Erro ao criar score:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async updateScore(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        return res.status(400).json({ error: 'Tenant ID é obrigatório' });
      }

      const score = await this.complianceRepository.updateScore(id, tenantId, req.body);
      if (!score) {
        return res.status(404).json({ error: 'Score não encontrado' });
      }

      res.json(score);
    } catch (error) {
      console.error('Erro ao atualizar score:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async calculateComplianceScore(req: Request, res: Response) {
    try {
      const { entityId, entityType } = req.params;
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        return res.status(400).json({ error: 'Tenant ID é obrigatório' });
      }

      const scoreCalculation = await this.complianceRepository.calculateComplianceScore(entityId, entityType, tenantId);
      res.json(scoreCalculation);
    } catch (error) {
      console.error('Erro ao calcular score de compliance:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // ESTATÍSTICAS
  async getComplianceStats(req: Request, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(400).json({ error: 'Tenant ID é obrigatório' });
      }

      const stats = await this.complianceRepository.getComplianceStats(tenantId);
      res.json(stats);
    } catch (error) {
      console.error('Erro ao buscar estatísticas de compliance:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // ALERTAS AUTOMÁTICOS
  async generateExpirationAlerts(req: Request, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(400).json({ error: 'Tenant ID é obrigatório' });
      }

      const alerts = await this.complianceRepository.generateExpirationAlerts(tenantId);
      res.json({
        message: `${alerts.length} alertas de vencimento gerados`,
        alerts
      });
    } catch (error) {
      console.error('Erro ao gerar alertas de vencimento:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
}