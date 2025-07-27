// LOCATIONS NEW ROUTES - API routes for 7 record types
import { Router } from "express";
import { LocationsNewController } from "./LocationsNewController";
import { LocationsNewRepository } from "./LocationsNewRepository";
import { DatabaseStorage } from "../../storage-simple";
import { jwtAuth } from "../../middleware/jwtAuth";

const router = Router();
const storage = new DatabaseStorage();
const repository = new LocationsNewRepository(storage);
const controller = new LocationsNewController(repository);

// Apply JWT authentication to all routes
router.use(jwtAuth);

// Get records by type
router.get('/:recordType', controller.getRecordsByType.bind(controller));

// Get statistics by type
router.get('/:recordType/stats', controller.getStatsByType.bind(controller));

// Create operations for each record type
router.post('/local', controller.createLocal.bind(controller));
router.post('/regiao', controller.createRegiao.bind(controller));
router.post('/rota-dinamica', controller.createRotaDinamica.bind(controller));
router.post('/trecho', controller.createTrecho.bind(controller));
router.post('/rota-trecho', controller.createRotaTrecho.bind(controller));
router.post('/area', controller.createArea.bind(controller));
router.post('/agrupamento', controller.createAgrupamento.bind(controller));

// Update and delete operations
router.put('/:recordType/:id', controller.updateRecord.bind(controller));
router.delete('/:recordType/:id', controller.deleteRecord.bind(controller));

// Utility services
router.get('/services/cep/:cep', controller.lookupCep.bind(controller));
router.get('/services/holidays', controller.lookupHolidays.bind(controller));

export default router;