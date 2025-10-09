/**
 * GDPR Report Repository Implementation - Infrastructure Layer
 * Clean Architecture - Drizzle ORM implementation
 * Following 1qa.md enterprise patterns
 */

import { eq, and, desc, sql, gte, lte, ilike, or, inArray, count } from 'drizzle-orm';
import { db } from '../../../../db';
import { gdprReports } from '../../../../../shared/schema-public';
import { IGdprReportRepository, GdprReportFilters, CreateGdprReportData, UpdateGdprReportData, GdprComplianceMetrics, StatusDistribution, TrendDataPoint } from '../../domain/repositories/IGdprReportRepository';
import { GdprReportEntity } from '../../domain/entities/GdprReport';

export class DrizzleGdprReportRepository implements IGdprReportRepository {
  
  async findById(id: string, tenantId: string): Promise<GdprReportEntity | null> {
    const reports = await db
      .select()
      .from(gdprReports)
      .where(
        and(
          eq(gdprReports.id, id),
          eq(gdprReports.tenantId, tenantId),
          eq(gdprReports.isActive, true)
        )
      )
      .limit(1);
    
    return reports[0] || null;
  }

  async findByTenantId(tenantId: string, filters?: GdprReportFilters): Promise<GdprReportEntity[]> {
    const conditions = [
      eq(gdprReports.tenantId, tenantId),
      eq(gdprReports.isActive, true)
    ];

    // Apply filters
    if (filters?.status) {
      conditions.push(inArray(gdprReports.status, filters.status));
    }
    
    if (filters?.reportType) {
      conditions.push(inArray(gdprReports.reportType, filters.reportType));
    }
    
    if (filters?.priority) {
      conditions.push(inArray(gdprReports.priority, filters.priority));
    }
    
    if (filters?.riskLevel) {
      conditions.push(inArray(gdprReports.riskLevel, filters.riskLevel));
    }
    
    if (filters?.assignedUserId) {
      conditions.push(eq(gdprReports.assignedUserId, filters.assignedUserId));
    }
    
    if (filters?.dateFrom) {
      conditions.push(gte(gdprReports.createdAt, filters.dateFrom));
    }
    
    if (filters?.dateTo) {
      conditions.push(lte(gdprReports.createdAt, filters.dateTo));
    }
    
    if (filters?.search) {
      conditions.push(
        or(
          ilike(gdprReports.title, `%${filters.search}%`),
          ilike(gdprReports.description, `%${filters.search}%`)
        )
      );
    }

    let query = db
      .select()
      .from(gdprReports)
      .where(and(...conditions))
      .orderBy(desc(gdprReports.createdAt));

    // Apply pagination
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }
    
    if (filters?.page && filters?.limit) {
      const offset = (filters.page - 1) * filters.limit;
      query = query.offset(offset);
    }

