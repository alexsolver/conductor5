import { Router } from 'express';
import { Pool } from 'pg';
import { ApprovalServiceFactory } from './infrastructure/services/ApprovalServiceFactory';

export function createApprovalRoutes(db: Pool): Router {
  const router = Router();
  const controller = ApprovalServiceFactory.createApprovalController(db);

  // Approval Rules routes
  router.get('/rules', (req, res) => controller.getApprovalRules(req, res));
  router.get('/rules/:id', (req, res) => controller.getApprovalRuleById(req, res));
  router.post('/rules', (req, res) => controller.createApprovalRule(req, res));
  router.put('/rules/:id', (req, res) => controller.updateApprovalRule(req, res));
  router.delete('/rules/:id', (req, res) => controller.deleteApprovalRule(req, res));

  // Approval Instances routes
  router.get('/instances', (req, res) => controller.getApprovalInstances(req, res));
  router.get('/instances/:id', (req, res) => controller.getApprovalInstanceById(req, res));
  router.post('/instances', (req, res) => controller.executeApprovalFlow(req, res));
  router.post('/instances/:id/decisions', (req, res) => controller.processApprovalDecision(req, res));

  // User-specific routes
  router.get('/pending', (req, res) => controller.getPendingApprovals(req, res));
  router.get('/my-decisions', (req, res) => controller.getUserDecisions(req, res));
  
  // Dashboard metrics
  router.get('/dashboard', (req, res) => controller.getApprovalDashboard(req, res));

  return router;
}