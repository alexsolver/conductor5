/**
 * Translation Completion API Routes
 * Automated translation completion following 1qa.md patterns
 */

import { Router } from 'express';
import { jwtAuth, AuthenticatedRequest } from '../middleware/jwtAuth';
import { TranslationCompletionService } from '../services/TranslationCompletionService';

const router = Router();
const translationService = new TranslationCompletionService();

/**
 * GET /api/translation-completion/analyze
 * Analisa gaps de tradução em todos os idiomas
 */
router.get('/analyze', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    // Verificar se usuário é SaaS admin
    if (req.user?.role !== 'saas_admin') {
      return res.status(403).json({ message: 'SaaS admin access required' });
    }

    const report = await translationService.generateCompletenessReport();

    res.json({
      success: true,
      data: report,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error analyzing translation completeness:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to analyze translation completeness' 
    });
  }
});

/**
 * GET /api/translation-completion/scan-keys
 * Escaneia todas as chaves de tradução no código fonte
 */
router.get('/scan-keys', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    if (req.user?.role !== 'saas_admin') {
      return res.status(403).json({ message: 'SaaS admin access required' });
    }

    const keys = await translationService.scanTranslationKeys();

    // Agrupa por módulo para melhor visualização
    const keysByModule = keys.reduce((acc, key) => {
      if (!acc[key.module]) {
        acc[key.module] = [];
      }
      acc[key.module].push(key);
      return acc;
    }, {} as Record<string, typeof keys>);

    res.json({
      success: true,
      data: {
        totalKeys: keys.length,
        keysByModule,
        keysByPriority: {
          high: keys.filter(k => k.priority === 'high').length,
          medium: keys.filter(k => k.priority === 'medium').length,
          low: keys.filter(k => k.priority === 'low').length
        }
      }
    });

  } catch (error) {
    console.error('Error scanning translation keys:', error);
    res.status(500).json({
      success: false, 
      message: 'Failed to scan translation keys' 
    });
  }
});

/**
 * POST /api/translation-completion/complete
 * Completa traduções faltantes automaticamente
 */
router.post('/complete', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    if (req.user?.role !== 'saas_admin') {
      return res.status(403).json({ message: 'SaaS admin access required' });
    }

    const { force = false, languages = [] } = req.body;

    // Se idiomas específicos foram solicitados, filtra apenas eles
    const targetLanguages = languages.length > 0 ? languages : undefined;

    const results = await translationService.completeTranslations(force);

    // Filtra resultados se idiomas específicos foram solicitados
    const filteredResults = targetLanguages 
      ? results.filter(r => targetLanguages.includes(r.language))
      : results;

    const summary = {
      totalLanguages: filteredResults.length,
      totalKeysAdded: filteredResults.reduce((sum, r) => sum + r.addedKeys.length, 0),
      totalErrors: filteredResults.reduce((sum, r) => sum + r.errors.length, 0),
      successfulLanguages: filteredResults.filter(r => r.errors.length === 0).length
    };

    res.json({
      success: true,
      data: {
        summary,
        results: filteredResults
      },
      message: `Completed translations for ${summary.totalLanguages} languages. Added ${summary.totalKeysAdded} keys.`
    });

  } catch (error) {
    console.error('Error completing translations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete translations'
    });
  }
});

/**
 * GET /api/translation-completion/gaps/:language
 * Analisa gaps específicos de um idioma
 */
router.get('/gaps/:language', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    if (req.user?.role !== 'saas_admin') {
      return res.status(403).json({ message: 'SaaS admin access required' });
    }

    const { language } = req.params;
    const supportedLanguages = ['en', 'pt', 'es'];

    if (!supportedLanguages.includes(language)) {
      return res.status(400).json({
        success: false,
        message: 'Unsupported language'
      });
    }

    const gaps = await translationService.analyzeTranslationGaps();
    const languageGap = gaps.find(g => g.language === language);

    if (!languageGap) {
      return res.status(404).json({
        success: false,
        message: 'Language gap analysis not found'
      });
    }

    res.json({
      success: true,
      data: languageGap
    });

  } catch (error) {
    console.error('Error analyzing language gaps:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to analyze language gaps'
    });
  }
});

