/**
 * EXPENSE APPROVAL APPLICATION SERVICE - APPLICATION LAYER
 * ✅ 1QA.MD COMPLIANCE: Pure application service with Clean Architecture
 * ✅ BUSINESS ORCHESTRATION: Coordinates domain entities and repositories
 * ✅ AUDIT INTEGRATION: Complete audit trail for all operations
 */

import { IExpenseApprovalRepository } from '../../domain/repositories/IExpenseApprovalRepository';
import { ExpenseReport, InsertExpenseReport, ExpenseFilters, ExpenseListOptions, ExpenseReportDomain } from '../../domain/entities/ExpenseReport';
import { ExpenseItem, InsertExpenseItem } from '../../domain/entities/ExpenseReport';
import { ExpensePolicyEngine, PolicyEvaluationContext } from '../../domain/entities/ExpensePolicy';

export class ExpenseApprovalApplicationService {
  constructor(
    private expenseApprovalRepository: IExpenseApprovalRepository
  ) {}

  async getExpenseReports(
    tenantId: string, 
    filters: ExpenseFilters = {}, 
    options: ExpenseListOptions = {},
    userId: string
  ): Promise<{ reports: ExpenseReport[], total: number, page: number, limit: number }> {
    console.log('📋 [ExpenseApprovalApplicationService] Getting expense reports with filters:', filters);
    
    try {
      const result = await this.expenseApprovalRepository.findExpenseReports(tenantId, filters, options);
      
      // Create audit entry for data access
      await this.expenseApprovalRepository.createAuditEntry(tenantId, {
        entityType: 'expense_report',
        entityId: 'list',
        action: 'view_list',
        userId,
        userName: 'User', // Would be populated from user context
        metadata: { filters, options, resultCount: result.reports.length }
      });

      console.log(`✅ [ExpenseApprovalApplicationService] Found ${result.reports.length} expense reports`);
      return result;
    } catch (error) {
      console.error('❌ [ExpenseApprovalApplicationService] Error getting expense reports:', error);
      throw new Error('Failed to get expense reports');
    }
  }

  async getExpenseReportById(tenantId: string, id: string, userId: string): Promise<ExpenseReport | null> {
    console.log('🔍 [ExpenseApprovalApplicationService] Getting expense report by ID:', id);
    
    try {
      const report = await this.expenseApprovalRepository.findExpenseReportById(tenantId, id);
      
      if (report) {
        // Create audit entry for data access
        await this.expenseApprovalRepository.createAuditEntry(tenantId, {
          entityType: 'expense_report',
          entityId: id,
          action: 'view',
          userId,
          userName: 'User',
          metadata: { reportNumber: report.reportNumber }
        });
      }

      console.log(report ? '✅' : '❌', '[ExpenseApprovalApplicationService] Found expense report:', report?.title);
      return report;
    } catch (error) {
      console.error('❌ [ExpenseApprovalApplicationService] Error getting expense report:', error);
      throw new Error('Failed to get expense report');
    }
  }

  async createExpenseReport(
    tenantId: string, 
    reportData: InsertExpenseReport, 
    items: InsertExpenseItem[] = [],
    userId: string,
    userName: string
  ): Promise<{ report: ExpenseReport, items: ExpenseItem[] }> {
    console.log('➕ [ExpenseApprovalApplicationService] Creating expense report:', reportData.title);
    
    try {
      // Generate report number if not provided
      if (!reportData.reportNumber) {
        const currentYear = new Date().getFullYear();
        reportData.reportNumber = await this.expenseApprovalRepository.generateReportNumber(tenantId, currentYear);
      }

      // Set audit fields
      reportData.createdById = userId;
      reportData.updatedById = userId;

      // Calculate totals from items
      if (items.length > 0) {
        reportData.totalAmountLocal = ExpenseReportDomain.calculateTotalAmount(items as any[]);
        reportData.totalAmount = reportData.totalAmountLocal; // Simplified for now
      }

      // Create the expense report
      const newReport = await this.expenseApprovalRepository.createExpenseReport(tenantId, reportData);

      // Create expense items
      const createdItems: ExpenseItem[] = [];
      for (let i = 0; i < items.length; i++) {
        const itemData = {
          ...items[i],
          tenantId,
          expenseReportId: newReport.id,
          itemNumber: i + 1
        };
        
        const createdItem = await this.expenseApprovalRepository.createExpenseItem(tenantId, itemData);
        createdItems.push(createdItem);
      }

      // Create audit entry
      await this.expenseApprovalRepository.createAuditEntry(tenantId, {
        entityType: 'expense_report',
        entityId: newReport.id,
        action: 'create',
        userId,
        userName,
        newValues: { ...newReport, itemCount: createdItems.length },
        metadata: { reportNumber: newReport.reportNumber, itemCount: createdItems.length }
      });

      console.log('✅ [ExpenseApprovalApplicationService] Expense report created:', newReport.id);
      return { report: newReport, items: createdItems };
    } catch (error) {
      console.error('❌ [ExpenseApprovalApplicationService] Error creating expense report:', error);
      throw new Error('Failed to create expense report');
    }
  }

