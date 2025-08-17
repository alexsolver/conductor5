// ✅ 1QA.MD COMPLIANCE: CLEAN ARCHITECTURE - INFRASTRUCTURE LAYER
// Concrete Repository: DrizzleApprovalRuleRepository - Drizzle ORM implementation

import { eq, and, like, desc, asc, inArray, sql, ilike } from 'drizzle-orm';
import { db } from '@shared/schema';
import { approvalRules } from '@shared/schema';
import { ApprovalRule } from '../../domain/entities/ApprovalRule';
import { 
  IApprovalRuleRepository,
  CreateApprovalRuleData,
  UpdateApprovalRuleData,
  ApprovalRuleFilters
} from '../../domain/repositories/IApprovalRuleRepository';

export class DrizzleApprovalRuleRepository implements IApprovalRuleRepository {
  
  async create(data: CreateApprovalRuleData): Promise<ApprovalRule> {
    const [result] = await db
      .insert(approvalRules)
      .values({
        tenantId: data.tenantId,
        name: data.name,
        description: data.description,
        moduleType: data.moduleType,
        queryConditions: data.queryConditions,
        approvalSteps: data.approvalSteps,
        slaHours: data.defaultSlaHours,
        escalationSettings: data.escalationEnabled ? {} : null,
        autoApprovalConditions: data.autoApprovalConditions,
        isActive: data.isActive ?? true,
        priority: data.priority ?? 100,
        createdById: data.createdById,
        updatedById: data.createdById,
      })
      .returning();

    return this.mapToEntity(result);
  }

  async update(id: string, data: UpdateApprovalRuleData): Promise<ApprovalRule> {
    const [result] = await db
      .update(approvalRules)
      .set({
        name: data.name,
        description: data.description,
        queryConditions: data.queryConditions,
        approvalSteps: data.approvalSteps,
        slaHours: data.defaultSlaHours,
        escalationSettings: data.escalationEnabled ? {} : null,
        autoApprovalConditions: data.autoApprovalConditions,
        isActive: data.isActive,
        priority: data.priority,
        updatedById: data.updatedById,
        updatedAt: new Date(),
      })
      .where(eq(approvalRules.id, id))
      .returning();

    if (!result) {
      throw new Error(`Approval rule with id ${id} not found`);
    }

    return this.mapToEntity(result);
  }

  async delete(id: string, tenantId: string): Promise<void> {
    const result = await db
      .delete(approvalRules)
      .where(and(
        eq(approvalRules.id, id),
        eq(approvalRules.tenantId, tenantId)
      ));

    if (result.rowCount === 0) {
      throw new Error(`Approval rule with id ${id} not found`);
    }
  }

  async findById(id: string, tenantId: string): Promise<ApprovalRule | null> {
    const [result] = await db
      .select()
      .from(approvalRules)
      .where(and(
        eq(approvalRules.id, id),
        eq(approvalRules.tenantId, tenantId)
      ));

    return result ? this.mapToEntity(result) : null;
  }

  async findByTenant(tenantId: string): Promise<ApprovalRule[]> {
    const results = await db
      .select()
      .from(approvalRules)
      .where(eq(approvalRules.tenantId, tenantId))
      .orderBy(asc(approvalRules.priority), desc(approvalRules.createdAt));

    return results.map(result => this.mapToEntity(result));
  }

  async findByFilters(filters: ApprovalRuleFilters): Promise<ApprovalRule[]> {
    const conditions = [eq(approvalRules.tenantId, filters.tenantId)];

    if (filters.moduleType) {
      conditions.push(eq(approvalRules.moduleType, filters.moduleType));
    }

    if (filters.entityType) {
      conditions.push(eq(approvalRules.entityType, filters.entityType));
    }

    if (filters.isActive !== undefined) {
      conditions.push(eq(approvalRules.isActive, filters.isActive));
    }

    if (filters.createdById) {
      conditions.push(eq(approvalRules.createdById, filters.createdById));
    }

    if (filters.search) {
      conditions.push(
        ilike(approvalRules.name, `%${filters.search}%`)
      );
    }

    const results = await db
      .select()
      .from(approvalRules)
      .where(and(...conditions))
      .orderBy(asc(approvalRules.priority), desc(approvalRules.createdAt));

    return results.map(result => this.mapToEntity(result));
  }

  async findByModule(tenantId: string, moduleType: string, entityType?: string): Promise<ApprovalRule[]> {
    const conditions = [
      eq(approvalRules.tenantId, tenantId),
      eq(approvalRules.moduleType, moduleType),
      eq(approvalRules.isActive, true)
    ];

    if (entityType) {
      conditions.push(eq(approvalRules.entityType, entityType));
    }

    const results = await db
      .select()
      .from(approvalRules)
      .where(and(...conditions))
      .orderBy(asc(approvalRules.priority));

    return results.map(result => this.mapToEntity(result));
  }

  async findApplicableRules(
    tenantId: string, 
    moduleType: string, 
    entityType: string, 
    entityData: Record<string, any>
  ): Promise<ApprovalRule[]> {
    // First get all rules for the module and entity type
    const rules = await this.findByModule(tenantId, moduleType, entityType);
    
    // Filter rules based on their query conditions
    // This is a simplified implementation - in a real scenario, 
    // you might want to evaluate conditions at the database level for better performance
    return rules.filter(rule => rule.evaluateConditions(entityData));
  }

