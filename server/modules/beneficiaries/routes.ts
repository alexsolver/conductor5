
/**
 * BENEFICIARIES ROUTES
 * Clean Architecture: Presentation layer routes with proper dependency injection
 */

import { Router } from 'express';
import { BeneficiariesController } from './application/controllers/BeneficiariesController';
import { CreateBeneficiaryUseCase } from './application/use-cases/CreateBeneficiaryUseCase';
import { UpdateBeneficiaryUseCase } from './application/use-cases/UpdateBeneficiaryUseCase';
import { GetBeneficiariesUseCase } from './application/use-cases/GetBeneficiariesUseCase';
import { DeleteBeneficiaryUseCase } from './application/use-cases/DeleteBeneficiaryUseCase';
import { DrizzleBeneficiaryRepository } from './infrastructure/repositories/DrizzleBeneficiaryRepository';

export function createBeneficiariesRoutes(db: any, schema: any, jwtAuth: any): Router {
  const router = Router();

  try {
    // Repository instance
    const beneficiaryRepository = new DrizzleBeneficiaryRepository(db, schema);

    // Use Cases instances
    const createBeneficiaryUseCase = new CreateBeneficiaryUseCase(beneficiaryRepository);
    const updateBeneficiaryUseCase = new UpdateBeneficiaryUseCase(beneficiaryRepository);
    const getBeneficiariesUseCase = new GetBeneficiariesUseCase(beneficiaryRepository);
    const deleteBeneficiaryUseCase = new DeleteBeneficiaryUseCase(beneficiaryRepository);

    // Controller instance with dependency injection
    const controller = new BeneficiariesController(
      createBeneficiaryUseCase,
      updateBeneficiaryUseCase,
      getBeneficiariesUseCase,
      deleteBeneficiaryUseCase
    );

    // Routes with proper middleware
    router.get('/', jwtAuth, (req, res) => controller.getBeneficiaries(req, res));
    router.post('/', jwtAuth, (req, res) => controller.createBeneficiary(req, res));
    router.put('/:id', jwtAuth, (req, res) => controller.updateBeneficiary(req, res));
    router.delete('/:id', jwtAuth, (req, res) => controller.deleteBeneficiary(req, res));

    console.log('✅ Beneficiaries routes registered successfully');
    return router;
  } catch (error) {
    console.error('❌ Error creating beneficiaries routes:', error);
    return router;
  }
}

// Default export for backward compatibility
const router = Router();
export default router;
