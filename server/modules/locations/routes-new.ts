// LOCATIONS NEW ROUTES - API routes for 7 record types
import { Router, Request, Response, NextFunction } from "express";
import { LocationsNewController } from './LocationsNewController';
import { LocationsNewRepository } from './LocationsNewRepository';
import { getTenantDb } from '../../db-tenant';
import { DatabaseStorage } from "../../storage-simple";
import { jwtAuth, AuthenticatedRequest } from "../../middleware/jwtAuth";

const router = Router();

// Apply JWT authentication to all routes
router.use(jwtAuth);

// Extend AuthenticatedRequest interface for locations
interface LocationsRequest extends AuthenticatedRequest {
  tenantDb?: any;
}

// Middleware to get tenant database pool (after authentication)
router.use('*', async (req: LocationsRequest, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      console.error('No tenant ID found in token:', req.user);
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid or expired token',
        error: 'No tenant ID found'
      });
    }

    // Get the database pool directly for SQL queries
    const { schemaManager } = await import('../../db');
    req.tenantDb = schemaManager.getPool();
    next();
  } catch (error) {
    console.error('Error getting tenant database:', error);
    return res.status(500).json({ success: false, message: 'Database connection error' });
  }
});

// Initialize controller with proper error handling
let controller: LocationsNewController;
try {
  controller = new LocationsNewController();
  console.log('✅ LocationsNewController initialized successfully');
} catch (error) {
  console.error('❌ Failed to initialize LocationsNewController:', error);
  throw error;
}

// Controller factory function
const getController = (req: LocationsRequest) => controller;

// Integration endpoints FIRST (most specific)
router.get("/integration/clientes", async (req: AuthenticatedRequest, res: Response) => {
  try {
    await controller.getClientes(req, res);
  } catch (error) {
    console.error('Error in clientes integration:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch clientes', error: error.message });
  }
});

router.get("/integration/tecnicos", async (req: AuthenticatedRequest, res: Response) => {
  try {
    await controller.getTecnicosEquipe(req, res);
  } catch (error) {
    console.error('Error in tecnicos integration:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch tecnicos', error: error.message });
  }
});

router.get("/integration/grupos", async (req: AuthenticatedRequest, res: Response) => {
  try {
    await controller.getGruposEquipe(req, res);
  } catch (error) {
    console.error('Error in grupos integration:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch grupos', error: error.message });
  }
});

router.get("/integration/locais", async (req: AuthenticatedRequest, res: Response) => {
  try {
    await controller.getLocaisAtendimento(req, res);
  } catch (error) {
    console.error('Error in locais integration:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch locais', error: error.message });
  }
});

// Services endpoints
router.get('/services/cep/:cep', async (req: LocationsRequest, res: Response) => {
  return controller.lookupCep(req, res);
});

router.get('/services/holidays', async (req: LocationsRequest, res: Response) => {
  return controller.lookupHolidays(req, res);
});

router.post('/services/geocode', async (req: LocationsRequest, res: Response) => {
  return controller.geocodeAddress(req, res);
});

// Get statistics by type 
router.get('/:recordType/stats', async (req: LocationsRequest, res: Response) => {
  return controller.getStatsByType(req, res);
});

// Get records by type (most generic - should be LAST)
router.get('/:recordType', async (req: LocationsRequest, res: Response) => {
  const { recordType } = req.params;
  
  // Validate record type first
  const validTypes = ['local', 'regiao', 'rota-dinamica', 'trecho', 'rota-trecho', 'area', 'agrupamento'];
  if (!validTypes.includes(recordType)) {
    return res.status(400).json({
      success: false,
      message: `Invalid record type: ${recordType}. Valid types: ${validTypes.join(', ')}`
    });
  }
  
  return controller.getRecordsByType(req, res);
});

// Create operations
router.post('/local', async (req: LocationsRequest, res: Response) => {
  return controller.createLocal(req, res);
});

router.post('/regiao', async (req: LocationsRequest, res: Response) => {
  return controller.createRegiao(req, res);
});

router.post('/rota-dinamica', async (req: AuthenticatedRequest, res: Response) => {
  return controller.createRotaDinamica(req, res);
});

router.post('/trecho', async (req: AuthenticatedRequest, res: Response) => {
  return controller.createTrecho(req, res);
});

router.post('/rota-trecho', async (req: AuthenticatedRequest, res: Response) => {
  return controller.createRotaTrecho(req, res);
});

router.post('/area', async (req: AuthenticatedRequest, res: Response) => {
  return controller.createArea(req, res);
});

router.post('/agrupamento', async (req: AuthenticatedRequest, res: Response) => {
  return controller.createAgrupamento(req, res);
});

// Update operations
router.put('/:recordType/:id', async (req: AuthenticatedRequest, res: Response) => {
  return controller.updateRecord(req, res);
});

// Delete operations
router.delete('/:recordType/:id', async (req: AuthenticatedRequest, res: Response) => {
  return controller.deleteRecord(req, res);
});

export default router;