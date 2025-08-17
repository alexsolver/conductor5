// ✅ 1QA.MD COMPLIANCE: Contract Domain Service - Clean Architecture Domain Layer
// Pure business logic without external dependencies

import { Contract } from '../entities/Contract';
import { contractStatusEnum, contractTypeEnum, contractPriorityEnum } from '@shared/schema';

// Type definitions from enum values
export type ContractStatus = typeof contractStatusEnum.enumValues[number];
export type ContractType = typeof contractTypeEnum.enumValues[number]; 
export type ContractPriority = typeof contractPriorityEnum.enumValues[number];

export class ContractDomainService {
  /**
   * Generate unique contract number following business rules
   * Format: CT-YYYY-NNNN (e.g., CT-2025-0001)
   */
  public generateContractNumber(year: number, sequence: number): string {
    const sequenceStr = sequence.toString().padStart(4, '0');
    return `CT-${year}-${sequenceStr}`;
  }

  /**
   * Calculate contract renewal recommendations
   */
  public calculateRenewalRecommendations(contracts: Contract[]): ContractRenewalRecommendation[] {
    return contracts
      .filter(contract => contract.canBeRenewed())
      .map(contract => ({
        contractId: contract.id,
        contractNumber: contract.contractNumber,
        title: contract.title,
        currentEndDate: contract.endDate,
        recommendedRenewalDate: this.calculateOptimalRenewalDate(contract),
        urgencyLevel: this.calculateRenewalUrgency(contract),
        estimatedValue: this.estimateRenewalValue(contract),
        autoRenewable: contract.isAutoRenewable()
      }))
      .sort((a, b) => this.compareRenewalUrgency(a.urgencyLevel, b.urgencyLevel));
  }

  /**
   * Calculate SLA compliance metrics
   */
  public calculateSlaMetrics(contracts: Contract[]): SlaMetrics {
    const activeContracts = contracts.filter(c => c.status === 'active');
    
    return {
      totalActiveContracts: activeContracts.length,
      averageContractDuration: this.calculateAverageDuration(activeContracts),
      renewalRate: this.calculateRenewalRate(contracts),
      valueDistribution: this.calculateValueDistribution(activeContracts),
      riskDistribution: this.calculateRiskDistribution(activeContracts)
    };
  }

  /**
   * Validate contract business rules before persistence
   */
  public validateContractRules(contract: Contract): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check for overlapping contracts with same customer
    if (contract.status === 'active') {
      // This would need to be checked against repository data
      warnings.push('Active contract validation requires repository check');
    }

    // Validate contract value vs type
    if (contract.contractType === 'sla' && !contract.monthlyValue) {
      warnings.push('SLA contracts typically require monthly value definition');
    }

    // Check renewal configuration
    if (contract.autoRenewal && !contract.renewalPeriodMonths) {
      errors.push('Auto-renewable contracts must specify renewal period');
    }

