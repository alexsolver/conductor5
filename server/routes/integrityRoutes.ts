import { Router } from 'express''[,;]
import { jwtAuth, AuthenticatedRequest } from '../middleware/jwtAuth''[,;]
import { requireSaasAdmin } from '../middleware/authorizationMiddleware''[,;]
import { IntegrityControlService } from '../services/IntegrityControlService''[,;]
import fs from 'fs/promises''[,;]
import path from 'path''[,;]
import { exec } from 'child_process''[,;]
import { promisify } from 'util''[,;]

const execAsync = promisify(exec);
const integrityRouter = Router();
const integrityService = new IntegrityControlService();

// Get all modules information
integrityRouter.get('/modules', jwtAuth, requireSaasAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const modules = await integrityService.getAllModules();
    res.json({ modules });
  } catch (error) {
    console.error('Error fetching modules:', error);
    res.status(500).json({ message: 'Failed to fetch modules' });
  }
});

// Get integrity checks history
integrityRouter.get('/checks', jwtAuth, requireSaasAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const checks = await integrityService.getIntegrityChecks();
    res.json({ checks });
  } catch (error) {
    console.error('Error fetching checks:', error);
    res.status(500).json({ message: 'Failed to fetch checks' });
  }
});

// Get real-time monitoring data
integrityRouter.get('/monitoring', jwtAuth, requireSaasAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const monitoring = await integrityService.getMonitoringData();
    res.json(monitoring);
  } catch (error) {
    console.error('Error fetching monitoring data:', error);
    res.status(500).json({ message: 'Failed to fetch monitoring data' });
  }
});

// Run integrity check
integrityRouter.post('/run-check', jwtAuth, requireSaasAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const { type, module } = req.body;
    const checkId = await integrityService.runIntegrityCheck(type, module);
    res.json({ checkId, message: 'Integrity check started' });
  } catch (error) {
    console.error('Error running integrity check:', error);
    res.status(500).json({ message: 'Failed to start integrity check' });
  }
});

// Create backup
integrityRouter.post('/backup', jwtAuth, requireSaasAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const backupId = await integrityService.createBackup();
    res.json({ backupId, message: 'Backup created successfully' });
  } catch (error) {
    console.error('Error creating backup:', error);
    res.status(500).json({ message: 'Failed to create backup' });
  }
});

// Get module dependencies
integrityRouter.get('/dependencies/:moduleName', jwtAuth, requireSaasAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const { moduleName } = req.params;
    const dependencies = await integrityService.getModuleDependencies(moduleName);
    res.json({ dependencies });
  } catch (error) {
    console.error('Error fetching dependencies:', error);
    res.status(500).json({ message: 'Failed to fetch dependencies' });
  }
});

// Validate module integrity before changes
integrityRouter.post('/validate-pre-change', jwtAuth, requireSaasAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const { filePath, proposedChanges } = req.body;
    const validation = await integrityService.validatePreChange(filePath, proposedChanges);
    res.json(validation);
  } catch (error) {
    console.error('Error validating pre-change:', error);
    res.status(500).json({ message: 'Failed to validate changes' });
  }
});

// Validate module integrity after changes
integrityRouter.post('/validate-post-change', jwtAuth, requireSaasAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const { filePath, changes } = req.body;
    const validation = await integrityService.validatePostChange(filePath, changes);
    res.json(validation);
  } catch (error) {
    console.error('Error validating post-change:', error);
    res.status(500).json({ message: 'Failed to validate changes' });
  }
});

// Run specific tests for a module
integrityRouter.post('/test-module/:moduleName', jwtAuth, requireSaasAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const { moduleName } = req.params;
    const testResults = await integrityService.runModuleTests(moduleName);
    res.json(testResults);
  } catch (error) {
    console.error('Error running module tests:', error);
    res.status(500).json({ message: 'Failed to run module tests' });
  }
});

// Get regression analysis
integrityRouter.get('/regression-analysis', jwtAuth, requireSaasAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const analysis = await integrityService.getRegressionAnalysis();
    res.json(analysis);
  } catch (error) {
    console.error('Error getting regression analysis:', error);
    res.status(500).json({ message: 'Failed to get regression analysis' });
  }
});

// Apply fix with integrity protection
integrityRouter.post('/protected-fix', jwtAuth, requireSaasAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const { filePath, fix, testScope } = req.body;
    const result = await integrityService.applyProtectedFix(filePath, fix, testScope);
    res.json(result);
  } catch (error) {
    console.error('Error applying protected fix:', error);
    res.status(500).json({ message: 'Failed to apply protected fix' });
  }
});

export { integrityRouter };