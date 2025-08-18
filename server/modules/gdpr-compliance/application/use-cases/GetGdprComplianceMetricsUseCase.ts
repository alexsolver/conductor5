/**
 * Get GDPR Compliance Metrics Use Case
 * Clean Architecture - Application Layer
 * Dashboard e Relatórios de Compliance
 */

import type { IGdprComplianceRepository } from '../../domain/repositories/IGdprComplianceRepository';

export interface GdprComplianceMetricsQuery {
  tenantId: string;
  dateRange?: {
    startDate: Date;
    endDate: Date;
  };
}

export interface GdprComplianceMetricsResult {
  success: boolean;
  data?: {
    // Métricas de Solicitações GDPR
    requests: {
      total: number;
      pending: number;
      overdue: number;
      completed: number;
      averageResponseTime: number;
      completionRate: number;
    };
    
    // Métricas de Consentimento
    consent: {
      totalConsents: number;
      activeConsents: number;
      consentRate: number;
      revokedConsents: number;
      cookieConsents: {
        necessary: number;
        marketing: number;
        analytics: number;
      };
    };
    
    // Métricas de Incidentes de Segurança
    incidents: {
      total: number;
      active: number;
      resolved: number;
      highRisk: number;
      requiresNotification: number;
    };
    
    // Status de Compliance Geral
    compliance: {
      score: number; // 0-100
      status: 'compliant' | 'at_risk' | 'non_compliant';
      lastAudit: Date | null;
      nextReview: Date | null;
    };
  };
  message: string;
}

export class GetGdprComplianceMetricsUseCase {
  constructor(
    private gdprRepository: IGdprComplianceRepository
  ) {}

  async execute(query: GdprComplianceMetricsQuery): Promise<GdprComplianceMetricsResult> {
    try {
      if (!query.tenantId) {
        return {
          success: false,
          message: 'ID do tenant é obrigatório'
        };
      }

      // Buscar métricas básicas do repositório
      const basicMetrics = await this.gdprRepository.getComplianceMetrics(query.tenantId);

      // Buscar dados adicionais
      const [overdueRequests, activeIncidents] = await Promise.all([
        this.gdprRepository.findOverdueRequests(query.tenantId),
        this.gdprRepository.findIncidentsRequiringNotification(query.tenantId)
      ]);

      // Calcular score de compliance (simplificado)
      const complianceScore = this.calculateComplianceScore({
        totalRequests: basicMetrics.totalRequests,
        overdueRequests: overdueRequests.length,
        completedRequests: basicMetrics.completedRequests,
        activeIncidents: basicMetrics.activeIncidents,
        consentRate: basicMetrics.consentRate
      });

      // Determinar status de compliance
      const complianceStatus = this.determineComplianceStatus(complianceScore);

      const result: GdprComplianceMetricsResult = {
        success: true,
        data: {
          requests: {
            total: basicMetrics.totalRequests,
            pending: basicMetrics.pendingRequests,
            overdue: basicMetrics.overdueRequests,
            completed: basicMetrics.completedRequests,
            averageResponseTime: basicMetrics.averageResponseTime,
            completionRate: basicMetrics.totalRequests > 0 
              ? (basicMetrics.completedRequests / basicMetrics.totalRequests) * 100 
              : 100
          },
          
          consent: {
            totalConsents: 0, // TODO: Implementar contagem real
            activeConsents: 0,
            consentRate: basicMetrics.consentRate,
            revokedConsents: 0,
            cookieConsents: {
              necessary: 0,
              marketing: 0,
              analytics: 0
            }
          },
          
          incidents: {
            total: basicMetrics.activeIncidents,
            active: basicMetrics.activeIncidents,
            resolved: 0,
            highRisk: activeIncidents.filter(i => ['high', 'very_high'].includes(i.severity)).length,
            requiresNotification: activeIncidents.length
          },
          
          compliance: {
            score: complianceScore,
            status: complianceStatus,
            lastAudit: null, // TODO: Implementar tracking de auditorias
            nextReview: this.calculateNextReviewDate()
          }
        },
        message: 'Métricas de compliance GDPR obtidas com sucesso'
      };

      return result;

    } catch (error) {
      console.error('[GetGdprComplianceMetricsUseCase] Error:', error);
      return {
        success: false,
        message: 'Erro interno ao obter métricas de compliance'
      };
    }
  }

  private calculateComplianceScore(metrics: {
    totalRequests: number;
    overdueRequests: number;
    completedRequests: number;
    activeIncidents: number;
    consentRate: number;
  }): number {
    let score = 100;

    // Penalizar por solicitações em atraso
    if (metrics.totalRequests > 0) {
      const overdueRate = metrics.overdueRequests / metrics.totalRequests;
      score -= overdueRate * 30; // Máximo de -30 pontos
    }

    // Penalizar por incidentes ativos
    if (metrics.activeIncidents > 0) {
      score -= Math.min(metrics.activeIncidents * 10, 25); // Máximo de -25 pontos
    }

    // Bonificar pela taxa de consentimento
    if (metrics.consentRate < 50) {
      score -= 15; // Penalizar taxa baixa de consentimento
    }

    // Garantir que o score está entre 0 e 100
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  private determineComplianceStatus(score: number): 'compliant' | 'at_risk' | 'non_compliant' {
    if (score >= 80) return 'compliant';
    if (score >= 60) return 'at_risk';
    return 'non_compliant';
  }

  private calculateNextReviewDate(): Date {
    // GDPR recomenda revisões trimestrais
    const nextReview = new Date();
    nextReview.setMonth(nextReview.getMonth() + 3);
    return nextReview;
  }
}