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
import { DrizzleUserRepository } from "../../modules/auth/infrastructure/repositories/DrizzleUserRepository";

export class DependencyContainer {
  private static instance: DependencyContainer;

  // Repositories
  private _userRepository?: DrizzleUserRepository;
  private _tenantRepository?: TenantRepository;

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

  // Repositories
  get userRepository(): DrizzleUserRepository {
    if (!this._userRepository) {
      // Use the working Drizzle repository
      this._userRepository = new DrizzleUserRepository();
    }
    return this._userRepository;
  }

  get tenantRepository(): TenantRepository {
    if (!this._tenantRepository) {
      this._tenantRepository = new TenantRepository();
    }
    return this._tenantRepository;
  }

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
        this.tokenService
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