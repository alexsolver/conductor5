// ✅ 1QA.MD COMPLIANCE: Interactive Map Routes
// Express router configuration with authentication and validation

import express, { Request, Response } from 'express';
import { InteractiveMapApplicationService } from './application/services/InteractiveMapApplicationService';
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
router.get('/agents', async (req: AuthenticatedRequest, res: Response) => {
  await controller.getFieldAgents(req, res);
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

export default router;
