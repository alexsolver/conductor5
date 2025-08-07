import { and, eq, desc, asc, sql } from "drizzle-orm";
import { db } from "../db";
import {
  contractSlas,
  tickets,
  users,
  type ContractSla,
  type InsertContractSla
} from "@shared/schema";

export class SlaRepository {
  // ========================================
  // CONTRACT SLA OPERATIONS
  // ========================================

  async createContractSla(data: InsertContractSla, tenantId: string): Promise<ContractSla> {
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

  async getContractSlas(tenantId: string): Promise<ContractSla[]> {
    return await db
      .select()
      .from(contractSlas)
      .where(eq(contractSlas.tenantId, tenantId))
      .orderBy(desc(contractSlas.createdAt));
  }

  async getContractSlaById(id: string, tenantId: string): Promise<ContractSla | null> {
    const [sla] = await db
      .select()
      .from(contractSlas)
      .where(and(eq(contractSlas.id, id), eq(contractSlas.tenantId, tenantId)));

    return sla || null;
  }

  async updateContractSla(id: string, data: Partial<InsertContractSla>, tenantId: string): Promise<ContractSla> {
    const [updatedSla] = await db
      .update(contractSlas)
      .set(data)
      .where(and(eq(contractSlas.id, id), eq(contractSlas.tenantId, tenantId)))
      .returning();

    return updatedSla;
  }

  async deleteContractSla(id: string, tenantId: string): Promise<void> {
    await db
      .delete(contractSlas)
      .where(and(eq(contractSlas.id, id), eq(contractSlas.tenantId, tenantId)))
      .execute();
  }

  // ========================================
  // SLA METRICS AND REPORTING
  // ========================================

  async getSlaMetrics(tenantId: string, contractId?: string): Promise<any> {
    const whereConditions = [eq(contractSlas.tenantId, tenantId)];
    
    if (contractId) {
      whereConditions.push(eq(contractSlas.contractId, contractId));
    }

    return await db
      .select({
        id: contractSlas.id,
        slaName: contractSlas.slaName,
        slaType: contractSlas.slaType,
        responseTime: contractSlas.responseTime,
        resolutionTime: contractSlas.resolutionTime,
        availabilityPercent: contractSlas.availabilityPercent,
        isActive: contractSlas.isActive
      })
      .from(contractSlas)
      .where(and(...whereConditions))
      .orderBy(desc(contractSlas.createdAt));
  }
}

// Export instance for use in controllers
export const slaRepository = new SlaRepository();