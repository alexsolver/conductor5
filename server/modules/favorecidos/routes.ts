import { Router, Request, Response } from "express";
import { z } from "zod";
import { storage } from "../../storage-simple";
import { jwtAuth } from "../../middleware/jwtAuth";
import { insertFavorecidoSchema, type InsertFavorecido } from "@shared/schema";

// Add type for authenticated request
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    tenantId: string;
    email: string;
    role: string;
  };
}

const router = Router();

// Apply authentication middleware to all routes
router.use(jwtAuth);

// Validation schemas
const getFavorecidosSchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 20),
  search: z.string().optional(),
});

const favorecidoIdSchema = z.object({
  id: z.string().uuid("Invalid favorecido ID format"),
});

// GET /api/favorecidos - Get all favorecidos with pagination and search
router.get("/", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { user } = req;
    const { page, limit, search } = getFavorecidosSchema.parse(req.query);
    
    const offset = (page - 1) * limit;
    const favorecidos = await storage.getFavorecidos(user.tenantId, {
      limit,
      offset,
      search,
    });

    // Get total count for pagination
    const allFavorecidos = await storage.getFavorecidos(user.tenantId, { search });
    const total = allFavorecidos.length;
    const totalPages = Math.ceil(total / limit);

    console.log(`Fetched ${favorecidos.length} favorecidos for tenant ${user.tenantId}`);

    res.json({
      favorecidos,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    console.error("Error fetching favorecidos:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to fetch favorecidos",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// GET /api/favorecidos/:id - Get a specific favorecido
router.get("/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { user } = req;
    const { id } = favorecidoIdSchema.parse(req.params);
    
    const favorecido = await storage.getFavorecido(id, user.tenantId);
    
    if (!favorecido) {
      return res.status(404).json({ 
        success: false,
        message: "Favorecido not found" 
      });
    }

    res.json({ favorecido });
  } catch (error) {
    console.error("Error fetching favorecido:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to fetch favorecido",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// POST /api/favorecidos - Create a new favorecido
router.post("/", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { user } = req;
    const favorecidoData: InsertFavorecido = req.body;
    
    const favorecido = await storage.createFavorecido(user.tenantId, favorecidoData);
    
    res.status(201).json({ 
      success: true,
      favorecido,
      message: "Favorecido created successfully"
    });
  } catch (error) {
    console.error("Error creating favorecido:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to create favorecido",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// PUT /api/favorecidos/:id - Update a favorecido
router.put("/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { user } = req;
    if (!user) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }
    
    const { id } = favorecidoIdSchema.parse(req.params);
    const updateData: Partial<InsertFavorecido> = req.body;
    
    console.log('Route params BEFORE calling storage:', { tenantId: user.tenantId, favorecidoId: id, updateData });
    
    // CRITICAL: Ensure correct parameter order: (tenantId, id, data)
    const favorecido = await storage.updateFavorecido(user.tenantId, id, updateData);
    
    if (!favorecido) {
      return res.status(404).json({ 
        success: false,
        message: "Favorecido not found" 
      });
    }

    res.json({ 
      success: true,
      favorecido,
      message: "Favorecido updated successfully"
    });
  } catch (error) {
    console.error("Error updating favorecido:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to update favorecido",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// DELETE /api/favorecidos/:id - Delete a favorecido
router.delete("/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { user } = req;
    if (!user) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }
    
    const { id } = favorecidoIdSchema.parse(req.params);
    
    const deleted = await storage.deleteFavorecido(user.tenantId, id);
    
    if (!deleted) {
      return res.status(404).json({ 
        success: false,
        message: "Favorecido not found" 
      });
    }

    res.json({ 
      success: true,
      message: "Favorecido deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting favorecido:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to delete favorecido",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// GET /api/favorecidos/:id/locations - Get locations associated with a favorecido
router.get("/:id/locations", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { user } = req;
    const { id } = favorecidoIdSchema.parse(req.params);

    // Verify favorecido exists and belongs to tenant
    const favorecido = await storage.getFavorecido(id, user.tenantId);
    if (!favorecido) {
      return res.status(404).json({
        success: false,
        message: "Favorecido not found"
      });
    }

    const locations = await storage.getFavorecidoLocations(id, user.tenantId);

    res.json({
      success: true,
      locations
    });
  } catch (error) {
    console.error("Error fetching favorecido locations:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch favorecido locations",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// POST /api/favorecidos/:id/locations - Add location to favorecido
router.post("/:id/locations", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { user } = req;
    const { id } = favorecidoIdSchema.parse(req.params);
    
    const addLocationSchema = z.object({
      locationId: z.string().uuid("Invalid location ID format"),
      isPrimary: z.boolean().optional().default(false)
    });
    
    const { locationId, isPrimary } = addLocationSchema.parse(req.body);

    // Verify favorecido exists and belongs to tenant
    const favorecido = await storage.getFavorecido(id, user.tenantId);
    if (!favorecido) {
      return res.status(404).json({
        success: false,
        message: "Favorecido not found"
      });
    }

    // Verify location exists and belongs to tenant
    const location = await storage.getLocation(locationId, user.tenantId);
    if (!location) {
      return res.status(404).json({
        success: false,
        message: "Location not found"
      });
    }

    const favorecidoLocation = await storage.addFavorecidoLocation(id, locationId, user.tenantId, isPrimary);

    res.status(201).json({
      success: true,
      favorecidoLocation,
      message: "Location added to favorecido successfully"
    });
  } catch (error) {
    console.error("Error adding location to favorecido:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add location to favorecido",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// DELETE /api/favorecidos/:id/locations/:locationId - Remove location from favorecido
router.delete("/:id/locations/:locationId", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { user } = req;
    const { id } = favorecidoIdSchema.parse(req.params);
    const locationIdSchema = z.object({
      locationId: z.string().uuid("Invalid location ID format")
    });
    const { locationId } = locationIdSchema.parse(req.params);

    // Verify favorecido exists and belongs to tenant
    const favorecido = await storage.getFavorecido(id, user.tenantId);
    if (!favorecido) {
      return res.status(404).json({
        success: false,
        message: "Favorecido not found"
      });
    }

    const success = await storage.removeFavorecidoLocation(id, locationId, user.tenantId);

    if (success) {
      res.json({
        success: true,
        message: "Location removed from favorecido successfully"
      });
    } else {
      res.status(404).json({
        success: false,
        message: "Location association not found"
      });
    }
  } catch (error) {
    console.error("Error removing location from favorecido:", error);
    res.status(500).json({
      success: false,
      message: "Failed to remove location from favorecido",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// PUT /api/favorecidos/:id/locations/:locationId/primary - Update primary status
router.put("/:id/locations/:locationId/primary", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { user } = req;
    const { id } = favorecidoIdSchema.parse(req.params);
    const locationIdSchema = z.object({
      locationId: z.string().uuid("Invalid location ID format")
    });
    const { locationId } = locationIdSchema.parse(req.params);
    
    const updatePrimarySchema = z.object({
      isPrimary: z.boolean()
    });
    
    const { isPrimary } = updatePrimarySchema.parse(req.body);

    // Verify favorecido exists and belongs to tenant
    const favorecido = await storage.getFavorecido(id, user.tenantId);
    if (!favorecido) {
      return res.status(404).json({
        success: false,
        message: "Favorecido not found"
      });
    }

    const success = await storage.updateFavorecidoLocationPrimary(id, locationId, user.tenantId, isPrimary);

    if (success) {
      res.json({
        success: true,
        message: "Location primary status updated successfully"
      });
    } else {
      res.status(404).json({
        success: false,
        message: "Location association not found"
      });
    }
  } catch (error) {
    console.error("Error updating location primary status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update location primary status",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

export default router;