    // Validate contract duration
    const duration = contract.getDurationInDays();
    if (duration < 30 && contract.contractType !== 'service') {
      warnings.push('Short-term contracts may require special approval');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Determine contract priority based on business rules
   */
  public calculateContractPriority(contract: Contract): ContractPriority {
    // High value contracts
    if (contract.totalValue && contract.totalValue > 100000) {
      return 'critical';
    }

    // SLA contracts are typically high priority
    if (contract.contractType === 'sla') {
      return 'high';
    }

    // Expiring soon contracts
    if (contract.isExpiringSoon(15)) {
      return 'high';
    }

    // Maintenance contracts for critical systems
    if (contract.contractType === 'maintenance') {
      return 'high';
    }

    return 'medium';
  }

  /**
   * Calculate financial impact of contract changes
   */
  public calculateFinancialImpact(
    originalContract: Contract,
    updatedContract: Contract
  ): FinancialImpact {
    const originalValue = originalContract.totalValue || 0;
    const updatedValue = updatedContract.totalValue || 0;
    const difference = updatedValue - originalValue;
    
    const originalMonthly = originalContract.monthlyValue || 0;
    const updatedMonthly = updatedContract.monthlyValue || 0;
    const monthlyDifference = updatedMonthly - originalMonthly;

    return {
      totalValueChange: difference,
      monthlyValueChange: monthlyDifference,
      percentageChange: originalValue > 0 ? (difference / originalValue) * 100 : 0,
      impactLevel: this.determineImpactLevel(difference, originalValue)
    };
  }

  // Private helper methods
  private calculateOptimalRenewalDate(contract: Contract): Date {
    const renewalBuffer = 30; // 30 days before expiration
    const optimalDate = new Date(contract.endDate);
    optimalDate.setDate(optimalDate.getDate() - renewalBuffer);
    return optimalDate;
  }

  private calculateRenewalUrgency(contract: Contract): RenewalUrgency {
    const remainingDays = contract.calculateRemainingDays();
    
    if (remainingDays <= 7) return 'critical';
    if (remainingDays <= 15) return 'high';
    if (remainingDays <= 30) return 'medium';
    return 'low';
  }

  private estimateRenewalValue(contract: Contract): number {
    // Apply standard inflation adjustment of 3%
    const baseValue = contract.totalValue || contract.monthlyValue || 0;
    return Math.round(baseValue * 1.03);
  }

  private compareRenewalUrgency(a: RenewalUrgency, b: RenewalUrgency): number {
    const urgencyOrder = { 'critical': 0, 'high': 1, 'medium': 2, 'low': 3 };
    return urgencyOrder[a] - urgencyOrder[b];
  }

  private calculateAverageDuration(contracts: Contract[]): number {
    if (contracts.length === 0) return 0;
    
    const totalDays = contracts.reduce((sum, contract) => {
      return sum + contract.getDurationInDays();
    }, 0);
    
    return Math.round(totalDays / contracts.length);
  }

  private calculateRenewalRate(contracts: Contract[]): number {
    const eligibleForRenewal = contracts.filter(c => 
      c.status === 'finished' && c.endDate > new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
    );
    
    if (eligibleForRenewal.length === 0) return 0;
    
    const renewed = eligibleForRenewal.filter(c => c.renewalDate !== null);
    return (renewed.length / eligibleForRenewal.length) * 100;
  }

  private calculateValueDistribution(contracts: Contract[]): ValueDistribution {
    const values = contracts
      .map(c => c.totalValue || 0)
      .filter(v => v > 0)
      .sort((a, b) => a - b);
    
    if (values.length === 0) {
      return { min: 0, max: 0, average: 0, median: 0 };
    }
    
    const sum = values.reduce((a, b) => a + b, 0);
    const average = sum / values.length;
    const median = values[Math.floor(values.length / 2)];
    
    return {
      min: values[0],
      max: values[values.length - 1],
      average: Math.round(average),
      median: Math.round(median)
    };
  }

  private calculateRiskDistribution(contracts: Contract[]): RiskDistribution {
    const riskCounts = { low: 0, medium: 0, high: 0, critical: 0 };
    
    contracts.forEach(contract => {
      const priority = this.calculateContractPriority(contract);
      if (priority === 'emergency') {
        riskCounts.critical++;
      } else {
        riskCounts[priority]++;
      }
    });
    
    const total = contracts.length;
    return {
      low: total > 0 ? (riskCounts.low / total) * 100 : 0,
      medium: total > 0 ? (riskCounts.medium / total) * 100 : 0,
      high: total > 0 ? (riskCounts.high / total) * 100 : 0,
      critical: total > 0 ? (riskCounts.critical / total) * 100 : 0
    };
  }

  private determineImpactLevel(difference: number, originalValue: number): ImpactLevel {
    if (originalValue === 0) return 'low';
    
    const percentageChange = Math.abs(difference / originalValue) * 100;
    
    if (percentageChange >= 20) return 'high';
    if (percentageChange >= 10) return 'medium';
    return 'low';
  }
}

// Type definitions
export interface ContractRenewalRecommendation {
  contractId: string;
  contractNumber: string;
  title: string;
  currentEndDate: Date;
  recommendedRenewalDate: Date;
  urgencyLevel: RenewalUrgency;
  estimatedValue: number;
  autoRenewable: boolean;
}

export interface SlaMetrics {
  totalActiveContracts: number;
  averageContractDuration: number;
  renewalRate: number;
  valueDistribution: ValueDistribution;
  riskDistribution: RiskDistribution;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface FinancialImpact {
  totalValueChange: number;
  monthlyValueChange: number;
  percentageChange: number;
  impactLevel: ImpactLevel;
}

export interface ValueDistribution {
  min: number;
  max: number;
  average: number;
  median: number;
}

export interface RiskDistribution {
  low: number;
  medium: number;
  high: number;
  critical: number;
}

export type RenewalUrgency = 'low' | 'medium' | 'high' | 'critical';
export type ImpactLevel = 'low' | 'medium' | 'high';