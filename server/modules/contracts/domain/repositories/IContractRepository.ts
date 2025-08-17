/**
 * IContractRepository - Interface do repositório de contratos
 * Seguindo Clean Architecture e 1qa.md compliance
 */

import { Contract, InsertContract } from '../entities/Contract';

export interface ContractFilters {
  status?: string;
  contractType?: string;
  priority?: string;
  managerId?: string;
  customerCompanyId?: string;
  search?: string;
  startDateFrom?: string;
  startDateTo?: string;
  endDateFrom?: string;
  endDateTo?: string;
  totalValueMin?: number;
  totalValueMax?: number;
}

export interface ContractListOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface IContractRepository {
  create(tenantId: string, contractData: InsertContract): Promise<Contract>;
  findById(tenantId: string, id: string): Promise<Contract | null>;
  findByNumber(tenantId: string, contractNumber: string): Promise<Contract | null>;
  findMany(
    tenantId: string, 
    filters?: ContractFilters, 
    options?: ContractListOptions
  ): Promise<{ contracts: Contract[], total: number, page: number, limit: number }>;
  findByCustomer(tenantId: string, customerCompanyId: string): Promise<Contract[]>;
  findByManager(tenantId: string, managerId: string): Promise<Contract[]>;
  findExpiringSoon(tenantId: string, days: number): Promise<Contract[]>;
  findByStatus(tenantId: string, status: string): Promise<Contract[]>;
  update(tenantId: string, id: string, updateData: Partial<InsertContract>, updatedBy: string): Promise<Contract>;
  delete(tenantId: string, id: string): Promise<void>;
  count(tenantId: string, filters?: ContractFilters): Promise<number>;
  generateContractNumber(tenantId: string, year: number): Promise<string>;
  getFinancialSummary(tenantId: string, filters?: ContractFilters): Promise<{
    totalValue: number;
    monthlyRecurring: number;
    averageValue: number;
    totalContracts: number;
  }>;
}