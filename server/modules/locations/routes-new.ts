// LOCATIONS NEW ROUTES - API routes for 7 record types
import { Router, Request, Response, NextFunction } from "express";
import { LocationsNewController } from './LocationsNewController';
import { LocationsNewRepository } from './LocationsNewRepository';
import { getTenantDb } from '../../db-tenant';
import { DatabaseStorage } from "../../storage-simple";
import { jwtAuth } from "../../middleware/jwtAuth";

const router = Router();

// Middleware to augment request with tenantId
interface AuthenticatedRequest extends Request {
  user?: {
    tenantId: string;
  };
  tenantDb: any; // Define the type for tenantDb based on your actual database type
}

// Apply JWT authentication to all routes FIRST
router.use(jwtAuth);

// Middleware to get tenant database (after authentication)
router.use('*', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return res.status(401).json({ success: false, message: 'Não foi possível identificar o tenant. Faça login novamente.' });
    }

    req.tenantDb = await getTenantDb(tenantId);
    next();
  } catch (error) {
    console.error('Error getting tenant database:', error);
    return res.status(500).json({ success: false, message: 'Database connection error' });
  }
});

// Controller factory function
const getController = (req: AuthenticatedRequest) => new LocationsNewController(req.tenantDb);

// Get records by type
router.get('/:recordType', async (req: AuthenticatedRequest, res: Response) => {
  const controller = getController(req);
  return controller.getRecordsByType(req, res);
});

// Get statistics by type  
router.get('/:recordType/stats', async (req: AuthenticatedRequest, res: Response) => {
  const controller = getController(req);
  return controller.getStatsByType(req, res);
});

// CEP lookup
router.get('/services/cep/:cep', async (req: AuthenticatedRequest, res: Response) => {
  const controller = getController(req);
  return controller.lookupCep(req, res);
});

// Holidays lookup
router.get('/services/holidays', async (req: AuthenticatedRequest, res: Response) => {
  const controller = getController(req);
  return controller.lookupHolidays(req, res);
});

// Geocoding
router.post('/services/geocode', async (req: AuthenticatedRequest, res: Response) => {
  const controller = getController(req);
  return controller.geocodeAddress(req, res);
});

// Create operations
router.post('/local', async (req: AuthenticatedRequest, res: Response) => {
  const controller = getController(req);
  return controller.createLocal(req, res);
});

router.post('/regiao', async (req: AuthenticatedRequest, res: Response) => {
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

export default router;