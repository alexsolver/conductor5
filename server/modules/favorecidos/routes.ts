import { Router, Request, Response } from "express";
import { z } from "zod";
import { storage } from "../../storage-simple";
import { jwtAuth } from "../../middleware/jwtAuth";
import { insertFavorecidoSchema, type InsertFavorecido } from "@shared/schema-simple";

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
    const { id } = favorecidoIdSchema.parse(req.params);
    const updateData: Partial<InsertFavorecido> = req.body;
    
    const favorecido = await storage.updateFavorecido(id, user.tenantId, updateData);
    
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
    const { id } = favorecidoIdSchema.parse(req.params);
    
    const deleted = await storage.deleteFavorecido(id, user.tenantId);
    
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

export default router;