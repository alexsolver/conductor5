import { Router, Request, Response } from "express";
import { z } from "zod";
import { storage } from "../../storage-simple";
import { jwtAuth } from "../../middleware/jwtAuth";
import { insertBeneficiarySchema, type InsertBeneficiary } from "@shared/schema";
import { sendSuccess, sendError, sendValidationError } from "../../utils/standardResponse";

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

const beneficiaryIdSchema = z.object({
  id: z.string().uuid("Invalid favorecido ID format"),
});

// GET /api/favorecidos - Get all favorecidos with pagination and search
router.get("/", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { user } = req;
    const { page, limit, search } = getBeneficiariesSchema.parse(req.query);

    const offset = (page - 1) * limit;
    const beneficiaries = await storage.getBeneficiaries(user.tenantId, {
      limit,
      offset,
      search,
    });

    // Get total count for pagination
    const allBeneficiaries = await storage.getBeneficiaries(user.tenantId, { search });
    const total = allBeneficiaries.length;
    const totalPages = Math.ceil(total / limit);

    console.log(`Fetched ${beneficiaries.length} beneficiaries for tenant ${user.tenantId}`);

    return sendSuccess(res, {
      beneficiaries,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    }, "Beneficiaries retrieved successfully");
  } catch (error) {
    console.error("Error fetching beneficiaries:", error);
    return sendError(res, error as any, "Failed to fetch beneficiaries", 500);
  }
});

// GET /api/favorecidos/:id - Get a specific favorecido
router.get("/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { user } = req;
    const { id } = beneficiaryIdSchema.parse(req.params);

    const beneficiary = await storage.getBeneficiary(id, user.tenantId);

    if (!beneficiary) {
      return sendError(res, "Beneficiary not found", "Beneficiary not found", 404);
    }

    return sendSuccess(res, { beneficiary }, "Beneficiary retrieved successfully");
  } catch (error) {
    console.error("Error fetching beneficiary:", error);
    return sendError(res, error as any, "Failed to fetch beneficiary", 500);
  }
});

// POST /api/favorecidos - Create a new favorecido
router.post("/", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { user } = req;
    const beneficiaryData: InsertBeneficiary = req.body;

    const beneficiary = await storage.createBeneficiary(user.tenantId, beneficiaryData);

    return sendSuccess(res, { beneficiary }, "Beneficiary created successfully", 201);
  } catch (error) {
    console.error("Error creating beneficiary:", error);
    return sendError(res, error as any, "Failed to create beneficiary", 500);
  }
});

// PUT /api/favorecidos/:id - Update a favorecido
router.put("/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { user } = req;
    if (!user) {
      return sendError(res, "Authentication required", "Authentication required", 401);
    }

    const { id } = beneficiaryIdSchema.parse(req.params);
    const updateData: Partial<InsertBeneficiary> = req.body;

    console.log('Route params BEFORE calling storage:', { tenantId: user.tenantId, beneficiaryId: id, updateData });

    // CRITICAL: Ensure correct parameter order: (tenantId, id, data)
    const beneficiary = await storage.updateBeneficiary(user.tenantId, id, updateData);

    if (!beneficiary) {
      return sendError(res, "Beneficiary not found", "Beneficiary not found", 404);
    }

    return sendSuccess(res, { beneficiary }, "Beneficiary updated successfully");
  } catch (error) {
    console.error("Error updating beneficiary:", error);
    return sendError(res, error as any, "Failed to update beneficiary", 500);
  }
});

// DELETE /api/favorecidos/:id - Delete a favorecido
router.delete("/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { user } = req;
    if (!user) {
      return sendError(res, "Authentication required", "Authentication required", 401);
    }

    const { id } = beneficiaryIdSchema.parse(req.params);

    const deleted = await storage.deleteBeneficiary(user.tenantId, id);

    if (!deleted) {
      return sendError(res, "Beneficiary not found", "Beneficiary not found", 404);
    }

    return sendSuccess(res, null, "Beneficiary deleted successfully");
  } catch (error) {
    console.error("Error deleting beneficiary:", error);
    return sendError(res, error as any, "Failed to delete beneficiary", 500);
  }
});

