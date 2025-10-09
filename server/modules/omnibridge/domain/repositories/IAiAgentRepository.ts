import { AIAgent, AIAction, InterviewSession } from '../entities/AiAgent';

export interface IAiAgentRepository {
  // AI Agent CRUD
  createAgent(agent: Omit<AIAgent, 'id' | 'createdAt' | 'updatedAt'>): Promise<AIAgent>;
  findAgentById(id: string, tenantId: string): Promise<AIAgent | null>;
  findAgentsByTenant(tenantId: string): Promise<AIAgent[]>;
  updateAgent(id: string, tenantId: string, updates: Partial<AIAgent>): Promise<AIAgent>;
  deleteAgent(id: string, tenantId: string): Promise<boolean>;
  
  // AI Actions CRUD
  createAction(action: Omit<AIAction, 'id' | 'createdAt' | 'updatedAt'>): Promise<AIAction>;
  findActionsByAgent(agentId: string, tenantId: string): Promise<AIAction[]>;
  findActionById(id: string, tenantId: string): Promise<AIAction | null>;
  updateAction(id: string, tenantId: string, updates: Partial<AIAction>): Promise<AIAction>;
  deleteAction(id: string, tenantId: string): Promise<boolean>;
  
  // Interview Sessions
  createSession(session: Omit<InterviewSession, 'id' | 'createdAt' | 'updatedAt'>): Promise<InterviewSession>;
  findSessionById(id: string, tenantId: string): Promise<InterviewSession | null>;
  findActiveSession(userId: string, channelId: string, tenantId: string): Promise<InterviewSession | null>;
  updateSession(id: string, tenantId: string, updates: Partial<InterviewSession>): Promise<InterviewSession>;
  completeSession(id: string, tenantId: string): Promise<InterviewSession>;
}
