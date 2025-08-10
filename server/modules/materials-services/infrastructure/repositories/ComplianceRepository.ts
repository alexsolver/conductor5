import { db } from '../../../../db';
import { 
  complianceAudits, 
  complianceCertifications, 
  complianceEvidence,
  complianceAlerts,
  complianceScores,
  type ComplianceAudit,
  type InsertComplianceAudit,
  type ComplianceCertification,
  type InsertComplianceCertification,
  type ComplianceEvidence,
  type InsertComplianceEvidence,
  type ComplianceAlert,
  type InsertComplianceAlert,
  type ComplianceScore,
  type InsertComplianceScore
} from '@shared/schema';
import { eq, and, desc, asc, lte, gte, or } from 'drizzle-orm';

import { IComplianceRepository } from '../../domain/ports/IComplianceRepository';

export class ComplianceRepository implements IComplianceRepository {
  // GESTÃO DE AUDITORIAS
  async getAllAudits(tenantId: string) {
    return await db
      .select()
      .from(complianceAudits)
      .where(eq(complianceAudits.tenantId, tenantId))
      .orderBy(desc(complianceAudits.scheduledDate));
  }

  async getAuditById(id: string, tenantId: string) {
    const [audit] = await db
      .select()
      .from(complianceAudits)
      .where(and(eq(complianceAudits.id, id), eq(complianceAudits.tenantId, tenantId)));
    return audit;
  }

  async createAudit(data: InsertComplianceAudit) {
    const [audit] = await db
      .insert(complianceAudits)
      .values(data)
      .returning();
    return audit;
  }

