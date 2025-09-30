// Domain Entity: ActionExecutionLog
// Representa a execução de uma ação/ferramenta pela IA

export interface ActionExecutionLog {
  id: number;
  tenantId: string;
  messageId: number;
  conversationId: number;
  actionName: string;
  actionType?: string;
  parameters: Record<string, any>;
  result?: Record<string, any>;
  success: boolean;
  errorMessage?: string;
  executionTimeMs: number;
  retryCount: number;
  triggeredBy: string;
  metadata?: Record<string, any>;
  executedAt: Date;
  createdAt: Date;
}

export interface CreateActionExecutionLogDTO {
  tenantId: string;
  messageId: number;
  conversationId: number;
  actionName: string;
  actionType?: string;
  parameters: Record<string, any>;
  result?: Record<string, any>;
  success: boolean;
  errorMessage?: string;
  executionTimeMs: number;
  retryCount?: number;
  triggeredBy?: string;
  metadata?: Record<string, any>;
}
