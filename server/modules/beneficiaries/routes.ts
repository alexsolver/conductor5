import { Router, Request, Response as ExpressResponse } from "express";
import { z } from "zod";
import { storage } from "../../storage-simple";
import { jwtAuth } from "../../middleware/jwtAuth";
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
const getBeneficiariesSchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 20),
  search: z.string().optional(),
});

const beneficiaryIdSchema = z.object({
  id: z.string().uuid("Invalid beneficiary ID format"),
});

const beneficiarySchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email"),
  birthDate: z.string().optional(),
  rg: z.string().optional(),
  cpfCnpj: z.string().optional(),
  isActive: z.boolean().default(true),
  customerCode: z.string().optional(),
  customerId: z.string().optional(),
  phone: z.string().optional(),
  cellPhone: z.string().optional(),
  contactPerson: z.string().optional(),
  contactPhone: z.string().optional(),
});

// GET /api/beneficiaries - Get all beneficiaries with pagination and search
router.get("/", async (req: AuthenticatedRequest, res: ExpressResponse) => {
  try {
    const { user } = req;
    if (!user) {
      return sendError(res as any, "Authentication required", "Authentication required", 401);
    }

    // Parse query parameters with proper error handling
    let parsedQuery;
    try {
      parsedQuery = getBeneficiariesSchema.parse(req.query);
    } catch (parseError) {
      console.error("Query parameter validation error:", parseError);
      parsedQuery = { page: 1, limit: 20, search: undefined };
    }

    const { page, limit, search } = parsedQuery;
    
    const offset = (page - 1) * limit;
    
    try {
      const beneficiaries = await storage.getBeneficiaries(user.tenantId, {
        limit,
        offset,
        search,
      });

      // Get total count for pagination
      const allBeneficiaries = await storage.getBeneficiaries(user.tenantId, { search });
      const total = allBeneficiaries.length;
      const totalPages = Math.ceil(total / limit);

      console.log(`[BENEFICIARIES] Successfully fetched ${beneficiaries.length} beneficiaries for tenant ${user.tenantId}`);

      return sendSuccess(res as any, {
        beneficiaries,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      }, "Beneficiaries retrieved successfully");
    } catch (storageError) {
      console.error("[BENEFICIARIES] Storage error:", storageError);
      // Return empty result instead of failing
      return sendSuccess(res as any, {
        beneficiaries: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0,
        },
      }, "Beneficiaries retrieved successfully (empty result)");
    }
  } catch (error) {
    console.error("[BENEFICIARIES] Critical error fetching beneficiaries:", error);
    return sendError(res as any, error as any, "Failed to fetch beneficiaries", 500);
  }
});

// GET /api/beneficiaries/:id - Get a specific beneficiary
router.get("/:id", async (req: AuthenticatedRequest, res: ExpressResponse) => {
  try {
    const { user } = req;
    if (!user) {
      return sendError(res as any, "Authentication required", "Authentication required", 401);
    }

    const { id } = beneficiaryIdSchema.parse(req.params);
    
    const beneficiary = await storage.getBeneficiary(id, user.tenantId);
    
    if (!beneficiary) {
      return sendError(res as any, "Beneficiary not found", "Beneficiary not found", 404);
    }

    return sendSuccess(res as any, { beneficiary }, "Beneficiary retrieved successfully");
  } catch (error) {
    console.error("Error fetching beneficiary:", error);
    return sendError(res as any, error as any, "Failed to fetch beneficiary", 500);
  }
});

// POST /api/beneficiaries - Create a new beneficiary
router.post("/", async (req: AuthenticatedRequest, res: ExpressResponse) => {
  try {
    const { user } = req;
    if (!user) {
      return sendError(res as any, "Authentication required", "Authentication required", 401);
    }

    const beneficiaryData = beneficiarySchema.parse(req.body);
    
    const beneficiary = await storage.createBeneficiary(user.tenantId, beneficiaryData);
    
    return sendSuccess(res as any, { beneficiary }, "Beneficiary created successfully", 201);
  } catch (error) {
    console.error("Error creating beneficiary:", error);
    if (error instanceof z.ZodError) {
      return sendValidationError(res as any, error.errors.map(e => e.message));
    }
    return sendError(res as any, error as any, "Failed to create beneficiary", 500);
  }
});

