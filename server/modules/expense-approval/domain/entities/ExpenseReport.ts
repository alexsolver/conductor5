/**
 * EXPENSE REPORT ENTITY - DOMAIN LAYER
 * ✅ 1QA.MD COMPLIANCE: Pure domain entity without external dependencies
 * ✅ CLEAN ARCHITECTURE: Domain-driven design
 * ✅ BUSINESS LOGIC: Core expense report operations
 */

export interface ExpenseReport {
  id: string;
  tenantId: string;
  reportNumber: string;
  employeeId: string;
  title: string;
  description?: string;
  status: ExpenseStatus;
  submissionDate?: Date;
  approvalDate?: Date;
  paymentDate?: Date;
  totalAmount: number;
  currency: string;
  exchangeRate: number;
  totalAmountLocal: number;
  departmentId?: string;
  costCenterId?: string;
  projectId?: string;
  policyViolationLevel: PolicyViolationLevel;
  riskScore: number;
  complianceChecked: boolean;
  auditRequired: boolean;
  currentApproverId?: string;
  approvalWorkflowId?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  createdById: string;
  updatedById: string;
  isActive: boolean;
}

export interface InsertExpenseReport {
  tenantId: string;
  reportNumber: string;
  employeeId: string;
  title: string;
  description?: string;
  status?: ExpenseStatus;
  submissionDate?: Date;
  approvalDate?: Date;
  paymentDate?: Date;
  totalAmount: number;
  currency?: string;
  exchangeRate?: number;
  totalAmountLocal: number;
  departmentId?: string;
  costCenterId?: string;
  projectId?: string;
  policyViolationLevel?: PolicyViolationLevel;
  riskScore?: number;
  complianceChecked?: boolean;
  auditRequired?: boolean;
  currentApproverId?: string;
  approvalWorkflowId?: string;
  metadata?: Record<string, any>;
  createdById: string;
  updatedById: string;
  isActive?: boolean;
}

export type ExpenseStatus = 
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'paid'
  | 'cancelled';

export type PolicyViolationLevel = 
  | 'none'
  | 'minor'
  | 'major'
  | 'critical';

export type ExpenseType = 
  | 'travel'
  | 'meal'
  | 'accommodation'
  | 'transport'
  | 'supplies'
  | 'equipment'
  | 'training'
  | 'client_entertainment'
  | 'other';

export type PaymentMethod = 
  | 'corporate_card'
  | 'personal_reimbursement'
  | 'advance_payment'
  | 'direct_billing';

export type Currency = 
  | 'BRL'
  | 'USD'
  | 'EUR'
  | 'GBP'
  | 'JPY'
  | 'CAD'
  | 'AUD';

export type ApprovalStatus = 
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'delegated'
  | 'escalated';

export type RiskLevel = 
  | 'low'
  | 'medium'
  | 'high'
  | 'critical';

/**
 * Domain service methods for ExpenseReport
 */
export class ExpenseReportDomain {
  /**
   * Calculate risk score based on multiple factors
   */
  static calculateRiskScore(report: ExpenseReport, items: ExpenseItem[]): number {
    let riskScore = 0;

    // High amount risk
    if (report.totalAmount > 10000) riskScore += 30;
    else if (report.totalAmount > 5000) riskScore += 20;
    else if (report.totalAmount > 1000) riskScore += 10;

    // Policy violations
    if (report.policyViolationLevel === 'critical') riskScore += 40;
    else if (report.policyViolationLevel === 'major') riskScore += 25;
    else if (report.policyViolationLevel === 'minor') riskScore += 10;

    // Items with violations
    const violatedItems = items.filter(item => item.policyViolation);
    riskScore += violatedItems.length * 5;

    // Weekend/holiday submissions
    const submissionDay = report.submissionDate?.getDay();
    if (submissionDay === 0 || submissionDay === 6) riskScore += 10;

    // Missing receipts or documentation
    const itemsWithoutReceipts = items.filter(item => !item.receiptNumber);
    riskScore += itemsWithoutReceipts.length * 15;

    // Round numbers (potential for fraud)
    const roundAmountItems = items.filter(item => 
      item.amount % 10 === 0 && item.amount > 100
    );
    riskScore += roundAmountItems.length * 5;

    return Math.min(riskScore, 100); // Cap at 100
  }

  /**
   * Determine if audit is required
   */
  static requiresAudit(report: ExpenseReport): boolean {
    return (
      report.riskScore >= 70 ||
      report.policyViolationLevel === 'critical' ||
      report.totalAmount > 20000 ||
      Math.random() < 0.05 // 5% random audit
    );
  }

