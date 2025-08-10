import { Router, Request, Response } from "express";
import { z } from "zod";
import { storage } from "../../storage-simple";
import { jwtAuth, AuthenticatedRequest } from "../../middleware/jwtAuth";
import { enhancedTenantValidator } from "../../middleware/tenantValidator";
import { BeneficiaryController } from "./application/controllers/BeneficiaryController";
import { BeneficiaryApplicationService } from "./application/services/BeneficiaryApplicationService";
import { DrizzleBeneficiaryRepository } from "./infrastructure/repositories/DrizzleBeneficiaryRepository";
import { sendSuccess, sendError, sendValidationError } from "../../utils/standardResponse";
import { db } from "../../db";

const beneficiariesRouter = Router();

// Middleware de autenticação para todas as rotas
beneficiariesRouter.use(jwtAuth);
beneficiariesRouter.use(enhancedTenantValidator());

// Inicializar dependências
const beneficiaryRepository = new DrizzleBeneficiaryRepository();
const beneficiaryService = new BeneficiaryApplicationService(beneficiaryRepository);

// Initialize use cases
import { CreateBeneficiaryUseCase } from './application/use-cases/CreateBeneficiaryUseCase';
import { GetBeneficiariesUseCase } from './application/use-cases/GetBeneficiariesUseCase';
import { UpdateBeneficiaryUseCase } from './application/use-cases/UpdateBeneficiaryUseCase';
import { DeleteBeneficiaryUseCase } from './application/use-cases/DeleteBeneficiaryUseCase';
import { BeneficiaryDomainService } from './domain/services/BeneficiaryDomainService';

const createBeneficiaryUseCase = new CreateBeneficiaryUseCase(beneficiaryRepository, new BeneficiaryDomainService());
const getBeneficiariesUseCase = new GetBeneficiariesUseCase(beneficiaryRepository);
const updateBeneficiaryUseCase = new UpdateBeneficiaryUseCase(beneficiaryRepository, new BeneficiaryDomainService());
const deleteBeneficiaryUseCase = new DeleteBeneficiaryUseCase(beneficiaryRepository);

const beneficiaryController = new BeneficiaryController(
  createBeneficiaryUseCase,
  getBeneficiariesUseCase,
  updateBeneficiaryUseCase,
  deleteBeneficiaryUseCase
);

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
beneficiariesRouter.get('/', async (req: AuthenticatedRequest, res: any) => {
  try {
    const tenantId = req.user?.tenantId!;
    const { page, limit, search } = getBeneficiariesSchema.parse(req.query);
    
    const beneficiaries = await beneficiaryRepository.findByTenant(tenantId, {
      page,
      limit,
      search
    });
    
    const total = await beneficiaryRepository.countByTenant(tenantId, search);
    
    return res.json({
      success: true,
      data: {
        beneficiaries,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      },
      message: "Beneficiaries retrieved successfully"
    });
  } catch (error: any) {
    console.error("Error fetching beneficiaries:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        success: false, 
        message: "Validation error", 
        errors: error.errors.map(e => e.message) 
      });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/beneficiaries/:id - Get a specific beneficiary
beneficiariesRouter.get("/:id", async (req: AuthenticatedRequest, res: any) => {
  try {
    const tenantId = req.user?.tenantId!;
    const { id } = beneficiaryIdSchema.parse(req.params);
    const beneficiary = await beneficiaryRepository.findById(id, tenantId);

    if (!beneficiary) {
      return res.status(404).json({ success: false, message: "Beneficiary not found" });
    }

    return res.json({ success: true, data: { beneficiary }, message: "Beneficiary retrieved successfully" });
  } catch (error: any) {
    console.error("Error fetching beneficiary:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: "Validation error", errors: error.errors.map(e => e.message) });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/beneficiaries - Create a new beneficiary
beneficiariesRouter.post("/", beneficiaryController.create.bind(beneficiaryController));

// PUT /api/beneficiaries/:id - Update a beneficiary
beneficiariesRouter.put("/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const { id } = beneficiaryIdSchema.parse(req.params);
    const beneficiaryData = beneficiarySchema.parse(req.body);

    const beneficiary = await beneficiaryController.update({ id, tenantId, ...beneficiaryData });

    if (!beneficiary) {
      return sendError(res, "Beneficiary not found", 404);
    }

    return sendSuccess(res, { beneficiary }, "Beneficiary updated successfully");
  } catch (error: any) {
    console.error("Error updating beneficiary:", error);
    if (error instanceof z.ZodError) {
      return sendValidationError(res, error.errors.map(e => e.message));
    }
    return sendError(res, error.message, 500);
  }
});

// DELETE /api/beneficiaries/:id - Delete a beneficiary
beneficiariesRouter.delete("/:id", beneficiaryController.delete.bind(beneficiaryController));

// Get customers associated with a beneficiary
beneficiariesRouter.get('/:id/customers', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const { id } = beneficiaryIdSchema.parse(req.params);
    const customers = await beneficiaryController.getBeneficiaryCustomers(tenantId, id);

    return sendSuccess(res, customers, 'Beneficiary customers retrieved successfully');
  } catch (error: any) {
    console.error('Error fetching beneficiary customers:', error);
    return sendError(res, error.message, 500);
  }
});

// Add customer to beneficiary
beneficiariesRouter.post('/:id/customers', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const { id } = beneficiaryIdSchema.parse(req.params);
    const { customerId } = req.body;

    if (!customerId) {
      return sendValidationError(res, ['Customer ID is required']);
    }

    const relationship = await beneficiaryController.addBeneficiaryCustomer(tenantId, id, customerId);

    return sendSuccess(res, relationship, 'Customer added to beneficiary successfully');
  } catch (error: any) {
    console.error('Error adding customer to beneficiary:', error);
    return sendError(res, error.message, 400);
  }
});

