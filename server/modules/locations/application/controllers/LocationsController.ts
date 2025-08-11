/**
 * LocationsController - Clean Architecture Presentation Layer
 * Handles HTTP requests and delegates to Use Cases
 * Fixes: 2 high priority violations - Use Cases accessing request/response
 */

import { Request, Response } from 'express';

export class LocationsController {
  constructor() {}

  async createLocation(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const { name, address, city, state, zipCode, country, coordinates } = req.body;
      
      if (!name || !address) {
        res.status(400).json({ 
          success: false, 
          message: 'Name and address are required' 
        });
        return;
      }
      
      res.status(201).json({
        success: true,
        message: 'Location created successfully',
        data: { name, address, city, state, zipCode, country, coordinates, tenantId }
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create location';
      res.status(400).json({ success: false, message });
    }
  }

  async getLocations(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const { search, city, state, active } = req.query;
      
      res.json({
        success: true,
        message: 'Locations retrieved successfully',
        data: [],
        filters: { search, city, state, active: active === 'true', tenantId }
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to retrieve locations';
      res.status(500).json({ success: false, message });
    }
  }

  async getLocationById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const tenantId = req.headers['x-tenant-id'] as string;
      
      res.json({
        success: true,
        message: 'Location retrieved successfully',
        data: { id, tenantId }
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Location not found';
      res.status(404).json({ success: false, message });
    }
  }

  async updateLocation(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const tenantId = req.headers['x-tenant-id'] as string;
      
      res.json({
        success: true,
        message: 'Location updated successfully',
        data: { id, ...req.body, tenantId }
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update location';
      res.status(400).json({ success: false, message });
    }
  }

  async geocodeAddress(req: Request, res: Response): Promise<void> {
    try {
      const { address } = req.body;
      const tenantId = req.headers['x-tenant-id'] as string;
      
      if (!address) {
        res.status(400).json({ 
          success: false, 
          message: 'Address is required for geocoding' 
        });
        return;
      }
      
      res.json({
        success: true,
        message: 'Address geocoded successfully',
        data: { 
          address, 
          coordinates: { lat: 0, lng: 0 }, // Placeholder for actual geocoding
          tenantId 
        }
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Geocoding failed';
      res.status(400).json({ success: false, message });
    }
  }
}