  async updateAudit(id: string, tenantId: string, data: Partial<InsertComplianceAudit>) {
    const [audit] = await db
      .update(complianceAudits)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(complianceAudits.id, id), eq(complianceAudits.tenantId, tenantId)))
      .returning();
    return audit;
  }

  async deleteAudit(id: string, tenantId: string) {
    await db
      .delete(complianceAudits)
      .where(and(eq(complianceAudits.id, id), eq(complianceAudits.tenantId, tenantId)));
  }

  // GESTÃO DE CERTIFICAÇÕES
  async getAllCertifications(tenantId: string) {
    return await db
      .select()
      .from(complianceCertifications)
      .where(eq(complianceCertifications.tenantId, tenantId))
      .orderBy(desc(complianceCertifications.expirationDate));
  }

  async getCertificationById(id: string, tenantId: string) {
    const [certification] = await db
      .select()
      .from(complianceCertifications)
      .where(and(eq(complianceCertifications.id, id), eq(complianceCertifications.tenantId, tenantId)));
    return certification;
  }

  async createCertification(data: InsertComplianceCertification) {
    const [certification] = await db
      .insert(complianceCertifications)
      .values(data)
      .returning();
    return certification;
  }

  async updateCertification(id: string, tenantId: string, data: Partial<InsertComplianceCertification>) {
    const [certification] = await db
      .update(complianceCertifications)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(complianceCertifications.id, id), eq(complianceCertifications.tenantId, tenantId)))
      .returning();
    return certification;
  }

  async deleteCertification(id: string, tenantId: string) {
    await db
      .delete(complianceCertifications)
      .where(and(eq(complianceCertifications.id, id), eq(complianceCertifications.tenantId, tenantId)));
  }

  // CERTIFICAÇÕES PRESTES A VENCER
  async getExpiringCertifications(tenantId: string, daysAhead: number = 30) {
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + daysAhead);

    return await db
      .select()
      .from(complianceCertifications)
      .where(and(
        eq(complianceCertifications.tenantId, tenantId),
        eq(complianceCertifications.status, 'active'),
        lte(complianceCertifications.expirationDate, expirationDate)
      ))
      .orderBy(asc(complianceCertifications.expirationDate));
  }

  // GESTÃO DE EVIDÊNCIAS
  async getAllEvidence(tenantId: string, auditId?: string, certificationId?: string) {
    const conditions = [eq(complianceEvidence.tenantId, tenantId)];
    
    if (auditId) {
      conditions.push(eq(complianceEvidence.auditId, auditId));
    }
    
    if (certificationId) {
      conditions.push(eq(complianceEvidence.certificationId, certificationId));
    }

    return await db
      .select()
      .from(complianceEvidence)
      .where(and(...conditions))
      .orderBy(desc(complianceEvidence.collectedDate));
  }

  async getEvidenceById(id: string, tenantId: string) {
    const [evidence] = await db
      .select()
      .from(complianceEvidence)
      .where(and(eq(complianceEvidence.id, id), eq(complianceEvidence.tenantId, tenantId)));
    return evidence;
  }

  async createEvidence(data: InsertComplianceEvidence) {
    const [evidence] = await db
      .insert(complianceEvidence)
      .values(data)
      .returning();
    return evidence;
  }

  async updateEvidence(id: string, tenantId: string, data: Partial<InsertComplianceEvidence>) {
    const [evidence] = await db
      .update(complianceEvidence)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(complianceEvidence.id, id), eq(complianceEvidence.tenantId, tenantId)))
      .returning();
    return evidence;
  }

  async deleteEvidence(id: string, tenantId: string) {
    await db
      .delete(complianceEvidence)
      .where(and(eq(complianceEvidence.id, id), eq(complianceEvidence.tenantId, tenantId)));
  }

  async verifyEvidence(id: string, tenantId: string, verifiedBy: string) {
    const [evidence] = await db
      .update(complianceEvidence)
      .set({
        verifiedBy,
        verifiedAt: new Date(),
        isValid: true,
        updatedAt: new Date()
      })
      .where(and(eq(complianceEvidence.id, id), eq(complianceEvidence.tenantId, tenantId)))
      .returning();
    return evidence;
  }

  // GESTÃO DE ALERTAS
  async getAllAlerts(tenantId: string, status?: string) {
    const conditions = [eq(complianceAlerts.tenantId, tenantId)];
    
    if (status) {
      conditions.push(eq(complianceAlerts.status, status));
    }

    return await db
      .select()
      .from(complianceAlerts)
      .where(and(...conditions))
      .orderBy(desc(complianceAlerts.createdAt));
  }

  async createAlert(data: InsertComplianceAlert) {
    const [alert] = await db
      .insert(complianceAlerts)
      .values(data)
      .returning();
    return alert;
  }

  async acknowledgeAlert(id: string, tenantId: string, acknowledgedBy: string) {
    const [alert] = await db
      .update(complianceAlerts)
      .set({
        status: 'acknowledged',
        acknowledgedBy,
        acknowledgedAt: new Date(),
        updatedAt: new Date()
      })
      .where(and(eq(complianceAlerts.id, id), eq(complianceAlerts.tenantId, tenantId)))
      .returning();
    return alert;
  }

  async resolveAlert(id: string, tenantId: string, resolvedBy: string, resolution: string) {
    const [alert] = await db
      .update(complianceAlerts)
      .set({
        status: 'resolved',
        resolvedBy,
        resolvedAt: new Date(),
        resolution,
        updatedAt: new Date()
      })
      .where(and(eq(complianceAlerts.id, id), eq(complianceAlerts.tenantId, tenantId)))
      .returning();
    return alert;
  }

  // SISTEMA DE SCORES DE COMPLIANCE
  async getAllScores(tenantId: string, entityType?: string) {
    const conditions = [eq(complianceScores.tenantId, tenantId)];
    
    if (entityType) {
      conditions.push(eq(complianceScores.entityType, entityType));
    }

    return await db
      .select()
      .from(complianceScores)
      .where(and(...conditions))
      .orderBy(desc(complianceScores.score));
  }

  async getScoreByEntity(entityId: string, entityType: string, tenantId: string) {
    const [score] = await db
      .select()
      .from(complianceScores)
      .where(and(
        eq(complianceScores.entityId, entityId),
        eq(complianceScores.entityType, entityType),
        eq(complianceScores.tenantId, tenantId)
      ))
      .orderBy(desc(complianceScores.assessedAt))
      .limit(1);
    return score;
  }

  async createScore(data: InsertComplianceScore) {
    const [score] = await db
      .insert(complianceScores)
      .values(data)
      .returning();
    return score;
  }

  async updateScore(id: string, tenantId: string, data: Partial<InsertComplianceScore>) {
    const [score] = await db
      .update(complianceScores)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(complianceScores.id, id), eq(complianceScores.tenantId, tenantId)))
      .returning();
    return score;
  }

  // CÁLCULO DE SCORE DE COMPLIANCE AUTOMÁTICO
  async calculateComplianceScore(entityId: string, entityType: string, tenantId: string) {
    // Buscar todas as certificações relacionadas
    const certifications = await db
      .select()
      .from(complianceCertifications)
      .where(eq(complianceCertifications.tenantId, tenantId));

    // Buscar auditorias relacionadas
    const audits = await db
      .select()
      .from(complianceAudits)
      .where(eq(complianceAudits.tenantId, tenantId));

    // Buscar alertas ativos
    const activeAlerts = await db
      .select()
      .from(complianceAlerts)
      .where(and(
        eq(complianceAlerts.tenantId, tenantId),
        eq(complianceAlerts.relatedEntityId, entityId),
        eq(complianceAlerts.status, 'active')
      ));

    // Cálculo do score (algoritmo simplificado)
    let score = 100; // Score inicial perfeito

    // Penalidades por alertas ativos
    const criticalAlerts = activeAlerts.filter(a => a.severity === 'critical').length;
    const highAlerts = activeAlerts.filter(a => a.severity === 'high').length;
    const mediumAlerts = activeAlerts.filter(a => a.severity === 'medium').length;
    const lowAlerts = activeAlerts.filter(a => a.severity === 'low').length;

    score -= (criticalAlerts * 25) + (highAlerts * 15) + (mediumAlerts * 8) + (lowAlerts * 3);

    // Bônus por certificações ativas
    const activeCertifications = certifications.filter(c => c.status === 'active').length;
    score += activeCertifications * 5;

    // Bônus por auditorias bem-sucedidas recentes
    const recentSuccessfulAudits = audits
      .filter(a => a.status === 'completed' && a.score && parseFloat(a.score) >= 80)
      .length;
    score += recentSuccessfulAudits * 10;

    // Garantir que o score não seja negativo nem superior a 100
    score = Math.max(0, Math.min(100, score));

    return {
      score: Math.round(score * 100) / 100,
      breakdown: {
        basScore: 100,
        alertsPenalty: (criticalAlerts * 25) + (highAlerts * 15) + (mediumAlerts * 8) + (lowAlerts * 3),
        certificationsBonus: activeCertifications * 5,
        auditsBonus: recentSuccessfulAudits * 10,
        finalScore: score
      }
    };
  }

  // ESTATÍSTICAS DE COMPLIANCE
  async getComplianceStats(tenantId: string) {
    const allAudits = await db
      .select()
      .from(complianceAudits)
      .where(eq(complianceAudits.tenantId, tenantId));

    const allCertifications = await db
      .select()
      .from(complianceCertifications)
      .where(eq(complianceCertifications.tenantId, tenantId));

    const allAlerts = await db
      .select()
      .from(complianceAlerts)
      .where(eq(complianceAlerts.tenantId, tenantId));

    const allScores = await db
      .select()
      .from(complianceScores)
      .where(eq(complianceScores.tenantId, tenantId));

    // Estatísticas de auditorias
    const totalAudits = allAudits.length;
    const completedAudits = allAudits.filter(a => a.status === 'completed').length;
    const planningAudits = allAudits.filter(a => a.status === 'planning').length;
    const inProgressAudits = allAudits.filter(a => a.status === 'in_progress').length;

    // Estatísticas de certificações
    const totalCertifications = allCertifications.length;
    const activeCertifications = allCertifications.filter(c => c.status === 'active').length;
    const expiredCertifications = allCertifications.filter(c => c.status === 'expired').length;
    
    // Certificações próximas do vencimento (30 dias)
    const expiringCertifications = await this.getExpiringCertifications(tenantId, 30);

    // Estatísticas de alertas
    const totalAlerts = allAlerts.length;
    const activeAlerts = allAlerts.filter(a => a.status === 'active').length;
    const criticalAlerts = allAlerts.filter(a => a.severity === 'critical' && a.status === 'active').length;

    // Score médio de compliance
    const avgScore = allScores.length > 0 ? 
      allScores.reduce((sum, s) => sum + parseFloat(s.score), 0) / allScores.length : 0;

    return {
      audits: {
        total: totalAudits,
        completed: completedAudits,
        planning: planningAudits,
        inProgress: inProgressAudits,
        completionRate: totalAudits > 0 ? Math.round((completedAudits / totalAudits) * 100) : 0
      },
      certifications: {
        total: totalCertifications,
        active: activeCertifications,
        expired: expiredCertifications,
        expiring: expiringCertifications.length,
        activeRate: totalCertifications > 0 ? Math.round((activeCertifications / totalCertifications) * 100) : 0
      },
      alerts: {
        total: totalAlerts,
        active: activeAlerts,
        critical: criticalAlerts
      },
      overallScore: Math.round(avgScore * 100) / 100,
      complianceLevel: avgScore >= 90 ? 'Excelente' : avgScore >= 75 ? 'Bom' : avgScore >= 60 ? 'Regular' : 'Crítico'
    };
  }

  // ALERTAS AUTOMÁTICOS PARA VENCIMENTOS
  async generateExpirationAlerts(tenantId: string) {
    const expiringCertifications = await this.getExpiringCertifications(tenantId, 30);
    const alerts = [];

    for (const cert of expiringCertifications) {
      const daysUntilExpiry = Math.ceil(
        (new Date(cert.expirationDate!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      );

      let severity: 'low' | 'medium' | 'high' | 'critical' = 'medium';
      if (daysUntilExpiry <= 7) severity = 'critical';
      else if (daysUntilExpiry <= 15) severity = 'high';
      else if (daysUntilExpiry <= 30) severity = 'medium';

      const alertData: InsertComplianceAlert = {
        tenantId,
        type: 'expiration',
        severity,
        title: `Certificação "${cert.name}" expira em ${daysUntilExpiry} dias`,
        description: `A certificação ${cert.name} (${cert.standard}) expira em ${cert.expirationDate}`,
        relatedEntityType: 'certification',
        relatedEntityId: cert.id,
        triggerDate: new Date(),
        dueDate: cert.expirationDate!
      };

      const [alert] = await db
        .insert(complianceAlerts)
        .values(alertData)
        .returning();
      
      alerts.push(alert);
    }

    return alerts;
  }
}