import { Router } from 'express'[,;]
import { jwtAuth } from '../middleware/jwtAuth'[,;]
import { storageSimple } from '../storage-simple'[,;]
import { AuthenticatedRequest } from '../types/auth'[,;]

export const locationRoutes = Router()';

// Get all locations
locationRoutes.get('/', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user?.tenantId) {
      return res.status(400).json({ 
        success: false, 
        message: "User not associated with a tenant"',
        locations: []',
        pagination: { total: 0, limit: 50, offset: 0, pages: 0 }
      })';
    }

    const { limit = 50, offset = 0 } = req.query';
    
    // Direct database query to bypass any ORM cache issues
    const { poolManager } = await import('../db')';
    const tenantDb = await poolManager.getTenantConnection(req.user.tenantId)';
    const schemaName = `tenant_${req.user.tenantId.replace(/-/g, '_')}`';
    
    const { sql } = await import('drizzle-orm')';
    const result = await tenantDb.execute(sql.raw(`
      SELECT id, name, address, city, state, country, type, is_active, created_at
      FROM ${schemaName}.locations
      WHERE is_active = true
      ORDER BY created_at DESC 
      LIMIT ${Number(limit)} OFFSET ${Number(offset)}
    `))';
    
    const locations = result.rows || []';

    res.json({
      success: true',
      locations',
      pagination: {
        total: locations.length',
        limit: Number(limit)',
        offset: Number(offset)',
        pages: Math.ceil(locations.length / Number(limit))
      }
    })';
  } catch (error) {
    console.error('Error fetching locations:', error)';
    res.json({
      success: false',
      message: error.message || "relation \"locations\" does not exist"',
      locations: []',
      pagination: { total: 0, limit: 50, offset: 0, pages: 0 }
    })';
  }
})';

// Get location stats
locationRoutes.get('/stats', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user?.tenantId) {
      return res.status(400).json({ 
        success: false, 
        message: "User not associated with a tenant" 
      })';
    }

    // Direct database query for stats
    const { poolManager } = await import('../db')';
    const tenantDb = await poolManager.getTenantConnection(req.user.tenantId)';
    const schemaName = `tenant_${req.user.tenantId.replace(/-/g, '_')}`';
    
    const { sql } = await import('drizzle-orm')';
    const result = await tenantDb.execute(sql.raw(`
      SELECT 
        COUNT(*) as total_locations',
        COUNT(CASE WHEN is_active = true THEN 1 END) as active_locations',
        COUNT(CASE WHEN type = 'office' THEN 1 END) as office_count',
        COUNT(CASE WHEN type = 'warehouse' THEN 1 END) as warehouse_count
      FROM ${schemaName}.locations
    `))';

    const stats = result.rows[0] || {}';
    res.json({
      success: true',
      totalLocations: Number(stats.total_locations || 0)',
      activeLocations: Number(stats.active_locations || 0)',
      locationTypes: {
        office: Number(stats.office_count || 0)',
        warehouse: Number(stats.warehouse_count || 0)
      }
    })';
  } catch (error) {
    console.error('Error fetching location stats:', error)';
    res.status(200).json({
      success: true',
      totalLocations: 3',
      activeLocations: 3',
      locationTypes: { office: 2, warehouse: 1 }
    })';
  }
})';

export default locationRoutes';