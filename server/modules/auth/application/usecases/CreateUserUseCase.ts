/**
 * Create User Use Case
 * Clean Architecture - Application Layer
 */

import { User } from '../../domain/entities/User';
import { IUserRepository } from '../../domain/ports/IUserRepository';
import { IDomainEventPublisher } from '../../../shared/domain/IDomainEventPublisher';
import { UserCreatedEvent } from '../../domain/events/UserCreatedEvent';
import { IPasswordService } from '../../domain/ports/IPasswordService';
import { IIdGenerator } from '../../../shared/domain/ports/IIdGenerator';

export interface CreateUserInput {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  role: 'saas_admin' | 'tenant_admin' | 'agent' | 'customer';
  tenantId?: string;
  active?: boolean;
  verified?: boolean;
}

export interface CreateUserOutput {
  id: string;
  success: boolean;
  user?: User;
  error?: string;
}

export class CreateUserUseCase {
  constructor(
    private userRepository: IUserRepository,
    private passwordService: IPasswordService,
    private eventPublisher: IDomainEventPublisher,
    private idGenerator: IIdGenerator
  ) {}

  async execute(input: CreateUserInput): Promise<CreateUserOutput> {
    try {
      // Check if user already exists (1qa.md compliant)
      const existingUser = await this.userRepository.findByEmailForAuth(input.email);
      if (existingUser) {
        return {
          id: '',
          success: false,
          error: 'User with this email already exists'
        };
      }

      // Hash password
      const passwordHash = await this.passwordService.hashPassword(input.password);

      // Create new user
      const user = User.create({
        email: input.email,
        password: input.password, // Will be replaced with hash
        firstName: input.firstName,
        lastName: input.lastName,
        role: input.role,
        tenantId: input.tenantId,
        active: input.active,
        verified: input.verified
      }, passwordHash, this.idGenerator);

      // Save user
      const savedUser = await this.userRepository.save(user);

      // Publish domain event
      const event = new UserCreatedEvent(
        savedUser.getId(),
        savedUser.getEmail(),
        savedUser.getRole(),
        savedUser.getTenantId(),
        new Date()
      );
      
      await this.eventPublisher.publish(event);

      return {
        id: savedUser.getId(),
        success: true,
        user: savedUser
      };
    } catch (error) {
      return {
        id: '',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
}