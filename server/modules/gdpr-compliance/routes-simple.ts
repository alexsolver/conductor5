/**
 * GDPR Compliance Routes - Simplified ORM Pattern
 * Following 1qa.md enterprise patterns with correct middleware integration
 */

import { Router } from 'express';
import { jwtAuth, AuthenticatedRequest } from '../../middleware/jwtAuth';
import { requirePermission } from '../../middleware/rbacMiddleware';
import { schemaManager } from '../../db';
import { eq, desc, and } from 'drizzle-orm';
import { gdprReports, gdprComplianceTasks, gdprAuditLog } from '@shared/schema';

const router = Router();

// ✅ GET /reports - List all GDPR reports with proper ORM usage
router.get('/reports', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Tenant ID required' 
      });
    }

    // Use tenant-specific database connection
    const db = schemaManager.getTenantDb(tenantId);
    
    const reports = await db
      .select()
      .from(gdprReports)
      .where(eq(gdprReports.tenantId, tenantId))
      .orderBy(desc(gdprReports.createdAt))
      .limit(50);

    res.json({
      success: true,
      data: reports,
      count: reports.length
    });

  } catch (error) {
    console.error('❌ [GDPR-REPORTS] Error fetching reports:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch GDPR reports'
    });
  }
});

// ✅ GET /metrics - GDPR compliance metrics with proper ORM usage
router.get('/metrics', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Tenant ID required' 
      });
    }

    const db = schemaManager.getTenantDb(tenantId);
    
    // Fetch reports by status
    const reports = await db
      .select()
      .from(gdprReports)
      .where(eq(gdprReports.tenantId, tenantId));

    // Calculate metrics
    const totalReports = reports.length;
    const statusCounts = reports.reduce((acc, report) => {
      acc[report.status] = (acc[report.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const riskLevelCounts = reports.reduce((acc, report) => {
      acc[report.riskLevel || 'unknown'] = (acc[report.riskLevel || 'unknown'] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const averageComplianceScore = reports.length > 0 
      ? Math.round(reports.reduce((sum, report) => sum + (report.complianceScore || 0), 0) / reports.length)
      : 0;

    res.json({
      success: true,
      data: {
        totalReports,
        statusCounts,
        riskLevelCounts,
        averageComplianceScore,
        reportTypes: reports.reduce((acc, report) => {
          acc[report.reportType] = (acc[report.reportType] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      }
    });

  } catch (error) {
    console.error('❌ [GDPR-METRICS] Error fetching metrics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch GDPR metrics'
    });
  }
});

// ✅ POST /reports - Create new GDPR report
router.post('/reports', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = req.user?.tenantId;
    const userId = req.user?.id;
    
    if (!tenantId || !userId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }

    const db = schemaManager.getTenantDb(tenantId);
    
    const reportData = {
      ...req.body,
      tenantId,
      createdBy: userId,
      updatedBy: userId,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const [newReport] = await db
      .insert(gdprReports)
      .values(reportData)
      .returning();

    res.status(201).json({
      success: true,
      data: newReport,
      message: 'GDPR report created successfully'
    });

  } catch (error) {
    console.error('❌ [GDPR-CREATE] Error creating report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create GDPR report'
    });
  }
});

// ✅ PUT /reports/:id - Update GDPR report
router.put('/reports/:id', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.user?.tenantId;
    const userId = req.user?.id;
    
    if (!tenantId || !userId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }

    const db = schemaManager.getTenantDb(tenantId);
    
    const updateData = {
      ...req.body,
      updatedBy: userId,
      updatedAt: new Date()
    };

    const [updatedReport] = await db
      .update(gdprReports)
      .set(updateData)
      .where(and(
        eq(gdprReports.id, id),
        eq(gdprReports.tenantId, tenantId)
      ))
      .returning();

    if (!updatedReport) {
      return res.status(404).json({
        success: false,
        message: 'GDPR report not found'
      });
    }

    res.json({
      success: true,
      data: updatedReport,
      message: 'GDPR report updated successfully'
    });

  } catch (error) {
    console.error('❌ [GDPR-UPDATE] Error updating report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update GDPR report'
    });
  }
});

// ✅ ADMIN: Privacy Policy Management Routes
router.get('/admin/privacy-policies', async (req: AuthenticatedRequest, res) => {
  try {
    const { gdprController } = await import('./application/controllers/GdprController');
    await gdprController.getPrivacyPolicies(req, res);
  } catch (error) {
    console.error('❌ [PRIVACY-POLICIES] Error fetching policies:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch privacy policies'
    });
  }
});

router.post('/admin/privacy-policies', async (req: AuthenticatedRequest, res) => {
  try {
    const { gdprController } = await import('./application/controllers/GdprController');
    await gdprController.createPrivacyPolicy(req, res);
  } catch (error) {
    console.error('❌ [PRIVACY-POLICIES] Error creating policy:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create privacy policy'
    });
  }
});

router.put('/admin/privacy-policies/:policyId/activate', async (req: AuthenticatedRequest, res) => {
  try {
    const { gdprController } = await import('./application/controllers/GdprController');
    await gdprController.activatePrivacyPolicy(req, res);
  } catch (error) {
    console.error('❌ [PRIVACY-POLICIES] Error activating policy:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to activate privacy policy'
    });
  }
});

console.log('✅ [GDPR-COMPLIANCE-SIMPLE] Routes initialized following 1qa.md ORM patterns');

export { router as gdprComplianceRoutes };