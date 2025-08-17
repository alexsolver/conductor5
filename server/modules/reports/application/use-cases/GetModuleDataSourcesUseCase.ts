// ✅ 1QA.MD COMPLIANCE: APPLICATION USE CASE - GET MODULE DATA SOURCES
// Application Layer - Use case for retrieving available data sources

import { ModuleIntegrationService, ModuleDataQuery, ModuleDataResult } from '../services/ModuleIntegrationService';
import { ModuleDataSource } from '../../domain/entities/ModuleDataSource';
import logger from '../../../../utils/logger';

export interface GetModuleDataSourcesRequest {
  tenantId: string;
  userId: string;
  moduleFilter?: string[];
  includePermissions?: boolean;
}

export interface GetModuleDataSourcesResponse {
  modules: ModuleDataSource[];
  totalCount: number;
  userPermissions: Record<string, any>;
}

export class GetModuleDataSourcesUseCase {
  constructor(
    private moduleIntegrationService: ModuleIntegrationService,
    private logger: typeof logger
  ) {}

  async execute(request: GetModuleDataSourcesRequest): Promise<GetModuleDataSourcesResponse> {
    try {
      this.logger.info('Getting module data sources', { 
        tenantId: request.tenantId, 
        userId: request.userId,
        moduleFilter: request.moduleFilter 
      });

      // Get all available modules
      let modules = await this.moduleIntegrationService.getAvailableModules(request.tenantId);

      // Apply module filter if specified
      if (request.moduleFilter && request.moduleFilter.length > 0) {
        modules = modules.filter(module => request.moduleFilter!.includes(module.module));
      }

      // Get user permissions for each module if requested
      const userPermissions: Record<string, any> = {};
      if (request.includePermissions) {
        for (const module of modules) {
          const permissions = {
            read: await this.moduleIntegrationService.validateModuleAccess(
              module.module, request.userId, 'read', request.tenantId
            ),
            write: await this.moduleIntegrationService.validateModuleAccess(
              module.module, request.userId, 'write', request.tenantId
            ),
            execute: await this.moduleIntegrationService.validateModuleAccess(
              module.module, request.userId, 'execute', request.tenantId
            ),
            admin: await this.moduleIntegrationService.validateModuleAccess(
              module.module, request.userId, 'admin', request.tenantId
            )
          };
          userPermissions[module.module] = permissions;
        }
      }

      const response: GetModuleDataSourcesResponse = {
        modules,
        totalCount: modules.length,
        userPermissions
      };

      this.logger.info('Module data sources retrieved successfully', { 
        tenantId: request.tenantId,
        moduleCount: modules.length 
      });

      return response;
    } catch (error) {
      this.logger.error('Error getting module data sources', { 
        error, 
        tenantId: request.tenantId, 
        userId: request.userId 
      });
      throw new Error(`Failed to get module data sources: ${error.message}`);
    }
  }
}

export interface ExecuteModuleQueryRequest {
  tenantId: string;
  userId: string;
  query: ModuleDataQuery;
  validatePermissions?: boolean;
}

export class ExecuteModuleQueryUseCase {
  constructor(
    private moduleIntegrationService: ModuleIntegrationService,
    private logger: typeof logger
  ) {}

  async execute(request: ExecuteModuleQueryRequest): Promise<ModuleDataResult> {
    try {
      this.logger.info('Executing module query', { 
        tenantId: request.tenantId, 
        userId: request.userId,
        module: request.query.module 
      });

      // Validate permissions if requested
      if (request.validatePermissions !== false) {
        const hasAccess = await this.moduleIntegrationService.validateModuleAccess(
          request.query.module, 
          request.userId, 
          'read', 
          request.tenantId
        );

        if (!hasAccess) {
          throw new Error(`User does not have access to module '${request.query.module}'`);
        }
      }

      // Execute the query
      const result = await this.moduleIntegrationService.executeModuleQuery(
        request.query, 
        request.tenantId
      );

      this.logger.info('Module query executed successfully', { 
        tenantId: request.tenantId,
        module: request.query.module,
        recordCount: result.totalCount,
        executionTime: result.executionTime 
      });

      return result;
    } catch (error) {
      this.logger.error('Error executing module query', { 
        error, 
        tenantId: request.tenantId, 
        userId: request.userId,
        module: request.query.module 
      });
      throw new Error(`Failed to execute module query: ${error.message}`);
    }
  }
}

export interface GetModuleTemplatesRequest {
  tenantId: string;
  userId: string;
  moduleName: string;
}

export class GetModuleTemplatesUseCase {
  constructor(
    private moduleIntegrationService: ModuleIntegrationService,
    private logger: typeof logger
  ) {}

  async execute(request: GetModuleTemplatesRequest): Promise<any[]> {
    try {
      this.logger.info('Getting module templates', { 
        tenantId: request.tenantId, 
        userId: request.userId,
        moduleName: request.moduleName 
      });

      // Validate access to module
      const hasAccess = await this.moduleIntegrationService.validateModuleAccess(
        request.moduleName, 
        request.userId, 
        'read', 
        request.tenantId
      );

      if (!hasAccess) {
        throw new Error(`User does not have access to module '${request.moduleName}'`);
      }

      // Get templates
      const templates = await this.moduleIntegrationService.getModuleTemplates(
        request.moduleName, 
        request.tenantId
      );

      this.logger.info('Module templates retrieved successfully', { 
        tenantId: request.tenantId,
        moduleName: request.moduleName,
        templateCount: templates.length 
      });

      return templates;
    } catch (error) {
      this.logger.error('Error getting module templates', { 
        error, 
        tenantId: request.tenantId, 
        userId: request.userId,
        moduleName: request.moduleName 
      });
      throw new Error(`Failed to get module templates: ${error.message}`);
    }
  }
}