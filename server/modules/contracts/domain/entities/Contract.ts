// ✅ 1QA.MD COMPLIANCE: Contract Entity - Clean Architecture Domain Layer
// Pure business logic without external dependencies

import { contractStatusEnum, contractTypeEnum, contractPriorityEnum } from '@shared/schema';

// Type definitions from enum values
export type ContractStatus = typeof contractStatusEnum.enumValues[number];
export type ContractType = typeof contractTypeEnum.enumValues[number]; 
export type ContractPriority = typeof contractPriorityEnum.enumValues[number];

export class Contract {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly contractNumber: string,
    public readonly title: string,
    public readonly contractType: ContractType,
    public readonly status: ContractStatus,
    public readonly priority: ContractPriority,
    public readonly customerCompanyId: string | null,
    public readonly managerId: string | null,
    public readonly technicalManagerId: string | null,
    public readonly locationId: string | null,
    public readonly startDate: Date,
    public readonly endDate: Date,
    public readonly renewalDate: Date | null,
    public readonly totalValue: number | null,
    public readonly monthlyValue: number | null,
    public readonly currency: string,
    public readonly paymentTerms: number | null,
    public readonly description: string | null,
    public readonly termsConditions: string | null,
    public readonly autoRenewal: boolean,
    public readonly renewalPeriodMonths: number | null,
    public readonly metadata: Record<string, any> | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly createdById: string | null,
    public readonly updatedById: string | null,
    public readonly isActive: boolean
  ) {
    this.validateBusinessRules();
  }

  private validateBusinessRules(): void {
    if (!this.tenantId) {
      throw new Error('Contract must belong to a tenant');
    }

    if (!this.contractNumber) {
      throw new Error('Contract number is required');
    }

    if (!this.title || this.title.trim().length === 0) {
      throw new Error('Contract title is required');
    }

    if (this.startDate >= this.endDate) {
      throw new Error('Contract start date must be before end date');
    }

    if (this.totalValue !== null && this.totalValue < 0) {
      throw new Error('Contract value cannot be negative');
    }

    if (this.monthlyValue !== null && this.monthlyValue < 0) {
      throw new Error('Monthly value cannot be negative');
    }

    if (this.paymentTerms !== null && this.paymentTerms < 0) {
      throw new Error('Payment terms cannot be negative');
    }

    if (this.renewalPeriodMonths !== null && this.renewalPeriodMonths < 1) {
      throw new Error('Renewal period must be at least 1 month');
    }
  }

  public isExpired(): boolean {
    return new Date() > this.endDate;
  }

  public isExpiringSoon(daysThreshold: number = 30): boolean {
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() + daysThreshold);
    return this.endDate <= thresholdDate && this.endDate > new Date();
  }

  public canBeRenewed(): boolean {
    return this.status === 'active' && this.isExpiringSoon();
  }

  public isAutoRenewable(): boolean {
    return this.autoRenewal && this.renewalPeriodMonths !== null;
  }

  public calculateRemainingDays(): number {
    const today = new Date();
    const timeDiff = this.endDate.getTime() - today.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  }

  public getDurationInDays(): number {
    const timeDiff = this.endDate.getTime() - this.startDate.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  }

  public canTransitionTo(newStatus: ContractStatus): boolean {
    const allowedTransitions: Record<ContractStatus, ContractStatus[]> = {
      'draft': ['analysis', 'canceled'],
      'analysis': ['approved', 'draft', 'canceled'],
      'approved': ['active', 'analysis', 'canceled'],
      'active': ['finished', 'canceled'],
      'finished': [],
      'canceled': []
    };

    return allowedTransitions[this.status]?.includes(newStatus) || false;
  }

  public updateStatus(newStatus: ContractStatus): void {
    if (!this.canTransitionTo(newStatus)) {
      throw new Error(`Invalid status transition from ${this.status} to ${newStatus}`);
    }
  }

  public generateNextRenewalDate(): Date | null {
    if (!this.renewalPeriodMonths) return null;
    
    const nextRenewal = new Date(this.endDate);
    nextRenewal.setMonth(nextRenewal.getMonth() + this.renewalPeriodMonths);
    return nextRenewal;
  }

  public toJSON(): Record<string, any> {
    return {
      id: this.id,
      tenantId: this.tenantId,
      contractNumber: this.contractNumber,
      title: this.title,
      contractType: this.contractType,
      status: this.status,
      priority: this.priority,
      customerCompanyId: this.customerCompanyId,
      managerId: this.managerId,
      technicalManagerId: this.technicalManagerId,
      locationId: this.locationId,
      startDate: this.startDate,
      endDate: this.endDate,
      renewalDate: this.renewalDate,
      totalValue: this.totalValue,
      monthlyValue: this.monthlyValue,
      currency: this.currency,
      paymentTerms: this.paymentTerms,
      description: this.description,
      termsConditions: this.termsConditions,
      autoRenewal: this.autoRenewal,
      renewalPeriodMonths: this.renewalPeriodMonths,
      metadata: this.metadata,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      createdById: this.createdById,
      updatedById: this.updatedById,
      isActive: this.isActive
    };
  }
}