import { db } from '../db';
import { contracts, contractSlas, contractServices, contractDocuments, contractRenewals, contractBilling, contractEquipment } from '@shared/schema';
import { eq, and, sql, desc, asc, ilike, between, inArray } from 'drizzle-orm';

export class ContractRepository {
  // ========================================
  // CONTRACTS CRUD OPERATIONS
  // ========================================
  
  async createContract(data: any, tenantId: string, userId: string) {
    const contractData = {
      ...data,
      tenantId,
      createdById: userId,
      updatedById: userId,
    };
    
    const [newContract] = await db
      .insert(contracts)
      .values(contractData)
      .returning();
    
    return newContract;
  }
  
  async getContracts(tenantId: string, filters?: {
    status?: string;
    contractType?: string;
    priority?: string;
    customerId?: string;
    managerId?: string;
    searchTerm?: string;
    limit?: number;
    offset?: number;
  }) {
    const whereConditions: any[] = [eq(contracts.tenantId, tenantId)];
    
    if (filters?.status) {
      whereConditions.push(eq(contracts.status, filters.status));
    }
    
    if (filters?.contractType) {
      whereConditions.push(eq(contracts.contractType, filters.contractType));
    }
    
    if (filters?.priority) {
      whereConditions.push(eq(contracts.priority, filters.priority));
    }
    
    if (filters?.customerId) {
      whereConditions.push(eq(contracts.customerId, filters.customerId));
    }
    
    if (filters?.managerId) {
      whereConditions.push(eq(contracts.managerId, filters.managerId));
    }
    
    if (filters?.searchTerm) {
      whereConditions.push(
        sql`(${contracts.title} ILIKE ${`%${filters.searchTerm}%`} OR ${contracts.contractNumber} ILIKE ${`%${filters.searchTerm}%`} OR ${contracts.description} ILIKE ${`%${filters.searchTerm}%`})`
      );
    }
    
    let query = db
      .select()
      .from(contracts)
      .where(and(...whereConditions))
      .orderBy(desc(contracts.createdAt));
    
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }
    
    if (filters?.offset) {
      query = query.offset(filters.offset);
    }
    
