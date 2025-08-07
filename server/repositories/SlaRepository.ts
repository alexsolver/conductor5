import { and, eq, desc, asc, sql, not, inArray } from "drizzle-orm";
import { db } from "../db";
import {
  ticketSlas,
  slaRules,
  slaStatusTimeouts,
  slaEscalations,
  slaMetrics,
  tickets,
  users,
  type TicketSla,
  type InsertTicketSla,
  type SlaRule,
  type InsertSlaRule,
  type SlaStatusTimeout,
  type InsertSlaStatusTimeout,
  type SlaEscalation,
  type InsertSlaEscalation,
  type SlaMetric,
  type InsertSlaMetric
} from "@shared/schema";

export class SlaRepository {
  // ========================================
  // TICKET SLA OPERATIONS
  // ========================================

  async createTicketSla(data: InsertTicketSla, tenantId: string): Promise<TicketSla> {
    const slaData = {
      ...data,
      tenantId,
    };

    const [newSla] = await db
      .insert(ticketSlas)
      .values(slaData)
      .returning();

    return newSla;
  }

  async getTicketSlas(tenantId: string): Promise<TicketSla[]> {
    return await db
      .select()
      .from(ticketSlas)
      .where(eq(ticketSlas.tenantId, tenantId))
      .orderBy(asc(ticketSlas.slaLevel), desc(ticketSlas.createdAt));
  }

  async getTicketSlaById(id: string, tenantId: string): Promise<TicketSla | null> {
    const [sla] = await db
      .select()
      .from(ticketSlas)
      .where(and(eq(ticketSlas.id, id), eq(ticketSlas.tenantId, tenantId)));

    return sla || null;
  }

