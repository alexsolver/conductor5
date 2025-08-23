// ✅ 1QA.MD: Application Controller - Handles HTTP requests, delegates to Use Cases
import { Request, Response } from 'express';
import { GetFieldAgentsUseCase } from '../use-cases/GetFieldAgentsUseCase';
import { UpdateAgentPositionUseCase } from '../use-cases/UpdateAgentPositionUseCase';
import { GetAgentLocationHistoryUseCase } from '../use-cases/GetAgentLocationHistoryUseCase';

export class InteractiveMapController {
  constructor(
    private getFieldAgentsUseCase: GetFieldAgentsUseCase,
    private updateAgentPositionUseCase: UpdateAgentPositionUseCase,
    private getAgentLocationHistoryUseCase: GetAgentLocationHistoryUseCase
  ) {
    console.log('🗺️ [INTERACTIVE-MAP] Controller initialized following Clean Architecture');
  }

  async getFieldAgents(req: Request, res: Response): Promise<void> {
    try {
      console.log('🗺️ [INTERACTIVE-MAP] === getFieldAgents CONTROLLER METHOD CALLED ===', {
        query: req.query,
        tenantId: (req as any).user?.tenantId,
        timestamp: new Date().toISOString()
      });

      const { tenantId } = (req as any).user;
      const { status, team, skills, lat, lng, radius } = req.query;

      const filters = {
        status: status as string,
        team: team as string,
        skills: skills ? (skills as string).split(',') : undefined,
        location: lat && lng ? {
          lat: parseFloat(lat as string),
          lng: parseFloat(lng as string),
          radiusKm: radius ? parseFloat(radius as string) : undefined
        } : undefined
      };

      const agents = await this.getFieldAgentsUseCase.execute(tenantId, filters);

      console.log('🗺️ [INTERACTIVE-MAP] getFieldAgents completed successfully', {
        agentsCount: agents.length,
        filters
      });

      res.json({
        success: true,
        data: agents,
        count: agents.length,
        message: 'Field agents retrieved successfully'
      });
    } catch (error) {
      console.error('🗺️ [INTERACTIVE-MAP-ERROR] getFieldAgents error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve field agents',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async updateAgentPosition(req: Request, res: Response): Promise<void> {
    try {
      console.log('🗺️ [INTERACTIVE-MAP] === updateAgentPosition CONTROLLER METHOD CALLED ===', {
        params: req.params,
        body: req.body,
        tenantId: (req as any).user?.tenantId,
        timestamp: new Date().toISOString()
      });

      const { tenantId } = (req as any).user;
      const { agentId } = req.params;
      const { lat, lng, accuracy, heading, speed } = req.body;

      await this.updateAgentPositionUseCase.execute(tenantId, agentId, {
        lat,
        lng,
        accuracy,
        heading,
        speed
      });

      console.log('🗺️ [INTERACTIVE-MAP] updateAgentPosition completed successfully', {
        agentId,
        position: { lat, lng }
      });

      res.json({
        success: true,
        message: 'Agent position updated successfully'
      });
    } catch (error) {
      console.error('🗺️ [INTERACTIVE-MAP-ERROR] updateAgentPosition error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update agent position',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getAgentLocationHistory(req: Request, res: Response): Promise<void> {
    try {
      console.log('🗺️ [INTERACTIVE-MAP] === getAgentLocationHistory CONTROLLER METHOD CALLED ===', {
        params: req.params,
        query: req.query,
        tenantId: (req as any).user?.tenantId,
        timestamp: new Date().toISOString()
      });

      const { tenantId } = (req as any).user;
      const { agentId } = req.params;
      const { fromDate, toDate } = req.query;

      const history = await this.getAgentLocationHistoryUseCase.execute(
        tenantId,
        agentId,
        new Date(fromDate as string),
        new Date(toDate as string)
      );

      console.log('🗺️ [INTERACTIVE-MAP] getAgentLocationHistory completed successfully', {
        agentId,
        historyCount: history.length
      });

      res.json({
        success: true,
        data: history,
        count: history.length,
        message: 'Agent location history retrieved successfully'
      });
    } catch (error) {
      console.error('🗺️ [INTERACTIVE-MAP-ERROR] getAgentLocationHistory error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve agent location history',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getMapConfiguration(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId } = (req as any).user;
      
      // ✅ 1QA.MD: Business configuration for map features
      const config = {
        defaultCenter: { lat: -23.5505, lng: -46.6333 }, // São Paulo default
        defaultZoom: 11,
        updateInterval: 10000, // 10 seconds
        offlineThreshold: 300000, // 5 minutes
        slaRiskThreshold: 0.8, // 80% of time remaining
        statusColors: {
          available: '#24B47E',
          in_transit: '#2F80ED',
          in_service: '#F2C94C',
          on_break: '#9B51E0',
          sla_at_risk: '#EB5757',
          offline: '#BDBDBD'
        },
        clustering: {
          enabled: true,
          maxZoom: 15,
          minPoints: 3
        }
      };

      res.json({
        success: true,
        data: config,
        message: 'Map configuration retrieved successfully'
      });
    } catch (error) {
      console.error('🗺️ [INTERACTIVE-MAP-ERROR] getMapConfiguration error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve map configuration'
      });
    }
  }
}