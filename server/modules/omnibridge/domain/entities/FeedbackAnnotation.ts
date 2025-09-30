// Domain Entity: FeedbackAnnotation
// Representa feedback e anotações sobre conversas/mensagens/ações

export type FeedbackRating = 'excellent' | 'good' | 'neutral' | 'poor' | 'terrible';

export interface FeedbackAnnotation {
  id: number;
  tenantId: string;
  conversationId?: number;
  messageId?: number;
  actionExecutionId?: number;
  rating?: FeedbackRating;
  category?: string;
  tags?: string[];
  notes?: string;
  correctiveAction?: string;
  expectedBehavior?: string;
  actualBehavior?: string;
  severity?: string;
  resolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: number;
  annotatedBy: number;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateFeedbackAnnotationDTO {
  tenantId: string;
  conversationId?: number;
  messageId?: number;
  actionExecutionId?: number;
  rating?: FeedbackRating;
  category?: string;
  tags?: string[];
  notes?: string;
  correctiveAction?: string;
  expectedBehavior?: string;
  actualBehavior?: string;
  severity?: string;
  annotatedBy: number;
  metadata?: Record<string, any>;
}

export interface UpdateFeedbackAnnotationDTO {
  rating?: FeedbackRating;
  category?: string;
  tags?: string[];
  notes?: string;
  correctiveAction?: string;
  expectedBehavior?: string;
  actualBehavior?: string;
  severity?: string;
  resolved?: boolean;
  resolvedAt?: Date;
  resolvedBy?: number;
  metadata?: Record<string, any>;
}
