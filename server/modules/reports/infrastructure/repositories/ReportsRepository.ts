// ✅ 1QA.MD COMPLIANCE: INFRASTRUCTURE REPOSITORY - DATABASE IMPLEMENTATION
// Infrastructure Layer - Drizzle ORM implementation with tenant isolation

import { eq, and, desc, asc, like, inArray, gte, lte, sql, count } from 'drizzle-orm';
import { db } from '../../../../db';
import { reports, reportExecutions } from '../../../../../shared/schema-reports';
import { IReportsRepository } from '../../domain/repositories/IReportsRepository';
import { Report, ReportFilters, ReportExecutionResult } from '../../domain/entities/Report';

export class ReportsRepository implements IReportsRepository {
  
  async create(report: Omit<Report, 'id' | 'createdAt' | 'updatedAt'>): Promise<Report> {
    const [createdReport] = await db
      .insert(reports)
      .values({
        ...report,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    
    return this.mapToEntity(createdReport);
  }

  async findById(id: string, tenantId: string): Promise<Report | null> {
    const [report] = await db
      .select()
      .from(reports)
      .where(and(
        eq(reports.id, id),
        eq(reports.tenantId, tenantId)
      ));
    
    return report ? this.mapToEntity(report) : null;
  }

  async findAll(filters: ReportFilters, limit = 20, offset = 0): Promise<Report[]> {
    let query = db
      .select()
      .from(reports)
      .where(eq(reports.tenantId, filters.tenantId));

    // Apply filters
    const conditions = [eq(reports.tenantId, filters.tenantId)];

    if (filters.status) {
      conditions.push(eq(reports.status, filters.status));
    }

    if (filters.type) {
      conditions.push(eq(reports.type, filters.type));
    }

    if (filters.category) {
      conditions.push(eq(reports.category, filters.category));
    }

    if (filters.ownerId) {
      conditions.push(eq(reports.ownerId, filters.ownerId));
    }

    if (filters.isPublic !== undefined) {
      conditions.push(eq(reports.isPublic, filters.isPublic));
    }

    if (filters.isTemplate !== undefined) {
      conditions.push(eq(reports.isTemplate, filters.isTemplate));
    }

    if (filters.dataSource) {
      conditions.push(eq(reports.dataSource, filters.dataSource));
    }

    if (filters.search) {
      conditions.push(
        like(reports.name, `%${filters.search}%`)
      );
    }

    if (filters.createdFrom) {
      conditions.push(gte(reports.createdAt, filters.createdFrom));
    }

    if (filters.createdTo) {
      conditions.push(lte(reports.createdAt, filters.createdTo));
    }

    const result = await db
      .select()
      .from(reports)
      .where(and(...conditions))
      .orderBy(desc(reports.updatedAt))
      .limit(limit)
      .offset(offset);

    return result.map(this.mapToEntity);
  }

  async update(id: string, tenantId: string, updates: Partial<Report>): Promise<Report | null> {
    const [updatedReport] = await db
      .update(reports)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(and(
        eq(reports.id, id),
        eq(reports.tenantId, tenantId)
      ))
      .returning();

    return updatedReport ? this.mapToEntity(updatedReport) : null;
  }

  async delete(id: string, tenantId: string): Promise<boolean> {
    const result = await db
      .delete(reports)
      .where(and(
        eq(reports.id, id),
        eq(reports.tenantId, tenantId)
      ));

    return result.rowCount > 0;
  }

  async findByOwner(ownerId: string, tenantId: string): Promise<Report[]> {
    const result = await db
      .select()
      .from(reports)
      .where(and(
        eq(reports.ownerId, ownerId),
        eq(reports.tenantId, tenantId)
      ))
      .orderBy(desc(reports.updatedAt));

    return result.map(this.mapToEntity);
  }

  async findByCategory(category: string, tenantId: string): Promise<Report[]> {
    const result = await db
      .select()
      .from(reports)
      .where(and(
        eq(reports.category, category),
        eq(reports.tenantId, tenantId)
      ))
      .orderBy(desc(reports.updatedAt));

    return result.map(this.mapToEntity);
  }

  async findByDataSource(dataSource: string, tenantId: string): Promise<Report[]> {
    const result = await db
      .select()
      .from(reports)
      .where(and(
        eq(reports.dataSource, dataSource),
        eq(reports.tenantId, tenantId)
      ))
      .orderBy(desc(reports.updatedAt));

    return result.map(this.mapToEntity);
  }

  async findByStatus(status: Report['status'], tenantId: string): Promise<Report[]> {
    const result = await db
      .select()
      .from(reports)
      .where(and(
        eq(reports.status, status),
        eq(reports.tenantId, tenantId)
      ))
      .orderBy(desc(reports.updatedAt));

    return result.map(this.mapToEntity);
  }

  async findPublicReports(tenantId: string): Promise<Report[]> {
    const result = await db
      .select()
      .from(reports)
      .where(and(
        eq(reports.isPublic, true),
        eq(reports.tenantId, tenantId)
      ))
      .orderBy(desc(reports.updatedAt));

    return result.map(this.mapToEntity);
  }

  async findTemplates(tenantId: string): Promise<Report[]> {
    const result = await db
      .select()
      .from(reports)
      .where(and(
        eq(reports.isTemplate, true),
        eq(reports.tenantId, tenantId)
      ))
      .orderBy(desc(reports.updatedAt));

    return result.map(this.mapToEntity);
  }

  async search(searchTerm: string, tenantId: string, limit = 20): Promise<Report[]> {
    const result = await db
      .select()
      .from(reports)
      .where(and(
        eq(reports.tenantId, tenantId),
        like(reports.name, `%${searchTerm}%`)
      ))
      .orderBy(desc(reports.updatedAt))
      .limit(limit);

    return result.map(this.mapToEntity);
  }

  async findByTags(tags: string[], tenantId: string): Promise<Report[]> {
    const result = await db
      .select()
      .from(reports)
      .where(and(
        eq(reports.tenantId, tenantId),
        sql`${reports.tags} && ${tags}`
      ))
      .orderBy(desc(reports.updatedAt));

    return result.map(this.mapToEntity);
  }

  async findAccessibleReports(userId: string, userRoles: string[], tenantId: string): Promise<Report[]> {
    const result = await db
      .select()
      .from(reports)
      .where(and(
        eq(reports.tenantId, tenantId),
        sql`(
          ${reports.isPublic} = true OR 
          ${reports.ownerId} = ${userId} OR 
          ${reports.allowedUsers} @> ${JSON.stringify([userId])} OR 
          ${reports.allowedRoles} && ${userRoles}
        )`
      ))
      .orderBy(desc(reports.updatedAt));

    return result.map(this.mapToEntity);
  }

  async checkUserAccess(reportId: string, userId: string, userRoles: string[], tenantId: string): Promise<boolean> {
    const [report] = await db
      .select()
      .from(reports)
      .where(and(
        eq(reports.id, reportId),
        eq(reports.tenantId, tenantId),
        sql`(
          ${reports.isPublic} = true OR 
          ${reports.ownerId} = ${userId} OR 
          ${reports.allowedUsers} @> ${JSON.stringify([userId])} OR 
          ${reports.allowedRoles} && ${userRoles}
        )`
      ));

    return !!report;
  }

  async findRecentlyExecuted(tenantId: string, limit = 10): Promise<Report[]> {
    const result = await db
      .select()
      .from(reports)
      .where(and(
        eq(reports.tenantId, tenantId),
        sql`${reports.lastExecutedAt} IS NOT NULL`
      ))
      .orderBy(desc(reports.lastExecutedAt))
      .limit(limit);

    return result.map(this.mapToEntity);
  }

  async findMostUsed(tenantId: string, limit = 10): Promise<Report[]> {
    const result = await db
      .select()
      .from(reports)
      .where(eq(reports.tenantId, tenantId))
      .orderBy(desc(reports.executionCount))
      .limit(limit);

    return result.map(this.mapToEntity);
  }

  async findScheduledReports(tenantId: string): Promise<Report[]> {
    const result = await db
      .select()
      .from(reports)
      .where(and(
        eq(reports.tenantId, tenantId),
        eq(reports.type, 'scheduled')
      ))
      .orderBy(desc(reports.updatedAt));

    return result.map(this.mapToEntity);
  }

  async recordExecution(reportId: string, tenantId: string, executionResult: ReportExecutionResult): Promise<void> {
    await db
      .insert(reportExecutions)
      .values({
        tenantId,
        reportId,
        status: executionResult.status,
        startedAt: executionResult.startedAt,
        completedAt: executionResult.completedAt,
        executionTime: executionResult.executionTime,
        resultCount: executionResult.resultCount,
        resultSize: executionResult.resultSize,
        outputFiles: executionResult.outputFiles,
        errorMessage: executionResult.errorMessage,
        errorDetails: executionResult.errorDetails,
        warnings: executionResult.warnings
      });
  }

  async updateExecutionMetrics(reportId: string, tenantId: string, executionTime: number): Promise<void> {
    // Get current metrics
    const [currentReport] = await db
      .select({
        executionCount: reports.executionCount,
        averageExecutionTime: reports.averageExecutionTime
      })
      .from(reports)
      .where(and(
        eq(reports.id, reportId),
        eq(reports.tenantId, tenantId)
      ));

    if (currentReport) {
      const newExecutionCount = currentReport.executionCount + 1;
      const newAverageExecutionTime = Math.round(
        ((currentReport.averageExecutionTime * currentReport.executionCount) + executionTime) / newExecutionCount
      );

      await db
        .update(reports)
        .set({
          executionCount: newExecutionCount,
          averageExecutionTime: newAverageExecutionTime,
          lastExecutedAt: new Date(),
          updatedAt: new Date()
        })
        .where(and(
          eq(reports.id, reportId),
          eq(reports.tenantId, tenantId)
        ));
    }
  }

  async isNameUnique(name: string, tenantId: string, excludeId?: string): Promise<boolean> {
    const conditions = [
      eq(reports.name, name),
      eq(reports.tenantId, tenantId)
    ];

    if (excludeId) {
      conditions.push(sql`${reports.id} != ${excludeId}`);
    }

    const [existingReport] = await db
      .select()
      .from(reports)
      .where(and(...conditions));

    return !existingReport;
  }

  async countByOwner(ownerId: string, tenantId: string): Promise<number> {
    const [result] = await db
      .select({ count: count() })
      .from(reports)
      .where(and(
        eq(reports.ownerId, ownerId),
        eq(reports.tenantId, tenantId)
      ));

    return result.count;
  }

  async countByCategory(category: string, tenantId: string): Promise<number> {
    const [result] = await db
      .select({ count: count() })
      .from(reports)
      .where(and(
        eq(reports.category, category),
        eq(reports.tenantId, tenantId)
      ));

    return result.count;
  }

  async archiveOldReports(tenantId: string, daysOld: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await db
      .update(reports)
      .set({
        status: 'archived',
        updatedAt: new Date()
      })
      .where(and(
        eq(reports.tenantId, tenantId),
        lte(reports.updatedAt, cutoffDate),
        sql`${reports.status} != 'archived'`
      ));

    return result.rowCount;
  }

  async cleanupExecutionLogs(tenantId: string, daysOld: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await db
      .delete(reportExecutions)
      .where(and(
        eq(reportExecutions.tenantId, tenantId),
        lte(reportExecutions.startedAt, cutoffDate)
      ));

    return result.rowCount;
  }

  async getUsageStatistics(tenantId: string, dateFrom?: Date, dateTo?: Date): Promise<{
    totalReports: number;
    totalExecutions: number;
    avgExecutionTime: number;
    mostUsedCategories: Array<{ category: string; count: number }>;
    topPerformers: Array<{ reportId: string; name: string; executionCount: number }>;
  }> {
    // Total reports
    const [totalReportsResult] = await db
      .select({ count: count() })
      .from(reports)
      .where(eq(reports.tenantId, tenantId));

    // Total executions (would need to join with executions table)
    const [totalExecutionsResult] = await db
      .select({ count: count() })
      .from(reportExecutions)
      .where(eq(reportExecutions.tenantId, tenantId));

    // Average execution time
    const [avgTimeResult] = await db
      .select({ 
        avg: sql<number>`AVG(${reports.averageExecutionTime})` 
      })
      .from(reports)
      .where(and(
        eq(reports.tenantId, tenantId),
        sql`${reports.averageExecutionTime} > 0`
      ));

    // Most used categories
    const categoriesResult = await db
      .select({
        category: reports.category,
        count: count()
      })
      .from(reports)
      .where(and(
        eq(reports.tenantId, tenantId),
        sql`${reports.category} IS NOT NULL`
      ))
      .groupBy(reports.category)
      .orderBy(desc(count()))
      .limit(5);

    // Top performers
    const topPerformersResult = await db
      .select({
        reportId: reports.id,
        name: reports.name,
        executionCount: reports.executionCount
      })
      .from(reports)
      .where(eq(reports.tenantId, tenantId))
      .orderBy(desc(reports.executionCount))
      .limit(5);

    return {
      totalReports: totalReportsResult.count,
      totalExecutions: totalExecutionsResult.count,
      avgExecutionTime: Math.round(avgTimeResult.avg || 0),
      mostUsedCategories: categoriesResult.map(r => ({
        category: r.category || 'Uncategorized',
        count: r.count
      })),
      topPerformers: topPerformersResult
    };
  }

  private mapToEntity(dbRecord: any): Report {
    return {
      id: dbRecord.id,
      tenantId: dbRecord.tenantId,
      name: dbRecord.name,
      description: dbRecord.description,
      type: dbRecord.type,
      status: dbRecord.status,
      category: dbRecord.category,
      dataSource: dbRecord.dataSource,
      query: dbRecord.query,
      queryConfig: dbRecord.queryConfig || {},
      filters: dbRecord.filters || {},
      parameters: dbRecord.parameters || {},
      layoutConfig: dbRecord.layoutConfig || {},
      chartConfig: dbRecord.chartConfig || {},
      formatConfig: dbRecord.formatConfig || {},
      ownerId: dbRecord.ownerId,
      isPublic: dbRecord.isPublic,
      accessLevel: dbRecord.accessLevel,
      allowedRoles: dbRecord.allowedRoles || [],
      allowedUsers: dbRecord.allowedUsers || [],
      lastExecutedAt: dbRecord.lastExecutedAt,
      executionCount: dbRecord.executionCount,
      averageExecutionTime: dbRecord.averageExecutionTime,
      cacheConfig: dbRecord.cacheConfig || {},
      cacheExpiry: dbRecord.cacheExpiry,
      exportFormats: dbRecord.exportFormats || [],
      emailConfig: dbRecord.emailConfig || {},
      deliveryConfig: dbRecord.deliveryConfig || {},
      tags: dbRecord.tags || [],
      metadata: dbRecord.metadata || {},
      version: dbRecord.version,
      isTemplate: dbRecord.isTemplate,
      templateId: dbRecord.templateId,
      createdAt: dbRecord.createdAt,
      updatedAt: dbRecord.updatedAt,
      createdBy: dbRecord.createdBy,
      updatedBy: dbRecord.updatedBy
    };
  }
}