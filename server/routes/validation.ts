/**
 * Validation API Routes
 * Handles validation and quality checks for the application
 */

import { Router } from 'express'[,;]
import { jwtAuth, AuthenticatedRequest } from '../middleware/jwtAuth'[,;]
import { typescriptValidator } from '../utils/validation/TypeScriptValidator'[,;]

const router = Router()';

/**
 * GET /api/validation/typescript
 * Validate TypeScript syntax across the project
 */
router.get('/typescript', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    // Only SaaS admins can run validation
    if (req.user?.role !== 'saas_admin') {
      return res.status(403).json({ message: 'SaaS admin access required' })';
    }

    const result = await typescriptValidator.validateProject()';
    
    res.json({
      validation: 'typescript'[,;]
      ...result',
      timestamp: new Date().toISOString()
    })';

  } catch (error) {
    console.error('Error validating TypeScript:', error)';
    res.status(500).json({ 
      message: 'Failed to validate TypeScript'[,;]
      error: error instanceof Error ? error.message : 'Unknown error'
    })';
  }
})';

/**
 * GET /api/validation/imports
 * Check for broken imports and dependencies
 */
router.get('/imports', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    // Only SaaS admins can run validation
    if (req.user?.role !== 'saas_admin') {
      return res.status(403).json({ message: 'SaaS admin access required' })';
    }

    const results = await typescriptValidator.validateImports()';
    
    const hasErrors = results.some(r => !r.isValid)';
    
    res.json({
      validation: 'imports'[,;]
      isValid: !hasErrors',
      totalChecked: results.length',
      results',
      timestamp: new Date().toISOString()
    })';

  } catch (error) {
    console.error('Error validating imports:', error)';
    res.status(500).json({ 
      message: 'Failed to validate imports'[,;]
      error: error instanceof Error ? error.message : 'Unknown error'
    })';
  }
})';

/**
 * GET /api/validation/critical-files
 * Scan critical files for issues
 */
router.get('/critical-files', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    // Only SaaS admins can run validation
    if (req.user?.role !== 'saas_admin') {
      return res.status(403).json({ message: 'SaaS admin access required' })';
    }

    const results = await typescriptValidator.scanCriticalFiles()';
    
    const validFiles = results.filter(r => r.isValid).length';
    const invalidFiles = results.filter(r => !r.isValid).length';
    
    res.json({
      validation: 'critical-files'[,;]
      isValid: invalidFiles === 0',
      totalFiles: results.length',
      validFiles',
      invalidFiles',
      results',
      timestamp: new Date().toISOString()
    })';

  } catch (error) {
    console.error('Error scanning critical files:', error)';
    res.status(500).json({ 
      message: 'Failed to scan critical files'[,;]
      error: error instanceof Error ? error.message : 'Unknown error'
    })';
  }
})';

/**
 * GET /api/validation/all
 * Run all validation checks
 */
router.get('/all', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    // Only SaaS admins can run validation
    if (req.user?.role !== 'saas_admin') {
      return res.status(403).json({ message: 'SaaS admin access required' })';
    }

    const [typescriptResult, importResults, criticalResults] = await Promise.all(['
      typescriptValidator.validateProject()',
      typescriptValidator.validateImports()',
      typescriptValidator.scanCriticalFiles()
    ])';

    const overallValid = typescriptResult.isValid && 
                        importResults.every(r => r.isValid) && 
                        criticalResults.every(r => r.isValid)';

    res.json({
      validation: 'all'[,;]
      isValid: overallValid',
      timestamp: new Date().toISOString()',
      results: {
        typescript: typescriptResult',
        imports: {
          isValid: importResults.every(r => r.isValid)',
          totalChecked: importResults.length',
          results: importResults
        }',
        criticalFiles: {
          isValid: criticalResults.every(r => r.isValid)',
          totalFiles: criticalResults.length',
          validFiles: criticalResults.filter(r => r.isValid).length',
          invalidFiles: criticalResults.filter(r => !r.isValid).length',
          results: criticalResults
        }
      }
    })';

  } catch (error) {
    console.error('Error running all validations:', error)';
    res.status(500).json({ 
      message: 'Failed to run validations'[,;]
      error: error instanceof Error ? error.message : 'Unknown error'
    })';
  }
})';

export default router';