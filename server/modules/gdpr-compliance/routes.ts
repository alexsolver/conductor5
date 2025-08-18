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
import { authenticateToken, authorizePermissions } from '../../middleware/auth';

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
  authenticateToken,
  authorizePermissions(['gdpr:create']),
  (req, res) => gdprComplianceController.createReport(req, res)
);

router.get(
  '/reports',
  authenticateToken,
  authorizePermissions(['gdpr:read']),
  (req, res) => gdprComplianceController.getReports(req, res)
);

router.get(
  '/reports/:id',
  authenticateToken,
  authorizePermissions(['gdpr:read']),
  (req, res) => gdprComplianceController.getReportById(req, res)
);

router.put(
  '/reports/:id',
  authenticateToken,
  authorizePermissions(['gdpr:update']),
  (req, res) => gdprComplianceController.updateReport(req, res)
);

router.delete(
  '/reports/:id',
  authenticateToken,
  authorizePermissions(['gdpr:delete']),
  (req, res) => gdprComplianceController.deleteReport(req, res)
);

// ✅ GDPR Analytics & Metrics Routes
router.get(
  '/metrics',
  authenticateToken,
  authorizePermissions(['gdpr:read']),
  (req, res) => gdprComplianceController.getMetrics(req, res)
);

// ✅ GDPR Report Workflow Routes
router.post(
  '/reports/:id/submit',
  authenticateToken,
  authorizePermissions(['gdpr:update']),
  async (req, res) => {
    req.body = { status: 'in_progress' };
    gdprComplianceController.updateReport(req, res);
  }
);

router.post(
  '/reports/:id/approve',
  authenticateToken,
  authorizePermissions(['gdpr:approve']),
  async (req, res) => {
    req.body = { status: 'approved' };
    gdprComplianceController.updateReport(req, res);
  }
);

router.post(
  '/reports/:id/publish',
  authenticateToken,
  authorizePermissions(['gdpr:publish']),
  async (req, res) => {
    req.body = { status: 'published' };
    gdprComplianceController.updateReport(req, res);
  }
);

export { router as gdprComplianceRoutes };