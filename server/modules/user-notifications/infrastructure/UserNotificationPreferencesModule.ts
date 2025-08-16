// Infrastructure Module - Dependency injection setup
import { GetUserNotificationPreferencesUseCase } from '../application/use-cases/GetUserNotificationPreferencesUseCase';
import { UpdateUserNotificationPreferencesUseCase } from '../application/use-cases/UpdateUserNotificationPreferencesUseCase';
import { UserNotificationPreferencesController } from '../application/controllers/UserNotificationPreferencesController';
import { DrizzleUserNotificationPreferencesRepository } from './repositories/DrizzleUserNotificationPreferencesRepository';

export class UserNotificationPreferencesModule {
  private static instance: UserNotificationPreferencesModule;
  private readonly repository: DrizzleUserNotificationPreferencesRepository;
  private readonly getUserPreferencesUseCase: GetUserNotificationPreferencesUseCase;
  private readonly updateUserPreferencesUseCase: UpdateUserNotificationPreferencesUseCase;
  private readonly controller: UserNotificationPreferencesController;

  private constructor() {
    // Initialize dependencies following dependency injection pattern
    this.repository = new DrizzleUserNotificationPreferencesRepository();
    
    this.getUserPreferencesUseCase = new GetUserNotificationPreferencesUseCase(
      this.repository
    );
    
    this.updateUserPreferencesUseCase = new UpdateUserNotificationPreferencesUseCase(
      this.repository
    );
    
    this.controller = new UserNotificationPreferencesController(
      this.getUserPreferencesUseCase,
      this.updateUserPreferencesUseCase
    );
  }

  public static getInstance(): UserNotificationPreferencesModule {
    if (!UserNotificationPreferencesModule.instance) {
      UserNotificationPreferencesModule.instance = new UserNotificationPreferencesModule();
    }
    return UserNotificationPreferencesModule.instance;
  }

  public getController(): UserNotificationPreferencesController {
    return this.controller;
  }

  public getRepository(): DrizzleUserNotificationPreferencesRepository {
    return this.repository;
  }

  public getGetUserPreferencesUseCase(): GetUserNotificationPreferencesUseCase {
    return this.getUserPreferencesUseCase;
  }

  public getUpdateUserPreferencesUseCase(): UpdateUserNotificationPreferencesUseCase {
    return this.updateUserPreferencesUseCase;
  }
}