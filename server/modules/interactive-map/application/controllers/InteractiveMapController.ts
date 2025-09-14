// ✅ 1QA.MD COMPLIANCE: Interactive Map Application Controller
// HTTP layer handling requests and responses

import { Request, Response } from 'express';
import { FindFieldAgentsUseCase } from '../use-cases/FindFieldAgentsUseCase';
import { UpdateAgentLocationUseCase } from '../use-cases/UpdateAgentLocationUseCase';
import { AgentSearchCriteria, MapViewport } from '../../domain/repositories/IInteractiveMapRepository';
import { LocationPoint, MapBounds } from '../../domain/entities/FieldAgent';
import type { AgentLocationUpdate } from '@shared/schema-interactive-map';
import { AuthenticatedRequest } from '@shared/types/AuthenticatedRequest'; // Assuming this type is available

// ✅ Controller - Application Layer
export class InteractiveMapController {
  constructor(
    private findFieldAgentsUseCase: FindFieldAgentsUseCase,
    private updateAgentLocationUseCase: UpdateAgentLocationUseCase,
    // Assuming interactiveMapService is injected here as well
    private interactiveMapService: any // Replace 'any' with the actual service type
  ) {}

  // ✅ GET /api/interactive-map/agents - List all field agents with filters
  async getFieldAgents(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        res.status(401).json({ success: false, message: 'Tenant ID is required' });
        return;
      }

      // ✅ Parse query parameters
      const {
        status,
        teams,
        skills,
        onDutyOnly,
        slaRiskOnly,
        includeOffline,
        includeInactive,
        bounds,
        proximityLat,
        proximityLng,
        proximityRadius
      } = req.query;

      // ✅ Build search criteria
      const criteria: AgentSearchCriteria = {};

      if (status) {
        criteria.status = Array.isArray(status) ? status as string[] : [status as string];
      }
      if (teams) {
        criteria.teams = Array.isArray(teams) ? teams as string[] : [teams as string];
      }
      if (skills) {
        criteria.skills = Array.isArray(skills) ? skills as string[] : [skills as string];
        console.log('[InteractiveMapController] Skills filter applied:', criteria.skills);
      }
      if (onDutyOnly === 'true') {
        criteria.onDutyOnly = true;
      }
      if (slaRiskOnly === 'true') {
        criteria.slaRiskOnly = true;
      }

      // ✅ Parse bounds if provided
      if (bounds && typeof bounds === 'string') {
        try {
          const boundsData = JSON.parse(bounds);
          criteria.bounds = new MapBounds(
            new LocationPoint(boundsData.northEast.lat, boundsData.northEast.lng),
            new LocationPoint(boundsData.southWest.lat, boundsData.southWest.lng)
          );
        } catch (error) {
          res.status(400).json({ success: false, message: 'Invalid bounds format' });
          return;
        }
      }

      // ✅ Parse proximity search
      if (proximityLat && proximityLng && proximityRadius) {
        const lat = parseFloat(proximityLat as string);
        const lng = parseFloat(proximityLng as string);
        const radius = parseInt(proximityRadius as string);

        if (!isNaN(lat) && !isNaN(lng) && !isNaN(radius)) {
          criteria.proximityLocation = new LocationPoint(lat, lng);
          criteria.proximityRadius = radius;
        }
      }

      // ✅ Execute use case
      const result = await this.findFieldAgentsUseCase.execute({
        tenantId,
        criteria,
        includeOffline: includeOffline === 'true',
        includeInactive: includeInactive === 'true'
      });