  async updateTicketSla(id: string, data: Partial<InsertTicketSla>, tenantId: string): Promise<TicketSla | null> {
    const [updatedSla] = await db
      .update(ticketSlas)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(ticketSlas.id, id), eq(ticketSlas.tenantId, tenantId)))
      .returning();

    return updatedSla || null;
  }

  async deleteTicketSla(id: string, tenantId: string): Promise<boolean> {
    const [deletedSla] = await db
      .update(ticketSlas)
      .set({ isActive: false, updatedAt: new Date() })
      .where(and(eq(ticketSlas.id, id), eq(ticketSlas.tenantId, tenantId)))
      .returning();

    return !!deletedSla;
  }

  // ========================================
  // SLA RULES OPERATIONS
  // ========================================

  async createSlaRule(data: InsertSlaRule, tenantId: string): Promise<SlaRule> {
    const ruleData = {
      ...data,
      tenantId,
    };

    const [newRule] = await db
      .insert(slaRules)
      .values(ruleData)
      .returning();

    return newRule;
  }

  async getSlaRules(slaId: string, tenantId: string): Promise<SlaRule[]> {
    return await db
      .select()
      .from(slaRules)
      .where(and(eq(slaRules.slaId, slaId), eq(slaRules.tenantId, tenantId)))
      .orderBy(asc(slaRules.priority), asc(slaRules.fieldName));
  }

  async getSlaRulesByFieldValue(fieldName: string, fieldValue: string, tenantId: string): Promise<SlaRule[]> {
    return await db
      .select()
      .from(slaRules)
      .where(and(
        eq(slaRules.fieldName, fieldName),
        eq(slaRules.fieldValue, fieldValue),
        eq(slaRules.tenantId, tenantId),
        eq(slaRules.isActive, true)
      ))
      .orderBy(asc(slaRules.priority));
  }

  async updateSlaRule(id: string, data: Partial<InsertSlaRule>, tenantId: string): Promise<SlaRule | null> {
    const [updatedRule] = await db
      .update(slaRules)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(slaRules.id, id), eq(slaRules.tenantId, tenantId)))
      .returning();

    return updatedRule || null;
  }

  async deleteSlaRule(id: string, tenantId: string): Promise<boolean> {
    const [deletedRule] = await db
      .update(slaRules)
      .set({ isActive: false, updatedAt: new Date() })
      .where(and(eq(slaRules.id, id), eq(slaRules.tenantId, tenantId)))
      .returning();

    return !!deletedRule;
  }

  // ========================================
  // SLA STATUS TIMEOUT OPERATIONS
  // ========================================

  async createStatusTimeout(data: InsertSlaStatusTimeout, tenantId: string): Promise<SlaStatusTimeout> {
    const timeoutData = {
      ...data,
      tenantId,
    };

    const [newTimeout] = await db
      .insert(slaStatusTimeouts)
      .values(timeoutData)
      .returning();

    return newTimeout;
  }

  async getStatusTimeouts(slaId: string, tenantId: string): Promise<SlaStatusTimeout[]> {
    return await db
      .select()
      .from(slaStatusTimeouts)
      .where(and(eq(slaStatusTimeouts.slaId, slaId), eq(slaStatusTimeouts.tenantId, tenantId)))
      .orderBy(asc(slaStatusTimeouts.statusValue));
  }

  async getStatusTimeoutByStatus(slaId: string, statusValue: string, tenantId: string): Promise<SlaStatusTimeout | null> {
    const [timeout] = await db
      .select()
      .from(slaStatusTimeouts)
      .where(and(
        eq(slaStatusTimeouts.slaId, slaId),
        eq(slaStatusTimeouts.statusValue, statusValue),
        eq(slaStatusTimeouts.tenantId, tenantId),
        eq(slaStatusTimeouts.isActive, true)
      ));

    return timeout || null;
  }

  async updateStatusTimeout(id: string, data: Partial<InsertSlaStatusTimeout>, tenantId: string): Promise<SlaStatusTimeout | null> {
    const [updatedTimeout] = await db
      .update(slaStatusTimeouts)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(slaStatusTimeouts.id, id), eq(slaStatusTimeouts.tenantId, tenantId)))
      .returning();

    return updatedTimeout || null;
  }

  async deleteStatusTimeout(id: string, tenantId: string): Promise<boolean> {
    const [deletedTimeout] = await db
      .update(slaStatusTimeouts)
      .set({ isActive: false, updatedAt: new Date() })
      .where(and(eq(slaStatusTimeouts.id, id), eq(slaStatusTimeouts.tenantId, tenantId)))
      .returning();

    return !!deletedTimeout;
  }

  // ========================================
  // SLA ESCALATION OPERATIONS
  // ========================================

  async createEscalation(data: InsertSlaEscalation, tenantId: string): Promise<SlaEscalation> {
    const escalationData = {
      ...data,
      tenantId,
    };

    const [newEscalation] = await db
      .insert(slaEscalations)
      .values(escalationData)
      .returning();

    return newEscalation;
  }

  async getTicketEscalations(ticketId: string, tenantId: string): Promise<SlaEscalation[]> {
    return await db
      .select()
      .from(slaEscalations)
      .where(and(eq(slaEscalations.ticketId, ticketId), eq(slaEscalations.tenantId, tenantId)))
      .orderBy(desc(slaEscalations.escalatedAt));
  }

  async getPendingEscalations(tenantId: string): Promise<SlaEscalation[]> {
    return await db
      .select()
      .from(slaEscalations)
      .where(and(
        eq(slaEscalations.tenantId, tenantId),
        eq(slaEscalations.escalationStatus, "pending")
      ))
      .orderBy(desc(slaEscalations.escalatedAt));
  }

  async acknowledgeEscalation(id: string, acknowledgedBy: string, tenantId: string): Promise<SlaEscalation | null> {
    const [updatedEscalation] = await db
      .update(slaEscalations)
      .set({
        escalationStatus: "acknowledged",
        acknowledgedAt: new Date(),
        acknowledgedBy
      })
      .where(and(eq(slaEscalations.id, id), eq(slaEscalations.tenantId, tenantId)))
      .returning();

    return updatedEscalation || null;
  }

  // ========================================
  // SLA METRICS OPERATIONS
  // ========================================

  async createOrUpdateMetric(data: InsertSlaMetric, tenantId: string): Promise<SlaMetric> {
    const metricData = {
      ...data,
      tenantId,
    };

    // Try to update existing metric first
    const [existingMetric] = await db
      .select()
      .from(slaMetrics)
      .where(and(
        eq(slaMetrics.ticketId, data.ticketId!),
        eq(slaMetrics.slaRuleId, data.slaRuleId!),
        eq(slaMetrics.tenantId, tenantId)
      ));

    if (existingMetric) {
      const [updatedMetric] = await db
        .update(slaMetrics)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(slaMetrics.id, existingMetric.id))
        .returning();

      return updatedMetric;
    } else {
      const [newMetric] = await db
        .insert(slaMetrics)
        .values(metricData)
        .returning();

      return newMetric;
    }
  }

  async getTicketMetrics(ticketId: string, tenantId: string): Promise<SlaMetric[]> {
    return await db
      .select()
      .from(slaMetrics)
      .where(and(eq(slaMetrics.ticketId, ticketId), eq(slaMetrics.tenantId, tenantId)));
  }

  async getSlaComplianceStats(tenantId: string, startDate?: Date, endDate?: Date) {
    const whereConditions = [eq(slaMetrics.tenantId, tenantId)];
    
    if (startDate) {
      whereConditions.push(sql`${slaMetrics.createdAt} >= ${startDate}`);
    }
    if (endDate) {
      whereConditions.push(sql`${slaMetrics.createdAt} <= ${endDate}`);
    }

    const stats = await db
      .select({
        totalTickets: sql<number>`count(*)`,
        responseCompliance: sql<number>`count(*) filter (where ${slaMetrics.firstResponseMet} = true)`,
        resolutionCompliance: sql<number>`count(*) filter (where ${slaMetrics.resolutionMet} = true)`,
        overallCompliance: sql<number>`count(*) filter (where ${slaMetrics.overallCompliance} = true)`,
        avgFirstResponseTime: sql<number>`avg(${slaMetrics.firstResponseTime})`,
        avgResolutionTime: sql<number>`avg(${slaMetrics.resolutionTime})`,
        avgTotalIdleTime: sql<number>`avg(${slaMetrics.totalIdleTime})`
      })
      .from(slaMetrics)
      .where(and(...whereConditions));

    return stats[0];
  }

  // ========================================
  // METADATA INTEGRATION HELPERS
  // ========================================

  async getApplicableSlaRules(ticketData: any, tenantId: string): Promise<SlaRule[]> {
    const applicableRules: SlaRule[] = [];

    // Check priority rules
    if (ticketData.priority) {
      const priorityRules = await this.getSlaRulesByFieldValue("priority", ticketData.priority, tenantId);
      applicableRules.push(...priorityRules);
    }

    // Check category rules
    if (ticketData.category) {
      const categoryRules = await this.getSlaRulesByFieldValue("category", ticketData.category, tenantId);
      applicableRules.push(...categoryRules);
    }

    // Check status rules
    if (ticketData.status) {
      const statusRules = await this.getSlaRulesByFieldValue("status", ticketData.status, tenantId);
      applicableRules.push(...statusRules);
    }

    // Sort by priority (lowest number = highest priority)
    return applicableRules.sort((a, b) => (a.priority || 100) - (b.priority || 100));
  }

  async calculateSlaMetrics(ticketId: string, tenantId: string): Promise<void> {
    // This method would calculate and update SLA metrics for a ticket
    // Implementation would involve analyzing ticket history, status changes, etc.
    // For now, this is a placeholder for the complex calculation logic
    console.log(`Calculating SLA metrics for ticket ${ticketId} in tenant ${tenantId}`);
  }
}

export const slaRepository = new SlaRepository();