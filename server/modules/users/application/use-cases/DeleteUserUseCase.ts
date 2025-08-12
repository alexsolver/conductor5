/**
 * APPLICATION LAYER - DELETE USER USE CASE
 * Seguindo Clean Architecture - 1qa.md compliance
 */

import { IUserRepository } from '../../domain/repositories/IUserRepository';

export class DeleteUserUseCase {
  constructor(
    private userRepository: IUserRepository
  ) {}

  async execute(userId: string, deletedById: string): Promise<void> {
    // Validação de entrada
    if (!userId) {
      throw new Error('User ID is required');
    }

    if (!deletedById) {
      throw new Error('Deleted by user ID is required');
    }

    // Buscar usuário existente
    const existingUser = await this.userRepository.findById(userId);
    if (!existingUser) {
      throw new Error('User not found');
    }

    // Verificar se usuário já está inativo
    if (!existingUser.isActive) {
      throw new Error('User is already deleted');
    }

    // Buscar usuário que está fazendo a deleção
    const deleter = await this.userRepository.findById(deletedById);
    if (!deleter) {
      throw new Error('Deleter user not found');
    }

    // Aplicar regras de negócio para deleção
    await this.validateDeletionRules(existingUser, deleter);

    // Soft delete - apenas marca como inativo
    await this.userRepository.delete(userId);
  }

  private async validateDeletionRules(user: any, deleter: any): Promise<void> {
    // Regra de negócio: Usuários não podem deletar a si mesmos
    if (user.id === deleter.id) {
      throw new Error('Users cannot delete themselves');
    }

    // Regra de negócio: Apenas SaaS admins podem deletar outros SaaS admins
    if (user.role === 'saas_admin' && deleter.role !== 'saas_admin') {
      throw new Error('Only SaaS admins can delete other SaaS admins');
    }

    // Regra de negócio: Tenant admins podem deletar usuários do mesmo tenant
    if (deleter.role === 'tenant_admin') {
      if (deleter.tenantId !== user.tenantId) {
        throw new Error('Tenant admins can only delete users from their own tenant');
      }
      
      // Tenant admins não podem deletar outros tenant admins
      if (user.role === 'tenant_admin') {
        throw new Error('Tenant admins cannot delete other tenant admins');
      }
    }

    // Regra de negócio: Agents e customers não podem deletar usuários
    if (['agent', 'customer'].includes(deleter.role)) {
      throw new Error('Insufficient permissions to delete users');
    }
  }
}