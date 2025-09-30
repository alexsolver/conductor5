// Repository Interface: IFeedbackAnnotationRepository
// Define o contrato para persistência de anotações de feedback

import { FeedbackAnnotation, CreateFeedbackAnnotationDTO, UpdateFeedbackAnnotationDTO } from '../entities/FeedbackAnnotation';

export interface IFeedbackAnnotationRepository {
  // CRUD básico
  create(data: CreateFeedbackAnnotationDTO): Promise<FeedbackAnnotation>;
  findById(id: number, tenantId: string): Promise<FeedbackAnnotation | null>;
  update(id: number, tenantId: string, data: UpdateFeedbackAnnotationDTO): Promise<FeedbackAnnotation>;
  delete(id: number, tenantId: string): Promise<void>;
  
  // Consultas
  findByConversationId(conversationId: number, tenantId: string): Promise<FeedbackAnnotation[]>;
  findByMessageId(messageId: number, tenantId: string): Promise<FeedbackAnnotation[]>;
  findByActionExecutionId(actionExecutionId: number, tenantId: string): Promise<FeedbackAnnotation[]>;
  
  // Filtros avançados
  findAll(tenantId: string, options?: {
    agentId?: number;
    rating?: string;
    category?: string;
    severity?: string;
    resolved?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<{ annotations: FeedbackAnnotation[]; total: number }>;
  
  // Estatísticas
  getStatistics(tenantId: string, agentId?: number): Promise<{
    totalAnnotations: number;
    byRating: Record<string, number>;
    byCategory: Record<string, number>;
    bySeverity: Record<string, number>;
    resolvedCount: number;
    unresolvedCount: number;
  }>;
}
