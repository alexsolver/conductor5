// Repository Interface: IActionExecutionLogRepository
// Define o contrato para persistência de logs de execução de ações

import { ActionExecutionLog, CreateActionExecutionLogDTO } from '../entities/ActionExecutionLog';

export interface IActionExecutionLogRepository {
  // CRUD básico
  create(data: CreateActionExecutionLogDTO): Promise<ActionExecutionLog>;
  findById(id: number, tenantId: string): Promise<ActionExecutionLog | null>;
  delete(id: number, tenantId: string): Promise<void>;
  
  // Consultas
  findByConversationId(conversationId: number, tenantId: string): Promise<ActionExecutionLog[]>;
  findByMessageId(messageId: number, tenantId: string): Promise<ActionExecutionLog[]>;
  
  // Analytics por ação
  getActionStatistics(tenantId: string, options?: {
    agentId?: number;
    actionName?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<{
    totalExecutions: number;
    successRate: number;
    avgExecutionTime: number;
    byActionName: Array<{
      actionName: string;
      total: number;
      success: number;
      failed: number;
      avgTime: number;
    }>;
  }>;
  
  // Incrementar contador de ações na conversa
  incrementConversationActionCount(conversationId: number, tenantId: string): Promise<void>;
}