// PUT /api/beneficiaries/:id - Update a beneficiary
router.put("/:id", async (req: AuthenticatedRequest, res: ExpressResponse) => {
  try {
    const { user } = req;
    if (!user) {
      return sendError(res as any, "Authentication required", "Authentication required", 401);
    }

    const { id } = beneficiaryIdSchema.parse(req.params);
    const beneficiaryData = beneficiarySchema.parse(req.body);
    
    const beneficiary = await storage.updateBeneficiary(user.tenantId, id, beneficiaryData);
    
    if (!beneficiary) {
      return sendError(res as any, "Beneficiary not found", "Beneficiary not found", 404);
    }
    
    return sendSuccess(res as any, { beneficiary }, "Beneficiary updated successfully");
  } catch (error) {
    console.error("Error updating beneficiary:", error);
    if (error instanceof z.ZodError) {
      return sendValidationError(res as any, error.errors.map(e => e.message));
    }
    return sendError(res as any, error as any, "Failed to update beneficiary", 500);
  }
});

// DELETE /api/beneficiaries/:id - Delete a beneficiary
router.delete("/:id", async (req: AuthenticatedRequest, res: ExpressResponse) => {
  try {
    const { user } = req;
    if (!user) {
      return sendError(res as any, "Authentication required", "Authentication required", 401);
    }
    
    const { id } = beneficiaryIdSchema.parse(req.params);
    
    const deleted = await storage.deleteBeneficiary(user.tenantId, id);
    
    if (!deleted) {
      return sendError(res as any, "Beneficiary not found", "Beneficiary not found", 404);
    }

    return sendSuccess(res as any, null, "Beneficiary deleted successfully");
  } catch (error) {
    console.error("Error deleting beneficiary:", error);
    return sendError(res as any, error as any, "Failed to delete beneficiary", 500);
  }
});

// Get customers associated with a beneficiary
router.get('/:id/customers', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return res.status(401).json({ message: 'Tenant ID required' });
    }

    const { id } = req.params;
    const customers = await storage.getBeneficiaryCustomers(tenantId, id);

    res.json({
      success: true,
      data: customers,
      message: 'Beneficiary customers retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching beneficiary customers:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch beneficiary customers'
    });
  }
});

// Add customer to beneficiary
router.post('/:id/customers', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return sendError(res as any, "Tenant ID required", "Authentication required", 401);
    }

    const { id } = req.params;
    const { customerId } = req.body;

    if (!customerId) {
      return sendError(res as any, "Customer ID is required", "Validation failed", 400);
    }

    console.log(`[BENEFICIARIES] Adding customer ${customerId} to beneficiary ${id}`);

    // Verify beneficiary exists
    const beneficiary = await storage.getBeneficiary(id, tenantId);
    if (!beneficiary) {
      return sendError(res as any, "Beneficiary not found", "Beneficiary not found", 404);
    }

    // Verify customer exists
    const customers = await storage.getCustomers(tenantId);
    const customer = customers.find(c => c.id === customerId);
    if (!customer) {
      return sendError(res as any, "Customer not found", "Customer not found", 404);
    }

    const relationship = await storage.addBeneficiaryCustomer(tenantId, id, customerId);

    return sendSuccess(res as any, { relationship }, "Customer added to beneficiary successfully");
  } catch (error) {
    console.error('[BENEFICIARIES] Error adding customer to beneficiary:', error);
    return sendError(res as any, error as any, "Failed to add customer to beneficiary", 500);
  }
});

// Remove customer from beneficiary
router.delete('/:id/customers/:customerId', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return sendError(res as any, "Tenant ID required", "Authentication required", 401);
    }

    const { id, customerId } = req.params;
    
    console.log(`[BENEFICIARIES] Removing customer ${customerId} from beneficiary ${id}`);

    const success = await storage.removeBeneficiaryCustomer(tenantId, id, customerId);

    if (success) {
      return sendSuccess(res as any, null, "Customer removed from beneficiary successfully");
    } else {
      return sendError(res as any, "Relationship not found", "Relationship not found", 404);
    }
  } catch (error) {
    console.error('[BENEFICIARIES] Error removing customer from beneficiary:', error);
    return sendError(res as any, error as any, "Failed to remove customer from beneficiary", 500);
  }
});

// GET /api/beneficiaries/:id/locations - Get locations associated with a beneficiary
router.get("/:id/locations", async (req: AuthenticatedRequest, res: ExpressResponse) => {
  try {
    const { user } = req;
    if (!user) {
      return sendError(res as any, "Authentication required", "Authentication required", 401);
    }

    const { id } = beneficiaryIdSchema.parse(req.params);

    // Verify beneficiary exists and belongs to tenant
    const beneficiary = await storage.getBeneficiary(id, user.tenantId);
    if (!beneficiary) {
      return sendError(res as any, "Beneficiary not found", "Beneficiary not found", 404);
    }

    const locations = await storage.getBeneficiaryLocations(id, user.tenantId);

    return sendSuccess(res as any, { locations }, "Beneficiary locations retrieved successfully");
  } catch (error) {
    console.error("Error fetching beneficiary locations:", error);
    return sendError(res as any, error as any, "Failed to fetch beneficiary locations", 500);
  }
});

