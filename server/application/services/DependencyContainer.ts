// Dependency Injection Container - Clean Architecture
import { UserRepository } from "../../infrastructure/repositories/UserRepository";
import { TenantRepository } from "../../infrastructure/repositories/TenantRepository";
import { PasswordHasher } from "../../infrastructure/services/PasswordHasher";
import { SimpleTokenService } from "../../infrastructure/services/SimpleTokenService";
import { LoginUseCase } from "../use-cases/auth/LoginUseCase";
import { RegisterUseCase } from "../use-cases/auth/RegisterUseCase";
import { RefreshTokenUseCase } from "../use-cases/auth/RefreshTokenUseCase";
import { storage } from "../../storage";

export class DependencyContainer {
  private static instance: DependencyContainer;
  
  // Repositories
  private _userRepository?: UserRepository;
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
  get userRepository(): UserRepository {
    if (!this._userRepository) {
      // Use the working infrastructure repository
      this._userRepository = new UserRepository();
    }
    return this._userRepository;
  }

  get tenantRepository(): TenantRepository {
    if (!this._tenantRepository) {
      this._tenantRepository = new TenantRepository();
    }
    return this._tenantRepository;
  }

  get storage() {
    return storage;
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