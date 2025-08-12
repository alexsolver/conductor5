/**
 * APPLICATION LAYER - UPDATE USER USE CASE
 * Seguindo Clean Architecture - 1qa.md compliance
 */

import * as bcrypt from 'bcrypt';
import { User } from '../../domain/entities/User';
import { UserDomainService } from '../../domain/entities/User';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { UpdateUserDTO, ChangePasswordDTO } from '../dto/CreateUserDTO';

export class UpdateUserUseCase {
  constructor(
    private userRepository: IUserRepository,
    private userDomainService: UserDomainService
  ) {}

  async execute(userId: string, dto: UpdateUserDTO): Promise<User> {
    // Validação de entrada
    if (!userId) {
      throw new Error('User ID is required');
    }

    if (!dto.updatedById) {
      throw new Error('Updated by user ID is required');
    }

    // Buscar usuário existente
    const existingUser = await this.userRepository.findById(userId);
    if (!existingUser) {
      throw new Error('User not found');
    }

    // Verificar se usuário está ativo
    if (!existingUser.isActive) {
      throw new Error('Cannot update inactive user');
    }

    // Preparar dados para atualização
    const updateData: Partial<User> = {
      updatedById: dto.updatedById
    };

    // Aplicar campos opcionais apenas se fornecidos
    if (dto.firstName !== undefined) {
      updateData.firstName = dto.firstName.trim();
    }

    if (dto.lastName !== undefined) {
      updateData.lastName = dto.lastName.trim();
    }

    if (dto.role !== undefined) {
      updateData.role = dto.role;
    }

    if (dto.employmentType !== undefined) {
      updateData.employmentType = dto.employmentType;
    }

    if (dto.isActive !== undefined) {
      updateData.isActive = dto.isActive;
    }

    // Profile information
    if (dto.phoneNumber !== undefined) {
      updateData.phoneNumber = dto.phoneNumber?.trim();
    }

    if (dto.position !== undefined) {
      updateData.position = dto.position?.trim();
    }

    if (dto.department !== undefined) {
      updateData.department = dto.department?.trim();
    }

    if (dto.avatar !== undefined) {
      updateData.avatar = dto.avatar;
    }

    // Preferences
    if (dto.language !== undefined) {
      updateData.language = dto.language;
    }

    if (dto.timezone !== undefined) {
      updateData.timezone = dto.timezone;
    }

    if (dto.theme !== undefined) {
      updateData.theme = dto.theme;
    }

    // Criar objeto usuário temporário para validação
    const userForValidation = {
      ...existingUser,
      ...updateData
    };

    // Validação de regras de negócio
    this.userDomainService.validate(userForValidation);

    // Aplicar regras de negócio específicas
    await this.applyUpdateRules(existingUser, updateData, dto);

    // Persistir as mudanças
    const updatedUser = await this.userRepository.update(userId, updateData);

    return updatedUser;
  }

  async changePassword(userId: string, dto: ChangePasswordDTO): Promise<void> {
    // Validação de entrada
    if (!userId) {
      throw new Error('User ID is required');
    }

    if (dto.newPassword !== dto.confirmPassword) {
      throw new Error('Password confirmation does not match');
    }

    // Buscar usuário existente
    const existingUser = await this.userRepository.findById(userId);
    if (!existingUser) {
      throw new Error('User not found');
    }

    // Verificar se usuário está ativo
    if (!existingUser.isActive) {
      throw new Error('Cannot change password for inactive user');
    }

    // Verificar senha atual
    const isCurrentPasswordValid = await bcrypt.compare(dto.currentPassword, existingUser.passwordHash);
    if (!isCurrentPasswordValid) {
      throw new Error('Current password is incorrect');
    }

    // Validar nova senha
    this.userDomainService.validatePassword(dto.newPassword);

    // Verificar se nova senha é diferente da atual
    const isSamePassword = await bcrypt.compare(dto.newPassword, existingUser.passwordHash);
    if (isSamePassword) {
      throw new Error('New password must be different from current password');
    }

    // Hash da nova senha
    const saltRounds = 12;
    const newPasswordHash = await bcrypt.hash(dto.newPassword, saltRounds);

    // Atualizar senha
    await this.userRepository.update(userId, {
      passwordHash: newPasswordHash,
      updatedById: userId // User updating their own password
    });
  }

  async updateLoginStats(userId: string): Promise<void> {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const existingUser = await this.userRepository.findById(userId);
    if (!existingUser) {
      throw new Error('User not found');
    }

    const loginStats = this.userDomainService.updateLoginStats(existingUser);
    
    await this.userRepository.updateLoginStats(userId, {
      lastLoginAt: loginStats.lastLoginAt!,
      loginCount: loginStats.loginCount!
    });
  }

  private async applyUpdateRules(
    existingUser: User,
    updateData: Partial<User>,
    dto: UpdateUserDTO
  ): Promise<void> {
    const updater = await this.userRepository.findById(dto.updatedById!);
    if (!updater) {
      throw new Error('Updater user not found');
    }

    // Regra de negócio: Mudança de role
    if (updateData.role && updateData.role !== existingUser.role) {
      await this.validateRoleChange(existingUser, updateData.role, updater);
    }

    // Regra de negócio: Desativação de usuário
    if (updateData.isActive === false && existingUser.isActive === true) {
      await this.validateUserDeactivation(existingUser, updater);
    }

    // Regra de negócio: Employment type changes
    if (updateData.employmentType && updateData.employmentType !== existingUser.employmentType) {
      await this.validateEmploymentTypeChange(existingUser, updateData.employmentType, updater);
    }
  }

  private async validateRoleChange(existingUser: User, newRole: string, updater: User): Promise<void> {
    // SaaS admin pode alterar qualquer role
    if (updater.role === 'saas_admin') {
      return;
    }

    // Tenant admin não pode alterar para SaaS admin
    if (newRole === 'saas_admin') {
      throw new Error('Only SaaS admins can assign SaaS admin role');
    }

    // Tenant admin pode alterar roles dentro do mesmo tenant
    if (updater.role === 'tenant_admin' && updater.tenantId === existingUser.tenantId) {
      return;
    }

    // Usuários não podem alterar seus próprios roles
    if (updater.id === existingUser.id) {
      throw new Error('Users cannot change their own role');
    }

    throw new Error('Insufficient permissions to change user role');
  }

  private async validateUserDeactivation(existingUser: User, updater: User): Promise<void> {
    // Usuários não podem desativar a si mesmos
    if (updater.id === existingUser.id) {
      throw new Error('Users cannot deactivate themselves');
    }

    // SaaS admin pode desativar qualquer usuário
    if (updater.role === 'saas_admin') {
      return;
    }

    // Tenant admin pode desativar usuários do mesmo tenant (exceto outros admins)
    if (updater.role === 'tenant_admin' && 
        updater.tenantId === existingUser.tenantId &&
        existingUser.role !== 'tenant_admin') {
      return;
    }

    throw new Error('Insufficient permissions to deactivate user');
  }

  private async validateEmploymentTypeChange(
    existingUser: User, 
    newEmploymentType: string, 
    updater: User
  ): Promise<void> {
    // SaaS admin pode alterar qualquer employment type
    if (updater.role === 'saas_admin') {
      return;
    }

    // Tenant admin pode alterar employment type dentro do mesmo tenant
    if (updater.role === 'tenant_admin' && updater.tenantId === existingUser.tenantId) {
      return;
    }

    throw new Error('Insufficient permissions to change employment type');
  }
}