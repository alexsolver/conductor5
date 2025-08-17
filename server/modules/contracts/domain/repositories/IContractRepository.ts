// ✅ 1QA.MD COMPLIANCE: Contract Repository Interface - Clean Architecture Domain Layer
// Pure interface without implementation details

import { Contract } from '../entities/Contract';
import { contractStatusEnum, contractTypeEnum, contractPriorityEnum } from '@shared/schema';

// Type definitions from enum values
export type ContractStatus = typeof contractStatusEnum.enumValues[number];
export type ContractType = typeof contractTypeEnum.enumValues[number]; 
export type ContractPriority = typeof contractPriorityEnum.enumValues[number];

export interface ContractFilters {
  status?: ContractStatus;
  contractType?: ContractType;
  priority?: ContractPriority;
  customerCompanyId?: string;
  managerId?: string;
  locationId?: string;
  startDateFrom?: Date;
  startDateTo?: Date;
  endDateFrom?: Date;
  endDateTo?: Date;
  search?: string;
  isActive?: boolean;
}

export interface ContractSummary {
  totalContracts: number;
  activeContracts: number;
  expiringSoonContracts: number;
  totalValue: number;
  monthlyRecurringRevenue: number;
}

export interface IContractRepository {
  // ✅ Basic CRUD Operations
  findById(id: string, tenantId: string): Promise<Contract | null>;
  findAll(tenantId: string, filters?: ContractFilters): Promise<Contract[]>;
  create(contract: Contract, tenantId: string): Promise<Contract>;
  update(contract: Contract, tenantId: string): Promise<Contract>;
  delete(id: string, tenantId: string): Promise<void>;

  // ✅ Business Queries
  findByContractNumber(contractNumber: string, tenantId: string): Promise<Contract | null>;
  findExpiring(tenantId: string, daysThreshold?: number): Promise<Contract[]>;
  findByCustomer(customerCompanyId: string, tenantId: string): Promise<Contract[]>;
  findByManager(managerId: string, tenantId: string): Promise<Contract[]>;
  findByStatus(status: ContractStatus, tenantId: string): Promise<Contract[]>;

  // ✅ Analytics & Reporting
  getSummary(tenantId: string): Promise<ContractSummary>;
  getContractsByMonth(tenantId: string, year: number): Promise<Record<string, number>>;
  getRevenueByMonth(tenantId: string, year: number): Promise<Record<string, number>>;

  // ✅ Audit Trail (Required by 1qa.md)
  createAuditEntry(
    tenantId: string,
    userId: string,
    action: string,
    entityId: string,
    oldValues?: Record<string, any>,
    newValues?: Record<string, any>
  ): Promise<void>;
}