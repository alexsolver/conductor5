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

    const { page, limit, search } = getBeneficiariesSchema.parse(req.query);
    
    const offset = (page - 1) * limit;
    const beneficiaries = await storage.getFavorecidos(user.tenantId, {
      limit,
      offset,
      search,
    });

    // Get total count for pagination
    const allBeneficiaries = await storage.getFavorecidos(user.tenantId, { search });
    const total = allBeneficiaries.length;
    const totalPages = Math.ceil(total / limit);

    console.log(`Fetched ${beneficiaries.length} beneficiaries for tenant ${user.tenantId}`);

    return sendSuccess(res as any, {
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
    
    const beneficiary = await storage.getFavorecido(id, user.tenantId);
    
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
    
    const beneficiary = await storage.createFavorecido(user.tenantId, beneficiaryData);
    
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
    
    const beneficiary = await storage.updateFavorecido(user.tenantId, id, beneficiaryData);
    
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
    
    const deleted = await storage.deleteFavorecido(user.tenantId, id);
    
    if (!deleted) {
      return sendError(res as any, "Beneficiary not found", "Beneficiary not found", 404);
    }

    return sendSuccess(res as any, null, "Beneficiary deleted successfully");
  } catch (error) {
    console.error("Error deleting beneficiary:", error);
    return sendError(res as any, error as any, "Failed to delete beneficiary", 500);
  }
});

// Get customers associated with a favorecido
router.get('/:id/customers', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return res.status(401).json({ message: 'Tenant ID required' });
    }

    const { id } = req.params;
    const customers = await storage.getFavorecidoCustomers(tenantId, id);

    res.json({
      success: true,
      data: customers,
      message: 'Favorecido customers retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching favorecido customers:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch favorecido customers'
    });
  }
});

// Add customer to favorecido
router.post('/:id/customers', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return res.status(401).json({ message: 'Tenant ID required' });
    }

    const { id } = req.params;
    const { customerId } = req.body;

    if (!customerId) {
      return res.status(400).json({
        success: false,
        error: 'Customer ID is required'
      });
    }

    const relationship = await storage.addFavorecidoCustomer(tenantId, id, customerId);

    res.json({
      success: true,
      data: relationship,
      message: 'Customer added to favorecido successfully'
    });
  } catch (error) {
    console.error('Error adding customer to favorecido:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add customer to favorecido'
    });
  }
});

// Remove customer from favorecido
router.delete('/:id/customers/:customerId', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return res.status(401).json({ message: 'Tenant ID required' });
    }

    const { id, customerId } = req.params;
    const success = await storage.removeFavorecidoCustomer(tenantId, id, customerId);

    if (success) {
      res.json({
        success: true,
        message: 'Customer removed from favorecido successfully'
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Relationship not found'
      });
    }
  } catch (error) {
    console.error('Error removing customer from favorecido:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to remove customer from favorecido'
    });
  }
});

export default router;