// Remove customer from beneficiary
beneficiariesRouter.delete('/:id/customers/:customerId', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const { id, customerId: paramCustomerId } = beneficiaryIdSchema.parse(req.params); // beneficiaryIdSchema is used for beneficiary id
    const { customerId: bodyCustomerId } = req.body; // Assuming customerId might also be in the body, though params is more RESTful

    // Determine which customerId to use. Prefer route parameter if available and valid.
    // If not, fall back to body if it exists.
    const customerIdToUse = paramCustomerId || bodyCustomerId;

    if (!customerIdToUse) {
      return sendValidationError(res, ['Customer ID is required']);
    }

    const success = await beneficiaryController.removeBeneficiaryCustomer(tenantId, id, customerIdToUse);

    if (success) {
      return sendSuccess(res, null, 'Customer removed from beneficiary successfully');
    } else {
      return sendError(res, 'Relationship not found', 404);
    }
  } catch (error: any) {
    console.error('Error removing customer from beneficiary:', error);
    if (error instanceof z.ZodError) {
      return sendValidationError(res, error.errors.map(e => e.message));
    }
    return sendError(res, error.message, 500);
  }
});

// GET /api/beneficiaries/:id/locations - Get locations associated with a beneficiary
beneficiariesRouter.get("/:id/locations", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const { id } = beneficiaryIdSchema.parse(req.params);

    const locations = await beneficiaryController.getBeneficiaryLocations(tenantId, id);

    return sendSuccess(res, locations, "Beneficiary locations retrieved successfully");
  } catch (error: any) {
    console.error("Error fetching beneficiary locations:", error);
    if (error instanceof z.ZodError) {
      return sendValidationError(res, error.errors.map(e => e.message));
    }
    return sendError(res, error.message, 500);
  }
});

// POST /api/beneficiaries/:id/locations - Add location to beneficiary
beneficiariesRouter.post("/:id/locations", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const { id } = beneficiaryIdSchema.parse(req.params);

    const addLocationSchema = z.object({
      locationId: z.string().uuid("Invalid location ID format"),
      isPrimary: z.boolean().optional().default(false)
    });

    const { locationId, isPrimary } = addLocationSchema.parse(req.body);

    const beneficiaryLocation = await beneficiaryController.addBeneficiaryLocation(tenantId, id, locationId, isPrimary);

    return sendSuccess(res, beneficiaryLocation, "Location added to beneficiary successfully", 201);
  } catch (error: any) {
    console.error("Error adding location to beneficiary:", error);
    if (error instanceof z.ZodError) {
      return sendValidationError(res, error.errors.map(e => e.message));
    }
    return sendError(res, error.message, 500);
  }
});

// DELETE /api/beneficiaries/:id/locations/:locationId - Remove location from beneficiary
beneficiariesRouter.delete("/:id/locations/:locationId", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const { id } = beneficiaryIdSchema.parse(req.params);
    const locationIdSchema = z.object({
      locationId: z.string().uuid("Invalid location ID format")
    });
    const { locationId } = locationIdSchema.parse(req.params);

    const success = await beneficiaryController.removeBeneficiaryLocation(tenantId, id, locationId);

    if (success) {
      return sendSuccess(res, null, "Location removed from beneficiary successfully");
    } else {
      return sendError(res, "Location association not found", 404);
    }
  } catch (error: any) {
    console.error("Error removing location from beneficiary:", error);
    if (error instanceof z.ZodError) {
      return sendValidationError(res, error.errors.map(e => e.message));
    }
    return sendError(res, error.message, 500);
  }
});

// PUT /api/beneficiaries/:id/locations/:locationId/primary - Update primary status
beneficiariesRouter.put("/:id/locations/:locationId/primary", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const { id } = beneficiaryIdSchema.parse(req.params);
    const locationIdSchema = z.object({
      locationId: z.string().uuid("Invalid location ID format")
    });
    const { locationId } = locationIdSchema.parse(req.params);

    const updatePrimarySchema = z.object({
      isPrimary: z.boolean()
    });

    const { isPrimary } = updatePrimarySchema.parse(req.body);

    const success = await beneficiaryController.updateBeneficiaryLocationPrimary(tenantId, id, locationId, isPrimary);

    if (success) {
      return sendSuccess(res, null, "Location primary status updated successfully");
    } else {
      return sendError(res, "Location association not found", 404);
    }
  } catch (error: any) {
    console.error("Error updating location primary status:", error);
    if (error instanceof z.ZodError) {
      return sendValidationError(res, error.errors.map(e => e.message));
    }
    return sendError(res, error.message, 500);
  }
});

export default beneficiariesRouter;