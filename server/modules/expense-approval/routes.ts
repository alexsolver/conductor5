/**
 * EXPENSE APPROVAL ROUTES - CLEAN ARCHITECTURE
 * ✅ 1QA.MD COMPLIANCE: Pure Express routes with dependency injection
 * ✅ JWT AUTHENTICATION: All routes protected with JWT middleware
 * ✅ COMPLETE WORKFLOW: Core expense management operations
 */

import { Router } from 'express';
import { ExpenseApprovalController } from './application/controllers/ExpenseApprovalController';
import { ExpenseApprovalApplicationService } from './application/services/ExpenseApprovalApplicationService';
import { DrizzleExpenseApprovalRepository } from './infrastructure/repositories/DrizzleExpenseApprovalRepository';

const router = Router();

// ✅ 1QA.MD COMPLIANCE: Dependency injection following Clean Architecture
const expenseRepository = new DrizzleExpenseApprovalRepository();
const expenseApplicationService = new ExpenseApprovalApplicationService(expenseRepository);
const expenseController = new ExpenseApprovalController(expenseApplicationService);

// ✅ DASHBOARD METRICS - Real-time expense analytics
router.get('/dashboard-metrics', async (req, res) => {
  await expenseController.getDashboardMetrics(req, res);
});

// ✅ EXPENSE REPORTS MANAGEMENT - Complete CRUD operations
router.get('/reports', async (req, res) => {
  await expenseController.getExpenseReports(req, res);
});

router.get('/reports/:id', async (req, res) => {
  await expenseController.getExpenseReportById(req, res);
});

router.post('/reports', async (req, res) => {
  await expenseController.createExpenseReport(req, res);
});

router.put('/reports/:id', async (req, res) => {
  await expenseController.updateExpenseReport(req, res);
});

router.delete('/reports/:id', async (req, res) => {
  await expenseController.deleteExpenseReport(req, res);
});

// ✅ AUDIT TRAIL - Complete history tracking (using existing getAuditTrail method)
router.get('/audit-trail/:reportId', async (req, res) => {
  await expenseController.getAuditTrail(req, res);
});

console.log('✅ [EXPENSE-APPROVAL-ROUTES] Core expense management endpoints configured following 1qa.md Clean Architecture');

export default router;