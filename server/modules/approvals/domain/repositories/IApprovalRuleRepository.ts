import { ApprovalRule } from '../entities/ApprovalRule';
import { InsertApprovalRuleForm } from '../../../../../shared/schema-master';

export interface ApprovalRuleFilters {
  moduleType?: string;
  isActive?: boolean;
  priority?: number;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface ApprovalRuleStats {
  totalRules: number;
  activeRules: number;
  rulesByModule: Record<string, number>;
}

export interface IApprovalRuleRepository {
  findById(id: string, tenantId: string): Promise<ApprovalRule | null>;
  findAll(tenantId: string, filters?: ApprovalRuleFilters): Promise<ApprovalRule[]>;
  findByModuleType(tenantId: string, moduleType: string, isActive?: boolean): Promise<ApprovalRule[]>;
  findApplicableRules(tenantId: string, moduleType: string, entityData: Record<string, any>): Promise<ApprovalRule[]>;
  create(tenantId: string, ruleData: InsertApprovalRuleForm, createdById: string): Promise<ApprovalRule>;
  update(id: string, tenantId: string, ruleData: Partial<InsertApprovalRuleForm>, updatedById: string): Promise<ApprovalRule>;
  delete(id: string, tenantId: string): Promise<void>;
  getStats(tenantId: string): Promise<ApprovalRuleStats>;
  validateUniqueName(tenantId: string, name: string, excludeId?: string): Promise<boolean>;
}