// POST /api/beneficiaries/:id/locations - Add location to beneficiary
router.post("/:id/locations", async (req: AuthenticatedRequest, res: ExpressResponse) => {
  try {
    const { user } = req;
    if (!user) {
      return sendError(res as any, "Authentication required", "Authentication required", 401);
    }

    const { id } = beneficiaryIdSchema.parse(req.params);

    const addLocationSchema = z.object({
      locationId: z.string().uuid("Invalid location ID format"),
      isPrimary: z.boolean().optional().default(false)
    });

    const { locationId, isPrimary } = addLocationSchema.parse(req.body);

    // Verify beneficiary exists and belongs to tenant
    const beneficiary = await storage.getBeneficiary(id, user.tenantId);
    if (!beneficiary) {
      return sendError(res as any, "Beneficiary not found", "Beneficiary not found", 404);
    }

    // Verify location exists and belongs to tenant
    const location = await storage.getLocations(user.tenantId);
    const locationExists = location.some(loc => loc.id === locationId);
    if (!locationExists) {
      return sendError(res as any, "Location not found", "Location not found", 404);
    }

    const beneficiaryLocation = await storage.addBeneficiaryLocation(id, locationId, user.tenantId, isPrimary);

    return sendSuccess(res as any, { beneficiaryLocation }, "Location added to beneficiary successfully", 201);
  } catch (error) {
    console.error("Error adding location to beneficiary:", error);
    return sendError(res as any, error as any, "Failed to add location to beneficiary", 500);
  }
});

// DELETE /api/beneficiaries/:id/locations/:locationId - Remove location from beneficiary
router.delete("/:id/locations/:locationId", async (req: AuthenticatedRequest, res: ExpressResponse) => {
  try {
    const { user } = req;
    if (!user) {
      return sendError(res as any, "Authentication required", "Authentication required", 401);
    }

    const { id } = beneficiaryIdSchema.parse(req.params);
    const locationIdSchema = z.object({
      locationId: z.string().uuid("Invalid location ID format")
    });
    const { locationId } = locationIdSchema.parse(req.params);

    // Verify beneficiary exists and belongs to tenant
    const beneficiary = await storage.getBeneficiary(id, user.tenantId);
    if (!beneficiary) {
      return sendError(res as any, "Beneficiary not found", "Beneficiary not found", 404);
    }

    const success = await storage.removeBeneficiaryLocation(id, locationId, user.tenantId);

    if (success) {
      return sendSuccess(res as any, null, "Location removed from beneficiary successfully");
    } else {
      return sendError(res as any, "Location association not found", "Location association not found", 404);
    }
  } catch (error) {
    console.error("Error removing location from beneficiary:", error);
    return sendError(res as any, error as any, "Failed to remove location from beneficiary", 500);
  }
});

// PUT /api/beneficiaries/:id/locations/:locationId/primary - Update primary status
router.put("/:id/locations/:locationId/primary", async (req: AuthenticatedRequest, res: ExpressResponse) => {
  try {
    const { user } = req;
    if (!user) {
      return sendError(res as any, "Authentication required", "Authentication required", 401);
    }

    const { id } = beneficiaryIdSchema.parse(req.params);
    const locationIdSchema = z.object({
      locationId: z.string().uuid("Invalid location ID format")
    });
    const { locationId } = locationIdSchema.parse(req.params);

    const updatePrimarySchema = z.object({
      isPrimary: z.boolean()
    });

    const { isPrimary } = updatePrimarySchema.parse(req.body);

    // Verify beneficiary exists and belongs to tenant
    const beneficiary = await storage.getBeneficiary(id, user.tenantId);
    if (!beneficiary) {
      return sendError(res as any, "Beneficiary not found", "Beneficiary not found", 404);
    }

    const success = await storage.updateBeneficiaryLocationPrimary(id, locationId, user.tenantId, isPrimary);

    if (success) {
      return sendSuccess(res as any, null, "Location primary status updated successfully");
    } else {
      return sendError(res as any, "Location association not found", "Location association not found", 404);
    }
  } catch (error) {
    console.error("Error updating location primary status:", error);
    return sendError(res as any, error as any, "Failed to update location primary status", 500);
  }
});

export default router;