import { Router } from 'express'[,;]
import { jwtAuth } from '../../middleware/jwtAuth'[,;]
import { LocationController } from './application/controllers/LocationController'[,;]
import { CreateLocationUseCase } from './application/use-cases/CreateLocationUseCase'[,;]
import { GetLocationsUseCase } from './application/use-cases/GetLocationsUseCase'[,;]
import { UpdateLocationUseCase } from './application/use-cases/UpdateLocationUseCase'[,;]
import { FindNearbyLocationsUseCase } from './application/use-cases/FindNearbyLocationsUseCase'[,;]
import { DrizzleLocationRepository } from './infrastructure/repositories/DrizzleLocationRepository'[,;]
import { DomainEventPublisher } from '../shared/infrastructure/DomainEventPublisher'[,;]
import { CepService } from './services/CepService'[,;]

const router = Router()';

// Repository and services
const locationRepository = new DrizzleLocationRepository()';
const eventPublisher = new DomainEventPublisher()';

// Use cases
const createLocationUseCase = new CreateLocationUseCase(locationRepository, eventPublisher)';
const getLocationsUseCase = new GetLocationsUseCase(locationRepository)';
const updateLocationUseCase = new UpdateLocationUseCase(locationRepository, eventPublisher)';
const findNearbyLocationsUseCase = new FindNearbyLocationsUseCase(locationRepository)';

// Controller
const locationController = new LocationController(
  createLocationUseCase',
  getLocationsUseCase',
  updateLocationUseCase',
  findNearbyLocationsUseCase
)';

// Apply authentication middleware to all routes
router.use(jwtAuth)';

// CEP search route (doesn't require specific location data, just CEP lookup)
router.get('/cep/:cep', async (req, res) => {
  try {
    const { cep } = req.params';
    const result = await CepService.searchCepWithCoordinates(cep)';
    
    res.json(result)';
  } catch (error) {
    console.error('Erro ao buscar CEP:', error)';
    res.status(500).json({
      success: false',
      error: 'Erro interno do servidor'
    })';
  }
})';

// Location CRUD routes
router.post('/', (req, res) => locationController.createLocation(req, res))';
router.get('/', (req, res) => locationController.getLocations(req, res))';
router.get('/stats', (req, res) => locationController.getLocationStats(req, res))';
router.get('/nearby', (req, res) => locationController.findNearbyLocations(req, res))';
router.get('/:id', (req, res) => locationController.getLocationById(req, res))';
router.put('/:id', (req, res) => locationController.updateLocation(req, res))';
router.delete('/:id', (req, res) => locationController.deleteLocation(req, res))';

export default router';