// Dependency Injection Container - Clean Architecture
import { PasswordHasher } from "../../infrastructure/services/PasswordHasher";
import { SimpleTokenService } from "../../infrastructure/services/SimpleTokenService";
import { LoginUseCase } from "../use-cases/auth/LoginUseCase";
import { RegisterUseCase } from "../use-cases/auth/RegisterUseCase";
import { RefreshTokenUseCase } from "../use-cases/auth/RefreshTokenUseCase";
import { storageSimple } from "../../storage-simple";
import { UserRepository } from "../../infrastructure/repositories/UserRepository";
import logger from "../../utils/logger";

export class DependencyContainer {
  private static instance: DependencyContainer;
  private logger: any;
  private tenantRepository: any;

  // Repositories
  private _userRepository?: UserRepository;
  private _tenantRepository?: any;

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
    this.logger = logger;
    this.initializeRepositories();
  }

  private async initializeRepositories() {
    // Repositories initialized directly when needed for 1qa.md compliance
  }

  /**
   * Get Tenant Repository - Restored for system functionality
   * Uses the existing TenantRepository implementation
   */
  async getTenantRepository() {
    if (!this._tenantRepository) {
      const { TenantRepository } = await import('../../infrastructure/repositories/TenantRepository');
      this._tenantRepository = new TenantRepository();
    }
    return this._tenantRepository;
  }

  /**
   * Helper method for direct tenant access - 1qa.md compliant alternative
   * Use this pattern for new implementations
   */
  static async getTenantDirect(tenantId: string) {
    const { db } = await import('../../db');
    const { tenants } = await import('../../db');
    const { eq } = await import('drizzle-orm');

    const result = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, tenantId))
      .limit(1);

    return result[0] || null;
  }

  // Repositories
  get userRepository(): UserRepository {
    if (!this._userRepository) {
      // Use the UserRepository that has findByIdAndTenant method
      this._userRepository = new UserRepository();
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
        null // Removed tenantRepository dependency for 1qa.md compliance
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