/**
 * GET /api/translation-completion/detect-hardcoded
 * Detecta textos hardcoded que precisam ser traduzidos
 */
router.get('/detect-hardcoded', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    if (req.user?.role !== 'saas_admin') {
      return res.status(403).json({ message: 'SaaS admin access required' });
    }

    const hardcodedTexts = await translationService.detectHardcodedTexts();

    // Agrupa por arquivo para melhor visualização
    const fileGroups = hardcodedTexts.reduce((acc, item) => {
      if (!acc[item.file]) {
        acc[item.file] = [];
      }
      acc[item.file].push(item);
      return acc;
    }, {} as Record<string, typeof hardcodedTexts>);

    const summary = {
      totalTexts: hardcodedTexts.length,
      totalFiles: Object.keys(fileGroups).length,
      byModule: hardcodedTexts.reduce((acc, item) => {
        const module = item.suggestedKey.split('.')[0];
        acc[module] = (acc[module] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };

    res.json({
      success: true,
      data: {
        summary,
        fileGroups,
        hardcodedTexts: hardcodedTexts.slice(0, 50) // Limita para não sobrecarregar
      }
    });

  } catch (error) {
    console.error('Error detecting hardcoded texts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to detect hardcoded texts'
    });
  }
});

/**
 * POST /api/translation-completion/replace-hardcoded
 * Substitui textos hardcoded por chaves de tradução
 */
router.post('/replace-hardcoded', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    if (req.user?.role !== 'saas_admin') {
      return res.status(403).json({ message: 'SaaS admin access required' });
    }

    const { dryRun = true } = req.body;

    const results = await translationService.replaceHardcodedTexts(dryRun);

    const summary = {
      totalFiles: results.length,
      successfulFiles: results.filter(r => r.success).length,
      totalReplacements: results.reduce((sum, r) => sum + r.replacements, 0),
      filesWithErrors: results.filter(r => !r.success).length
    };

    res.json({
      success: true,
      data: {
        summary,
        results,
        mode: dryRun ? 'simulation' : 'applied'
      },
      message: dryRun 
        ? `Simulation complete: ${summary.totalReplacements} replacements would be made`
        : `Applied ${summary.totalReplacements} replacements across ${summary.successfulFiles} files`
    });

  } catch (error) {
    console.error('Error replacing hardcoded texts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to replace hardcoded texts'
    });
  }
});

/**
 * POST /api/translation-completion/auto-complete-all
 * Completa automaticamente todas as traduções faltantes
 */
