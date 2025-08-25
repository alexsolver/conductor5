// Dependency Injection Container - Clean Architecture
import { DrizzleUserRepository } from "../../modules/auth/infrastructure/repositories/DrizzleUserRepository";
import { TenantRepository } from "../../infrastructure/repositories/TenantRepository";
import { PasswordHasher } from "../../infrastructure/services/PasswordHasher";
import { SimpleTokenService } from "../../infrastructure/services/SimpleTokenService";
import { LoginUseCase } from "../use-cases/auth/LoginUseCase";
import { RegisterUseCase } from "../use-cases/auth/RegisterUseCase";
import { RefreshTokenUseCase } from "../use-cases/auth/RefreshTokenUseCase";
import { storageSimple } from "../../storage-simple";
import { UserRepository } from "../../infrastructure/repositories/UserRepository";
// Removed duplicate import: import { DrizzleUserRepository } from "../../modules/auth/infrastructure/repositories/DrizzleUserRepository";
import { Logger } from "../services/Logger";
import { DomainEventPublisher, IDomainEventPublisher } from "../services/DomainEventPublisher";

export class DependencyContainer {
  private static instance: DependencyContainer;
  private logger: Logger;
  private eventPublisher: IDomainEventPublisher;
  private tenantRepository: any;

  // Repositories
  private _userRepository?: DrizzleUserRepository;
  // Removed unused _tenantRepository?: TenantRepository;

  // Services
  private _passwordHasher?: PasswordHasher;
  private _tokenService?: SimpleTokenService;

  // Use Cases
  private _loginUseCase?: LoginUseCase;
  private _registerUseCase?: RegisterUseCase;
  private _refreshTokenUseCase?: RefreshTokenUseCase;

  static getInstance(): DependencyContainer {
    if (!DependencyContainer.instance) {
      DependencyContainer.instance = new DependencyContainer();
    }
    return DependencyContainer.instance;
  }

  private constructor() {
    // Initialize dependencies
    this.logger = new Logger();
    this.eventPublisher = new DomainEventPublisher();
    this.initializeRepositories();
  }

  private async initializeRepositories() {
    // Initialize tenant repository
    const { TenantRepository } = await import('../infrastructure/repositories/TenantRepository');
    this.tenantRepository = new TenantRepository();
  }

  getTenantRepository() {
    if (!this.tenantRepository) {
      throw new Error('TenantRepository not initialized');
    }
    return this.tenantRepository;
  }

  // Repositories
  get userRepository(): DrizzleUserRepository {
    if (!this._userRepository) {
      // Use the working Drizzle repository
      this._userRepository = new DrizzleUserRepository();
    }
    return this._userRepository;
  }

  // Removed unused tenantRepository getter

  private _storage?: any;

  get storage() {
    if (!this._storage) {
      // Use database directly for 1qa.md compliance
      throw new Error('Storage should be initialized externally - use database directly for 1qa.md compliance');
    }
    return this._storage;
  }

  async getStorage() {
    // Método alternativo para async loading
    if (!this._storage) {
      try {
        const { storageSimple } = await import('../../storage-simple');
        this._storage = storageSimple;
        console.log('✅ [DependencyContainer] Storage loaded via async import');
      } catch (error) {
        console.error('❌ [DependencyContainer] Failed to async load storage:', error);
        throw new Error('Storage module not available via async import');
      }
    }
    return this._storage;
  }

  // Services
  get passwordHasher(): PasswordHasher {
    if (!this._passwordHasher) {
      this._passwordHasher = new PasswordHasher();
    }
    return this._passwordHasher;
  }

  get tokenService(): SimpleTokenService {
    if (!this._tokenService) {
      this._tokenService = new SimpleTokenService();
    }
    return this._tokenService;
  }

  // Use Cases
  get loginUseCase(): LoginUseCase {
    if (!this._loginUseCase) {
      this._loginUseCase = new LoginUseCase(
        this.userRepository,
        this.passwordHasher,
        this.tokenService
      );
    }
    return this._loginUseCase;
  }

  get registerUseCase(): RegisterUseCase {
    if (!this._registerUseCase) {
      this._registerUseCase = new RegisterUseCase(
        this.userRepository,
        this.passwordHasher,
        this.tokenService,
        this.getTenantRepository() // Added tenantRepository here
      );
    }
    return this._registerUseCase;
  }

  get refreshTokenUseCase(): RefreshTokenUseCase {
    if (!this._refreshTokenUseCase) {
      this._refreshTokenUseCase = new RefreshTokenUseCase(
        this.userRepository,
        this.tokenService
      );
    }
    return this._refreshTokenUseCase;
  }
}