/**
 * Security Incident Domain Entity
 * Clean Architecture - Domain Layer
 * GDPR/LGPD Compliance - Funcionalidade 10: Notificações de Incidentes
 */

import type { SecurityIncident as SecurityIncidentType } from '@shared/schema-gdpr-compliance-clean';

export class SecurityIncident {
  constructor(
    public readonly id: string,
    public readonly incidentType: string,
    public readonly severity: string,
    public readonly title: string,
    public readonly description: string,
    public readonly affectedDataTypes: any,
    public readonly affectedUserCount: number | null,
    public readonly discoveredAt: Date,
    public readonly containedAt: Date | null,
    public readonly resolvedAt: Date | null,
    public readonly authorityNotified: boolean,
    public readonly authorityNotifiedAt: Date | null,
    public readonly usersNotified: boolean,
    public readonly usersNotifiedAt: Date | null,
    public readonly tenantId: string,
    public readonly reportedBy: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly remediationActions: any,
    public readonly attachments: any
  ) {}

  /**
   * Verifica se requer notificação obrigatória às autoridades (GDPR Art. 33)
   * Critério: risco alto/muito alto para direitos e liberdades dos titulares
   */
  requiresAuthorityNotification(): boolean {
    return ['high', 'very_high'].includes(this.severity);
  }

  /**
   * Verifica se está dentro do prazo GDPR (72h para autoridades)
   */
  isWithinAuthorityNotificationDeadline(): boolean {
    const deadlineMs = 72 * 60 * 60 * 1000; // 72 horas em ms
    return (new Date().getTime() - this.discoveredAt.getTime()) <= deadlineMs;
  }

  /**
   * Verifica se requer notificação aos usuários (GDPR Art. 34)
   */
  requiresUserNotification(): boolean {
    // Notificação obrigatória se risco alto para direitos e liberdades
    return this.severity === 'very_high';
  }

  /**
   * Verifica se o incidente está contido
   */
  isContained(): boolean {
    return !!this.containedAt;
  }

  /**
   * Verifica se o incidente foi resolvido
   */
  isResolved(): boolean {
    return !!this.resolvedAt;
  }

  /**
   * Factory method para criar novo incidente
   */
  static create(data: Partial<SecurityIncidentType>): SecurityIncident {
    if (!data.incidentType || !data.severity || !data.title || !data.description || !data.tenantId || !data.reportedBy) {
      throw new Error('Missing required fields for SecurityIncident');
    }

    return new SecurityIncident(
      data.id || crypto.randomUUID(),
      data.incidentType,
      data.severity,
      data.title,
      data.description,
      data.affectedDataTypes || null,
      data.affectedUserCount || null,
      data.discoveredAt || new Date(),
      data.containedAt || null,
      data.resolvedAt || null,
      data.authorityNotified || false,
      data.authorityNotifiedAt || null,
      data.usersNotified || false,
      data.usersNotifiedAt || null,
      data.tenantId,
      data.reportedBy,
      data.createdAt || new Date(),
      data.updatedAt || new Date(),
      data.remediationActions || null,
      data.attachments || null
    );
  }

  /**
   * Marca como notificado às autoridades
   */
  markAuthorityNotified(): SecurityIncident {
    return new SecurityIncident(
      this.id,
      this.incidentType,
      this.severity,
      this.title,
      this.description,
      this.affectedDataTypes,
      this.affectedUserCount,
      this.discoveredAt,
      this.containedAt,
      this.resolvedAt,
      true,
      new Date(),
      this.usersNotified,
      this.usersNotifiedAt,
      this.tenantId,
      this.reportedBy,
      this.createdAt,
      new Date(),
      this.remediationActions,
      this.attachments
    );
  }

  /**
   * Marca como notificado aos usuários
   */
  markUsersNotified(): SecurityIncident {
    return new SecurityIncident(
      this.id,
      this.incidentType,
      this.severity,
      this.title,
      this.description,
      this.affectedDataTypes,
      this.affectedUserCount,
      this.discoveredAt,
      this.containedAt,
      this.resolvedAt,
      this.authorityNotified,
      this.authorityNotifiedAt,
      true,
      new Date(),
      this.tenantId,
      this.reportedBy,
      this.createdAt,
      new Date(),
      this.remediationActions,
      this.attachments
    );
  }

  /**
   * Marca como contido
   */
  markAsContained(remediationActions?: any): SecurityIncident {
    return new SecurityIncident(
      this.id,
      this.incidentType,
      this.severity,
      this.title,
      this.description,
      this.affectedDataTypes,
      this.affectedUserCount,
      this.discoveredAt,
      new Date(),
      this.resolvedAt,
      this.authorityNotified,
      this.authorityNotifiedAt,
      this.usersNotified,
      this.usersNotifiedAt,
      this.tenantId,
      this.reportedBy,
      this.createdAt,
      new Date(),
      remediationActions || this.remediationActions,
      this.attachments
    );
  }

  /**
   * Marca como resolvido
   */
  markAsResolved(): SecurityIncident {
    return new SecurityIncident(
      this.id,
      this.incidentType,
      this.severity,
      this.title,
      this.description,
      this.affectedDataTypes,
      this.affectedUserCount,
      this.discoveredAt,
      this.containedAt,
      new Date(),
      this.authorityNotified,
      this.authorityNotifiedAt,
      this.usersNotified,
      this.usersNotifiedAt,
      this.tenantId,
      this.reportedBy,
      this.createdAt,
      new Date(),
      this.remediationActions,
      this.attachments
    );
  }
}