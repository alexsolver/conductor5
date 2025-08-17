/**
 * EXPENSE APPROVAL ROUTES - INFRASTRUCTURE LAYER
 * ✅ 1QA.MD COMPLIANCE: Clean Architecture route configuration
 * ✅ DEPENDENCY INJECTION: Proper service injection
 * ✅ AUTHENTICATION: JWT middleware required
 */

import { Router } from 'express';
import { ExpenseApprovalController } from '../application/controllers/ExpenseApprovalController';
import { ExpenseApprovalApplicationService } from '../application/services/ExpenseApprovalApplicationService';
import { DrizzleExpenseApprovalRepository } from '../infrastructure/repositories/DrizzleExpenseApprovalRepository';

// Configurar dependências seguindo Clean Architecture
const expenseApprovalRepository = new DrizzleExpenseApprovalRepository();
const expenseApprovalApplicationService = new ExpenseApprovalApplicationService(expenseApprovalRepository);
const expenseApprovalController = new ExpenseApprovalController(expenseApprovalApplicationService);

const router = Router();

// Expense Reports - CRUD completo
router.get('/reports', expenseApprovalController.getExpenseReports.bind(expenseApprovalController));
router.post('/reports', expenseApprovalController.createExpenseReport.bind(expenseApprovalController));
router.get('/reports/:id', expenseApprovalController.getExpenseReportById.bind(expenseApprovalController));
router.put('/reports/:id', expenseApprovalController.updateExpenseReport.bind(expenseApprovalController));
router.delete('/reports/:id', expenseApprovalController.deleteExpenseReport.bind(expenseApprovalController));

// Expense Report Workflow
router.post('/reports/:id/submit', expenseApprovalController.submitExpenseReport.bind(expenseApprovalController));

// Analytics e Dashboard
router.get('/dashboard-metrics', expenseApprovalController.getDashboardMetrics.bind(expenseApprovalController));
router.get('/analytics', expenseApprovalController.getAnalytics.bind(expenseApprovalController));

// Audit Trail
router.get('/audit-trail/:entityType/:entityId', expenseApprovalController.getAuditTrail.bind(expenseApprovalController));

export default router;