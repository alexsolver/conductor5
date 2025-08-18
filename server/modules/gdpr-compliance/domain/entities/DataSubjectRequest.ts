/**
 * Data Subject Request Domain Entity
 * Clean Architecture - Domain Layer
 * GDPR/LGPD Compliance - Funcionalidades 3-7: Direitos GDPR
 */

import type { DataSubjectRequest as DataSubjectRequestType } from '@shared/schema-gdpr-compliance-clean';

export class DataSubjectRequest {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly requestType: string,
    public readonly status: string,
    public readonly requestDetails: string | null,
    public readonly requestedData: any,
    public readonly responseData: any,
    public readonly processedBy: string | null,
    public readonly processedAt: Date | null,
    public readonly dueDate: Date,
    public readonly completedAt: Date | null,
    public readonly tenantId: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly notes: string | null,
    public readonly attachments: any
  ) {}

  /**
   * Verifica se a solicitação está dentro do prazo GDPR (30 dias)
   */
  isWithinGdprDeadline(): boolean {
    return new Date() <= this.dueDate;
  }

  /**
   * Verifica se a solicitação está vencida
   */
  isOverdue(): boolean {
    return new Date() > this.dueDate && !this.completedAt;
  }

  /**
   * Calcula dias restantes para resposta
   */
  getDaysRemaining(): number {
    const diffTime = this.dueDate.getTime() - new Date().getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Factory method para criar nova solicitação
   */
  static create(data: Partial<DataSubjectRequestType>): DataSubjectRequest {
    if (!data.userId || !data.requestType || !data.tenantId) {
      throw new Error('Missing required fields for DataSubjectRequest');
    }

    // GDPR exige resposta em até 30 dias
    const dueDate = data.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    return new DataSubjectRequest(
      data.id || crypto.randomUUID(),
      data.userId,
      data.requestType,
      data.status || 'pending',
      data.requestDetails || null,
      data.requestedData || null,
      data.responseData || null,
      data.processedBy || null,
      data.processedAt || null,
      dueDate,
      data.completedAt || null,
      data.tenantId,
      data.createdAt || new Date(),
      data.updatedAt || new Date(),
      data.notes || null,
      data.attachments || null
    );
  }

  /**
   * Marca como processada
   */
  markAsProcessed(processedBy: string, responseData?: any): DataSubjectRequest {
    return new DataSubjectRequest(
      this.id,
      this.userId,
      this.requestType,
      'completed',
      this.requestDetails,
      this.requestedData,
      responseData || this.responseData,
      processedBy,
      new Date(),
      this.dueDate,
      new Date(),
      this.tenantId,
      this.createdAt,
      new Date(),
      this.notes,
      this.attachments
    );
  }

  /**
   * Atualiza status
   */
  updateStatus(status: string, notes?: string): DataSubjectRequest {
    return new DataSubjectRequest(
      this.id,
      this.userId,
      this.requestType,
      status,
      this.requestDetails,
      this.requestedData,
      this.responseData,
      this.processedBy,
      this.processedAt,
      this.dueDate,
      status === 'completed' ? new Date() : this.completedAt,
      this.tenantId,
      this.createdAt,
      new Date(),
      notes || this.notes,
      this.attachments
    );
  }
}