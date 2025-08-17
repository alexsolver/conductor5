// ✅ 1QA.MD COMPLIANCE: Create Contract Use Case - Clean Architecture Application Layer
// Pure business logic orchestration without external dependencies

import { Contract } from '../../domain/entities/Contract';
import { IContractRepository } from '../../domain/repositories/IContractRepository';
import { ContractDomainService } from '../../domain/services/ContractDomainService';
import type { ContractType, ContractStatus, ContractPriority } from '../../domain/entities/Contract';

export interface CreateContractRequest {
  title: string;
  contractType: ContractType;
  priority?: ContractPriority;
  customerCompanyId?: string;
  managerId?: string;
  technicalManagerId?: string;
  locationId?: string;
  startDate: Date;
  endDate: Date;
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
  createdById?: string;
}

export interface CreateContractResponse {
  contract: Contract;
  validationWarnings?: string[];
}

export class CreateContractUseCase {
  constructor(
    private contractRepository: IContractRepository,
    private contractDomainService: ContractDomainService
  ) {}

  async execute(
    request: CreateContractRequest,
    tenantId: string,
    userId: string
  ): Promise<CreateContractResponse> {
    console.log('🏗️ [CreateContractUseCase] Creating new contract', {
      title: request.title,
      type: request.contractType,
      tenantId
    });

    // Generate unique contract number
    const currentYear = new Date().getFullYear();
    const existingContracts = await this.contractRepository.findAll(tenantId);
    const sequence = existingContracts.length + 1;
    const contractNumber = this.contractDomainService.generateContractNumber(currentYear, sequence);

    // Ensure contract number is unique
    const existingContract = await this.contractRepository.findByContractNumber(contractNumber, tenantId);
    if (existingContract) {
      // If collision, use timestamp-based fallback
      const timestamp = Date.now().toString().slice(-4);
      const fallbackNumber = this.contractDomainService.generateContractNumber(currentYear, parseInt(timestamp));
    }

    // Create contract entity with generated ID
    const contractId = crypto.randomUUID();
    
    const contract = new Contract(
      contractId,
      tenantId,
      contractNumber,
      request.title,
      request.contractType,
      'draft', // All contracts start as draft
      request.priority || this.contractDomainService.calculateContractPriority({} as Contract),
      request.customerCompanyId || null,
      request.managerId || null,
      request.technicalManagerId || null,
      request.locationId || null,
      request.startDate,
      request.endDate,
      request.renewalDate || null,
      request.totalValue || null,
      request.monthlyValue || null,
      request.currency || 'BRL',
      request.paymentTerms || null,
      request.description || null,
      request.termsConditions || null,
      request.autoRenewal || false,
      request.renewalPeriodMonths || null,
      request.metadata || null,
      new Date(), // createdAt
      new Date(), // updatedAt
      request.createdById || userId,
      userId, // updatedById
      true // isActive
    );

    // Validate business rules
    const validation = this.contractDomainService.validateContractRules(contract);
    if (!validation.isValid) {
      throw new Error(`Contract validation failed: ${validation.errors.join(', ')}`);
    }

    // Persist contract
    const createdContract = await this.contractRepository.create(contract, tenantId);

    // Create audit entry
    await this.contractRepository.createAuditEntry(
      tenantId,
      userId,
      'CREATE_CONTRACT',
      createdContract.id,
      undefined,
      createdContract.toJSON()
    );

    console.log('✅ [CreateContractUseCase] Contract created successfully', {
      id: createdContract.id,
      contractNumber: createdContract.contractNumber
    });

    return {
      contract: createdContract,
      validationWarnings: validation.warnings.length > 0 ? validation.warnings : undefined
    };
  }
}