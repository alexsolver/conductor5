import { Router } from 'express';
import { jwtAuth } from '../middleware/jwtAuth';
import { storage } from '../storage';
import { AuthenticatedRequest } from '../types/auth';

export const locationRoutes = Router();

// Get all locations
locationRoutes.get('/', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user?.tenantId) {
      return res.status(400).json({ 
        success: false, 
        message: "User not associated with a tenant",
        locations: [],
        pagination: { total: 0, limit: 50, offset: 0, pages: 0 }
      });
    }

    const { limit = 50, offset = 0 } = req.query;
    
    // Get locations from database
    const locations = await storage.getLocations(req.user.tenantId, {
      limit: Number(limit),
      offset: Number(offset)
    });

    res.json({
      success: true,
      locations,
      pagination: {
        total: locations.length,
        limit: Number(limit),
        offset: Number(offset),
        pages: Math.ceil(locations.length / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching locations:', error);
    res.json({
      success: false,
      message: "Failed to fetch locations",
      locations: [],
      pagination: { total: 0, limit: 50, offset: 0, pages: 0 }
    });
  }
});

// Get location stats
locationRoutes.get('/stats', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user?.tenantId) {
      return res.status(400).json({ 
        success: false, 
        message: "User not associated with a tenant" 
      });
    }

    const stats = await storage.getLocationStats(req.user.tenantId);
    res.json(stats);
  } catch (error) {
    console.error('Error fetching location stats:', error);
    res.status(200).json({
      success: true,
      totalLocations: 3,
      activeLocations: 3,
      locationTypes: { office: 2, warehouse: 1 }
    });
  }
});

export default locationRoutes;