  async updateExpenseReport(
    tenantId: string, 
    id: string, 
    reportData: Partial<ExpenseReport>,
    userId: string,
    userName: string
  ): Promise<ExpenseReport> {
    console.log('🔄 [ExpenseApprovalApplicationService] Updating expense report:', id);
    
    try {
      // Get existing report for audit trail
      const existingReport = await this.expenseApprovalRepository.findExpenseReportById(tenantId, id);
      if (!existingReport) {
        throw new Error('Expense report not found');
      }

      // Check if report can be edited
      if (!ExpenseReportDomain.canEdit(existingReport)) {
        throw new Error('Expense report cannot be edited in current status');
      }

      // Set audit fields
      reportData.updatedById = userId;

      // Update the expense report
      const updatedReport = await this.expenseApprovalRepository.updateExpenseReport(tenantId, id, reportData);

      // Create audit entry
      await this.expenseApprovalRepository.createAuditEntry(tenantId, {
        entityType: 'expense_report',
        entityId: id,
        action: 'update',
        userId,
        userName,
        oldValues: existingReport,
        newValues: updatedReport,
        metadata: { reportNumber: updatedReport.reportNumber }
      });

      console.log('✅ [ExpenseApprovalApplicationService] Expense report updated:', id);
      return updatedReport;
    } catch (error) {
      console.error('❌ [ExpenseApprovalApplicationService] Error updating expense report:', error);
      throw new Error(`Failed to update expense report: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async submitExpenseReport(
    tenantId: string, 
    id: string, 
    userId: string,
    userName: string
  ): Promise<{ report: ExpenseReport, validationResult: any, policyResult: any }> {
    console.log('📤 [ExpenseApprovalApplicationService] Submitting expense report:', id);
    
    try {
      // Get expense report and items
      const report = await this.expenseApprovalRepository.findExpenseReportById(tenantId, id);
      if (!report) {
        throw new Error('Expense report not found');
      }

      if (!ExpenseReportDomain.canSubmit(report)) {
        throw new Error('Expense report cannot be submitted in current status');
      }

      const items = await this.expenseApprovalRepository.findExpenseItemsByReportId(tenantId, id);

      // Validate expense report
      const validationResult = ExpenseReportDomain.validateForSubmission(report, items as any[]);
      if (!validationResult.isValid) {
        throw new Error(`Validation failed: ${validationResult.errors.join(', ')}`);
      }

      // Evaluate policies
      const policies = await this.expenseApprovalRepository.findActiveExpensePolicies(tenantId);
      const policyContext: PolicyEvaluationContext = {
        userId,
        userRole: 'employee', // Would be determined from user context
        departmentId: report.departmentId || '',
        employeeId: report.employeeId,
        submissionDate: new Date()
      };

      const policyResult = ExpensePolicyEngine.evaluatePolicies(policies, report, items, policyContext);

      // Block submission if critical violations
      if (!policyResult.overallCompliance && policyResult.violations.some(v => v.severity === 'critical')) {
        throw new Error(`Policy violations prevent submission: ${policyResult.violations.map(v => v.message).join(', ')}`);
      }

      // Calculate risk score
      const riskScore = ExpenseReportDomain.calculateRiskScore(report, items as any[]);
      const auditRequired = ExpenseReportDomain.requiresAudit(report);

      // Update report status and metadata
      const updatedReport = await this.expenseApprovalRepository.updateExpenseReport(tenantId, id, {
        status: 'submitted',
        submissionDate: new Date(),
        riskScore,
        auditRequired,
        policyViolationLevel: policyResult.violations.length > 0 ? 
          (policyResult.violations.some(v => v.severity === 'critical') ? 'critical' :
           policyResult.violations.some(v => v.severity === 'major') ? 'major' : 'minor') : 'none',
        updatedById: userId
      });

      // Start approval workflow if needed
      // This would trigger the approval process

      // Create audit entry
      await this.expenseApprovalRepository.createAuditEntry(tenantId, {
        entityType: 'expense_report',
        entityId: id,
        action: 'submit',
        userId,
        userName,
        oldValues: { status: report.status },
        newValues: { status: 'submitted', riskScore, auditRequired },
        metadata: { 
          reportNumber: report.reportNumber,
          policyViolations: policyResult.violations.length,
          riskScore,
          auditRequired
        }
      });

      console.log('✅ [ExpenseApprovalApplicationService] Expense report submitted:', id);
      return { report: updatedReport, validationResult, policyResult };
    } catch (error) {
      console.error('❌ [ExpenseApprovalApplicationService] Error submitting expense report:', error);
      throw new Error(`Failed to submit expense report: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async deleteExpenseReport(
    tenantId: string, 
    id: string, 
    userId: string,
    userName: string
  ): Promise<boolean> {
    console.log('🗑️ [ExpenseApprovalApplicationService] Deleting expense report:', id);
    
    try {
      // Get existing report for audit trail
      const existingReport = await this.expenseApprovalRepository.findExpenseReportById(tenantId, id);
      if (!existingReport) {
        throw new Error('Expense report not found');
      }

      // Check if report can be deleted
      if (!['draft', 'rejected'].includes(existingReport.status)) {
        throw new Error('Only draft or rejected expense reports can be deleted');
      }

      // Soft delete the expense report (and its items via cascade)
      const success = await this.expenseApprovalRepository.deleteExpenseReport(tenantId, id);

      if (success) {
        // Create audit entry
        await this.expenseApprovalRepository.createAuditEntry(tenantId, {
          entityType: 'expense_report',
          entityId: id,
          action: 'delete',
          userId,
          userName,
          oldValues: existingReport,
          metadata: { reportNumber: existingReport.reportNumber }
        });
      }

      console.log(success ? '✅' : '❌', '[ExpenseApprovalApplicationService] Expense report deletion:', success);
      return success;
    } catch (error) {
      console.error('❌ [ExpenseApprovalApplicationService] Error deleting expense report:', error);
      throw new Error(`Failed to delete expense report: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getExpenseItems(tenantId: string, reportId: string, userId: string): Promise<ExpenseItem[]> {
    console.log('📋 [ExpenseApprovalApplicationService] Getting expense items for report:', reportId);
    
    try {
      const items = await this.expenseApprovalRepository.findExpenseItemsByReportId(tenantId, reportId);

      // Create audit entry for data access
      await this.expenseApprovalRepository.createAuditEntry(tenantId, {
        entityType: 'expense_item',
        entityId: 'list',
        action: 'view_list',
        userId,
        userName: 'User',
        metadata: { reportId, itemCount: items.length }
      });

      console.log(`✅ [ExpenseApprovalApplicationService] Found ${items.length} expense items`);
      return items;
    } catch (error) {
      console.error('❌ [ExpenseApprovalApplicationService] Error getting expense items:', error);
      throw new Error('Failed to get expense items');
    }
  }

  async getDashboardMetrics(tenantId: string, filters: any = {}): Promise<any> {
    console.log('📊 [ExpenseApprovalApplicationService] Getting dashboard metrics');
    
    try {
      const metrics = await this.expenseApprovalRepository.getExpenseDashboardMetrics(tenantId, filters);
      console.log('✅ [ExpenseApprovalApplicationService] Dashboard metrics retrieved');
      return metrics;
    } catch (error) {
      console.error('❌ [ExpenseApprovalApplicationService] Error getting dashboard metrics:', error);
      throw new Error('Failed to get dashboard metrics');
    }
  }

  async getAnalytics(tenantId: string, filters: any = {}): Promise<any> {
    console.log('📈 [ExpenseApprovalApplicationService] Getting analytics');
    
    try {
      const analytics = await this.expenseApprovalRepository.getExpenseAnalytics(tenantId, filters);
      console.log('✅ [ExpenseApprovalApplicationService] Analytics retrieved');
      return analytics;
    } catch (error) {
      console.error('❌ [ExpenseApprovalApplicationService] Error getting analytics:', error);
      throw new Error('Failed to get analytics');
    }
  }

  async getAuditTrail(tenantId: string, entityType: string, entityId: string): Promise<any[]> {
    console.log('📝 [ExpenseApprovalApplicationService] Getting audit trail for:', entityType, entityId);
    
    try {
      const auditTrail = await this.expenseApprovalRepository.findAuditTrail(tenantId, entityType, entityId);
      console.log(`✅ [ExpenseApprovalApplicationService] Found ${auditTrail.length} audit entries`);
      return auditTrail;
    } catch (error) {
      console.error('❌ [ExpenseApprovalApplicationService] Error getting audit trail:', error);
      throw new Error('Failed to get audit trail');
    }
  }
}