// Repository Interface: IAgentImprovementRepository
// Define o contrato para persistência de melhorias de agentes

import { AgentImprovement, CreateAgentImprovementDTO, ApplyAgentImprovementDTO } from '../entities/AgentImprovement';

export interface IAgentImprovementRepository {
  // CRUD básico
  create(data: CreateAgentImprovementDTO): Promise<AgentImprovement>;
  findById(id: number, tenantId: string): Promise<AgentImprovement | null>;
  delete(id: number, tenantId: string): Promise<void>;
  
  // Consultas
  findByAgentId(agentId: number, tenantId: string, options?: {
    applied?: boolean;
    improvementType?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ improvements: AgentImprovement[]; total: number }>;
  
  // Aplicar melhoria
  apply(id: number, tenantId: string, data: ApplyAgentImprovementDTO): Promise<AgentImprovement>;
  
  // Reverter melhoria
  rollback(id: number, tenantId: string): Promise<AgentImprovement>;
  
  // Histórico de versões
  getVersionHistory(agentId: number, tenantId: string): Promise<AgentImprovement[]>;
}