    return await query;
  }

  async create(data: CreateGdprReportData): Promise<GdprReportEntity> {
    const [report] = await db
      .insert(gdprReports)
      .values({
        ...data,
        status: 'draft',
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true
      })
      .returning();
    
    return report;
  }

  async update(id: string, data: UpdateGdprReportData, tenantId: string): Promise<GdprReportEntity> {
    const [report] = await db
      .update(gdprReports)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(
        and(
          eq(gdprReports.id, id),
          eq(gdprReports.tenantId, tenantId),
          eq(gdprReports.isActive, true)
        )
      )
      .returning();
    
    return report;
  }

  async delete(id: string, tenantId: string, deletedBy: string): Promise<void> {
    await db
      .update(gdprReports)
      .set({
        isActive: false,
        deletedAt: new Date(),
        deletedBy: deletedBy,
        updatedAt: new Date()
      })
      .where(
        and(
          eq(gdprReports.id, id),
          eq(gdprReports.tenantId, tenantId)
        )
      );
  }

  async findByStatus(status: string, tenantId: string): Promise<GdprReportEntity[]> {
    return await db
      .select()
      .from(gdprReports)
      .where(
        and(
          eq(gdprReports.status, status),
          eq(gdprReports.tenantId, tenantId),
          eq(gdprReports.isActive, true)
        )
      )
      .orderBy(desc(gdprReports.createdAt));
  }

  async findByType(reportType: string, tenantId: string): Promise<GdprReportEntity[]> {
    return await db
      .select()
      .from(gdprReports)
      .where(
        and(
          eq(gdprReports.reportType, reportType),
          eq(gdprReports.tenantId, tenantId),
          eq(gdprReports.isActive, true)
        )
      )
      .orderBy(desc(gdprReports.createdAt));
  }

  async findByAssignedUser(userId: string, tenantId: string): Promise<GdprReportEntity[]> {
    return await db
      .select()
      .from(gdprReports)
      .where(
        and(
          eq(gdprReports.assignedUserId, userId),
          eq(gdprReports.tenantId, tenantId),
          eq(gdprReports.isActive, true)
        )
      )
      .orderBy(desc(gdprReports.createdAt));
  }

  async findOverdueReports(tenantId: string): Promise<GdprReportEntity[]> {
    const now = new Date();
    return await db
      .select()
      .from(gdprReports)
      .where(
        and(
          eq(gdprReports.tenantId, tenantId),
          eq(gdprReports.isActive, true),
          lte(gdprReports.dueDate, now),
          inArray(gdprReports.status, ['draft', 'in_progress', 'under_review'])
        )
      )
      .orderBy(gdprReports.dueDate);
  }

  async findHighRiskReports(tenantId: string): Promise<GdprReportEntity[]> {
    return await db
      .select()
      .from(gdprReports)
      .where(
        and(
          eq(gdprReports.tenantId, tenantId),
          eq(gdprReports.isActive, true),
          inArray(gdprReports.riskLevel, ['high', 'very_high'])
        )
      )
      .orderBy(desc(gdprReports.createdAt));
  }

  async getComplianceMetrics(tenantId: string): Promise<GdprComplianceMetrics> {
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const thisMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Get all metrics in parallel
    const [
      totalReports,
      activeReports, 
      completedReports,
      overdueReports,
      avgScore,
      highRiskReports,
      reportsThisMonth,
      reportsLastMonth
    ] = await Promise.all([
      // Total reports
      db.select({ count: count() })
        .from(gdprReports)
        .where(and(eq(gdprReports.tenantId, tenantId), eq(gdprReports.isActive, true))),
      
      // Active reports
      db.select({ count: count() })
        .from(gdprReports)
        .where(and(
          eq(gdprReports.tenantId, tenantId),
          eq(gdprReports.isActive, true),
          inArray(gdprReports.status, ['draft', 'in_progress', 'under_review'])
        )),
      
      // Completed reports
      db.select({ count: count() })
        .from(gdprReports)
        .where(and(
          eq(gdprReports.tenantId, tenantId),
          eq(gdprReports.isActive, true),
          inArray(gdprReports.status, ['approved', 'published'])
        )),
      
      // Overdue reports
      db.select({ count: count() })
        .from(gdprReports)
        .where(and(
          eq(gdprReports.tenantId, tenantId),
          eq(gdprReports.isActive, true),
          lte(gdprReports.dueDate, now),
          inArray(gdprReports.status, ['draft', 'in_progress', 'under_review'])
        )),
      
      // Average compliance score
      db.select({ avg: sql`AVG(${gdprReports.complianceScore})` })
        .from(gdprReports)
        .where(and(
          eq(gdprReports.tenantId, tenantId),
          eq(gdprReports.isActive, true)
        )),
      
      // High risk reports
      db.select({ count: count() })
        .from(gdprReports)
        .where(and(
          eq(gdprReports.tenantId, tenantId),
          eq(gdprReports.isActive, true),
          inArray(gdprReports.riskLevel, ['high', 'very_high'])
        )),
      
      // Reports this month
      db.select({ count: count() })
        .from(gdprReports)
        .where(and(
          eq(gdprReports.tenantId, tenantId),
          eq(gdprReports.isActive, true),
          gte(gdprReports.createdAt, thisMonth)
        )),
      
      // Reports last month
      db.select({ count: count() })
        .from(gdprReports)
        .where(and(
          eq(gdprReports.tenantId, tenantId),
          eq(gdprReports.isActive, true),
          gte(gdprReports.createdAt, lastMonth),
          lte(gdprReports.createdAt, thisMonthEnd)
        ))
    ]);

    return {
      totalReports: totalReports[0]?.count || 0,
      activeReports: activeReports[0]?.count || 0,
      completedReports: completedReports[0]?.count || 0,
      overdueReports: overdueReports[0]?.count || 0,
      averageComplianceScore: Math.round(Number(avgScore[0]?.avg) || 0),
      highRiskReports: highRiskReports[0]?.count || 0,
      reportsThisMonth: reportsThisMonth[0]?.count || 0,
      reportsLastMonth: reportsLastMonth[0]?.count || 0
    };
  }

  async getReportStatusDistribution(tenantId: string): Promise<StatusDistribution[]> {
    const results = await db
      .select({
        status: gdprReports.status,
        count: count()
      })
      .from(gdprReports)
      .where(and(
        eq(gdprReports.tenantId, tenantId),
        eq(gdprReports.isActive, true)
      ))
      .groupBy(gdprReports.status);

    const totalCount = results.reduce((sum, item) => sum + item.count, 0);
    
    return results.map(item => ({
      status: item.status,
      count: item.count,
      percentage: totalCount > 0 ? Math.round((item.count / totalCount) * 100) : 0
    }));
  }

  async getTrendData(tenantId: string, days: number): Promise<TrendDataPoint[]> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    const results = await db
      .select({
        date: sql`DATE(${gdprReports.createdAt})`,
        reportsCreated: count(gdprReports.id),
        reportsCompleted: sql`COUNT(CASE WHEN ${gdprReports.status} IN ('approved', 'published') THEN 1 END)`,
        avgScore: sql`AVG(${gdprReports.complianceScore})`
      })
      .from(gdprReports)
      .where(and(
        eq(gdprReports.tenantId, tenantId),
        eq(gdprReports.isActive, true),
        gte(gdprReports.createdAt, startDate)
      ))
      .groupBy(sql`DATE(${gdprReports.createdAt})`)
      .orderBy(sql`DATE(${gdprReports.createdAt})`);

    return results.map(item => ({
      date: item.date as string,
      reportsCreated: item.reportsCreated,
      reportsCompleted: Number(item.reportsCompleted) || 0,
      averageScore: Math.round(Number(item.avgScore) || 0)
    }));
  }
}