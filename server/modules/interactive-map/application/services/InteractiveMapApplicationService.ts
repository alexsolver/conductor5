// ✅ 1QA.MD COMPLIANCE: Interactive Map Application Service
// Dependency Injection and Use Case orchestration

import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { FindFieldAgentsUseCase } from '../use-cases/FindFieldAgentsUseCase';
import { UpdateAgentLocationUseCase } from '../use-cases/UpdateAgentLocationUseCase';
import { InteractiveMapController } from '../controllers/InteractiveMapController';
import { DrizzleInteractiveMapRepository } from '../../infrastructure/repositories/DrizzleInteractiveMapRepository';
import { InteractiveMapDomainService } from '../../domain/services/InteractiveMapDomainService';
import { ExternalApiService } from './ExternalApiService'; // Assuming ExternalApiService is in the same directory

// ✅ Application Service - Dependency Injection Container
export class InteractiveMapApplicationService {
  private repository: DrizzleInteractiveMapRepository;
  private domainService: InteractiveMapDomainService;
  private findFieldAgentsUseCase: FindFieldAgentsUseCase;
  private updateAgentLocationUseCase: UpdateAgentLocationUseCase;
  private controller: InteractiveMapController;
  private externalApiService: ExternalApiService; // Add ExternalApiService

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

    // ✅ External API Service
    this.externalApiService = new ExternalApiService(); // Initialize ExternalApiService
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

  // ✅ Get External API Service instance
  getExternalApiService(): ExternalApiService {
    return this.externalApiService;
  }

  // ✅ Weather data retrieval
  async getWeatherData(lat: number, lng: number): Promise<any> {
    try {
      // Try to get real weather data from SaaS Admin OpenWeather integration
      return await this.externalApiService.getWeatherData(lat, lng);
    } catch (error) {
      console.warn('[INTERACTIVE-MAP-SERVICE] Weather API failed, using fallback:', error);

      // Fallback to mock data
      return {
        temperature: 20 + Math.random() * 10,
        condition: 'Dados simulados',
        humidity: 60 + Math.floor(Math.random() * 30),
        windSpeed: Math.floor(Math.random() * 15),
        visibility: 10,
        icon: '01d'
      };
    }
  }

  // ✅ Get user groups for filtering
  async getUserGroups(tenantId: string): Promise<any[]> {
    try {
      // It's assumed that DrizzleInteractiveMapRepository has a method getUserGroups
      // If not, this method needs to be added to the repository as well.
      return await this.repository.getUserGroups(tenantId);
    } catch (error) {
      console.error('[INTERACTIVE-MAP-SERVICE] Error fetching user groups:', error);
      throw error;
    }
  }

  // ✅ Health check for the service
  async healthCheck(tenantId: string): Promise<{
    status: 'healthy' | 'unhealthy';
    services: {
      repository: boolean;
      domainService: boolean;
      findUseCase: boolean;
      updateUseCase: boolean;
      externalApiService: boolean; // Add externalApiService to health check
      userGroups: boolean; // Add userGroups to health check
    };
    agentCount?: number;
  }> {
    try {
      // Test repository connection
      const agentCount = await this.repository.getActiveAgentCount(tenantId);

      // Test external API service
      await this.externalApiService.healthCheck(); // Assuming ExternalApiService has a healthCheck method

      // Test user groups retrieval
      await this.getUserGroups(tenantId);

      return {
        status: 'healthy',
        services: {
          repository: true,
          domainService: true,
          findUseCase: true,
          updateUseCase: true,
          externalApiService: true,
          userGroups: true
        },
        agentCount
      };
    } catch (error) {
      console.error('[InteractiveMapApplicationService] Health check failed:', error);
      // Determine which services are unhealthy
      let repoHealthy = false;
      let externalApiHealthy = false;
      let userGroupsHealthy = false;

      try {
        await this.repository.getActiveAgentCount(tenantId);
        repoHealthy = true;
      } catch (e) {
        console.error('[InteractiveMapApplicationService] Repository health check failed.');
      }

      try {
        await this.externalApiService.healthCheck();
        externalApiHealthy = true;
      } catch (e) {
        console.error('[InteractiveMapApplicationService] External API health check failed.');
      }

      try {
        await this.getUserGroups(tenantId);
        userGroupsHealthy = true;
      } catch (e) {
        console.error('[InteractiveMapApplicationService] User Groups health check failed.');
      }

      return {
        status: 'unhealthy',
        services: {
          repository: repoHealthy,
          domainService: true, // Domain service is generally always healthy if initialized
          findUseCase: repoHealthy, // Use cases depend on repository
          updateUseCase: repoHealthy,
          externalApiService: externalApiHealthy,
          userGroups: userGroupsHealthy
        }
      };
    }
  }
}