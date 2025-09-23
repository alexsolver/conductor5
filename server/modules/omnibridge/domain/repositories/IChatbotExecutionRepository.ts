import { 
  SelectChatbotExecution, 
  InsertChatbotExecution
} from '../../../../../shared/schema-chatbot';

export interface IChatbotExecutionRepository {
  // Basic CRUD operations
  create(execution: InsertChatbotExecution): Promise<SelectChatbotExecution>;
  findById(id: string): Promise<SelectChatbotExecution | null>;
  findByBot(botId: string, limit?: number, offset?: number): Promise<SelectChatbotExecution[]>;
  findByTenant(tenantId: string, limit?: number, offset?: number): Promise<SelectChatbotExecution[]>;
  update(id: string, updates: Partial<SelectChatbotExecution>): Promise<SelectChatbotExecution | null>;
  
  // Execution lifecycle
  startExecution(execution: InsertChatbotExecution): Promise<SelectChatbotExecution>;
  updateStatus(id: string, status: string, error?: string): Promise<boolean>;
  completeExecution(id: string, endedAt: Date, metrics?: any): Promise<boolean>;
  failExecution(id: string, error: string): Promise<boolean>;
  
  // Context management
  updateContext(id: string, context: any): Promise<boolean>;
  addToNodeTrace(id: string, nodeId: string, timestamp: Date, data?: any): Promise<boolean>;
  
  // Analytics and reporting
  getExecutionsByDateRange(
    tenantId: string, 
    startDate: Date, 
    endDate: Date
  ): Promise<SelectChatbotExecution[]>;
  
  getExecutionStats(botId: string, period?: 'day' | 'week' | 'month'): Promise<{
    totalExecutions: number;
    successfulExecutions: number;
    failedExecutions: number;
    averageDuration: number;
    successRate: number;
  }>;
  
  getBotPerformanceMetrics(tenantId: string): Promise<Array<{
    botId: string;
    botName: string;
    executions: number;
    successRate: number;
    avgDuration: number;
  }>>;
  
  getChannelStats(tenantId: string): Promise<Array<{
    channelId: string;
    executions: number;
    successRate: number;
  }>>;
  
  // Active executions
  findActiveExecutions(tenantId?: string): Promise<SelectChatbotExecution[]>;
  findTimedOutExecutions(timeoutMinutes: number): Promise<SelectChatbotExecution[]>;
  
  // Cleanup
  cleanupOldExecutions(olderThanDays: number): Promise<number>;
  
  // Search and filtering
  searchExecutions(tenantId: string, filters: {
    botId?: string;
    status?: string;
    channelId?: string;
    userId?: string;
    dateFrom?: Date;
    dateTo?: Date;
  }): Promise<SelectChatbotExecution[]>;
}