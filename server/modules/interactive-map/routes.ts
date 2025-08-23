// ✅ 1QA.MD COMPLIANCE: Interactive Map Routes
// Express router configuration with authentication and validation

import express, { Request, Response } from 'express';
import { InteractiveMapApplicationService } from './application/services/InteractiveMapApplicationService';
import { MapExportService } from './domain/services/MapExportService';
import { MapAuditService } from './domain/services/MapAuditService';
import { ExternalApiService } from './infrastructure/services/ExternalApiService';
import { db } from '../../db';
import { jwtAuth, AuthenticatedRequest } from '../../middleware/jwtAuth';

// ✅ Initialize Application Service
const interactiveMapService = new InteractiveMapApplicationService(db);
const controller = interactiveMapService.getController();

// ✅ Create Express Router
const router = express.Router();

// ✅ Apply authentication to all routes
router.use(jwtAuth);

// ✅ Field Agents Routes

// GET /api/interactive-map/agents - List all field agents with filters
router.get('/agents', async (req: Request, res: Response) => {
  await controller.getFieldAgents(req as AuthenticatedRequest, res);
});

// GET /api/interactive-map/agents/stats - Get agent statistics
router.get('/agents/stats', async (req: Request, res: Response) => {
  await controller.getAgentStats(req, res);
});

// GET /api/interactive-map/agents/near - Find agents near location
router.get('/agents/near', async (req: Request, res: Response) => {
  await controller.getAgentsNearLocation(req, res);
});

// GET /api/interactive-map/agents/sla-risk - Get agents in SLA risk
router.get('/agents/sla-risk', async (req: Request, res: Response) => {
  await controller.getAgentsInSlaRisk(req, res);
});

// GET /api/interactive-map/agents/offline - Get offline agents
router.get('/agents/offline', async (req: Request, res: Response) => {
  await controller.getOfflineAgents(req, res);
});

// GET /api/interactive-map/agents/:agentId/history - Get agent location history
router.get('/agents/:agentId/history', async (req: Request, res: Response) => {
  await controller.getAgentLocationHistory(req, res);
});

// POST /api/interactive-map/agents/location - Update agent location
router.post('/agents/location', async (req: Request, res: Response) => {
  await controller.updateAgentLocation(req, res);
});

// ✅ Export Routes

// POST /api/interactive-map/export/csv - Export agents to CSV
router.post('/export/csv', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { agents, filters } = req.body;
    const result = MapExportService.exportToCSV(agents, filters);
    
    if (result.success) {
      // Log audit event
      await MapAuditService.logDataExport(
        req.user!.id,
        req.user!.tenantId!,
        'csv',
        { agentCount: agents.length, includesPersonalData: true },
        { userAgent: req.get('User-Agent'), ipAddress: req.ip }
      );
      
      res.setHeader('Content-Type', result.mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
      res.send(result.data);
    } else {
      res.status(500).json({ success: false, error: result.error });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: 'Export failed' });
  }
});

// POST /api/interactive-map/export/geojson - Export agents to GeoJSON
router.post('/export/geojson', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { agents, filters } = req.body;
    const result = MapExportService.exportToGeoJSON(agents, filters);
    
    if (result.success) {
      // Log audit event
      await MapAuditService.logDataExport(
        req.user!.id,
        req.user!.tenantId!,
        'geojson',
        { agentCount: agents.length, includesPersonalData: true },
        { userAgent: req.get('User-Agent'), ipAddress: req.ip }
      );
      
      res.setHeader('Content-Type', result.mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
      res.send(result.data);
    } else {
      res.status(500).json({ success: false, error: result.error });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: 'Export failed' });
  }
});

// POST /api/interactive-map/export/pdf - Export agents to PDF
router.post('/export/pdf', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { agents, filters } = req.body;
    const result = MapExportService.exportToPDF(agents, filters);
    
    if (result.success) {
      // Log audit event
      await MapAuditService.logDataExport(
        req.user!.id,
        req.user!.tenantId!,
        'pdf',
        { agentCount: agents.length, includesPersonalData: true },
        { userAgent: req.get('User-Agent'), ipAddress: req.ip }
      );
      
      res.setHeader('Content-Type', result.mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
      res.send(result.data);
    } else {
      res.status(500).json({ success: false, error: result.error });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: 'Export failed' });
  }
});

// ✅ Audit Routes

// GET /api/interactive-map/audit - Get audit logs
router.get('/audit', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { userId, eventType, dateRange, limit = 50, offset = 0 } = req.query;
    
    const filters: any = {
      limit: Number(limit),
      offset: Number(offset)
    };
    
    if (userId) filters.userId = userId as string;
    if (eventType) filters.eventType = Array.isArray(eventType) ? eventType : [eventType];
    if (dateRange) {
      const range = JSON.parse(dateRange as string);
      filters.dateRange = {
        start: new Date(range.start),
        end: new Date(range.end)
      };
    }
    
    const logs = await MapAuditService.getAuditLogs(req.user!.tenantId!, filters);
    res.json({ success: true, data: logs });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to retrieve audit logs' });
  }
});

