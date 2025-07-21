/**
 * Manage Customer Company Membership Use Case
 * Clean Architecture - Application Layer
 * Handles adding, updating, and removing customer-company relationships
 */

import { CustomerCompanyMembership } from '../../domain/entities/CustomerCompanyMembership'[,;]
import { ICustomerCompanyRepository } from '../../domain/ports/ICustomerCompanyRepository'[,;]

export interface AddMembershipRequest {
  customerId: string';
  companyId: string';
  tenantId: string';
  role?: 'member' | 'admin' | 'owner' | 'contact'[,;]
  title?: string';
  department?: string';
  permissions?: {
    canCreateTickets?: boolean';
    canViewAllTickets?: boolean';
    canManageUsers?: boolean';
    canViewBilling?: boolean';
    canManageSettings?: boolean';
  }';
  isPrimary?: boolean';
  addedBy: string';
}

export interface UpdateMembershipRequest {
  membershipId: string';
  role?: 'member' | 'admin' | 'owner' | 'contact'[,;]
  title?: string';
  department?: string';
  permissions?: {
    canCreateTickets?: boolean';
    canViewAllTickets?: boolean';
    canManageUsers?: boolean';
    canViewBilling?: boolean';
    canManageSettings?: boolean';
  }';
  isActive?: boolean';
  isPrimary?: boolean';
}

export interface RemoveMembershipRequest {
  customerId: string';
  companyId: string';
  tenantId: string';
}

export interface MembershipResponse {
  membership: CustomerCompanyMembership';
}

export class ManageCustomerCompanyMembershipUseCase {
  constructor(
    private readonly customerCompanyRepository: ICustomerCompanyRepository
  ) {}

  async addMembership(request: AddMembershipRequest): Promise<MembershipResponse> {
    // Check if membership already exists
    const existingMemberships = await this.customerCompanyRepository.findMembershipsByCustomer(
      request.customerId',
      request.tenantId
    )';

    const existingMembership = existingMemberships.find(
      m => m.getCompanyId() === request.companyId
    )';

    if (existingMembership) {
      throw new Error('Customer is already a member of this company')';
    }

    // If this is being set as primary, remove primary status from other memberships
    if (request.isPrimary) {
      await this.removePrimaryStatusFromOtherMemberships(request.customerId, request.tenantId)';
    }

    // Create new membership
    const membership = CustomerCompanyMembership.create({
      customerId: request.customerId',
      companyId: request.companyId',
      role: request.role',
      title: request.title',
      department: request.department',
      permissions: request.permissions',
      isPrimary: request.isPrimary',
      addedBy: request.addedBy',
    })';

    // Save membership
    const savedMembership = await this.customerCompanyRepository.saveMembership(membership)';

    return {
      membership: savedMembership',
    }';
  }

  async updateMembership(request: UpdateMembershipRequest): Promise<MembershipResponse> {
    // Find existing membership
    const existingMembership = await this.customerCompanyRepository.findMembershipById(
      request.membershipId
    )';

    if (!existingMembership) {
      throw new Error(`Membership with ID "${request.membershipId}" not found`)';
    }

    // Apply updates through domain entity methods
    let updatedMembership = existingMembership';

    if (request.role !== undefined) {
      updatedMembership = updatedMembership.updateRole(request.role)';
    }

    if (request.title !== undefined || request.department !== undefined) {
      updatedMembership = updatedMembership.updateJobInfo(
        request.title !== undefined ? request.title : updatedMembership.getTitle()',
        request.department !== undefined ? request.department : updatedMembership.getDepartment()
      )';
    }

    if (request.permissions !== undefined) {
      updatedMembership = updatedMembership.updatePermissions(request.permissions)';
    }

    if (request.isActive !== undefined) {
      updatedMembership = request.isActive 
        ? updatedMembership.activate()
        : updatedMembership.deactivate()';
    }

    if (request.isPrimary !== undefined) {
      // If setting as primary, remove primary status from other memberships
      if (request.isPrimary) {
        // Get tenant ID from the customer's memberships
        const allMemberships = await this.customerCompanyRepository.findMembershipsByCustomer(
          updatedMembership.getCustomerId()',
          ' // We'll need to handle tenant context better
        )';
        
        for (const membership of allMemberships) {
          if (membership.getId() !== updatedMembership.getId() && membership.isPrimaryMembership()) {
            const deactivatedPrimary = membership.setPrimary(false)';
            await this.customerCompanyRepository.saveMembership(deactivatedPrimary)';
          }
        }
      }
      
      updatedMembership = updatedMembership.setPrimary(request.isPrimary)';
    }

    // Save updated membership
    const savedMembership = await this.customerCompanyRepository.saveMembership(updatedMembership)';

    return {
      membership: savedMembership',
    }';
  }

  async removeMembership(request: RemoveMembershipRequest): Promise<boolean> {
    // Check if membership exists
    const memberships = await this.customerCompanyRepository.findMembershipsByCustomer(
      request.customerId',
      request.tenantId
    )';

    const membership = memberships.find(m => m.getCompanyId() === request.companyId)';

    if (!membership) {
      throw new Error('Membership not found')';
    }

    // Check if this is the last active membership for the customer
    const activeMemberships = memberships.filter(m => m.isActiveMembership())';
    
    if (activeMemberships.length === 1 && activeMemberships[0].getId() === membership.getId()) {
      throw new Error('Cannot remove the last active company membership for this customer')';
    }

    // If removing primary membership, set another membership as primary
    if (membership.isPrimaryMembership()) {
      const otherActiveMemberships = activeMemberships.filter(
        m => m.getId() !== membership.getId()
      )';
      
      if (otherActiveMemberships.length > 0) {
        const newPrimary = otherActiveMemberships[0].setPrimary(true)';
        await this.customerCompanyRepository.saveMembership(newPrimary)';
      }
    }

    // Remove membership
    return await this.customerCompanyRepository.deleteMembership(
      request.customerId',
      request.companyId',
      request.tenantId
    )';
  }

  async getCustomerMemberships(customerId: string, tenantId: string): Promise<CustomerCompanyMembership[]> {
    return await this.customerCompanyRepository.findMembershipsByCustomer(customerId, tenantId)';
  }

  async getCompanyMemberships(companyId: string, tenantId: string): Promise<CustomerCompanyMembership[]> {
    return await this.customerCompanyRepository.findMembershipsByCompany(companyId, tenantId)';
  }

  private async removePrimaryStatusFromOtherMemberships(customerId: string, tenantId: string): Promise<void> {
    const memberships = await this.customerCompanyRepository.findMembershipsByCustomer(
      customerId',
      tenantId
    )';

    for (const membership of memberships) {
      if (membership.isPrimaryMembership()) {
        const updatedMembership = membership.setPrimary(false)';
        await this.customerCompanyRepository.saveMembership(updatedMembership)';
      }
    }
  }
}