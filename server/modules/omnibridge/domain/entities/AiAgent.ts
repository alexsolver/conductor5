export interface AIAgent {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  configPrompt: string;
  allowedFormIds: string[];
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AIAction {
  id: string;
  tenantId: string;
  agentId: string;
  type: 'interview';
  config: {
    formId?: string;
    [key: string]: any;
  };
  executionCount: number;
  lastExecutedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface InterviewSession {
  id: string;
  tenantId: string;
  agentId: string;
  actionId: string;
  formId: string;
  userId: string;
  channelId: string;
  conversationId: string;
  collectedData: Record<string, any>;
  currentFieldIndex: number;
  status: 'in_progress' | 'completed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}
