// ✅ 1QA.MD COMPLIANCE: DRIZZLE ORM REPOSITORY IMPLEMENTATION
// Infrastructure Layer - Repository Pattern with Drizzle ORM

import { eq, and, desc, asc, like, sql } from 'drizzle-orm';
import { db } from '../../../../../shared/schema';
import { reports, reportExecutions, dashboards, dashboardWidgets } from '../../../../../shared/schema-reports';
import type { IReportsRepository } from '../../domain/repositories/IReportsRepository';

// ✅ 1QA.MD COMPLIANCE: TYPE DEFINITIONS FROM SCHEMA
type Report = typeof reports.$inferSelect;
type ReportExecution = typeof reportExecutions.$inferSelect;
type Dashboard = typeof dashboards.$inferSelect;
type DashboardWidget = typeof dashboardWidgets.$inferSelect;

export class DrizzleReportsRepository implements IReportsRepository {
  
  // ✅ REPORTS CRUD - FULL ORM COMPLIANCE
  
  async createReport(reportData: Omit<Report, 'id' | 'createdAt' | 'updatedAt'>, tenantId: string): Promise<Report> {
    if (!tenantId) throw new Error('Tenant ID required for multi-tenant isolation');
    
    const [newReport] = await db
      .insert(reports)
      .values({
        ...reportData,
        tenantId,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    
    return newReport as Report;
  }

  async findReportById(id: string, tenantId: string): Promise<Report | null> {
    if (!tenantId) throw new Error('Tenant ID required for multi-tenant isolation');
    
    const [report] = await db
      .select()
      .from(reports)
      .where(and(
        eq(reports.id, id),
        eq(reports.tenantId, tenantId)
      ));
    
    return report as Report || null;
  }

  async findReports(filters: any, tenantId: string): Promise<{ reports: Report[]; total: number }> {
    if (!tenantId) throw new Error('Tenant ID required for multi-tenant isolation');
    
    const baseQuery = db
      .select()
      .from(reports)
      .where(eq(reports.tenantId, tenantId));
    
    // Apply filters
    let query = baseQuery;
    
    if (filters.name) {
      query = query.where(like(reports.name, `%${filters.name}%`));
    }
    
    if (filters.type) {
      query = query.where(eq(reports.type, filters.type));
    }
    
    if (filters.status) {
      query = query.where(eq(reports.status, filters.status));
    }
    
    // Apply sorting
    if (filters.sortBy === 'name') {
      query = filters.sortOrder === 'asc' ? 
        query.orderBy(asc(reports.name)) : 
        query.orderBy(desc(reports.name));
    } else {
      query = filters.sortOrder === 'asc' ? 
        query.orderBy(asc(reports.createdAt)) : 
        query.orderBy(desc(reports.createdAt));
    }
    
    // Apply pagination
    if (filters.limit) {
      query = query.limit(filters.limit);
    }
    
    if (filters.offset) {
      query = query.offset(filters.offset);
    }
    
    const reportsList = await query;
    
    // Get total count
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(reports)
      .where(eq(reports.tenantId, tenantId));
    
    return {
      reports: reportsList as Report[],
      total: count
    };
  }

  async updateReport(id: string, data: Partial<Report>, tenantId: string): Promise<Report | null> {
    if (!tenantId) throw new Error('Tenant ID required for multi-tenant isolation');
    
    const [updatedReport] = await db
      .update(reports)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(and(
        eq(reports.id, id),
        eq(reports.tenantId, tenantId)
      ))
      .returning();
    
    return updatedReport as Report || null;
  }

  async deleteReport(id: string, tenantId: string): Promise<boolean> {
    if (!tenantId) throw new Error('Tenant ID required for multi-tenant isolation');
    
    const result = await db
      .delete(reports)
      .where(and(
        eq(reports.id, id),
        eq(reports.tenantId, tenantId)
      ));
    
    return result.rowCount > 0;
  }

  // ✅ REPORT EXECUTIONS - ORM COMPLIANCE
  
  async createReportExecution(executionData: Omit<ReportExecution, 'id' | 'createdAt'>, tenantId: string): Promise<ReportExecution> {
    if (!tenantId) throw new Error('Tenant ID required for multi-tenant isolation');
    
    const [newExecution] = await db
      .insert(reportExecutions)
      .values({
        ...executionData,
        tenantId,
        createdAt: new Date()
      })
      .returning();
    
    return newExecution as ReportExecution;
  }

  async findReportExecutions(reportId: string, tenantId: string): Promise<ReportExecution[]> {
    if (!tenantId) throw new Error('Tenant ID required for multi-tenant isolation');
    
    const executions = await db
      .select()
      .from(reportExecutions)
      .where(and(
        eq(reportExecutions.reportId, reportId),
        eq(reportExecutions.tenantId, tenantId)
      ))
      .orderBy(desc(reportExecutions.createdAt));
    
    return executions as ReportExecution[];
  }

  // ✅ DASHBOARDS CRUD - FULL ORM COMPLIANCE
  
  async createDashboard(dashboardData: Omit<Dashboard, 'id' | 'createdAt' | 'updatedAt'>, tenantId: string): Promise<Dashboard> {
    if (!tenantId) throw new Error('Tenant ID required for multi-tenant isolation');
    
    const [newDashboard] = await db
      .insert(dashboards)
      .values({
        ...dashboardData,
        tenantId,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    
    return newDashboard as Dashboard;
  }

  async findDashboardById(id: string, tenantId: string): Promise<Dashboard | null> {
    if (!tenantId) throw new Error('Tenant ID required for multi-tenant isolation');
    
    const [dashboard] = await db
      .select()
      .from(dashboards)
      .where(and(
        eq(dashboards.id, id),
        eq(dashboards.tenantId, tenantId)
      ));
    
    return dashboard as Dashboard || null;
  }

  async findDashboards(filters: any, tenantId: string): Promise<{ dashboards: Dashboard[]; total: number }> {
    if (!tenantId) throw new Error('Tenant ID required for multi-tenant isolation');
    
    const baseQuery = db
      .select()
      .from(dashboards)
      .where(eq(dashboards.tenantId, tenantId));
    
    let query = baseQuery;
    
    // Apply filters
    if (filters.name) {
      query = query.where(like(dashboards.name, `%${filters.name}%`));
    }
    
    if (filters.isPublic !== undefined) {
      query = query.where(eq(dashboards.isPublic, filters.isPublic));
    }
    
    // Apply sorting
    if (filters.sortBy === 'name') {
      query = filters.sortOrder === 'asc' ? 
        query.orderBy(asc(dashboards.name)) : 
        query.orderBy(desc(dashboards.name));
    } else {
      query = filters.sortOrder === 'asc' ? 
        query.orderBy(asc(dashboards.createdAt)) : 
        query.orderBy(desc(dashboards.createdAt));
    }
    
    // Apply pagination
    if (filters.limit) {
      query = query.limit(filters.limit);
    }
    
    if (filters.offset) {
      query = query.offset(filters.offset);
    }
    
    const dashboardsList = await query;
    
    // Get total count
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(dashboards)
      .where(eq(dashboards.tenantId, tenantId));
    
    return {
      dashboards: dashboardsList as Dashboard[],
      total: count
    };
  }

  async updateDashboard(id: string, data: Partial<Dashboard>, tenantId: string): Promise<Dashboard | null> {
    if (!tenantId) throw new Error('Tenant ID required for multi-tenant isolation');
    
    const [updatedDashboard] = await db
      .update(dashboards)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(and(
        eq(dashboards.id, id),
        eq(dashboards.tenantId, tenantId)
      ))
      .returning();
    
    return updatedDashboard as Dashboard || null;
  }

  async deleteDashboard(id: string, tenantId: string): Promise<boolean> {
    if (!tenantId) throw new Error('Tenant ID required for multi-tenant isolation');
    
    const result = await db
      .delete(dashboards)
      .where(and(
        eq(dashboards.id, id),
        eq(dashboards.tenantId, tenantId)
      ));
    
    return result.rowCount > 0;
  }

  // ✅ DASHBOARD WIDGETS - ORM COMPLIANCE
  
  async createDashboardWidget(widgetData: Omit<DashboardWidget, 'id' | 'createdAt' | 'updatedAt'>, tenantId: string): Promise<DashboardWidget> {
    if (!tenantId) throw new Error('Tenant ID required for multi-tenant isolation');
    
    const [newWidget] = await db
      .insert(dashboardWidgets)
      .values({
        ...widgetData,
        tenantId,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    
    return newWidget as DashboardWidget;
  }

  async findDashboardWidgets(dashboardId: string, tenantId: string): Promise<DashboardWidget[]> {
    if (!tenantId) throw new Error('Tenant ID required for multi-tenant isolation');
    
    const widgets = await db
      .select()
      .from(dashboardWidgets)
      .where(and(
        eq(dashboardWidgets.dashboardId, dashboardId),
        eq(dashboardWidgets.tenantId, tenantId)
      ))
      .orderBy(asc(dashboardWidgets.position));
    
    return widgets as DashboardWidget[];
  }

  async updateDashboardWidget(id: string, data: Partial<DashboardWidget>, tenantId: string): Promise<DashboardWidget | null> {
    if (!tenantId) throw new Error('Tenant ID required for multi-tenant isolation');
    
    const [updatedWidget] = await db
      .update(dashboardWidgets)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(and(
        eq(dashboardWidgets.id, id),
        eq(dashboardWidgets.tenantId, tenantId)
      ))
      .returning();
    
    return updatedWidget as DashboardWidget || null;
  }

  async deleteDashboardWidget(id: string, tenantId: string): Promise<boolean> {
    if (!tenantId) throw new Error('Tenant ID required for multi-tenant isolation');
    
    const result = await db
      .delete(dashboardWidgets)
      .where(and(
        eq(dashboardWidgets.id, id),
        eq(dashboardWidgets.tenantId, tenantId)
      ));
    
    return result.rowCount > 0;
  }
}