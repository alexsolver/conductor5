// ✅ 1QA.MD COMPLIANCE: Update Contract Use Case - Clean Architecture Application Layer
// Pure business logic orchestration without external dependencies

import { Contract } from '../../domain/entities/Contract';
import { IContractRepository } from '../../domain/repositories/IContractRepository';
import { ContractDomainService } from '../../domain/services/ContractDomainService';
import type { ContractType, ContractStatus, ContractPriority } from '../../domain/entities/Contract';

export interface UpdateContractRequest {
  id: string;
  title?: string;
  contractType?: ContractType;
  status?: ContractStatus;
  priority?: ContractPriority;
  customerCompanyId?: string;
  managerId?: string;
  technicalManagerId?: string;
  locationId?: string;
  startDate?: Date;
  endDate?: Date;
  renewalDate?: Date;
  totalValue?: number;
  monthlyValue?: number;
  currency?: string;
  paymentTerms?: number;
  description?: string;
  termsConditions?: string;
  autoRenewal?: boolean;
  renewalPeriodMonths?: number;
  metadata?: Record<string, any>;
}

export interface UpdateContractResponse {
  contract: Contract;
  financialImpact?: any;
  validationWarnings?: string[];
}

export class UpdateContractUseCase {
  constructor(
    private contractRepository: IContractRepository,
    private contractDomainService: ContractDomainService
  ) {}

  async execute(
    request: UpdateContractRequest,
    tenantId: string,
    userId: string
  ): Promise<UpdateContractResponse> {
    console.log('🔄 [UpdateContractUseCase] Updating contract', {
      id: request.id,
      tenantId
    });

    // Find existing contract
    const existingContract = await this.contractRepository.findById(request.id, tenantId);
    if (!existingContract) {
      throw new Error('Contract not found');
    }

    // Store old values for audit
    const oldValues = existingContract.toJSON();

    // Validate status transition if status is being updated
    if (request.status && request.status !== existingContract.status) {
      if (!existingContract.canTransitionTo(request.status)) {
        throw new Error(`Invalid status transition from ${existingContract.status} to ${request.status}`);
      }
    }

    // Create updated contract entity
    const updatedContract = new Contract(
      existingContract.id,
      existingContract.tenantId,
      existingContract.contractNumber, // Contract number cannot be changed
      request.title ?? existingContract.title,
      request.contractType ?? existingContract.contractType,
      request.status ?? existingContract.status,
      request.priority ?? existingContract.priority,
      request.customerCompanyId !== undefined ? request.customerCompanyId : existingContract.customerCompanyId,
      request.managerId !== undefined ? request.managerId : existingContract.managerId,
      request.technicalManagerId !== undefined ? request.technicalManagerId : existingContract.technicalManagerId,
      request.locationId !== undefined ? request.locationId : existingContract.locationId,
      request.startDate ?? existingContract.startDate,
      request.endDate ?? existingContract.endDate,
      request.renewalDate !== undefined ? request.renewalDate : existingContract.renewalDate,
      request.totalValue !== undefined ? request.totalValue : existingContract.totalValue,
      request.monthlyValue !== undefined ? request.monthlyValue : existingContract.monthlyValue,
      request.currency ?? existingContract.currency,
      request.paymentTerms !== undefined ? request.paymentTerms : existingContract.paymentTerms,
      request.description !== undefined ? request.description : existingContract.description,
      request.termsConditions !== undefined ? request.termsConditions : existingContract.termsConditions,
      request.autoRenewal !== undefined ? request.autoRenewal : existingContract.autoRenewal,
      request.renewalPeriodMonths !== undefined ? request.renewalPeriodMonths : existingContract.renewalPeriodMonths,
      request.metadata !== undefined ? request.metadata : existingContract.metadata,
      existingContract.createdAt,
      new Date(), // updatedAt
      existingContract.createdById,
      userId, // updatedById
      existingContract.isActive
    );

    // Validate business rules
    const validation = this.contractDomainService.validateContractRules(updatedContract);
    if (!validation.isValid) {
      throw new Error(`Contract validation failed: ${validation.errors.join(', ')}`);
    }

    // Calculate financial impact if values changed
    let financialImpact;
    if (
      request.totalValue !== undefined || 
      request.monthlyValue !== undefined
    ) {
      financialImpact = this.contractDomainService.calculateFinancialImpact(
        existingContract,
        updatedContract
      );
    }

    // Persist updated contract
    const savedContract = await this.contractRepository.update(updatedContract, tenantId);

    // Create audit entry
    await this.contractRepository.createAuditEntry(
      tenantId,
      userId,
      'UPDATE_CONTRACT',
      savedContract.id,
      oldValues,
      savedContract.toJSON()
    );

    console.log('✅ [UpdateContractUseCase] Contract updated successfully', {
      id: savedContract.id,
      contractNumber: savedContract.contractNumber,
      hasFinancialImpact: !!financialImpact
    });

    return {
      contract: savedContract,
      financialImpact,
      validationWarnings: validation.warnings.length > 0 ? validation.warnings : undefined
    };
  }
}