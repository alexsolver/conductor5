/**
 * ContractApplicationService - Serviço de aplicação para contratos
 * Seguindo Clean Architecture e 1qa.md compliance
 */

import { IContractRepository, ContractFilters, ContractListOptions } from '../../domain/repositories/IContractRepository';
import { Contract, InsertContract } from '../../domain/entities/Contract';

export class ContractApplicationService {
  constructor(
    private contractRepository: IContractRepository
  ) {}

  async getContracts(
    tenantId: string, 
    filters: ContractFilters = {}, 
    options: ContractListOptions = {}
  ): Promise<{ contracts: Contract[], total: number, page: number, limit: number }> {
    console.log('📋 [ContractApplicationService] Getting contracts with filters:', filters);
    
    try {
      const result = await this.contractRepository.findMany(tenantId, filters, options);
      console.log(`✅ [ContractApplicationService] Found ${result.contracts.length} contracts`);
      return result;
    } catch (error) {
      console.error('❌ [ContractApplicationService] Error getting contracts:', error);
      throw new Error('Failed to get contracts');
    }
  }

  async getContractById(tenantId: string, id: string): Promise<Contract | null> {
    console.log('🔍 [ContractApplicationService] Getting contract by ID:', id);
    
    try {
      const contract = await this.contractRepository.findById(tenantId, id);
      if (!contract) {
        console.log('❌ [ContractApplicationService] Contract not found:', id);
        return null;
      }
      
      console.log('✅ [ContractApplicationService] Found contract:', contract.title);
      return contract;
    } catch (error) {
      console.error('❌ [ContractApplicationService] Error getting contract:', error);
      throw new Error('Failed to get contract');
    }
  }

  async createContract(tenantId: string, contractData: InsertContract): Promise<Contract> {
    console.log('➕ [ContractApplicationService] Creating contract:', contractData.title);
    
    try {
      // Gerar número do contrato se não fornecido
      if (!contractData.contractNumber) {
        const currentYear = new Date().getFullYear();
        contractData.contractNumber = await this.contractRepository.generateContractNumber(tenantId, currentYear);
      }

      // Validar se o número do contrato já existe
      const existingContract = await this.contractRepository.findByNumber(tenantId, contractData.contractNumber);
      if (existingContract) {
        throw new Error('Contract number already exists');
      }

      const newContract = await this.contractRepository.create(tenantId, contractData);
      console.log('✅ [ContractApplicationService] Contract created:', newContract.id);
      return newContract;
    } catch (error) {
      console.error('❌ [ContractApplicationService] Error creating contract:', error);
      throw new Error('Failed to create contract');
    }
  }

  async updateContract(
    tenantId: string, 
    id: string, 
    updateData: Partial<InsertContract>, 
    updatedBy: string
  ): Promise<Contract> {
    console.log('✏️ [ContractApplicationService] Updating contract:', id);
    
    try {
      // Verificar se o contrato existe
      const existingContract = await this.contractRepository.findById(tenantId, id);
      if (!existingContract) {
        throw new Error('Contract not found');
      }

      const updatedContract = await this.contractRepository.update(tenantId, id, updateData, updatedBy);
      console.log('✅ [ContractApplicationService] Contract updated:', updatedContract.id);
      return updatedContract;
    } catch (error) {
      console.error('❌ [ContractApplicationService] Error updating contract:', error);
      throw new Error('Failed to update contract');
    }
  }

  async deleteContract(tenantId: string, id: string): Promise<void> {
    console.log('🗑️ [ContractApplicationService] Deleting contract:', id);
    
    try {
      // Verificar se o contrato existe
      const existingContract = await this.contractRepository.findById(tenantId, id);
      if (!existingContract) {
        throw new Error('Contract not found');
      }

      await this.contractRepository.delete(tenantId, id);
      console.log('✅ [ContractApplicationService] Contract deleted:', id);
    } catch (error) {
      console.error('❌ [ContractApplicationService] Error deleting contract:', error);
      throw new Error('Failed to delete contract');
    }
  }

  async getContractsByCustomer(tenantId: string, customerCompanyId: string): Promise<Contract[]> {
    console.log('🔍 [ContractApplicationService] Getting contracts by customer:', customerCompanyId);
    
    try {
      const contracts = await this.contractRepository.findByCustomer(tenantId, customerCompanyId);
      console.log(`✅ [ContractApplicationService] Found ${contracts.length} contracts for customer`);
      return contracts;
    } catch (error) {
      console.error('❌ [ContractApplicationService] Error getting contracts by customer:', error);
      throw new Error('Failed to get contracts by customer');
    }
  }

  async getContractsByManager(tenantId: string, managerId: string): Promise<Contract[]> {
    console.log('🔍 [ContractApplicationService] Getting contracts by manager:', managerId);
    
    try {
      const contracts = await this.contractRepository.findByManager(tenantId, managerId);
      console.log(`✅ [ContractApplicationService] Found ${contracts.length} contracts for manager`);
      return contracts;
    } catch (error) {
      console.error('❌ [ContractApplicationService] Error getting contracts by manager:', error);
      throw new Error('Failed to get contracts by manager');
    }
  }

  async getExpiringContracts(tenantId: string, days: number = 30): Promise<Contract[]> {
    console.log('⏰ [ContractApplicationService] Getting contracts expiring in', days, 'days');
    
    try {
      const contracts = await this.contractRepository.findExpiringSoon(tenantId, days);
      console.log(`✅ [ContractApplicationService] Found ${contracts.length} contracts expiring soon`);
      return contracts;
    } catch (error) {
      console.error('❌ [ContractApplicationService] Error getting expiring contracts:', error);
      throw new Error('Failed to get expiring contracts');
    }
  }

  async getFinancialSummary(tenantId: string, filters: ContractFilters = {}): Promise<{
    totalValue: number;
    monthlyRecurring: number;
    averageValue: number;
    totalContracts: number;
  }> {
    console.log('📊 [ContractApplicationService] Getting financial summary');
    
    try {
      const summary = await this.contractRepository.getFinancialSummary(tenantId, filters);
      console.log('✅ [ContractApplicationService] Financial summary generated');
      return summary;
    } catch (error) {
      console.error('❌ [ContractApplicationService] Error getting financial summary:', error);
      throw new Error('Failed to get financial summary');
    }
  }

  async getDashboardMetrics(tenantId: string): Promise<{
    totalActive: number;
    totalDraft: number;
    totalExpiringSoon: number;
    monthlyRevenue: number;
    totalRevenue: number;
  }> {
    console.log('📈 [ContractApplicationService] Getting dashboard metrics');
    
    try {
      const [activeContracts, draftContracts, expiringContracts, financialSummary] = await Promise.all([
        this.contractRepository.count(tenantId, { status: 'active' }),
        this.contractRepository.count(tenantId, { status: 'draft' }),
        this.contractRepository.findExpiringSoon(tenantId, 30),
        this.contractRepository.getFinancialSummary(tenantId, { status: 'active' })
      ]);

      const metrics = {
        totalActive: activeContracts,
        totalDraft: draftContracts,
        totalExpiringSoon: expiringContracts.length,
        monthlyRevenue: financialSummary.monthlyRecurring,
        totalRevenue: financialSummary.totalValue
      };

      console.log('✅ [ContractApplicationService] Dashboard metrics generated:', metrics);
      return metrics;
    } catch (error) {
      console.error('❌ [ContractApplicationService] Error getting dashboard metrics:', error);
      throw new Error('Failed to get dashboard metrics');
    }
  }
}