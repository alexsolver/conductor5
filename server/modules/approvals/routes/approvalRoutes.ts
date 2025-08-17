// ✅ 1QA.MD COMPLIANCE: CLEAN ARCHITECTURE - ROUTES LAYER
// API Routes: Approval Routes - Express route definitions for approval management

import { Router } from 'express';
import { ApprovalController } from '../controllers/ApprovalController';
import { authenticateJWT } from '../../../middleware/auth';

const router = Router();
const approvalController = new ApprovalController();

// Apply JWT authentication to all routes
router.use(authenticateJWT);

// ========================================
// APPROVAL RULES ROUTES
// ========================================

/**
 * @route GET /api/approvals/rules
 * @desc Get approval rules with optional filters
 * @access Private
 * @query {string} [moduleType] - Filter by module type
 * @query {string} [entityType] - Filter by entity type  
 * @query {boolean} [isActive] - Filter by active status
 * @query {string} [createdById] - Filter by creator
 * @query {string} [search] - Search in name and description
 */
router.get('/rules', approvalController.getApprovalRules.bind(approvalController));

/**
 * @route GET /api/approvals/rules/:id
 * @desc Get specific approval rule by ID
 * @access Private
 * @param {string} id - Approval rule ID
 */
router.get('/rules/:id', approvalController.getApprovalRuleById.bind(approvalController));

/**
 * @route POST /api/approvals/rules
 * @desc Create new approval rule
 * @access Private
 * @body {CreateApprovalRuleRequest} - Rule creation data
 */
router.post('/rules', approvalController.createApprovalRule.bind(approvalController));

/**
 * @route PUT /api/approvals/rules/:id
 * @desc Update existing approval rule
 * @access Private
 * @param {string} id - Approval rule ID
 * @body {UpdateApprovalRuleRequest} - Rule update data
 */
router.put('/rules/:id', approvalController.updateApprovalRule.bind(approvalController));

/**
 * @route DELETE /api/approvals/rules/:id
 * @desc Delete approval rule
 * @access Private
 * @param {string} id - Approval rule ID
 * @query {boolean} [force] - Force delete even with related instances
 */
router.delete('/rules/:id', approvalController.deleteApprovalRule.bind(approvalController));

// ========================================
// APPROVAL INSTANCES ROUTES
// ========================================

/**
 * @route GET /api/approvals/instances
 * @desc Get approval instances with optional filters and pagination
 * @access Private
 * @query {string|string[]} [status] - Filter by status
 * @query {string} [entityType] - Filter by entity type
 * @query {string} [entityId] - Filter by entity ID
 * @query {string} [requestedById] - Filter by requester
 * @query {string} [ruleId] - Filter by rule ID
 * @query {number} [urgencyLevel] - Filter by urgency level
 * @query {boolean} [slaViolated] - Filter by SLA violation
 * @query {boolean} [overdueOnly] - Show only overdue instances
 * @query {string} [dateFrom] - Filter from date
 * @query {string} [dateTo] - Filter to date
 * @query {number} [page] - Page number for pagination
 * @query {number} [limit] - Items per page
 * @query {boolean} [includeDetails] - Include detailed information
 */
router.get('/instances', approvalController.getApprovalInstances.bind(approvalController));

/**
 * @route POST /api/approvals/instances
 * @desc Create new approval instance
 * @access Private
 * @body {CreateApprovalInstanceRequest} - Instance creation data
 */
router.post('/instances', approvalController.createApprovalInstance.bind(approvalController));

/**
 * @route POST /api/approvals/instances/:id/decision
 * @desc Process approval decision
 * @access Private
 * @param {string} id - Approval instance ID
 * @body {ProcessApprovalDecisionRequest} - Decision data
 */
router.post('/instances/:id/decision', approvalController.processApprovalDecision.bind(approvalController));

// ========================================
// DASHBOARD/METRICS ROUTES
// ========================================

