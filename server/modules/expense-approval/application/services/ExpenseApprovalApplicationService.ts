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

// Enterprise services imports
import { OCRService, OCRResult } from '../../infrastructure/services/OCRService';
import { CurrencyService, CurrencyConversionRequest, CurrencyConversionResult } from '../../domain/services/CurrencyService';
import { CorporateCardService, ExpenseMatch, CardReconciliation } from '../../domain/services/CorporateCardService';
import { PolicyEngineService, PolicyEvaluationResult } from '../../domain/services/PolicyEngineService';
import { ExpenseWorkflowService, WorkflowExecution } from '../../domain/services/ExpenseWorkflowService';

export class ExpenseApprovalApplicationService {
  // Enterprise domain services
  private ocrService: OCRService;
  private currencyService: CurrencyService;
  private corporateCardService: CorporateCardService;
  private policyEngineService: PolicyEngineService;
  private workflowService: ExpenseWorkflowService;

  constructor(
    private expenseApprovalRepository: IExpenseApprovalRepository
  ) {
    // Initialize enterprise services
    this.ocrService = new OCRService();
    this.currencyService = new CurrencyService();
    this.corporateCardService = new CorporateCardService();
    this.policyEngineService = new PolicyEngineService();
    this.workflowService = new ExpenseWorkflowService();
    
    console.log('🚀 [ExpenseApprovalApplicationService] All enterprise services initialized');
  }

  async getExpenseReports(
    tenantId: string, 
    filters: ExpenseFilters = {}, 
    options: ExpenseListOptions = {},
    userId: string
  ): Promise<{ reports: ExpenseReport[], total: number, page: number, limit: number }> {
    console.log('📋 [ExpenseApprovalApplicationService] Getting expense reports with filters:', filters);
    
    try {
      const result = await this.expenseApprovalRepository.findExpenseReports(tenantId, filters, options);
      
      // Create audit entry for data access - using NULL for list operations
      await this.expenseApprovalRepository.createAuditEntry(tenantId, {
        entityType: 'expense_report',
        entityId: null, // NULL for list operations to avoid UUID constraint
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

  /**
   * =====================================
   * NEW ENTERPRISE FEATURES - OCR PROCESSING
   * =====================================
   */
  
  /**
   * Process document with OCR for expense extraction
   */
  async processExpenseDocument(
    tenantId: string,
    userId: string,
    fileBuffer: Buffer,
    fileName: string,
    mimeType: string
  ): Promise<OCRResult> {
    console.log('📄 [ExpenseApprovalApplicationService] Processing expense document with OCR:', fileName);
    
    try {
      const ocrResult = await this.ocrService.processDocument(fileBuffer, mimeType, fileName);
      
      // Check for duplicate documents
      const isDuplicate = await this.ocrService.checkDuplicateDocument(ocrResult.documentHash, tenantId);
      if (isDuplicate) {
        console.warn('⚠️ [ExpenseApprovalApplicationService] Duplicate document detected');
      }
      
      // Validate extracted data quality
      const validation = this.ocrService.validateExtractedData(ocrResult.extractedData);
      
      // Create audit entry
      await this.expenseApprovalRepository.createAuditEntry(tenantId, {
        entityType: 'document_ocr',
        entityId: null,
        action: 'process_document',
        userId,
        userName: 'User',
        metadata: {
          fileName,
          confidence: ocrResult.confidence,
          processingTime: ocrResult.processingTime,
          extractedAmount: ocrResult.extractedData.amount,
          isDuplicate,
          validationIssues: validation.issues
        }
      });
      
      console.log('✅ [ExpenseApprovalApplicationService] OCR processing completed with confidence:', ocrResult.confidence);
      return ocrResult;
      
    } catch (error) {
      console.error('❌ [ExpenseApprovalApplicationService] OCR processing failed:', error);
      throw new Error(`OCR processing failed: ${error.message}`);
    }
  }

  /**
   * =====================================
   * NEW ENTERPRISE FEATURES - MULTI-CURRENCY
   * =====================================
   */

  /**
   * Convert currency amounts with real-time rates
   */
  async convertCurrency(
    tenantId: string,
    userId: string,
    request: CurrencyConversionRequest
  ): Promise<CurrencyConversionResult> {
    console.log('💱 [ExpenseApprovalApplicationService] Converting currency:', request);
    
    try {
      const result = await this.currencyService.convertCurrency(request);
      
      // Create audit entry
      await this.expenseApprovalRepository.createAuditEntry(tenantId, {
        entityType: 'currency_conversion',
        entityId: null,
        action: 'convert_currency',
        userId,
        userName: 'User',
        metadata: {
          fromCurrency: request.fromCurrency,
          toCurrency: request.toCurrency,
          amount: request.amount,
          exchangeRate: result.exchangeRate.rate,
          source: result.exchangeRate.source
        }
      });
      
      console.log('✅ [ExpenseApprovalApplicationService] Currency conversion completed');
      return result;
      
    } catch (error) {
      console.error('❌ [ExpenseApprovalApplicationService] Currency conversion failed:', error);
      throw new Error(`Currency conversion failed: ${error.message}`);
    }
  }

  /**
   * Get supported currencies
   */
  async getSupportedCurrencies(): Promise<any> {
    return this.currencyService.getSupportedCurrencies();
  }

  /**
   * =====================================
   * NEW ENTERPRISE FEATURES - POLICY ENGINE
   * =====================================
   */

  /**
   * Evaluate expense report against all policies
   */
  async evaluateExpensePolicies(
    tenantId: string,
    userId: string,
    expenseReportId: string,
    contextData?: Record<string, any>
  ): Promise<PolicyEvaluationResult> {
    console.log('🔍 [ExpenseApprovalApplicationService] Evaluating expense policies for report:', expenseReportId);
    
    try {
      const expenseReport = await this.expenseApprovalRepository.findExpenseReportById(tenantId, expenseReportId);
      if (!expenseReport) {
        throw new Error('Expense report not found');
      }
      
      const evaluationResult = await this.policyEngineService.evaluateExpenseReport(expenseReport, tenantId, contextData);
      
      // Create audit entry
      await this.expenseApprovalRepository.createAuditEntry(tenantId, {
        entityType: 'policy_evaluation',
        entityId: expenseReportId,
        action: 'evaluate_policies',
        userId,
        userName: 'User',
        metadata: {
          isCompliant: evaluationResult.isCompliant,
          violationsCount: evaluationResult.violations.length,
          riskScore: evaluationResult.riskScore,
          complianceScore: evaluationResult.complianceScore,
          requiredActionsCount: evaluationResult.requiredActions.length
        }
      });
      
      console.log('✅ [ExpenseApprovalApplicationService] Policy evaluation completed:', {
        compliant: evaluationResult.isCompliant,
        riskScore: evaluationResult.riskScore
      });
      
      return evaluationResult;
      
    } catch (error) {
      console.error('❌ [ExpenseApprovalApplicationService] Policy evaluation failed:', error);
      throw new Error(`Policy evaluation failed: ${error.message}`);
    }
  }
}