  async findActiveRules(tenantId: string, moduleType: string): Promise<ApprovalRule[]> {
    const results = await db
      .select()
      .from(approvalRules)
      .where(and(
        eq(approvalRules.tenantId, tenantId),
        eq(approvalRules.moduleType, moduleType),
        eq(approvalRules.isActive, true)
      ))
      .orderBy(asc(approvalRules.priority));

    return results.map(result => this.mapToEntity(result));
  }

  async findByPriority(tenantId: string, ascending: boolean = true): Promise<ApprovalRule[]> {
    const orderBy = ascending ? asc(approvalRules.priority) : desc(approvalRules.priority);
    
    const results = await db
      .select()
      .from(approvalRules)
      .where(eq(approvalRules.tenantId, tenantId))
      .orderBy(orderBy);

    return results.map(result => this.mapToEntity(result));
  }

  async countByTenant(tenantId: string): Promise<number> {
    const [result] = await db
      .select({ count: sql`count(*)`.mapWith(Number) })
      .from(approvalRules)
      .where(eq(approvalRules.tenantId, tenantId));

    return result.count;
  }

  async countByModule(tenantId: string, moduleType: string): Promise<number> {
    const [result] = await db
      .select({ count: sql`count(*)`.mapWith(Number) })
      .from(approvalRules)
      .where(and(
        eq(approvalRules.tenantId, tenantId),
        sql`${approvalRules.moduleType} = ${moduleType}`
      ));

    return result.count;
  }

  async activateMultiple(ids: string[], tenantId: string): Promise<void> {
    await db
      .update(approvalRules)
      .set({ 
        isActive: true,
        updatedAt: new Date()
      })
      .where(and(
        inArray(approvalRules.id, ids),
        eq(approvalRules.tenantId, tenantId)
      ));
  }

  async deactivateMultiple(ids: string[], tenantId: string): Promise<void> {
    await db
      .update(approvalRules)
      .set({ 
        isActive: false,
        updatedAt: new Date()
      })
      .where(and(
        inArray(approvalRules.id, ids),
        eq(approvalRules.tenantId, tenantId)
      ));
  }

  async updatePriorities(updates: Array<{ id: string; priority: number }>, tenantId: string): Promise<void> {
    // Use a transaction for consistency
    await db.transaction(async (tx) => {
      for (const update of updates) {
        await tx
          .update(approvalRules)
          .set({ 
            priority: update.priority,
            updatedAt: new Date()
          })
          .where(and(
            eq(approvalRules.id, update.id),
            eq(approvalRules.tenantId, tenantId)
          ));
      }
    });
  }

  async checkNameUniqueness(name: string, tenantId: string, excludeId?: string): Promise<boolean> {
    const conditions = [
      eq(approvalRules.tenantId, tenantId),
      ilike(approvalRules.name, name)
    ];

    if (excludeId) {
      conditions.push(sql`${approvalRules.id} != ${excludeId}`);
    }

    const [result] = await db
      .select({ count: sql`count(*)`.mapWith(Number) })
      .from(approvalRules)
      .where(and(...conditions));

    return result.count === 0; // True if name is unique (count is 0)
  }

  async findConflictingRules(rule: ApprovalRule): Promise<ApprovalRule[]> {
    // Find rules with same module type and overlapping priority
    // This is a simplified conflict detection - you might want more sophisticated logic
    const results = await db
      .select()
      .from(approvalRules)
      .where(and(
        eq(approvalRules.tenantId, rule.tenantId),
        eq(approvalRules.moduleType, rule.moduleType),
        eq(approvalRules.isActive, true),
        sql`${approvalRules.id} != ${rule.id}`,
        eq(approvalRules.priority, rule.priority)
      ));

    return results.map(result => this.mapToEntity(result));
  }

  async findRecentlyModified(tenantId: string, daysBack: number = 7): Promise<ApprovalRule[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysBack);

    const results = await db
      .select()
      .from(approvalRules)
      .where(and(
        eq(approvalRules.tenantId, tenantId),
        sql`${approvalRules.updatedAt} >= ${cutoffDate}`
      ))
      .orderBy(desc(approvalRules.updatedAt));

    return results.map(result => this.mapToEntity(result));
  }

  async findByCreator(tenantId: string, createdById: string): Promise<ApprovalRule[]> {
    const results = await db
      .select()
      .from(approvalRules)
      .where(and(
        eq(approvalRules.tenantId, tenantId),
        eq(approvalRules.createdById, createdById)
      ))
      .orderBy(desc(approvalRules.createdAt));

    return results.map(result => this.mapToEntity(result));
  }

  private mapToEntity(dbRecord: any): ApprovalRule {
    return ApprovalRule.fromDatabase({
      id: dbRecord.id,
      tenantId: dbRecord.tenantId,
      name: dbRecord.name,
      description: dbRecord.description,
      moduleType: dbRecord.moduleType,
      entityType: dbRecord.moduleType, // Use moduleType as entityType since entityType column doesn't exist
      queryConditions: dbRecord.queryConditions,
      approvalSteps: dbRecord.approvalSteps,
      defaultSlaHours: dbRecord.slaHours, // Real column name
      escalationEnabled: dbRecord.escalationSettings ? true : false, // Real column name
      autoApprovalEnabled: false, // Column doesn't exist, default to false
      autoApprovalConditions: dbRecord.autoApprovalConditions,
      isActive: dbRecord.isActive,
      priority: dbRecord.priority,
      createdById: dbRecord.createdById,
      updatedById: dbRecord.updatedById,
      createdAt: dbRecord.createdAt,
      updatedAt: dbRecord.updatedAt,
    });
  }
}