// GET /api/favorecidos/:id/locations - Get locations associated with a favorecido
router.get("/:id/locations", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { user } = req;
    const { id } = beneficiaryIdSchema.parse(req.params);

    // Verify favorecido exists and belongs to tenant
    const beneficiary = await storage.getBeneficiary(id, user.tenantId);
    if (!beneficiary) {
      return sendError(res, "Beneficiary not found", "Beneficiary not found", 404);
    }

    const locations = await storage.getBeneficiaryLocations(id, user.tenantId);

    return sendSuccess(res, { locations }, "Beneficiary locations retrieved successfully");
  } catch (error) {
    console.error("Error fetching beneficiary locations:", error);
    return sendError(res, error as any, "Failed to fetch beneficiary locations", 500);
  }
});

// POST /api/favorecidos/:id/locations - Add location to favorecido
router.post("/:id/locations", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { user } = req;
    const { id } = beneficiaryIdSchema.parse(req.params);

    const addLocationSchema = z.object({
      locationId: z.string().uuid("Invalid location ID format"),
      isPrimary: z.boolean().optional().default(false)
    });

    const { locationId, isPrimary } = addLocationSchema.parse(req.body);

    // Verify favorecido exists and belongs to tenant
    const beneficiary = await storage.getBeneficiary(id, user.tenantId);
    if (!beneficiary) {
      return sendError(res, "Beneficiary not found", "Beneficiary not found", 404);
    }

    // Verify location exists and belongs to tenant
    const location = await storage.getLocation(locationId, user.tenantId);
    if (!location) {
      return sendError(res, "Location not found", "Location not found", 404);
    }

    const favorecidoLocation = await storage.addBeneficiaryLocation(id, locationId, user.tenantId, isPrimary);

    return sendSuccess(res, { favorecidoLocation }, "Location added to beneficiary successfully", 201);
  } catch (error) {
    console.error("Error adding location to beneficiary:", error);
    return sendError(res, error as any, "Failed to add location to beneficiary", 500);
  }
});

// DELETE /api/favorecidos/:id/locations/:locationId - Remove location from favorecido
router.delete("/:id/locations/:locationId", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { user } = req;
    const { id } = beneficiaryIdSchema.parse(req.params);
    const locationIdSchema = z.object({
      locationId: z.string().uuid("Invalid location ID format")
    });
    const { locationId } = locationIdSchema.parse(req.params);

    // Verify favorecido exists and belongs to tenant
    const beneficiary = await storage.getBeneficiary(id, user.tenantId);
    if (!beneficiary) {
      return sendError(res, "Beneficiary not found", "Beneficiary not found", 404);
    }

    const success = await storage.removeBeneficiaryLocation(id, locationId, user.tenantId);

    if (success) {
      return sendSuccess(res, null, "Location removed from beneficiary successfully");
    } else {
      return sendError(res, "Location association not found", "Location association not found", 404);
    }
  } catch (error) {
    console.error("Error removing location from beneficiary:", error);
    return sendError(res, error as any, "Failed to remove location from beneficiary", 500);
  }
});

// PUT /api/favorecidos/:id/locations/:locationId/primary - Update primary status
router.put("/:id/locations/:locationId/primary", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { user } = req;
    const { id } = beneficiaryIdSchema.parse(req.params);
    const locationIdSchema = z.object({
      locationId: z.string().uuid("Invalid location ID format")
    });
    const { locationId } = locationIdSchema.parse(req.params);

    const updatePrimarySchema = z.object({
      isPrimary: z.boolean()
    });

    const { isPrimary } = updatePrimarySchema.parse(req.body);

    // Verify favorecido exists and belongs to tenant
    const beneficiary = await storage.getBeneficiary(id, user.tenantId);
    if (!beneficiary) {
      return sendError(res, "Beneficiary not found", "Beneficiary not found", 404);
    }

    const success = await storage.updateBeneficiaryLocationPrimary(id, locationId, user.tenantId, isPrimary);

    if (success) {
      return sendSuccess(res, null, "Location primary status updated successfully");
    } else {
      return sendError(res, "Location association not found", "Location association not found", 404);
    }
  } catch (error) {
    console.error("Error updating location primary status:", error);
    return sendError(res, error as any, "Failed to update location primary status", 500);
  }
});

export default router;