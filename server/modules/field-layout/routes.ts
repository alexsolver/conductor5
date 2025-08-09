
import { Router } from 'express';
import { FieldLayoutController } from './application/controllers/FieldLayoutController';
import { CreateFieldLayoutUseCase } from './application/use-cases/CreateFieldLayoutUseCase';
import { GetFieldLayoutsUseCase } from './application/use-cases/GetFieldLayoutsUseCase';
import { DrizzleFieldLayoutRepository } from './infrastructure/repositories/DrizzleFieldLayoutRepository';
import { FieldLayoutDomainService } from './domain/services/FieldLayoutDomainService';
import { jwtAuth, AuthenticatedRequest } from '../../middleware/jwtAuth';

const router = Router();

// Dependency injection
const repository = new DrizzleFieldLayoutRepository();
const domainService = new FieldLayoutDomainService();
const createUseCase = new CreateFieldLayoutUseCase(repository, domainService);
const getUseCase = new GetFieldLayoutsUseCase(repository);
const controller = new FieldLayoutController(createUseCase, getUseCase);

// Routes
router.post('/', jwtAuth, async (req: AuthenticatedRequest, res) => {
  req.body.tenantId = req.user?.tenantId;
  await controller.create(req, res);
});

router.get('/tenant/:tenantId', jwtAuth, async (req: AuthenticatedRequest, res) => {
  await controller.getByTenant(req, res);
});

export default router;
