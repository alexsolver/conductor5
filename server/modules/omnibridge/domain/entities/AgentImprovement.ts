// Domain Entity: AgentImprovement
// Representa melhorias aplicadas aos agentes baseadas em feedback

export type ImprovementType = 'prompt_update' | 'action_config' | 'field_mapping' | 'context_enhancement';

export interface AgentImprovement {
  id: number;
  tenantId: string;
  agentId: number;
  basedOnAnnotationId?: number;
  improvementType: ImprovementType;
  description: string;
  beforeConfig?: Record<string, any>;
  afterConfig?: Record<string, any>;
  promptUpdate?: string;
  impactMetrics?: Record<string, any>;
  applied: boolean;
  appliedAt?: Date;
  appliedBy?: number;
  rollbackAvailable: boolean;
  version: number;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAgentImprovementDTO {
  tenantId: string;
  agentId: number;
  basedOnAnnotationId?: number;
  improvementType: ImprovementType;
  description: string;
  beforeConfig?: Record<string, any>;
  afterConfig?: Record<string, any>;
  promptUpdate?: string;
  metadata?: Record<string, any>;
}

export interface ApplyAgentImprovementDTO {
  appliedBy: number;
  impactMetrics?: Record<string, any>;
}
