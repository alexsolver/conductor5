import { Router } from 'express';
import { BeneficiariesController } from './application/controllers/BeneficiariesController';
import { jwtAuth } from '../../middleware/jwtAuth';

const router = Router();
const controller = new BeneficiariesController();

router.get('/', jwtAuth, (req, res) => controller.getBeneficiaries(req, res));
router.post('/', jwtAuth, (req, res) => controller.createBeneficiary(req, res));
router.put('/:id', jwtAuth, (req, res) => controller.updateBeneficiary(req, res));
router.delete('/:id', jwtAuth, (req, res) => controller.deleteBeneficiary(req, res));

export { router as beneficiariesRouter };