// Infrastructure Layer - Module configuration following 1qa.md Clean Architecture
import { GetUserNotificationPreferencesUseCase } from '../application/use-cases/GetUserNotificationPreferencesUseCase';
import { UpdateUserNotificationPreferencesUseCase } from '../application/use-cases/UpdateUserNotificationPreferencesUseCase';
import { UserNotificationPreferencesController } from '../application/controllers/UserNotificationPreferencesController';
import { DrizzleUserNotificationPreferencesRepository } from './repositories/DrizzleUserNotificationPreferencesRepository';
import { IUserNotificationPreferencesRepository } from '../domain/repositories/IUserNotificationPreferencesRepository';

export class UserNotificationPreferencesModule {
  private static instance: UserNotificationPreferencesModule;
  private readonly repository: IUserNotificationPreferencesRepository;
  private readonly getUserPreferencesUseCase: GetUserNotificationPreferencesUseCase;
  private readonly updateUserPreferencesUseCase: UpdateUserNotificationPreferencesUseCase;
  private readonly controller: UserNotificationPreferencesController;

  private constructor() {
    // Following 1qa.md dependency injection pattern
    this.repository = new DrizzleUserNotificationPreferencesRepository();
    this.getUserPreferencesUseCase = new GetUserNotificationPreferencesUseCase(this.repository);
    this.updateUserPreferencesUseCase = new UpdateUserNotificationPreferencesUseCase(this.repository);
    this.controller = new UserNotificationPreferencesController(
      this.getUserPreferencesUseCase,
      this.updateUserPreferencesUseCase
    );
  }

  static getInstance(): UserNotificationPreferencesModule {
    if (!UserNotificationPreferencesModule.instance) {
      UserNotificationPreferencesModule.instance = new UserNotificationPreferencesModule();
    }
    return UserNotificationPreferencesModule.instance;
  }

  getController(): UserNotificationPreferencesController {
    return this.controller;
  }

  getRepository(): IUserNotificationPreferencesRepository {
    return this.repository;
  }
}