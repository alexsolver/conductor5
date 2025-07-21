
import { Router } from 'express''[,;]
import { jwtAuth } from '../../middleware/jwtAuth''[,;]
import { InternalFormController } from './application/controllers/InternalFormController''[,;]
import { CreateInternalFormUseCase } from './application/use-cases/CreateInternalFormUseCase''[,;]
import { SubmitFormUseCase } from './application/use-cases/SubmitFormUseCase''[,;]
import { DrizzleInternalFormRepository } from './infrastructure/repositories/DrizzleInternalFormRepository''[,;]
import { DrizzleFormSubmissionRepository } from './infrastructure/repositories/DrizzleFormSubmissionRepository''[,;]
import { InternalFormActionsService } from './application/services/InternalFormActionsService''[,;]

const router = Router();

// Initialize dependencies
const formRepository = new DrizzleInternalFormRepository();
const submissionRepository = new DrizzleFormSubmissionRepository();
const actionsService = new InternalFormActionsService();

const createFormUseCase = new CreateInternalFormUseCase(formRepository);
const submitFormUseCase = new SubmitFormUseCase(formRepository, submissionRepository, actionsService);

const controller = new InternalFormController(
  createFormUseCase,
  submitFormUseCase,
  formRepository,
  submissionRepository
);

// Form management routes
router.post('/forms', jwtAuth, (req, res) => controller.createForm(req, res));
router.get('/forms', jwtAuth, (req, res) => controller.getForms(req, res));
router.get('/forms/:id', jwtAuth, (req, res) => controller.getForm(req, res));
router.put('/forms/:id', jwtAuth, (req, res) => controller.updateForm(req, res));
router.delete('/forms/:id', jwtAuth, (req, res) => controller.deleteForm(req, res));

// Form submission routes
router.post('/forms/:id/submit', jwtAuth, (req, res) => controller.submitForm(req, res));
router.get('/submissions', jwtAuth, (req, res) => controller.getSubmissions(req, res));
router.get('/submissions/:id', jwtAuth, (req, res) => controller.getSubmission(req, res));

// Approval routes
router.post('/submissions/:id/approve', jwtAuth, (req, res) => controller.approveSubmission(req, res));
router.post('/submissions/:id/reject', jwtAuth, (req, res) => controller.rejectSubmission(req, res));

// Categories routes
router.get('/categories', jwtAuth, (req, res) => controller.getCategories(req, res));
router.post('/categories', jwtAuth, (req, res) => controller.createCategory(req, res));

export default router;
