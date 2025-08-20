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
 * Get supported languages (public endpoint - NO AUTH REQUIRED)
 */
router.get('/languages', (req: any, res: any) => {
  // Endpoint público para idiomas - sem autenticação
  res.json({
    success: true,
    data: [
      { code: 'en', name: 'English', nativeName: 'English' },
      { code: 'pt-BR', name: 'Portuguese (Brazil)', nativeName: 'Português (Brasil)' },
      { code: 'es', name: 'Spanish', nativeName: 'Español' }
    ]
  });
});

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

/**
 * POST /api/translations/seed
 * Seed basic translations (admin only)
 */
router.post('/seed', jwtAuth, async (req: any, res: any) => {
  try {
    if (req.user?.role !== 'saas_admin') {
      return res.status(403).json({
        success: false,
        message: 'SaaS Admin access required'
      });
    }

    const { SeedTranslationsUseCase } = await import('./application/use-cases/SeedTranslationsUseCase');
    const { DrizzleTranslationRepository } = await import('./infrastructure/repositories/DrizzleTranslationRepository');
    const { TranslationDomainService } = await import('./domain/services/TranslationDomainService');
    
    const repository = new DrizzleTranslationRepository();
    const domainService = new TranslationDomainService();
    const seedUseCase = new SeedTranslationsUseCase(repository, domainService);
    
    const result = await seedUseCase.execute();
    
    res.json({
      success: true,
      message: `Seeding completed: ${result.created} created, ${result.updated} updated`,
      data: result
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to seed translations'
    });
  }
});

export default router;