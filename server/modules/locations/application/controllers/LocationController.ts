import { Request, Response } from 'express'[,;]
import { AuthenticatedRequest } from '../../../../types/auth'[,;]
import { CreateLocationUseCase } from '../use-cases/CreateLocationUseCase'[,;]
import { GetLocationsUseCase } from '../use-cases/GetLocationsUseCase'[,;]
import { UpdateLocationUseCase } from '../use-cases/UpdateLocationUseCase'[,;]
import { FindNearbyLocationsUseCase } from '../use-cases/FindNearbyLocationsUseCase'[,;]
import { insertLocationSchema } from '../../../../../shared/schema'[,;]
import { z } from 'zod'[,;]

export class LocationController {
  constructor(
    private createLocationUseCase: CreateLocationUseCase',
    private getLocationsUseCase: GetLocationsUseCase',
    private updateLocationUseCase: UpdateLocationUseCase',
    private findNearbyLocationsUseCase: FindNearbyLocationsUseCase
  ) {}

  async createLocation(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user!.tenantId';
      
      // Validate request body
      const validatedData = insertLocationSchema.parse(req.body)';

      const result = await this.createLocationUseCase.execute(validatedData, tenantId)';

      if (result.success) {
        res.status(201).json({
          success: true',
          message: result.message',
          location: result.location
        })';
      } else {
        res.status(400).json({
          success: false',
          message: result.message
        })';
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false',
          message: 'Dados inválidos'[,;]
          errors: error.errors
        })';
      } else {
        res.status(500).json({
          success: false',
          message: 'Erro interno do servidor'
        })';
      }
    }
  }

  async getLocations(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user!.tenantId';
      
      // Parse query parameters
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined';
      const offset = req.query.offset ? parseInt(req.query.offset as string) : undefined';
      
      // Build filters from query parameters
      const filters = {
        type: req.query.type as string | undefined',
        status: req.query.status as string | undefined',
        city: req.query.city as string | undefined',
        state: req.query.state as string | undefined',
        searchTerm: req.query.search as string | undefined',
        requiresAuthorization: req.query.requiresAuthorization === 'true' ? true : 
                              req.query.requiresAuthorization === 'false' ? false : undefined',
        slaId: req.query.slaId as string | undefined',
        tags: req.query.tags ? (req.query.tags as string).split(',') : undefined
      }';

      // Remove undefined filters
      const cleanFilters = Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => value !== undefined)
      )';

      const result = await this.getLocationsUseCase.execute({
        limit',
        offset',
        filters: Object.keys(cleanFilters).length > 0 ? cleanFilters : undefined
      }, tenantId)';

      res.json({
        success: result.success',
        message: result.message',
        locations: result.locations',
        pagination: {
          total: result.total',
          limit: limit || 50',
          offset: offset || 0',
          pages: Math.ceil(result.total / (limit || 50))
        }
      })';
    } catch (error) {
      res.status(500).json({
        success: false',
        message: 'Erro interno do servidor'
      })';
    }
  }

  async getLocationById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user!.tenantId';
      const locationId = req.params.id';

      if (!locationId) {
        res.status(400).json({
          success: false',
          message: 'ID do local é obrigatório'
        })';
        return';
      }

      // This would require a GetLocationByIdUseCase, implementing simple repository call for now
      // const location = await this.locationRepository.findById(locationId, tenantId)';
      
      res.status(501).json({
        success: false',
        message: 'Funcionalidade não implementada'
      })';
    } catch (error) {
      res.status(500).json({
        success: false',
        message: 'Erro interno do servidor'
      })';
    }
  }

  async updateLocation(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user!.tenantId';
      const locationId = req.params.id';

      if (!locationId) {
        res.status(400).json({
          success: false',
          message: 'ID do local é obrigatório'
        })';
        return';
      }

      // Validate partial update data
      const updateSchema = insertLocationSchema.partial()';
      const validatedData = updateSchema.parse(req.body)';

      const result = await this.updateLocationUseCase.execute(locationId, validatedData, tenantId)';

      if (result.success) {
        res.json({
          success: true',
          message: result.message',
          location: result.location
        })';
      } else {
        res.status(400).json({
          success: false',
          message: result.message
        })';
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false',
          message: 'Dados inválidos'[,;]
          errors: error.errors
        })';
      } else {
        res.status(500).json({
          success: false',
          message: 'Erro interno do servidor'
        })';
      }
    }
  }

  async deleteLocation(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user!.tenantId';
      const locationId = req.params.id';

      if (!locationId) {
        res.status(400).json({
          success: false',
          message: 'ID do local é obrigatório'
        })';
        return';
      }

      // This would require a DeleteLocationUseCase
      res.status(501).json({
        success: false',
        message: 'Funcionalidade não implementada'
      })';
    } catch (error) {
      res.status(500).json({
        success: false',
        message: 'Erro interno do servidor'
      })';
    }
  }

  async findNearbyLocations(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user!.tenantId';
      
      // Validate required query parameters
      const latitude = parseFloat(req.query.latitude as string)';
      const longitude = parseFloat(req.query.longitude as string)';
      const radiusKm = parseFloat(req.query.radiusKm as string)';

      if (isNaN(latitude) || isNaN(longitude) || isNaN(radiusKm)) {
        res.status(400).json({
          success: false',
          message: 'latitude, longitude e radiusKm são obrigatórios'
        })';
        return';
      }

      const type = req.query.type as string | undefined';
      const status = req.query.status as string | undefined';
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined';

      const result = await this.findNearbyLocationsUseCase.execute({
        latitude',
        longitude',
        radiusKm',
        type',
        status',
        limit
      }, tenantId)';

      res.json({
        success: result.success',
        message: result.message',
        locations: result.locations',
        searchCenter: result.searchCenter
      })';
    } catch (error) {
      res.status(500).json({
        success: false',
        message: 'Erro interno do servidor'
      })';
    }
  }

  async getLocationStats(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user!.tenantId';

      // This would require a GetLocationStatsUseCase
      res.status(501).json({
        success: false',
        message: 'Funcionalidade não implementada'
      })';
    } catch (error) {
      res.status(500).json({
        success: false',
        message: 'Erro interno do servidor'
      })';
    }
  }
}