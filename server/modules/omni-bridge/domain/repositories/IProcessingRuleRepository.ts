
/**
 * ProcessingRule Repository Interface
 * Clean Architecture - Domain Layer
 */
import { ProcessingRule } from '../entities/ProcessingRule';

export interface IProcessingRuleRepository {
  findAll(tenantId: string): Promise<ProcessingRule[]>;
  findById(tenantId: string, id: string): Promise<ProcessingRule | null>;
  findActive(tenantId: string): Promise<ProcessingRule[]>;
  findByChannelType(tenantId: string, channelType: string): Promise<ProcessingRule[]>;
  save(rule: ProcessingRule): Promise<ProcessingRule>;
  update(tenantId: string, id: string, updates: Partial<ProcessingRule>): Promise<ProcessingRule | null>;
  updateExecutionCount(tenantId: string, id: string): Promise<void>;
  delete(tenantId: string, id: string): Promise<boolean>;
}
