/**
 * Contract Entity - Entidade de domínio para contratos
 * Seguindo Clean Architecture e 1qa.md compliance
 */

export interface Contract {
  id: string;
  tenantId: string;
  contractNumber: string;
  title: string;
  contractType: 'service' | 'supply' | 'maintenance' | 'rental' | 'sla';
  status: 'draft' | 'analysis' | 'approved' | 'active' | 'terminated';
  priority: 'low' | 'medium' | 'high' | 'critical' | 'emergency';
  customerCompanyId?: string;
  managerId: string;
  technicalManagerId?: string;
  locationId?: string;
  startDate: Date;
  endDate: Date;
  renewalDate?: Date;
  totalValue: number;
  monthlyValue: number;
  currency: string;
  paymentTerms?: number;
  description?: string;
  termsConditions?: string;
  autoRenewal: boolean;
  renewalPeriodMonths: number;
  createdAt: Date;
  updatedAt: Date;
  createdById: string;
  updatedById: string;
  isActive: boolean;
}

export interface InsertContract {
  tenantId: string;
  contractNumber: string;
  title: string;
  contractType: 'service' | 'supply' | 'maintenance' | 'rental' | 'sla';
  status?: 'draft' | 'analysis' | 'approved' | 'active' | 'terminated';
  priority?: 'low' | 'medium' | 'high' | 'critical' | 'emergency';
  customerCompanyId?: string;
  managerId: string;
  technicalManagerId?: string;
  locationId?: string;
  startDate: Date;
  endDate: Date;
  renewalDate?: Date;
  totalValue: number;
  monthlyValue: number;
  currency?: string;
  paymentTerms?: number;
  description?: string;
  termsConditions?: string;
  autoRenewal?: boolean;
  renewalPeriodMonths?: number;
  createdById: string;
  updatedById: string;
  isActive?: boolean;
}

export interface ContractDocument {
  id: string;
  tenantId: string;
  contractId: string;
  documentName: string;
  documentType: 'contract' | 'addendum' | 'proposal' | 'invoice' | 'receipt';
  fileName?: string;
  filePath?: string;
  fileSize?: number;
  mimeType?: string;
  versionNumber: number;
  isCurrentVersion: boolean;
  description?: string;
  accessLevel: 'internal' | 'client' | 'public';
  requiresSignature: boolean;
  signatureStatus: 'pending' | 'signed' | 'rejected';
  uploadedById: string;
  createdAt: Date;
  isActive: boolean;
}

export interface ContractSla {
  id: string;
  tenantId: string;
  contractId: string;
  slaName: string;
  slaType: 'availability' | 'response_time' | 'resolution_time' | 'performance';
  serviceDescription?: string;
  targetResolutionTime?: number;
  escalationTime?: number;
  penaltyPercentage?: number;
  penaltyAmount?: number;
  measurementPeriod: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  availabilityTarget?: number;
  performanceTarget?: number;
  isActive: boolean;
  createdAt: Date;
}

export interface ContractBilling {
  id: string;
  tenantId: string;
  contractId: string;
  billingCycle: 'monthly' | 'quarterly' | 'annually' | 'one_time';
  billingDay: number;
  billingPeriodStart: Date;
  billingPeriodEnd: Date;
  amount: number;
  currency: string;
  invoiceNumber?: string;
  dueDate: Date;
  paymentStatus: 'pending' | 'paid' | 'overdue' | 'cancelled';
  paymentDate?: Date;
  paymentMethod?: string;
  notes?: string;
  generatedById: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ContractRenewal {
  id: string;
  tenantId: string;
  contractId: string;
  renewalType: 'automatic' | 'manual' | 'negotiated';
  renewalDate: Date;
  newEndDate: Date;
  newValue?: number;
  valueAdjustmentPercentage?: number;
  termsChanges?: string;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  approvedById?: string;
  approvalDate?: Date;
  notes?: string;
  requestedById: string;
  createdAt: Date;
}

export interface ContractEquipment {
  id: string;
  tenantId: string;
  contractId: string;
  equipmentName: string;
  equipmentType?: string;
  serialNumber?: string;
  model?: string;
  manufacturer?: string;
  warrantyStartDate?: Date;
  warrantyEndDate?: Date;
  maintenanceSchedule?: string;
  location?: string;
  status: 'active' | 'inactive' | 'maintenance' | 'decommissioned';
  notes?: string;
  createdAt: Date;
  isActive: boolean;
}