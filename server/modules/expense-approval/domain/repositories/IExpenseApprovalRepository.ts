/**
 * EXPENSE APPROVAL REPOSITORY INTERFACE - DOMAIN LAYER
 * ✅ 1QA.MD COMPLIANCE: Pure interface without external dependencies
 * ✅ CLEAN ARCHITECTURE: Domain repository contract
 * ✅ DEPENDENCY INVERSION: Repository abstraction
 */

import { ExpenseReport, InsertExpenseReport, ExpenseFilters, ExpenseListOptions } from '../entities/ExpenseReport';
import { ExpenseItem, InsertExpenseItem } from '../entities/ExpenseReport';
import { ExpenseApprovalWorkflow, ExpenseApprovalInstance, ExpenseApprovalDecision } from '../entities/ApprovalWorkflow';
import { ExpensePolicy } from '../entities/ExpensePolicy';
import { CorporateCard, CardTransaction } from '../entities/CorporateCard';

export interface IExpenseApprovalRepository {
  // Expense Reports
  createExpenseReport(tenantId: string, reportData: InsertExpenseReport): Promise<ExpenseReport>;
  findExpenseReportById(tenantId: string, id: string): Promise<ExpenseReport | null>;
  findExpenseReports(tenantId: string, filters: ExpenseFilters, options: ExpenseListOptions): Promise<{
    reports: ExpenseReport[];
    total: number;
    page: number;
    limit: number;
  }>;
  updateExpenseReport(tenantId: string, id: string, reportData: Partial<ExpenseReport>): Promise<ExpenseReport>;
  deleteExpenseReport(tenantId: string, id: string): Promise<boolean>;
  generateReportNumber(tenantId: string, year: number): Promise<string>;

  // Expense Items
  createExpenseItem(tenantId: string, itemData: InsertExpenseItem): Promise<ExpenseItem>;
  findExpenseItemsByReportId(tenantId: string, reportId: string): Promise<ExpenseItem[]>;
  updateExpenseItem(tenantId: string, id: string, itemData: Partial<ExpenseItem>): Promise<ExpenseItem>;
  deleteExpenseItem(tenantId: string, id: string): Promise<boolean>;

  // Approval Workflows
  findApprovalWorkflows(tenantId: string): Promise<ExpenseApprovalWorkflow[]>;
  findDefaultApprovalWorkflow(tenantId: string): Promise<ExpenseApprovalWorkflow | null>;
  createApprovalInstance(tenantId: string, instanceData: Partial<ExpenseApprovalInstance>): Promise<ExpenseApprovalInstance>;
  findApprovalInstanceByReportId(tenantId: string, reportId: string): Promise<ExpenseApprovalInstance | null>;
  updateApprovalInstance(tenantId: string, id: string, instanceData: Partial<ExpenseApprovalInstance>): Promise<ExpenseApprovalInstance>;
  createApprovalDecision(tenantId: string, decisionData: Partial<ExpenseApprovalDecision>): Promise<ExpenseApprovalDecision>;
  findApprovalDecisionsByInstanceId(tenantId: string, instanceId: string): Promise<ExpenseApprovalDecision[]>;

  // Policies
  findExpensePolicies(tenantId: string): Promise<ExpensePolicy[]>;
  findActiveExpensePolicies(tenantId: string): Promise<ExpensePolicy[]>;
  
  // Corporate Cards
  findCorporateCardsByEmployee(tenantId: string, employeeId: string): Promise<CorporateCard[]>;
  findUnreconciledCardTransactions(tenantId: string, cardId: string): Promise<CardTransaction[]>;
  updateCardTransaction(tenantId: string, id: string, transactionData: Partial<CardTransaction>): Promise<CardTransaction>;

  // Dashboard & Analytics
  getExpenseDashboardMetrics(tenantId: string, filters?: any): Promise<{
    totalSubmitted: number;
    totalPending: number;
    totalApproved: number;
    totalRejected: number;
    totalPaid: number;
    avgProcessingTime: number;
    complianceRate: number;
    highRiskCount: number;
    monthlyTrends: any[];
  }>;

  getExpenseAnalytics(tenantId: string, filters?: any): Promise<{
    expensesByCategory: any[];
    expensesByDepartment: any[];
    expensesByEmployee: any[];
    riskAnalysis: any[];
    policyViolations: any[];
  }>;

  // Audit Trail
  createAuditEntry(tenantId: string, auditData: {
    entityType: string;
    entityId: string;
    action: string;
    userId: string;
    userName: string;
    userRole?: string;
    ipAddress?: string;
    userAgent?: string;
    oldValues?: Record<string, any>;
    newValues?: Record<string, any>;
    metadata?: Record<string, any>;
    sessionId?: string;
  }): Promise<void>;

  findAuditTrail(tenantId: string, entityType: string, entityId: string): Promise<any[]>;
}

export interface ExpenseApprovalWorkflow {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  isDefault: boolean;
  steps: WorkflowStep[];
  conditions?: WorkflowCondition[];
  slaHours: number;
  escalationRules?: EscalationRule[];
  isActive: boolean;
  createdAt: Date;
  createdById: string;
}

export interface WorkflowStep {
  step: number;
  name: string;
  approverId?: string;
  approverRole?: string;
  conditions?: WorkflowCondition[];
  slaHours?: number;
  isParallel?: boolean;
  isOptional?: boolean;
}

export interface WorkflowCondition {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'nin' | 'contains';
  value: any;
  logicalOperator?: 'and' | 'or';
}

export interface EscalationRule {
  afterHours: number;
  escalateTo: string;
  notificationMessage?: string;
}

export interface ExpenseApprovalInstance {
  id: string;
  tenantId: string;
  expenseReportId: string;
  workflowId: string;
  currentStep: number;
  totalSteps: number;
  status: 'pending' | 'approved' | 'rejected' | 'delegated' | 'escalated';
  startedAt: Date;
  completedAt?: Date;
  slaDeadline?: Date;
  escalated: boolean;
  escalationCount: number;
  currentApproverId?: string;
  metadata?: Record<string, any>;
  isActive: boolean;
}

export interface ExpenseApprovalDecision {
  id: string;
  tenantId: string;
  instanceId: string;
  expenseReportId: string;
  step: number;
  approverId: string;
  decision: 'pending' | 'approved' | 'rejected' | 'delegated' | 'escalated';
  comments?: string;
  decisionDate: Date;
  timeToDecision?: number;
  ipAddress?: string;
  userAgent?: string;
  delegatedTo?: string;
  delegationReason?: string;
  metadata?: Record<string, any>;
}