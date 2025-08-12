/**
 * APPLICATION LAYER - CREATE USER USE CASE
 * Seguindo Clean Architecture - 1qa.md compliance
 */

import * as bcrypt from 'bcrypt';
import { User } from '../../domain/entities/User';
import { UserDomainService } from '../../domain/entities/User';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { CreateUserDTO } from '../dto/CreateUserDTO';

export class CreateUserUseCase {
  constructor(
    private userRepository: IUserRepository,
    private userDomainService: UserDomainService
  ) {}

  async execute(dto: CreateUserDTO): Promise<User> {
    // Validação de entrada
    if (!dto.tenantId) {
      throw new Error('Tenant ID is required');
    }

    // Preparar dados do usuário
    const userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'> = {
      tenantId: dto.tenantId,
      email: dto.email.toLowerCase().trim(),
      firstName: dto.firstName.trim(),
      lastName: dto.lastName.trim(),
      role: dto.role,
      employmentType: dto.employmentType,
      isActive: true,
      
      // Profile information
      phoneNumber: dto.phoneNumber?.trim(),
      position: dto.position?.trim(),
      department: dto.department?.trim(),
      avatar: dto.avatar,
      
      // Preferences com valores padrão
      language: dto.language || 'pt-BR',
      timezone: dto.timezone || 'America/Sao_Paulo',
      theme: dto.theme,
      
      // Authentication
      passwordHash: '', // Será preenchido após hash
      loginCount: 0,
      
      // Audit
      createdById: dto.createdById,
      updatedById: dto.createdById
    };

    // Validação de regras de negócio
    this.userDomainService.validate(userData);

    // Validar senha
    this.userDomainService.validatePassword(dto.password);

    // Verificar se email já existe
    const existingUser = await this.userRepository.findByEmail(userData.email);
    if (existingUser) {
      throw new Error('Email already exists');
    }

    // Hash da senha
    const saltRounds = 12;
    userData.passwordHash = await bcrypt.hash(dto.password, saltRounds);

    // Aplicar regras de negócio específicas
    await this.applyCreationRules(userData, dto);

    // Persistir o usuário
    const createdUser = await this.userRepository.create(userData);

    return createdUser;
  }

  private async applyCreationRules(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>, dto: CreateUserDTO): Promise<void> {
    // Regra de negócio: SaaS admin só pode ser criado por outro SaaS admin
    if (userData.role === 'saas_admin' && dto.createdById) {
      const creator = await this.userRepository.findById(dto.createdById);
      if (!creator || creator.role !== 'saas_admin') {
        throw new Error('Only SaaS admins can create other SaaS admins');
      }
    }

    // Regra de negócio: Tenant admin precisa ser do mesmo tenant
    if (userData.role === 'tenant_admin' && dto.createdById) {
      const creator = await this.userRepository.findById(dto.createdById);
      if (creator && creator.tenantId !== userData.tenantId && creator.role !== 'saas_admin') {
        throw new Error('Tenant admin can only be created within the same tenant');
      }
    }

    // Regra de negócio: Employment type deve ser compatível com tenant
    // (Esta validação pode ser expandida conforme regras específicas do tenant)
    
    // Regra de negócio: Definir department padrão se não fornecido
    if (!userData.department) {
      switch (userData.role) {
        case 'agent':
          userData.department = 'Support';
          break;
        case 'tenant_admin':
          userData.department = 'Administration';
          break;
        default:
          userData.department = 'General';
      }
    }
  }
}