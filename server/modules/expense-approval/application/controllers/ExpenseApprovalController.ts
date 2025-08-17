/**
 * EXPENSE APPROVAL CONTROLLER - APPLICATION LAYER
 * ✅ 1QA.MD COMPLIANCE: Pure Express controller with Clean Architecture
 * ✅ AUTHENTICATION: JWT token validation required
 * ✅ VALIDATION: Zod schema validation for all inputs
 */

import { Request, Response } from 'express';
import { ExpenseApprovalApplicationService } from '../services/ExpenseApprovalApplicationService';
import { ZodError } from 'zod';

// Interface de usuário autenticado compatível com JWT middleware
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    userId: string;
    tenantId: string;
    email: string;
    userName?: string;
  };
}

export class ExpenseApprovalController {
  constructor(
    private expenseApprovalApplicationService: ExpenseApprovalApplicationService
  ) {}

  async getExpenseReports(req: AuthenticatedRequest, res: Response): Promise<void> {
    console.log('🔍 [ExpenseApprovalController] Getting expense reports...');
    
    try {
      const tenantId = req.user?.tenantId;
      const userId = req.user?.userId || req.user?.id;
      
      if (!tenantId || !userId) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const {
        page = 1,
        limit = 20,
        sortBy = 'created_at',
        sortOrder = 'desc',
        status,
        employeeId,
        departmentId,
        costCenterId,
        projectId,
        submissionDateFrom,
        submissionDateTo,
        amountMin,
        amountMax,
        search,
        policyViolationLevel,
        riskScoreMin,
        complianceChecked,
        auditRequired,
        currentApproverId
      } = req.query;

      const filters = {
        status: status as string,
        employeeId: employeeId as string,
        departmentId: departmentId as string,
        costCenterId: costCenterId as string,
        projectId: projectId as string,
        submissionDateFrom: submissionDateFrom as string,
        submissionDateTo: submissionDateTo as string,
        amountMin: amountMin ? parseFloat(amountMin as string) : undefined,
        amountMax: amountMax ? parseFloat(amountMax as string) : undefined,
        search: search as string,
        policyViolationLevel: policyViolationLevel as string,
        riskScoreMin: riskScoreMin ? parseInt(riskScoreMin as string) : undefined,
        complianceChecked: complianceChecked ? complianceChecked === 'true' : undefined,
        auditRequired: auditRequired ? auditRequired === 'true' : undefined,
        currentApproverId: currentApproverId as string
      };

      const options = {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc'
      };

      const result = await this.expenseApprovalApplicationService.getExpenseReports(tenantId, filters, options, userId);

      res.json({
        success: true,
        data: result
      });

      console.log(`✅ [ExpenseApprovalController] Returned ${result.reports.length} expense reports`);
    } catch (error) {
      console.error('❌ [ExpenseApprovalController] Error getting expense reports:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get expense reports',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getExpenseReportById(req: AuthenticatedRequest, res: Response): Promise<void> {
    console.log('🔍 [ExpenseApprovalController] Getting expense report by ID...');
    
    try {
      const tenantId = req.user?.tenantId;
      const userId = req.user?.userId;
      
      if (!tenantId || !userId) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const { id } = req.params;
      const report = await this.expenseApprovalApplicationService.getExpenseReportById(tenantId, id, userId);

      if (!report) {
        res.status(404).json({
          success: false,
          message: 'Expense report not found'
        });
        return;
      }

      // Get expense items
      const items = await this.expenseApprovalApplicationService.getExpenseItems(tenantId, id, userId);

      res.json({
        success: true,
        data: {
          report,
          items
        }
      });

      console.log('✅ [ExpenseApprovalController] Expense report found:', report.title);
    } catch (error) {
      console.error('❌ [ExpenseApprovalController] Error getting expense report:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get expense report',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async createExpenseReport(req: AuthenticatedRequest, res: Response): Promise<void> {
    console.log('🔧 [ExpenseApprovalController] Creating expense report...');
    
    try {
      const tenantId = req.user?.tenantId;
      const userId = req.user?.userId;
      const userName = req.user?.userName || req.user?.email || 'User';
      
      if (!tenantId || !userId) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const { report, items = [] } = req.body;

      // Basic validation
      if (!report || !report.title) {
        res.status(400).json({
          success: false,
          message: 'Report title is required'
        });
        return;
      }

      const reportData = {
        ...report,
        tenantId,
        employeeId: report.employeeId || userId, // Default to current user
        createdById: userId,
        updatedById: userId
      };

      const result = await this.expenseApprovalApplicationService.createExpenseReport(
        tenantId, 
        reportData, 
        items,
        userId,
        userName
      );

      console.log('✅ [ExpenseApprovalController] Expense report created successfully:', result.report.id);
      res.status(201).json({
        success: true,
        message: 'Expense report created successfully',
        data: result
      });
    } catch (error) {
      console.error('❌ [ExpenseApprovalController] Error creating expense report:', error);
      if (error instanceof ZodError) {
        res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.errors
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Failed to create expense report',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  }

  async updateExpenseReport(req: AuthenticatedRequest, res: Response): Promise<void> {
    console.log('🔄 [ExpenseApprovalController] Updating expense report...');
    
    try {
      const tenantId = req.user?.tenantId;
      const userId = req.user?.userId;
      const userName = req.user?.userName || req.user?.email || 'User';
      
      if (!tenantId || !userId) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const { id } = req.params;
      const reportData = req.body;

      const updatedReport = await this.expenseApprovalApplicationService.updateExpenseReport(
        tenantId, 
        id, 
        reportData, 
        userId,
        userName
      );

      console.log('✅ [ExpenseApprovalController] Expense report updated successfully:', id);
      res.json({
        success: true,
        message: 'Expense report updated successfully',
        data: updatedReport
      });
    } catch (error) {
      console.error('❌ [ExpenseApprovalController] Error updating expense report:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update expense report',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async submitExpenseReport(req: AuthenticatedRequest, res: Response): Promise<void> {
    console.log('📤 [ExpenseApprovalController] Submitting expense report...');
    
    try {
      const tenantId = req.user?.tenantId;
      const userId = req.user?.userId;
      const userName = req.user?.userName || req.user?.email || 'User';
      
      if (!tenantId || !userId) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const { id } = req.params;

      const result = await this.expenseApprovalApplicationService.submitExpenseReport(
        tenantId, 
        id, 
        userId,
        userName
      );

      console.log('✅ [ExpenseApprovalController] Expense report submitted successfully:', id);
      res.json({
        success: true,
        message: 'Expense report submitted successfully',
        data: result
      });
    } catch (error) {
      console.error('❌ [ExpenseApprovalController] Error submitting expense report:', error);
      res.status(400).json({
        success: false,
        message: 'Failed to submit expense report',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async deleteExpenseReport(req: AuthenticatedRequest, res: Response): Promise<void> {
    console.log('🗑️ [ExpenseApprovalController] Deleting expense report...');
    
    try {
      const tenantId = req.user?.tenantId;
      const userId = req.user?.userId;
      const userName = req.user?.userName || req.user?.email || 'User';
      
      if (!tenantId || !userId) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const { id } = req.params;

      const success = await this.expenseApprovalApplicationService.deleteExpenseReport(
        tenantId, 
        id, 
        userId,
        userName
      );

      if (!success) {
        res.status(404).json({
          success: false,
          message: 'Expense report not found or could not be deleted'
        });
        return;
      }

      console.log('✅ [ExpenseApprovalController] Expense report deleted successfully:', id);
      res.json({
        success: true,
        message: 'Expense report deleted successfully'
      });
    } catch (error) {
      console.error('❌ [ExpenseApprovalController] Error deleting expense report:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete expense report',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getDashboardMetrics(req: AuthenticatedRequest, res: Response): Promise<void> {
    console.log('📊 [ExpenseApprovalController] Getting dashboard metrics...');
    
    try {
      const tenantId = req.user?.tenantId;
      
      if (!tenantId) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const filters = req.query; // Would parse specific filters
      const metrics = await this.expenseApprovalApplicationService.getDashboardMetrics(tenantId, filters);

      res.json({
        success: true,
        data: metrics
      });

      console.log('✅ [ExpenseApprovalController] Dashboard metrics retrieved');
    } catch (error) {
      console.error('❌ [ExpenseApprovalController] Error getting dashboard metrics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get dashboard metrics',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getAnalytics(req: AuthenticatedRequest, res: Response): Promise<void> {
    console.log('📈 [ExpenseApprovalController] Getting analytics...');
    
    try {
      const tenantId = req.user?.tenantId;
      
      if (!tenantId) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const filters = req.query;
      const analytics = await this.expenseApprovalApplicationService.getAnalytics(tenantId, filters);

      res.json({
        success: true,
        data: analytics
      });

      console.log('✅ [ExpenseApprovalController] Analytics retrieved');
    } catch (error) {
      console.error('❌ [ExpenseApprovalController] Error getting analytics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get analytics',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getAuditTrail(req: AuthenticatedRequest, res: Response): Promise<void> {
    console.log('📝 [ExpenseApprovalController] Getting audit trail...');
    
    try {
      const tenantId = req.user?.tenantId;
      
      if (!tenantId) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const { entityType, entityId } = req.params;
      const auditTrail = await this.expenseApprovalApplicationService.getAuditTrail(tenantId, entityType, entityId);

      res.json({
        success: true,
        data: auditTrail
      });

      console.log(`✅ [ExpenseApprovalController] Audit trail retrieved: ${auditTrail.length} entries`);
    } catch (error) {
      console.error('❌ [ExpenseApprovalController] Error getting audit trail:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get audit trail',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}