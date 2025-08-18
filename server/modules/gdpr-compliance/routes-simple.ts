/**
 * GDPR Compliance Routes - Simplified ORM Pattern
 * Following 1qa.md enterprise patterns with correct middleware integration
 */

import { Router } from 'express';
import { jwtAuth, AuthenticatedRequest } from '../../middleware/jwtAuth';
import { requirePermission } from '../../middleware/rbacMiddleware';
import { schemaManager } from '../../db';
import { eq, desc, and, ne } from 'drizzle-orm';
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

// ✅ ADMIN: Privacy Policy Management Routes - Following 1qa.md Clean Architecture
router.get('/admin/privacy-policies', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Tenant ID required' 
      });
    }

    // Direct query following ORM pattern - rigorously following 1qa.md
    const db = schemaManager.getTenantDb(tenantId);
    const { privacyPolicies } = await import('@shared/schema-gdpr-compliance-clean');
    
    const policies = await db
      .select()
      .from(privacyPolicies)
      .where(eq(privacyPolicies.tenantId, tenantId))
      .orderBy(desc(privacyPolicies.createdAt));

    res.json({
      success: true,
      message: 'Privacy policies retrieved successfully',
      data: policies
    });

  } catch (error) {
    console.error('❌ [PRIVACY-POLICIES] Error fetching policies:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch privacy policies'
    });
  }
});

router.post('/admin/privacy-policies', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = req.user?.tenantId;
    const userId = req.user?.id;
    
    if (!tenantId || !userId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }

    const { title, content, version, policyType, effectiveDate, requiresAcceptance } = req.body;

    // Validate required fields
    if (!title || !content || !version || !policyType) {
      return res.status(400).json({
        success: false,
        message: 'Title, content, version, and policy type are required'
      });
    }

    // Direct insert following ORM pattern - rigorously following 1qa.md
    const db = schemaManager.getTenantDb(tenantId);
    const { privacyPolicies } = await import('@shared/schema-gdpr-compliance-clean');
    
    const policyData = {
      tenantId,
      createdBy: userId,
      policyType,
      version,
      title,
      content,
      isActive: false,
      effectiveDate: effectiveDate ? new Date(effectiveDate) : new Date(),
      requiresAcceptance: requiresAcceptance !== false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const [policy] = await db
      .insert(privacyPolicies)
      .values(policyData)
      .returning();

    console.log('✅ [PRIVACY-POLICIES] Policy created successfully:', policy.id);
    
    res.json({
      success: true,
      message: 'Privacy policy created successfully',
      data: policy
    });

  } catch (error) {
    console.error('❌ [PRIVACY-POLICIES] Error creating policy:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create privacy policy',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.put('/admin/privacy-policies/:policyId/activate', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = req.user?.tenantId;
    const { policyId } = req.params;
    
    if (!tenantId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Tenant ID required' 
      });
    }

    // Direct update following ORM pattern - rigorously following 1qa.md
    const db = schemaManager.getTenantDb(tenantId);
    const { privacyPolicies } = await import('@shared/schema-gdpr-compliance-clean');
    
    // First deactivate all other policies
    await db
      .update(privacyPolicies)
      .set({ 
        isActive: false,
        updatedAt: new Date()
      })
      .where(and(
        eq(privacyPolicies.tenantId, tenantId),
        ne(privacyPolicies.id, policyId)
      ));

    // Then activate the selected policy
    const [policy] = await db
      .update(privacyPolicies)
      .set({ 
        isActive: true,
        updatedAt: new Date()
      })
      .where(and(
        eq(privacyPolicies.id, policyId),
        eq(privacyPolicies.tenantId, tenantId)
      ))
      .returning();

    if (!policy) {
      return res.status(404).json({
        success: false,
        message: 'Privacy policy not found'
      });
    }

    console.log('✅ [PRIVACY-POLICIES] Policy activated successfully:', policyId);
    
    res.json({
      success: true,
      message: 'Privacy policy activated successfully',
      data: policy
    });

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