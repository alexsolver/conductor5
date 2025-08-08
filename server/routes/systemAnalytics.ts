import { Router } from 'express';
import { jwtAuth } from '../middleware/jwtAuth';
import { PerformanceDashboard } from '../database/PerformanceDashboard';
import { enterpriseIndexManager } from '../database/EnterpriseIndexManager';
import { QueryOptimizer } from '../database/QueryOptimizer';

const router = Router();

// Performance Dashboard - Relatório completo do sistema
router.get('/performance-report', jwtAuth, async (req, res) => {
  try {
    const report = await PerformanceDashboard.generateSystemReport();
    
    res.json({
      success: true,
      message: 'Performance report generated successfully',
      data: report,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('[PERFORMANCE-REPORT] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate performance report',
      error: error.message
    });
  }
});

// Análise de queries por tenant
router.get('/tenant-performance/:tenantId', jwtAuth, async (req, res) => {
  try {
    const { tenantId } = req.params;
    
    const analysis = await QueryOptimizer.analyzeSlowQueries(tenantId);
    const tableStats = await PerformanceDashboard.getTopTablesBySize();
    
    res.json({
      success: true,
      message: 'Tenant performance analysis completed',
      data: {
        ...analysis,
        tableStats: tableStats.filter((t: any) => 
          t.schemaname === `tenant_${tenantId.replace(/-/g, '_')}`
        )
      }
    });
  } catch (error) {
    console.error('[TENANT-PERFORMANCE] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to analyze tenant performance',
      error: error.message
    });
  }
});

// Verificação de saúde dos índices
router.get('/index-health/:tenantId', jwtAuth, async (req, res) => {
  try {
    const { tenantId } = req.params;
    
    await enterpriseIndexManager.checkIndexUsage(tenantId);
    await enterpriseIndexManager.analyzeAllTables(tenantId);
    
    res.json({
      success: true,
      message: 'Index health check completed',
      tenantId,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[INDEX-HEALTH] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check index health',
      error: error.message
    });
  }
});

// Otimização automática de estatísticas
router.post('/optimize-statistics/:tenantId', jwtAuth, async (req, res) => {
  try {
    const { tenantId } = req.params;
    
    await QueryOptimizer.optimizeTableStatistics(tenantId);
    
    res.json({
      success: true,
      message: 'Table statistics optimized successfully',
      tenantId,
      optimizedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('[OPTIMIZE-STATISTICS] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to optimize statistics',
      error: error.message
    });
  }
});

export default router;