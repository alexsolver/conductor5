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

// Controller factory function
const getController = (req: LocationsRequest) => new LocationsNewController(req.tenantDb);

// Get statistics by type FIRST to avoid UUID conflict  
router.get('/:recordType/stats', async (req: LocationsRequest, res: Response) => {
  const controller = getController(req);
  return controller.getStatsByType(req, res);
});

// Get records by type
router.get('/:recordType', async (req: LocationsRequest, res: Response) => {
  const controller = getController(req);
  return controller.getRecordsByType(req, res);
});

// CEP lookup
router.get('/services/cep/:cep', async (req: LocationsRequest, res: Response) => {
  const controller = getController(req);
  return controller.lookupCep(req, res);
});

// Holidays lookup
router.get('/holidays', async (req: LocationsRequest, res: Response) => {
  const controller = getController(req);
  return controller.lookupHolidays(req, res);
});

// Geocoding
router.post('/services/geocode', async (req: LocationsRequest, res: Response) => {
  const controller = getController(req);
  return controller.geocodeAddress(req, res);
});

// Create operations
router.post('/local', async (req: LocationsRequest, res: Response) => {
  const controller = getController(req);
  return controller.createLocal(req, res);
});

router.post('/regiao', async (req: LocationsRequest, res: Response) => {
  const controller = getController(req);
  return controller.createRegiao(req, res);
});

router.post('/rota-dinamica', async (req: AuthenticatedRequest, res: Response) => {
  const controller = getController(req);
  return controller.createRotaDinamica(req, res);
});

router.post('/trecho', async (req: AuthenticatedRequest, res: Response) => {
  const controller = getController(req);
  return controller.createTrecho(req, res);
});

router.post('/rota-trecho', async (req: AuthenticatedRequest, res: Response) => {
  const controller = getController(req);
  return controller.createRotaTrecho(req, res);
});

router.post('/area', async (req: AuthenticatedRequest, res: Response) => {
  const controller = getController(req);
  return controller.createArea(req, res);
});

router.post('/agrupamento', async (req: AuthenticatedRequest, res: Response) => {
  const controller = getController(req);
  return controller.createAgrupamento(req, res);
});

// Update operations
router.put('/:recordType/:id', async (req: AuthenticatedRequest, res: Response) => {
  const controller = getController(req);
  return controller.updateRecord(req, res);
});

// Delete operations
router.delete('/:recordType/:id', async (req: AuthenticatedRequest, res: Response) => {
  const controller = getController(req);
  return controller.deleteRecord(req, res);
});

// CEP and geocoding services
router.get("/services/cep/:cep", async (req: AuthenticatedRequest, res: Response) => {
  const controller = getController(req);
  return controller.lookupCep(req, res);
});
router.post("/services/geocode", async (req: AuthenticatedRequest, res: Response) => {
  const controller = getController(req);
  return controller.geocodeAddress(req, res);
});
router.get("/services/holidays", async (req: AuthenticatedRequest, res: Response) => {
  const controller = getController(req);
  return controller.lookupHolidays(req, res);
});

  // Integration endpoints for region relationships
router.get("/integration/clientes", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const controller = getController(req);
    await controller.getClientes(req, res);
  } catch (error) {
    console.error('Error in clientes integration:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch clientes', error: error.message });
  }
});

router.get("/integration/tecnicos", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const controller = getController(req);
    await controller.getTecnicosEquipe(req, res);
  } catch (error) {
    console.error('Error in tecnicos integration:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch tecnicos', error: error.message });
  }
});

router.get("/integration/grupos", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const controller = getController(req);
    await controller.getGruposEquipe(req, res);
  } catch (error) {
    console.error('Error in grupos integration:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch grupos', error: error.message });
  }
});

router.get("/integration/locais", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const controller = getController(req);
    await controller.getLocaisAtendimento(req, res);
  } catch (error) {
    console.error('Error in locais integration:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch locais', error: error.message });
  }
});

export default router;