    return await query;
  }
  
  async getContractById(id: string, tenantId: string) {
    const result = await db
      .select()
      .from(contracts)
      .where(and(eq(contracts.id, id), eq(contracts.tenantId, tenantId)));
    
    return result[0] || null;
  }
  
  async updateContract(id: string, data: any, tenantId: string, userId: string) {
    const updateData = {
      ...data,
      updatedById: userId,
      updatedAt: new Date(),
    };
    
    const [updatedContract] = await db
      .update(contracts)
      .set(updateData)
      .where(and(eq(contracts.id, id), eq(contracts.tenantId, tenantId)))
      .returning();
    
    return updatedContract;
  }
  
  async deleteContract(id: string, tenantId: string) {
    const [deletedContract] = await db
      .update(contracts)
      .set({ isActive: false })
      .where(and(eq(contracts.id, id), eq(contracts.tenantId, tenantId)))
      .returning();
    
    return deletedContract;
  }
  
  // ========================================
  // CONTRACT SLA OPERATIONS
  // ========================================
  
  async createContractSla(data: any, tenantId: string) {
    const slaData = {
      ...data,
      tenantId,
    };
    
    const [newSla] = await db
      .insert(contractSlas)
      .values(slaData)
      .returning();
    
    return newSla;
  }
  
  async getContractSlas(contractId: string, tenantId: string) {
    return await db
      .select()
      .from(contractSlas)
      .where(and(eq(contractSlas.contractId, contractId), eq(contractSlas.tenantId, tenantId)))
      .orderBy(desc(contractSlas.createdAt));
  }
  
  async updateContractSla(id: string, data: any, tenantId: string) {
    const [updatedSla] = await db
      .update(contractSlas)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(contractSlas.id, id), eq(contractSlas.tenantId, tenantId)))
      .returning();
    
    return updatedSla;
  }
  
  async deleteContractSla(id: string, tenantId: string) {
    const [deletedSla] = await db
      .update(contractSlas)
      .set({ isActive: false })
      .where(and(eq(contractSlas.id, id), eq(contractSlas.tenantId, tenantId)))
      .returning();
    
    return deletedSla;
  }
  
  // ========================================
  // CONTRACT SERVICES OPERATIONS
  // ========================================
  
  async createContractService(data: any, tenantId: string) {
    const serviceData = {
      ...data,
      tenantId,
    };
    
    const [newService] = await db
      .insert(contractServices)
      .values(serviceData)
      .returning();
    
    return newService;
  }
  
  async getContractServices(contractId: string, tenantId: string) {
    return await db
      .select()
      .from(contractServices)
      .where(and(eq(contractServices.contractId, contractId), eq(contractServices.tenantId, tenantId)))
      .orderBy(desc(contractServices.createdAt));
  }
  
  async updateContractService(id: string, data: any, tenantId: string) {
    const [updatedService] = await db
      .update(contractServices)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(contractServices.id, id), eq(contractServices.tenantId, tenantId)))
      .returning();
    
    return updatedService;
  }
  
  async deleteContractService(id: string, tenantId: string) {
    const [deletedService] = await db
      .update(contractServices)
      .set({ isActive: false })
      .where(and(eq(contractServices.id, id), eq(contractServices.tenantId, tenantId)))
      .returning();
    
    return deletedService;
  }
  
  // ========================================
  // CONTRACT DOCUMENTS OPERATIONS
  // ========================================
  
  async createContractDocument(data: any, tenantId: string, userId: string) {
    const documentData = {
      ...data,
      tenantId,
      uploadedById: userId,
    };
    
    const [newDocument] = await db
      .insert(contractDocuments)
      .values(documentData)
      .returning();
    
    return newDocument;
  }
  
  async getContractDocuments(contractId: string, tenantId: string) {
    return await db
      .select()
      .from(contractDocuments)
      .where(and(eq(contractDocuments.contractId, contractId), eq(contractDocuments.tenantId, tenantId)))
      .orderBy(desc(contractDocuments.createdAt));
  }
  
  async updateContractDocument(id: string, data: any, tenantId: string) {
    const [updatedDocument] = await db
      .update(contractDocuments)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(contractDocuments.id, id), eq(contractDocuments.tenantId, tenantId)))
      .returning();
    
    return updatedDocument;
  }
  
  async deleteContractDocument(id: string, tenantId: string) {
    const [deletedDocument] = await db
      .update(contractDocuments)
      .set({ isActive: false })
      .where(and(eq(contractDocuments.id, id), eq(contractDocuments.tenantId, tenantId)))
      .returning();
    
    return deletedDocument;
  }
  
  // ========================================
  // CONTRACT RENEWAL OPERATIONS
  // ========================================
  
  async createContractRenewal(data: any, tenantId: string, userId: string) {
    const renewalData = {
      ...data,
      tenantId,
      requestedById: userId,
    };
    
    const [newRenewal] = await db
      .insert(contractRenewals)
      .values(renewalData)
      .returning();
    
    return newRenewal;
  }
  
  async getContractRenewals(contractId: string, tenantId: string) {
    return await db
      .select()
      .from(contractRenewals)
      .where(and(eq(contractRenewals.contractId, contractId), eq(contractRenewals.tenantId, tenantId)))
      .orderBy(desc(contractRenewals.renewalDate));
  }
  
  async updateContractRenewal(id: string, data: any, tenantId: string) {
    const [updatedRenewal] = await db
      .update(contractRenewals)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(contractRenewals.id, id), eq(contractRenewals.tenantId, tenantId)))
      .returning();
    
    return updatedRenewal;
  }
  
  // ========================================
  // CONTRACT BILLING OPERATIONS
  // ========================================
  
  async createContractBilling(data: any, tenantId: string, userId: string) {
    const billingData = {
      ...data,
      tenantId,
      generatedById: userId,
    };
    
    const [newBilling] = await db
      .insert(contractBilling)
      .values(billingData)
      .returning();
    
    return newBilling;
  }
  
  async getContractBilling(contractId: string, tenantId: string, filters?: {
    startDate?: Date;
    endDate?: Date;
    paymentStatus?: string;
  }) {
    const whereConditions: any[] = [
      eq(contractBilling.contractId, contractId),
      eq(contractBilling.tenantId, tenantId)
    ];
    
    if (filters?.startDate && filters?.endDate) {
      whereConditions.push(between(contractBilling.billingPeriodStart, filters.startDate, filters.endDate));
    }
    
    if (filters?.paymentStatus) {
      whereConditions.push(eq(contractBilling.paymentStatus, filters.paymentStatus));
    }
    
    return await db
      .select()
      .from(contractBilling)
      .where(and(...whereConditions))
      .orderBy(desc(contractBilling.billingPeriodStart));
  }
  
  async updateContractBilling(id: string, data: any, tenantId: string) {
    const [updatedBilling] = await db
      .update(contractBilling)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(contractBilling.id, id), eq(contractBilling.tenantId, tenantId)))
      .returning();
    
    return updatedBilling;
  }
  
  // ========================================
  // CONTRACT EQUIPMENT OPERATIONS
  // ========================================
  
  async createContractEquipment(data: any, tenantId: string) {
    const equipmentData = {
      ...data,
      tenantId,
    };
    
    const [newEquipment] = await db
      .insert(contractEquipment)
      .values(equipmentData)
      .returning();
    
    return newEquipment;
  }
  
  async getContractEquipment(contractId: string, tenantId: string) {
    return await db
      .select()
      .from(contractEquipment)
      .where(and(eq(contractEquipment.contractId, contractId), eq(contractEquipment.tenantId, tenantId)))
      .orderBy(desc(contractEquipment.createdAt));
  }
  
  async updateContractEquipment(id: string, data: any, tenantId: string) {
    const [updatedEquipment] = await db
      .update(contractEquipment)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(contractEquipment.id, id), eq(contractEquipment.tenantId, tenantId)))
      .returning();
    
    return updatedEquipment;
  }
  
  async deleteContractEquipment(id: string, tenantId: string) {
    const [deletedEquipment] = await db
      .update(contractEquipment)
      .set({ isActive: false })
      .where(and(eq(contractEquipment.id, id), eq(contractEquipment.tenantId, tenantId)))
      .returning();
    
    return deletedEquipment;
  }
  
  // ========================================
  // DASHBOARD AND ANALYTICS
  // ========================================
  
  async getContractStats(tenantId: string) {
    const totalContracts = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(contracts)
      .where(and(eq(contracts.tenantId, tenantId), eq(contracts.isActive, true)));
    
    const activeContracts = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(contracts)
      .where(and(eq(contracts.tenantId, tenantId), eq(contracts.status, 'active'), eq(contracts.isActive, true)));
    
    const contractsNearRenewal = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(contracts)
      .where(and(
        eq(contracts.tenantId, tenantId),
        eq(contracts.isActive, true),
        sql`${contracts.renewalDate} <= NOW() + INTERVAL '30 days'`
      ));
    
    const totalValue = await db
      .select({ sum: sql<number>`COALESCE(SUM(${contracts.totalValue}), 0)` })
      .from(contracts)
      .where(and(eq(contracts.tenantId, tenantId), eq(contracts.status, 'active'), eq(contracts.isActive, true)));
    
    const monthlyRecurring = await db
      .select({ sum: sql<number>`COALESCE(SUM(${contracts.monthlyValue}), 0)` })
      .from(contracts)
      .where(and(eq(contracts.tenantId, tenantId), eq(contracts.status, 'active'), eq(contracts.isActive, true)));
    
    return {
      totalContracts: totalContracts[0]?.count || 0,
      activeContracts: activeContracts[0]?.count || 0,
      contractsNearRenewal: contractsNearRenewal[0]?.count || 0,
      totalValue: totalValue[0]?.sum || 0,
      monthlyRecurring: monthlyRecurring[0]?.sum || 0,
    };
  }
  
  async getContractsByStatus(tenantId: string) {
    return await db
      .select({
        status: contracts.status,
        count: sql<number>`COUNT(*)`
      })
      .from(contracts)
      .where(and(eq(contracts.tenantId, tenantId), eq(contracts.isActive, true)))
      .groupBy(contracts.status);
  }
  
  async getContractsByType(tenantId: string) {
    return await db
      .select({
        contractType: contracts.contractType,
        count: sql<number>`COUNT(*)`
      })
      .from(contracts)
      .where(and(eq(contracts.tenantId, tenantId), eq(contracts.isActive, true)))
      .groupBy(contracts.contractType);
  }
  
  async getUpcomingRenewals(tenantId: string, days: number = 30) {
    return await db
      .select()
      .from(contracts)
      .where(and(
        eq(contracts.tenantId, tenantId),
        eq(contracts.isActive, true),
        sql`${contracts.renewalDate} <= NOW() + INTERVAL '${days} days'`
      ))
      .orderBy(asc(contracts.renewalDate));
  }
}