      res.json({
        success: true,
        message: 'Field agents retrieved successfully',
        data: result
      });
    } catch (error) {
      console.error('[InteractiveMapController] Error getting field agents:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve field agents',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // ✅ GET /api/interactive-map/agents/stats - Get agent statistics
  async getAgentStats(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        res.status(401).json({ success: false, message: 'Tenant ID is required' });
        return;
      }

      const result = await this.findFieldAgentsUseCase.execute({
        tenantId,
        includeOffline: true,
        includeInactive: true
      });

      res.json({
        success: true,
        message: 'Agent statistics retrieved successfully',
        data: {
          totalCount: result.totalCount,
          availableCount: result.availableCount,
          inTransitCount: result.inTransitCount,
          inServiceCount: result.inServiceCount,
          offlineCount: result.offlineCount
        }
      });
    } catch (error) {
      console.error('[InteractiveMapController] Error getting agent stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve agent statistics',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // ✅ GET /api/interactive-map/agents/near - Find agents near location
  async getAgentsNearLocation(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        res.status(401).json({ success: false, message: 'Tenant ID is required' });
        return;
      }

      const { lat, lng, radius } = req.query;

      if (!lat || !lng || !radius) {
        res.status(400).json({
          success: false,
          message: 'Latitude, longitude and radius are required'
        });
        return;
      }

      const latitude = parseFloat(lat as string);
      const longitude = parseFloat(lng as string);
      const radiusMeters = parseInt(radius as string);

      if (isNaN(latitude) || isNaN(longitude) || isNaN(radiusMeters)) {
        res.status(400).json({
          success: false,
          message: 'Invalid coordinates or radius'
        });
        return;
      }

      const location = new LocationPoint(latitude, longitude);
      const result = await this.findFieldAgentsUseCase.findNearLocation(
        tenantId,
        location,
        radiusMeters
      );

      res.json({
        success: true,
        message: 'Nearby agents retrieved successfully',
        data: result
      });
    } catch (error) {
      console.error('[InteractiveMapController] Error finding nearby agents:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to find nearby agents',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // ✅ POST /api/interactive-map/agents/location - Update agent location
  async updateAgentLocation(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      const userId = req.user?.id;

      if (!tenantId) {
        res.status(401).json({ success: false, message: 'Tenant ID is required' });
        return;
      }

      const locationUpdate: AgentLocationUpdate = req.body;

      if (!locationUpdate.agentId || !locationUpdate.lat || !locationUpdate.lng) {
        res.status(400).json({
          success: false,
          message: 'Agent ID, latitude and longitude are required'
        });
        return;
      }

      const result = await this.updateAgentLocationUseCase.execute({
        tenantId,
        locationUpdate,
        userId
      });

      res.json({
        success: true,
        message: 'Agent location updated successfully',
        data: result
      });
    } catch (error) {
      console.error('[InteractiveMapController] Error updating agent location:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update agent location',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // ✅ POST /api/interactive-map/agents/location/batch - Batch update agent locations
  async updateMultipleAgentLocations(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      const userId = req.user?.id;

      if (!tenantId) {
        res.status(401).json({ success: false, message: 'Tenant ID is required' });
        return;
      }

      const { locationUpdates } = req.body;

      if (!Array.isArray(locationUpdates) || locationUpdates.length === 0) {
        res.status(400).json({
          success: false,
          message: 'Location updates array is required'
        });
        return;
      }

      const result = await this.updateAgentLocationUseCase.updateMultipleAgentLocations({
        tenantId,
        locationUpdates,
        userId
      });

      res.json({
        success: true,
        message: 'Batch location update completed',
        data: result
      });
    } catch (error) {
      console.error('[InteractiveMapController] Error in batch location update:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update agent locations',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // ✅ GET /api/interactive-map/agents/:agentId/history - Get agent location history
  async getAgentLocationHistory(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        res.status(401).json({ success: false, message: 'Tenant ID is required' });
        return;
      }

      const { agentId } = req.params;
      const { hours = '24' } = req.query;

      if (!agentId) {
        res.status(400).json({
          success: false,
          message: 'Agent ID is required'
        });
        return;
      }

      const hoursNumber = parseInt(hours as string);
      if (isNaN(hoursNumber) || hoursNumber <= 0 || hoursNumber > 24) {
        res.status(400).json({
          success: false,
          message: 'Hours must be between 1 and 24'
        });
        return;
      }

      const result = await this.updateAgentLocationUseCase.getAgentLocationHistory({
        tenantId,
        agentId,
        hours: hoursNumber
      });

      res.json({
        success: true,
        message: 'Agent location history retrieved successfully',
        data: result
      });
    } catch (error) {
      console.error('[InteractiveMapController] Error getting location history:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve location history',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // ✅ GET /api/interactive-map/agents/sla-risk - Get agents in SLA risk
  async getAgentsInSlaRisk(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        res.status(401).json({ success: false, message: 'Tenant ID is required' });
        return;
      }

      const result = await this.findFieldAgentsUseCase.findAgentsInSlaRisk(tenantId);

      res.json({
        success: true,
        message: 'Agents in SLA risk retrieved successfully',
        data: result
      });
    } catch (error) {
      console.error('[InteractiveMapController] Error getting SLA risk agents:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve agents in SLA risk',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // ✅ GET /api/interactive-map/agents/offline - Get offline agents
  async getOfflineAgents(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        res.status(401).json({ success: false, message: 'Tenant ID is required' });
        return;
      }

      const { maxOfflineMinutes = '5' } = req.query;
      const minutes = parseInt(maxOfflineMinutes as string);

      if (isNaN(minutes) || minutes <= 0) {
        res.status(400).json({
          success: false,
          message: 'Max offline minutes must be a positive number'
        });
        return;
      }

      const result = await this.findFieldAgentsUseCase.findOfflineAgents(tenantId, minutes);

      res.json({
        success: true,
        message: 'Offline agents retrieved successfully',
        data: result
      });
    } catch (error) {
      console.error('[InteractiveMapController] Error getting offline agents:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve offline agents',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Added endpoint to get user groups for the teams filter
  async getExternalWeather(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { lat, lng } = req.query;

      if (!lat || !lng) {
        res.status(400).json({
          success: false,
          error: 'Missing required parameters',
          message: 'Latitude and longitude are required'
        });
        return;
      }

      const weatherData = await this.interactiveMapService.getWeatherData(
        parseFloat(lat as string),
        parseFloat(lng as string)
      );

      res.json({
        success: true,
        data: weatherData,
        message: 'Weather data retrieved successfully'
      });

    } catch (error) {
      console.error('[INTERACTIVE-MAP-CONTROLLER] Error fetching weather data:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to fetch weather data'
      });
    }
  }

  async getUserGroups(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
          message: 'Tenant ID not found'
        });
        return;
      }

      const userGroups = await this.interactiveMapService.getUserGroups(tenantId);

      res.json({
        success: true,
        data: userGroups,
        message: 'User groups retrieved successfully'
      });

    } catch (error) {
      console.error('[INTERACTIVE-MAP-CONTROLLER] Error fetching user groups:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to fetch user groups'
      });
    }
  }
}