  /**
   * Validate expense report before submission
   */
  static validateForSubmission(report: ExpenseReport, items: ExpenseItem[]): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields
    if (!report.title.trim()) errors.push('Title is required');
    if (!report.employeeId) errors.push('Employee is required');
    if (items.length === 0) errors.push('At least one expense item is required');

    // Business rules
    if (report.totalAmount <= 0) errors.push('Total amount must be greater than zero');
    if (report.totalAmount > 50000) warnings.push('High amount requires additional approval');

    // Items validation
    items.forEach((item, index) => {
      if (!item.description.trim()) errors.push(`Item ${index + 1}: Description is required`);
      if (item.amount <= 0) errors.push(`Item ${index + 1}: Amount must be greater than zero`);
      if (!item.expenseDate) errors.push(`Item ${index + 1}: Expense date is required`);
      
      // Date validation - cannot be future or too old
      const expenseDate = new Date(item.expenseDate);
      const today = new Date();
      const maxDaysOld = 90;
      
      if (expenseDate > today) {
        errors.push(`Item ${index + 1}: Expense date cannot be in the future`);
      }
      
      const daysDiff = Math.floor((today.getTime() - expenseDate.getTime()) / (1000 * 60 * 60 * 24));
      if (daysDiff > maxDaysOld) {
        warnings.push(`Item ${index + 1}: Expense is ${daysDiff} days old (policy limit: ${maxDaysOld} days)`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Generate next report number
   */
  static generateReportNumber(tenantId: string, year: number, sequence: number): string {
    const shortTenant = tenantId.substring(0, 8).toUpperCase();
    return `EXP-${shortTenant}-${year}-${sequence.toString().padStart(5, '0')}`;
  }

  /**
   * Calculate total amount from items
   */
  static calculateTotalAmount(items: ExpenseItem[]): number {
    return items.reduce((total, item) => total + item.amountLocal, 0);
  }

  /**
   * Check if report can be edited
   */
  static canEdit(report: ExpenseReport): boolean {
    return ['draft', 'rejected'].includes(report.status);
  }

  /**
   * Check if report can be submitted
   */
  static canSubmit(report: ExpenseReport): boolean {
    return report.status === 'draft';
  }

  /**
   * Check if report can be approved
   */
  static canApprove(report: ExpenseReport): boolean {
    return ['submitted', 'under_review'].includes(report.status);
  }

  /**
   * Check if report can be paid
   */
  static canPay(report: ExpenseReport): boolean {
    return report.status === 'approved';
  }
}

export interface ExpenseItem {
  id: string;
  tenantId: string;
  expenseReportId: string;
  itemNumber: number;
  expenseType: ExpenseType;
  category: string;
  subcategory?: string;
  description: string;
  expenseDate: string;
  amount: number;
  currency: Currency;
  exchangeRate: number;
  amountLocal: number;
  vendor?: string;
  vendorTaxId?: string;
  location?: string;
  paymentMethod: PaymentMethod;
  cardTransactionId?: string;
  receiptNumber?: string;
  taxAmount: number;
  taxRate?: number;
  businessJustification?: string;
  attendees?: Record<string, any>;
  mileage?: number;
  mileageRate?: number;
  policyViolation: boolean;
  policyViolationDetails?: string;
  complianceNotes?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface InsertExpenseItem {
  tenantId: string;
  expenseReportId: string;
  itemNumber: number;
  expenseType: ExpenseType;
  category: string;
  subcategory?: string;
  description: string;
  expenseDate: string;
  amount: number;
  currency?: Currency;
  exchangeRate?: number;
  amountLocal: number;
  vendor?: string;
  vendorTaxId?: string;
  location?: string;
  paymentMethod: PaymentMethod;
  cardTransactionId?: string;
  receiptNumber?: string;
  taxAmount?: number;
  taxRate?: number;
  businessJustification?: string;
  attendees?: Record<string, any>;
  mileage?: number;
  mileageRate?: number;
  policyViolation?: boolean;
  policyViolationDetails?: string;
  complianceNotes?: string;
  isActive?: boolean;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ExpenseFilters {
  status?: ExpenseStatus;
  employeeId?: string;
  departmentId?: string;
  costCenterId?: string;
  projectId?: string;
  submissionDateFrom?: string;
  submissionDateTo?: string;
  amountMin?: number;
  amountMax?: number;
  search?: string;
  policyViolationLevel?: PolicyViolationLevel;
  riskScoreMin?: number;
  complianceChecked?: boolean;
  auditRequired?: boolean;
  currentApproverId?: string;
}

export interface ExpenseListOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}