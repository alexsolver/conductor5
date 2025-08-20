/**
 * Translation Management Routes
 * Clean Architecture presentation layer for translation module
 */

import { Router } from 'express';
import { jwtAuth, AuthenticatedRequest } from '../../middleware/jwtAuth';
import { TranslationController } from './application/controllers/TranslationController';
import { CreateTranslationUseCase } from './application/use-cases/CreateTranslationUseCase';
import { UpdateTranslationUseCase } from './application/use-cases/UpdateTranslationUseCase';
import { BulkImportTranslationsUseCase } from './application/use-cases/BulkImportTranslationsUseCase';
import { GetTranslationStatsUseCase } from './application/use-cases/GetTranslationStatsUseCase';
import { SearchTranslationsUseCase } from './application/use-cases/SearchTranslationsUseCase';
import { DrizzleTranslationRepository } from './infrastructure/repositories/DrizzleTranslationRepository';
import { TranslationDomainService } from './domain/services/TranslationDomainService';

const router = Router();

// Dependency injection setup following 1qa.md patterns
function createTranslationController(): TranslationController {
  const repository = new DrizzleTranslationRepository();
  const domainService = new TranslationDomainService();
  
  const createUseCase = new CreateTranslationUseCase(repository, domainService);
  const updateUseCase = new UpdateTranslationUseCase(repository, domainService);
  const bulkImportUseCase = new BulkImportTranslationsUseCase(repository, domainService);
  const getStatsUseCase = new GetTranslationStatsUseCase(repository, domainService);
  const searchUseCase = new SearchTranslationsUseCase(repository);
  
  return new TranslationController(
    createUseCase,
    updateUseCase,
    bulkImportUseCase,
    getStatsUseCase,
    searchUseCase
  );
}

const controller = createTranslationController();

// Route definitions following RESTful patterns

/**
 * GET /api/translations/languages
 * Get supported languages
 */
router.get('/languages', controller.getLanguages.bind(controller));

/**
 * GET /api/translations/stats
 * Get translation statistics
 */
router.get('/stats', jwtAuth, controller.getStats.bind(controller));

/**
 * GET /api/translations/search
 * Search translations
 */
router.get('/search', jwtAuth, controller.searchTranslations.bind(controller));

/**
 * GET /api/translations/export
 * Export translations
 */
router.get('/export', jwtAuth, controller.exportTranslations.bind(controller));

/**
 * GET /api/translations/:language
 * Get translations for a specific language
 */
router.get('/:language', jwtAuth, controller.getTranslationsByLanguage.bind(controller));

/**
 * POST /api/translations
 * Create a new translation
 */
router.post('/', jwtAuth, controller.createTranslation.bind(controller));

/**
 * POST /api/translations/bulk-import
 * Bulk import translations
 */
router.post('/bulk-import', jwtAuth, controller.bulkImport.bind(controller));

/**
 * PUT /api/translations/:id
 * Update a translation
 */
router.put('/:id', jwtAuth, controller.updateTranslation.bind(controller));

/**
 * PATCH /api/translations/:id
 * Partially update a translation
 */
router.patch('/:id', jwtAuth, controller.updateTranslation.bind(controller));

export default router;