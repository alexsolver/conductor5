/**
 * Create Data Subject Request Use Case
 * Clean Architecture - Application Layer
 * GDPR/LGPD Compliance - Direitos do Titular dos Dados
 */

import type { IGdprComplianceRepository } from '../../domain/repositories/IGdprComplianceRepository';
import type { InsertDataSubjectRequest } from '@shared/schema-gdpr-compliance-clean';

export interface CreateDataSubjectRequestCommand {
  userId: string;
  requestType: 'access' | 'portability' | 'rectification' | 'erasure' | 'restriction' | 'objection' | 'complaint';
  requestDetails?: string;
  requestedData?: any;
  tenantId: string;
}

export interface CreateDataSubjectRequestResult {
  success: boolean;
  requestId?: string;
  message: string;
  dueDate?: Date;
}

export class CreateDataSubjectRequestUseCase {
  constructor(
    private gdprRepository: IGdprComplianceRepository
  ) {}

  async execute(command: CreateDataSubjectRequestCommand): Promise<CreateDataSubjectRequestResult> {
    try {
      // Validações de negócio
      if (!command.userId || !command.requestType || !command.tenantId) {
        return {
          success: false,
          message: 'Dados obrigatórios não fornecidos'
        };
      }

      // GDPR exige resposta em até 30 dias (máximo permitido)
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 30);

      // Preparar dados para inserção
      const requestData: InsertDataSubjectRequest = {
        userId: command.userId,
        requestType: command.requestType,
        status: 'pending',
        requestDetails: command.requestDetails || null,
        requestedData: command.requestedData || null,
        responseData: null,
        processedBy: null,
        processedAt: null,
        dueDate: dueDate,
        completedAt: null,
        tenantId: command.tenantId,
        notes: null,
        attachments: null
      };

      // Criar solicitação
      const request = await this.gdprRepository.createDataSubjectRequest(requestData);

      // Log de auditoria
      await this.gdprRepository.createAuditLog({
        userId: command.userId,
        subjectUserId: command.userId,
        action: 'data_subject_request_created',
        entityType: 'data_subject_request',
        entityId: request.id,
        ipAddress: '127.0.0.1', // TODO: Capturar IP real
        userAgent: null,
        requestData: { requestType: command.requestType },
        responseData: { requestId: request.id },
        tenantId: command.tenantId,
        severity: 'medium',
        tags: { gdpr: true, request_type: command.requestType }
      });

      return {
        success: true,
        requestId: request.id,
        message: `Solicitação de ${this.getRequestTypeDescription(command.requestType)} criada com sucesso`,
        dueDate: dueDate
      };

    } catch (error) {
      console.error('[CreateDataSubjectRequestUseCase] Error:', error);
      return {
        success: false,
        message: 'Erro interno do servidor ao criar solicitação'
      };
    }
  }

  private getRequestTypeDescription(type: string): string {
    const descriptions = {
      'access': 'acesso aos dados',
      'portability': 'portabilidade de dados',
      'rectification': 'retificação de dados',
      'erasure': 'esquecimento/exclusão de dados',
      'restriction': 'restrição de processamento',
      'objection': 'oposição ao processamento',
      'complaint': 'reclamação'
    };
    return descriptions[type as keyof typeof descriptions] || type;
  }
}