router.post('/auto-complete-all', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    if (req.user?.role !== 'saas_admin') {
      return res.status(403).json({ message: 'SaaS admin access required' });
    }

    console.log('🔄 [AUTO-TRANSLATION] Starting SAFE automatic completion...');

    // MODO SEGURO: Apenas completa arquivos de tradução JSON, NÃO modifica código
    console.log('🚨 [SAFETY] Running in SAFE MODE - no TypeScript files will be modified');

    // 1. Completa apenas traduções nos arquivos JSON com timeout de segurança
    const completionResults = await Promise.race([
      translationService.completeAllTranslations(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Translation completion timeout')), 30000)
      )
    ]) as any[];

    // 2. DESABILITADO: Substituição de textos hardcoded (causa crashes)
    console.log('🚨 [SAFETY] Hardcoded text replacement DISABLED to prevent code corruption');
    const hardcodedResults = []; // Array vazio para evitar crashes

    // 3. Gera relatório final com timeout
    const finalReport = await Promise.race([
      translationService.generateCompletenessReport(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Report generation timeout')), 10000)
      )
    ]) as any;

    const summary = {
      translationsAdded: Array.isArray(completionResults) ? completionResults.reduce((sum, r) => sum + (r.addedKeys?.length || 0), 0) : 0,
      hardcodedTextsReplaced: Array.isArray(hardcodedResults) ? hardcodedResults.reduce((sum, r) => sum + (r.replacements || 0), 0) : 0,
      filesModified: Array.isArray(hardcodedResults) ? hardcodedResults.filter(r => r.success && r.replacements > 0).length : 0,
      finalCompleteness: finalReport?.summary?.languageStats || {}
    };

    console.log('✅ [AUTO-TRANSLATION] Completion successful:', summary);

    res.json({
      success: true,
      data: {
        summary,
        completionResults: Array.isArray(completionResults) ? completionResults : [],
        hardcodedResults: Array.isArray(hardcodedResults) ? hardcodedResults.filter(r => r.replacements > 0) : [],
        finalReport: finalReport || { summary: { languageStats: {} }, gaps: [] }
      },
      message: `Auto-translation completed! Added ${summary.translationsAdded} translations and replaced ${summary.hardcodedTextsReplaced} hardcoded texts in ${summary.filesModified} files.`
    });

  } catch (error) {
    console.error('❌ [AUTO-TRANSLATION] Critical error:', error);
    res.json({
      success: false,
      data: {
        summary: {
          translationsAdded: 0,
          hardcodedTextsReplaced: 0,
          filesModified: 0,
          finalCompleteness: {}
        },
        completionResults: [],
        hardcodedResults: [],
        finalReport: { summary: { languageStats: {} }, gaps: [] }
      },
      message: `Auto-translation encountered an error: ${error.message}. Please try again later.`,
      error: error.message
    });
  }
});

/**
 * POST /api/translation-completion/clean-invalid
 * Remove chaves de tradução inválidas dos arquivos
 */
router.post('/clean-invalid', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    if (req.user?.role !== 'saas_admin') {
      return res.status(403).json({ message: 'SaaS admin access required' });
    }

    const results = await translationService.cleanInvalidTranslationKeys();

    res.json({
      success: true,
      data: results,
      message: `Cleaned ${results.totalKeysRemoved} invalid keys from ${results.filesProcessed} files`
    });

  } catch (error) {
    console.error('Error cleaning invalid translation keys:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clean invalid translation keys'
    });
  }
});

/**
 * POST /api/translation-completion/validate
 * Valida integridade das traduções
 */
router.post('/validate', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    if (req.user?.role !== 'saas_admin') {
      return res.status(403).json({ message: 'SaaS admin access required' });
    }

    const report = await translationService.generateCompletenessReport();

    // Identifica problemas críticos
    const criticalIssues = [];
    const warnings = [];

    for (const [language, stats] of Object.entries(report.summary.languageStats)) {
      if (stats.completeness < 50) {
        criticalIssues.push(`${language}: only ${stats.completeness}% complete`);
      } else if (stats.completeness < 80) {
        warnings.push(`${language}: ${stats.completeness}% complete`);
      }
    }

    // Identifica módulos com muitos gaps
    const moduleIssues = [];
    for (const gap of report.gaps) {
      for (const [module, missingKeys] of Object.entries(gap.moduleGaps)) {
        if (missingKeys.length > 10) {
          moduleIssues.push(`${gap.language}/${module}: ${missingKeys.length} missing keys`);
        }
      }
    }

    const isHealthy = criticalIssues.length === 0 && warnings.length < 5;

    res.json({
      success: true,
      data: {
        isHealthy,
        completenessReport: report,
        issues: {
          critical: criticalIssues,
          warnings: warnings,
          moduleIssues: moduleIssues.slice(0, 10) // Limita para não sobrecarregar
        },
        recommendations: isHealthy 
          ? ['Translation system is healthy!']
          : [
              'Run auto-completion for critical languages',
              'Focus on high-priority keys first',
              'Review module-specific translation gaps'
            ]
      }
    });

  } catch (error) {
    console.error('Error validating translations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate translations'
    });
  }
});

export default router;