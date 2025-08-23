// ✅ 1QA.MD COMPLIANCE: Interactive Map Application Service
// Dependency Injection and Use Case orchestration

import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { FindFieldAgentsUseCase } from '../use-cases/FindFieldAgentsUseCase';
import { UpdateAgentLocationUseCase } from '../use-cases/UpdateAgentLocationUseCase';
import { InteractiveMapController } from '../controllers/InteractiveMapController';
import { DrizzleInteractiveMapRepository } from '../../infrastructure/repositories/DrizzleInteractiveMapRepository';
import { InteractiveMapDomainService } from '../../domain/services/InteractiveMapDomainService';

// ✅ Application Service - Dependency Injection Container
export class InteractiveMapApplicationService {
  private repository: DrizzleInteractiveMapRepository;
  private domainService: InteractiveMapDomainService;
  private findFieldAgentsUseCase: FindFieldAgentsUseCase;
  private updateAgentLocationUseCase: UpdateAgentLocationUseCase;
  private controller: InteractiveMapController;

  constructor(private db: NodePgDatabase<any>) {
    this.initializeServices();
  }

  // ✅ Initialize all services following Clean Architecture
  private initializeServices(): void {
    // ✅ Infrastructure Layer
    this.repository = new DrizzleInteractiveMapRepository(this.db);
    
    // ✅ Domain Layer
    this.domainService = new InteractiveMapDomainService();
    
    // ✅ Application Layer - Use Cases
    this.findFieldAgentsUseCase = new FindFieldAgentsUseCase(
      this.repository,
      this.domainService
    );
    
    this.updateAgentLocationUseCase = new UpdateAgentLocationUseCase(
      this.repository,
      this.domainService
    );
    
    // ✅ Application Layer - Controller
    this.controller = new InteractiveMapController(
      this.findFieldAgentsUseCase,
      this.updateAgentLocationUseCase
    );
  }

  // ✅ Get controller instance for route registration
  getController(): InteractiveMapController {
    return this.controller;
  }

  // ✅ Get repository instance for direct access if needed
  getRepository(): DrizzleInteractiveMapRepository {
    return this.repository;
  }

  // ✅ Get domain service instance
  getDomainService(): InteractiveMapDomainService {
    return this.domainService;
  }

  // ✅ Get use case instances
  getFindFieldAgentsUseCase(): FindFieldAgentsUseCase {
    return this.findFieldAgentsUseCase;
  }

  getUpdateAgentLocationUseCase(): UpdateAgentLocationUseCase {
    return this.updateAgentLocationUseCase;
  }

  // ✅ Health check for the service
  async healthCheck(tenantId: string): Promise<{
    status: 'healthy' | 'unhealthy';
    services: {
      repository: boolean;
      domainService: boolean;
      findUseCase: boolean;
      updateUseCase: boolean;
    };
    agentCount?: number;
  }> {
    try {
      // Test repository connection
      const agentCount = await this.repository.getActiveAgentCount(tenantId);
      
      return {
        status: 'healthy',
        services: {
          repository: true,
          domainService: true,
          findUseCase: true,
          updateUseCase: true
        },
        agentCount
      };
    } catch (error) {
      console.error('[InteractiveMapApplicationService] Health check failed:', error);
      return {
        status: 'unhealthy',
        services: {
          repository: false,
          domainService: true,
          findUseCase: false,
          updateUseCase: false
        }
      };
    }
  }
}
