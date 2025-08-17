// ✅ 1QA.MD COMPLIANCE: REPORTS MODULE INDEX
// Infrastructure Layer - Module initialization with dependency injection

import { Router } from 'express';
import { createReportsRoutes } from './routes';
import { ReportsController } from './application/controllers/ReportsController';
import { DashboardsController } from './application/controllers/DashboardsController';

// Import Use Cases
import { CreateReportUseCase } from './application/use-cases/CreateReportUseCase';
import { ExecuteReportUseCase } from './application/use-cases/ExecuteReportUseCase';
import { FindReportUseCase } from './application/use-cases/FindReportUseCase';
import { DeleteReportUseCase } from './application/use-cases/DeleteReportUseCase';
import { GetModuleDataSourcesUseCase, ExecuteModuleQueryUseCase, GetModuleTemplatesUseCase } from './application/use-cases/GetModuleDataSourcesUseCase';

// Import Services
import { ModuleIntegrationService } from './application/services/ModuleIntegrationService';
import { RealtimeDashboardService } from './application/services/RealtimeDashboardService';
import { SchedulingService } from './application/services/SchedulingService';
import { NotificationIntegrationService } from './application/services/NotificationIntegrationService';
import { ApprovalIntegrationService } from './application/services/ApprovalIntegrationService';

// Import Repository
import { DrizzleReportsRepository } from './infrastructure/repositories/DrizzleReportsRepository';

// Import utils
import logger from '../../utils/logger';

/**
 * Initialize Reports module with dependency injection
 * ✅ CLEAN ARCHITECTURE: Proper dependency injection following 1qa.md
 */
export function initializeReportsModule(): Router {
  try {
    logger.info('🏗️ [REPORTS-MODULE] Initializing following Clean Architecture');

    // Initialize Repository (Infrastructure Layer)
    const reportsRepository = new DrizzleReportsRepository();

    // Initialize Services (Application Layer)
    const moduleIntegrationService = new ModuleIntegrationService(reportsRepository, logger);
    const realtimeDashboardService = new RealtimeDashboardService(logger);
    const schedulingService = new SchedulingService(logger);
    const notificationIntegrationService = new NotificationIntegrationService(logger);
    const approvalIntegrationService = new ApprovalIntegrationService(logger);

    // Initialize Use Cases (Application Layer)
    const createReportUseCase = new CreateReportUseCase(reportsRepository, logger);
    const executeReportUseCase = new ExecuteReportUseCase(reportsRepository, logger);
    const findReportUseCase = new FindReportUseCase(reportsRepository, logger);
    const deleteReportUseCase = new DeleteReportUseCase(reportsRepository, logger);
    
    // Module Integration Use Cases
    const getModuleDataSourcesUseCase = new GetModuleDataSourcesUseCase(moduleIntegrationService, logger);
    const executeModuleQueryUseCase = new ExecuteModuleQueryUseCase(moduleIntegrationService, logger);
    const getModuleTemplatesUseCase = new GetModuleTemplatesUseCase(moduleIntegrationService, logger);

    // Initialize Controllers (Application Layer)
    const reportsController = new ReportsController(
      createReportUseCase,
      executeReportUseCase,
      findReportUseCase,
      deleteReportUseCase,
      getModuleDataSourcesUseCase,
      executeModuleQueryUseCase,
      getModuleTemplatesUseCase
    );

    const dashboardsController = new DashboardsController();

    // Create routes with dependency injection
    const router = createReportsRoutes(reportsController, dashboardsController);

    logger.info('✅ [REPORTS-MODULE] Initialized successfully following Clean Architecture');
    logger.info('✅ [REPORTS-MODULE] Module Integration Service operational');
    logger.info('✅ [REPORTS-MODULE] Real-time Dashboard Service operational');
    logger.info('✅ [REPORTS-MODULE] Scheduling Service operational');
    logger.info('✅ [REPORTS-MODULE] Notification Integration Service operational');
    logger.info('✅ [REPORTS-MODULE] Approval Integration Service operational');

    return router;
  } catch (error) {
    logger.error('❌ [REPORTS-MODULE] Initialization failed', { error });
    throw new Error(`Failed to initialize Reports module: ${error.message}`);
  }
}

export default initializeReportsModule;