// ✅ 1QA.MD COMPLIANCE: CLEAN ARCHITECTURE - DOMAIN LAYER
// Repository Interface: IApprovalRuleRepository - Domain contract without implementation details

import { ApprovalRule } from '../entities/ApprovalRule';

export interface CreateApprovalRuleData {
  tenantId: string;
  name: string;
  description?: string;
  moduleType: 'tickets' | 'materials' | 'knowledge_base' | 'timecard' | 'contracts';
  entityType: string;
  queryConditions: any[];
  approvalSteps: any[];
  defaultSlaHours: number;
  escalationEnabled: boolean;
  autoApprovalEnabled: boolean;
  autoApprovalConditions?: any[];
  isActive?: boolean;
  priority?: number;
  createdById: string;
}

export interface UpdateApprovalRuleData {
  name?: string;
  description?: string;
  queryConditions?: any[];
  approvalSteps?: any[];
  defaultSlaHours?: number;
  escalationEnabled?: boolean;
  autoApprovalEnabled?: boolean;
  autoApprovalConditions?: any[];
  isActive?: boolean;
  priority?: number;
  updatedById: string;
}

export interface ApprovalRuleFilters {
  tenantId: string;
  moduleType?: string;
  isActive?: boolean;
  createdById?: string;
  search?: string; // Search in name and description
}

export interface IApprovalRuleRepository {
  // CRUD operations
  create(data: CreateApprovalRuleData): Promise<ApprovalRule>;
  update(id: string, data: UpdateApprovalRuleData): Promise<ApprovalRule>;
  delete(id: string, tenantId: string): Promise<void>;

  // Query operations
  findById(id: string, tenantId: string): Promise<ApprovalRule | null>;
  findByTenant(tenantId: string): Promise<ApprovalRule[]>;
  findByFilters(filters: ApprovalRuleFilters): Promise<ApprovalRule[]>;
  findByModule(tenantId: string, moduleType: string, entityType?: string): Promise<ApprovalRule[]>;
  
  // Rule evaluation and matching
  findApplicableRules(
    tenantId: string, 
    moduleType: string, 
    entityType: string, 
    entityData: Record<string, any>
  ): Promise<ApprovalRule[]>;
  
  // Rule priority and activation
  findActiveRules(tenantId: string, moduleType: string): Promise<ApprovalRule[]>;
  findByPriority(tenantId: string, ascending?: boolean): Promise<ApprovalRule[]>;
  
  // Statistics and analytics
  countByTenant(tenantId: string): Promise<number>;
  countByModule(tenantId: string, moduleType: string): Promise<number>;
  
  // Bulk operations
  activateMultiple(ids: string[], tenantId: string): Promise<void>;
  deactivateMultiple(ids: string[], tenantId: string): Promise<void>;
  updatePriorities(updates: Array<{ id: string; priority: number }>, tenantId: string): Promise<void>;
  
  // Validation and conflicts
  checkNameUniqueness(name: string, tenantId: string, excludeId?: string): Promise<boolean>;
  findConflictingRules(rule: ApprovalRule): Promise<ApprovalRule[]>;
  
  // Audit and history
  findRecentlyModified(tenantId: string, daysBack?: number): Promise<ApprovalRule[]>;
  findByCreator(tenantId: string, createdById: string): Promise<ApprovalRule[]>;
}