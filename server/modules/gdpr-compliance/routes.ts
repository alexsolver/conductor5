/**
 * GDPR Compliance Routes - Presentation Layer
 * Clean Architecture - HTTP endpoint definitions
 * Following 1qa.md enterprise patterns
 */

import { Router } from 'express';
import { GdprComplianceController } from './application/controllers/GdprComplianceController';
import { CreateGdprReportUseCase } from './application/use-cases/CreateGdprReportUseCase';
import { GetGdprReportsUseCase } from './application/use-cases/GetGdprReportsUseCase';
import { UpdateGdprReportUseCase } from './application/use-cases/UpdateGdprReportUseCase';
import { GetGdprComplianceMetricsUseCase } from './application/use-cases/GetGdprComplianceMetricsUseCase';
import { DrizzleGdprReportRepository } from './infrastructure/repositories/DrizzleGdprReportRepository';
import { jwtAuth, AuthenticatedRequest } from '../../middleware/jwtAuth';
import { requirePermission } from '../../middleware/rbacMiddleware';

const router = Router();

// ✅ Dependency Injection - Clean Architecture Pattern
const gdprReportRepository = new DrizzleGdprReportRepository();

// Use Cases
const createGdprReportUseCase = new CreateGdprReportUseCase(gdprReportRepository);
const getGdprReportsUseCase = new GetGdprReportsUseCase(gdprReportRepository);
const updateGdprReportUseCase = new UpdateGdprReportUseCase(gdprReportRepository);
const getGdprComplianceMetricsUseCase = new GetGdprComplianceMetricsUseCase(gdprReportRepository);

// Controller
const gdprComplianceController = new GdprComplianceController(
  createGdprReportUseCase,
  getGdprReportsUseCase,
  updateGdprReportUseCase,
  getGdprComplianceMetricsUseCase
);

// ✅ GDPR Reports CRUD Routes
router.post(
  '/reports',
  jwtAuth,
  requirePermission('gdpr', 'create'),
  (req: AuthenticatedRequest, res) => gdprComplianceController.createReport(req, res)
);

router.get(
  '/reports',
  jwtAuth,
  requirePermission('gdpr', 'read'),
  (req: AuthenticatedRequest, res) => gdprComplianceController.getReports(req, res)
);

router.get(
  '/reports/:id',
  jwtAuth,
  requirePermission('gdpr', 'read'),
  (req: AuthenticatedRequest, res) => gdprComplianceController.getReportById(req, res)
);

router.put(
  '/reports/:id',
  jwtAuth,
  requirePermission('gdpr', 'update'),
  (req: AuthenticatedRequest, res) => gdprComplianceController.updateReport(req, res)
);

router.delete(
  '/reports/:id',
  jwtAuth,
  requirePermission('gdpr', 'delete'),
  (req: AuthenticatedRequest, res) => gdprComplianceController.deleteReport(req, res)
);

// ✅ GDPR Analytics & Metrics Routes
router.get(
  '/metrics',
  jwtAuth,
  requirePermission('gdpr', 'read'),
  (req: AuthenticatedRequest, res) => gdprComplianceController.getMetrics(req, res)
);

// ✅ GDPR Report Workflow Routes
router.post(
  '/reports/:id/submit',
  jwtAuth,
  requirePermission('gdpr', 'update'),
  async (req: AuthenticatedRequest, res) => {
    req.body = { status: 'in_progress' };
    gdprComplianceController.updateReport(req, res);
  }
);

router.post(
  '/reports/:id/approve',
  jwtAuth,
  requirePermission('gdpr', 'approve'),
  async (req: AuthenticatedRequest, res) => {
    req.body = { status: 'approved' };
    gdprComplianceController.updateReport(req, res);
  }
);

router.post(
  '/reports/:id/publish',
  jwtAuth,
  requirePermission('gdpr', 'publish'),
  async (req: AuthenticatedRequest, res) => {
    req.body = { status: 'published' };
    gdprComplianceController.updateReport(req, res);
  }
);

export { router as gdprComplianceRoutes };