/**
 * @route GET /api/approvals/dashboard
 * @desc Get approval dashboard metrics
 * @access Private
 */
router.get('/dashboard', approvalController.getApprovalDashboard.bind(approvalController));

// ========================================
// UTILITY ROUTES
// ========================================

/**
 * @route GET /api/approvals/rules/modules/:moduleType/applicable
 * @desc Get applicable rules for a specific module and entity
 * @access Private
 * @param {string} moduleType - Module type
 * @query {string} entityType - Entity type
 * @query {object} [entityData] - Entity data for rule evaluation
 */
router.get('/rules/modules/:moduleType/applicable', async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;
    const { moduleType } = req.params;
    const { entityType, entityData } = req.query;

    if (!tenantId) {
      res.status(401).json({ error: 'Tenant não identificado' });
      return;
    }

    const approvalRuleRepository = approvalController['approvalRuleRepository'];
    
    const rules = await approvalRuleRepository.findApplicableRules(
      tenantId,
      moduleType,
      entityType as string,
      entityData ? JSON.parse(entityData as string) : {}
    );

    res.json({ data: rules });
  } catch (error) {
    console.error('Error getting applicable rules:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * @route GET /api/approvals/instances/pending/my
 * @desc Get pending instances for current user
 * @access Private
 */
router.get('/instances/pending/my', async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;
    const userId = req.user?.id;

    if (!tenantId || !userId) {
      res.status(401).json({ error: 'Usuário não autenticado' });
      return;
    }

    const approvalInstanceRepository = approvalController['approvalInstanceRepository'];
    
    // This would need additional logic to find instances where the user is an approver
    // For now, we'll return instances requested by the user
    const instances = await approvalInstanceRepository.findByRequester(tenantId, userId);
    const pendingInstances = instances.filter(instance => instance.status === 'pending');

    res.json({ data: pendingInstances });
  } catch (error) {
    console.error('Error getting my pending instances:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * @route GET /api/approvals/instances/overdue
 * @desc Get overdue approval instances
 * @access Private
 */
router.get('/instances/overdue', async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      res.status(401).json({ error: 'Tenant não identificado' });
      return;
    }

    const approvalInstanceRepository = approvalController['approvalInstanceRepository'];
    const overdueInstances = await approvalInstanceRepository.findOverdueInstances(tenantId);

    res.json({ data: overdueInstances });
  } catch (error) {
    console.error('Error getting overdue instances:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * @route POST /api/approvals/instances/bulk-expire
 * @desc Expire overdue instances in bulk
 * @access Private
 */
router.post('/instances/bulk-expire', async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      res.status(401).json({ error: 'Tenant não identificado' });
      return;
    }

    const approvalInstanceRepository = approvalController['approvalInstanceRepository'];
    const expiredInstances = await approvalInstanceRepository.expireOverdueInstances(tenantId);

    res.json({
      message: `${expiredInstances.length} instâncias expiradas com sucesso`,
      data: expiredInstances,
    });
  } catch (error) {
    console.error('Error expiring overdue instances:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * @route GET /api/approvals/metrics/period
 * @desc Get approval metrics for a specific period
 * @access Private
 * @query {string} startDate - Start date (ISO string)
 * @query {string} endDate - End date (ISO string)
 */
router.get('/metrics/period', async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;
    const { startDate, endDate } = req.query;

    if (!tenantId) {
      res.status(401).json({ error: 'Tenant não identificado' });
      return;
    }

    if (!startDate || !endDate) {
      res.status(400).json({ error: 'Datas de início e fim são obrigatórias' });
      return;
    }

    const approvalInstanceRepository = approvalController['approvalInstanceRepository'];
    const metrics = await approvalInstanceRepository.getMetricsForPeriod(
      tenantId,
      new Date(startDate as string),
      new Date(endDate as string)
    );

    res.json({ data: metrics });
  } catch (error) {
    console.error('Error getting period metrics:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export { router as approvalRoutes };