// GET /api/interactive-map/audit/privacy-report - Generate privacy report
router.get('/audit/privacy-report', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    
    const dateRange = {
      start: new Date(startDate as string),
      end: new Date(endDate as string)
    };
    
    const report = await MapAuditService.generatePrivacyReport(req.user!.tenantId!, dateRange);
    res.json({ success: true, data: report });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to generate privacy report' });
  }
});

// POST /api/interactive-map/agents/location/batch - Batch update agent locations
router.post('/agents/location/batch', async (req: Request, res: Response) => {
  await controller.updateMultipleAgentLocations(req, res);
});

// ✅ Health Check Route
router.get('/health', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return res.status(401).json({
        success: false,
        message: 'Tenant ID is required'
      });
    }

    const healthCheck = await interactiveMapService.healthCheck(tenantId);
    
    res.json({
      success: true,
      message: 'Interactive Map service health check',
      data: healthCheck
    });
  } catch (error) {
    console.error('[InteractiveMapRoutes] Health check failed:', error);
    res.status(500).json({
      success: false,
      message: 'Health check failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ✅ Debug Route (Development Only)
if (process.env.NODE_ENV === 'development') {
  router.get('/debug/service-info', async (req: Request, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({
          success: false,
          message: 'Tenant ID is required'
        });
      }

      // Get service instances information
      const serviceInfo = {
        repository: {
          type: 'DrizzleInteractiveMapRepository',
          initialized: !!interactiveMapService.getRepository()
        },
        domainService: {
          type: 'InteractiveMapDomainService',
          initialized: !!interactiveMapService.getDomainService()
        },
        useCases: {
          findFieldAgents: !!interactiveMapService.getFindFieldAgentsUseCase(),
          updateAgentLocation: !!interactiveMapService.getUpdateAgentLocationUseCase()
        },
        controller: {
          type: 'InteractiveMapController',
          initialized: !!interactiveMapService.getController()
        }
      };

      res.json({
        success: true,
        message: 'Interactive Map service debug information',
        data: serviceInfo
      });
    } catch (error) {
      console.error('[InteractiveMapRoutes] Debug info failed:', error);
      res.status(500).json({
        success: false,
        message: 'Debug info failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
}

// ✅ External Data Routes

// GET /api/interactive-map/external/weather - Get weather data
router.get('/external/weather', async (req: Request, res: Response) => {
  try {
    const { lat, lng } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({ success: false, error: 'Latitude and longitude required' });
    }
    
    const weather = await ExternalApiService.getCachedData(
      `weather_${lat}_${lng}`,
      () => ExternalApiService.getWeatherData(Number(lat), Number(lng)),
      10 // 10 minutes cache
    );
    
    res.json({ success: true, data: weather });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch weather data' });
  }
});

// GET /api/interactive-map/external/traffic - Get traffic data
router.get('/external/traffic', async (req: Request, res: Response) => {
  try {
    const { north, south, east, west } = req.query;
    
    if (!north || !south || !east || !west) {
      return res.status(400).json({ success: false, error: 'Bounds parameters required' });
    }
    
    const bounds = {
      north: Number(north),
      south: Number(south),
      east: Number(east),
      west: Number(west)
    };
    
    const traffic = await ExternalApiService.getCachedData(
      `traffic_${north}_${south}_${east}_${west}`,
      () => ExternalApiService.getTrafficData(bounds),
      5 // 5 minutes cache
    );
    
    res.json({ success: true, data: traffic });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch traffic data' });
  }
});

// GET /api/interactive-map/external/combined - Get combined external data
router.get('/external/combined', async (req: Request, res: Response) => {
  try {
    const { centerLat, centerLng, north, south, east, west } = req.query;
    
    if (!centerLat || !centerLng || !north || !south || !east || !west) {
      return res.status(400).json({ success: false, error: 'Center coordinates and bounds required' });
    }
    
    const bounds = {
      north: Number(north),
      south: Number(south),
      east: Number(east),
      west: Number(west)
    };
    
    const data = await ExternalApiService.getCachedData(
      `combined_${centerLat}_${centerLng}_${north}_${south}_${east}_${west}`,
      () => ExternalApiService.getMapLayerData(Number(centerLat), Number(centerLng), bounds),
      10 // 10 minutes cache
    );
    
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch external data' });
  }
});

// Initialize cache cleanup
ExternalApiService.startCacheCleanup();

export default router;
