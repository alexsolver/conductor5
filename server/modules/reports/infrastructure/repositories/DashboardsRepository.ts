// ✅ 1QA.MD COMPLIANCE: INFRASTRUCTURE REPOSITORY - DATABASE IMPLEMENTATION
// Infrastructure Layer - Drizzle ORM implementation with tenant isolation

import { eq, and, desc, asc, like, inArray, gte, lte, sql, count } from 'drizzle-orm';
import { db } from '@shared/schema';
import { dashboards, dashboardWidgets } from '@shared/schema-reports';
import { IDashboardsRepository } from '../../domain/repositories/IDashboardsRepository';
import { Dashboard, DashboardFilters, DashboardWidget, DashboardWidgetFilters } from '../../domain/entities/Dashboard';

export class DashboardsRepository implements IDashboardsRepository {
  
  // Dashboard CRUD Operations
  async create(dashboard: Omit<Dashboard, 'id' | 'createdAt' | 'updatedAt'>): Promise<Dashboard> {
    const [createdDashboard] = await db
      .insert(dashboards)
      .values({
        ...dashboard,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    
    return this.mapDashboardToEntity(createdDashboard);
  }

  async findById(id: string, tenantId: string): Promise<Dashboard | null> {
    const [dashboard] = await db
      .select()
      .from(dashboards)
      .where(and(
        eq(dashboards.id, id),
        eq(dashboards.tenantId, tenantId)
      ));
    
    return dashboard ? this.mapDashboardToEntity(dashboard) : null;
  }

  async findAll(filters: DashboardFilters, limit = 20, offset = 0): Promise<Dashboard[]> {
    const conditions = [eq(dashboards.tenantId, filters.tenantId)];

    if (filters.status) {
      conditions.push(eq(dashboards.status, filters.status));
    }

    if (filters.layoutType) {
      conditions.push(eq(dashboards.layoutType, filters.layoutType));
    }

    if (filters.ownerId) {
      conditions.push(eq(dashboards.ownerId, filters.ownerId));
    }

    if (filters.isPublic !== undefined) {
      conditions.push(eq(dashboards.isPublic, filters.isPublic));
    }

    if (filters.isFavorite !== undefined) {
      conditions.push(eq(dashboards.isFavorite, filters.isFavorite));
    }

    if (filters.search) {
      conditions.push(
        like(dashboards.name, `%${filters.search}%`)
      );
    }

    if (filters.createdFrom) {
      conditions.push(gte(dashboards.createdAt, filters.createdFrom));
    }

    if (filters.createdTo) {
      conditions.push(lte(dashboards.createdAt, filters.createdTo));
    }

    const result = await db
      .select()
      .from(dashboards)
      .where(and(...conditions))
      .orderBy(desc(dashboards.updatedAt))
      .limit(limit)
      .offset(offset);

    return result.map(this.mapDashboardToEntity);
  }

  async update(id: string, tenantId: string, updates: Partial<Dashboard>): Promise<Dashboard | null> {
    const [updatedDashboard] = await db
      .update(dashboards)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(and(
        eq(dashboards.id, id),
        eq(dashboards.tenantId, tenantId)
      ))
      .returning();

    return updatedDashboard ? this.mapDashboardToEntity(updatedDashboard) : null;
  }

  async delete(id: string, tenantId: string): Promise<boolean> {
    // Delete associated widgets first (cascade should handle this, but being explicit)
    await db
      .delete(dashboardWidgets)
      .where(and(
        eq(dashboardWidgets.dashboardId, id),
        eq(dashboardWidgets.tenantId, tenantId)
      ));

    const result = await db
      .delete(dashboards)
      .where(and(
        eq(dashboards.id, id),
        eq(dashboards.tenantId, tenantId)
      ));

    return result.rowCount > 0;
  }

  // Dashboard Query Operations
  async findByOwner(ownerId: string, tenantId: string): Promise<Dashboard[]> {
    const result = await db
      .select()
      .from(dashboards)
      .where(and(
        eq(dashboards.ownerId, ownerId),
        eq(dashboards.tenantId, tenantId)
      ))
      .orderBy(desc(dashboards.updatedAt));

    return result.map(this.mapDashboardToEntity);
  }

  async findPublicDashboards(tenantId: string): Promise<Dashboard[]> {
    const result = await db
      .select()
      .from(dashboards)
      .where(and(
        eq(dashboards.isPublic, true),
        eq(dashboards.tenantId, tenantId)
      ))
      .orderBy(desc(dashboards.updatedAt));

    return result.map(this.mapDashboardToEntity);
  }

  async findFavorites(userId: string, tenantId: string): Promise<Dashboard[]> {
    const result = await db
      .select()
      .from(dashboards)
      .where(and(
        eq(dashboards.isFavorite, true),
        eq(dashboards.ownerId, userId),
        eq(dashboards.tenantId, tenantId)
      ))
      .orderBy(desc(dashboards.lastViewedAt));

    return result.map(this.mapDashboardToEntity);
  }

  async findByShareToken(shareToken: string): Promise<Dashboard | null> {
    const [dashboard] = await db
      .select()
      .from(dashboards)
      .where(eq(dashboards.shareToken, shareToken));
    
    return dashboard ? this.mapDashboardToEntity(dashboard) : null;
  }

  async findRecentlyViewed(userId: string, tenantId: string, limit = 10): Promise<Dashboard[]> {
    const result = await db
      .select()
      .from(dashboards)
      .where(and(
        eq(dashboards.ownerId, userId),
        eq(dashboards.tenantId, tenantId),
        sql`${dashboards.lastViewedAt} IS NOT NULL`
      ))
      .orderBy(desc(dashboards.lastViewedAt))
      .limit(limit);

    return result.map(this.mapDashboardToEntity);
  }

  // Dashboard Search Operations
  async search(searchTerm: string, tenantId: string, limit = 20): Promise<Dashboard[]> {
    const result = await db
      .select()
      .from(dashboards)
      .where(and(
        eq(dashboards.tenantId, tenantId),
        like(dashboards.name, `%${searchTerm}%`)
      ))
      .orderBy(desc(dashboards.updatedAt))
      .limit(limit);

    return result.map(this.mapDashboardToEntity);
  }

  async findByTags(tags: string[], tenantId: string): Promise<Dashboard[]> {
    const result = await db
      .select()
      .from(dashboards)
      .where(and(
        eq(dashboards.tenantId, tenantId),
        sql`${dashboards.tags} && ${tags}`
      ))
      .orderBy(desc(dashboards.updatedAt));

    return result.map(this.mapDashboardToEntity);
  }

  // Dashboard Access Control
  async findAccessibleDashboards(userId: string, userRoles: string[], tenantId: string): Promise<Dashboard[]> {
    const result = await db
      .select()
      .from(dashboards)
      .where(and(
        eq(dashboards.tenantId, tenantId),
        sql`(
          ${dashboards.isPublic} = true OR 
          ${dashboards.ownerId} = ${userId} OR 
          ${dashboards.allowedUsers} @> ${JSON.stringify([userId])} OR 
          ${dashboards.allowedRoles} && ${userRoles}
        )`
      ))
      .orderBy(desc(dashboards.updatedAt));

    return result.map(this.mapDashboardToEntity);
  }

  async checkUserAccess(dashboardId: string, userId: string, userRoles: string[], tenantId: string): Promise<boolean> {
    const [dashboard] = await db
      .select()
      .from(dashboards)
      .where(and(
        eq(dashboards.id, dashboardId),
        eq(dashboards.tenantId, tenantId),
        sql`(
          ${dashboards.isPublic} = true OR 
          ${dashboards.ownerId} = ${userId} OR 
          ${dashboards.allowedUsers} @> ${JSON.stringify([userId])} OR 
          ${dashboards.allowedRoles} && ${userRoles}
        )`
      ));

    return !!dashboard;
  }

  // Dashboard Analytics
  async updateViewCount(id: string, tenantId: string): Promise<void> {
    await db
      .update(dashboards)
      .set({
        viewCount: sql`${dashboards.viewCount} + 1`,
        lastViewedAt: new Date(),
        updatedAt: new Date()
      })
      .where(and(
        eq(dashboards.id, id),
        eq(dashboards.tenantId, tenantId)
      ));
  }

  async recordView(dashboardId: string, userId: string, tenantId: string): Promise<void> {
    await this.updateViewCount(dashboardId, tenantId);
  }

  // Widget CRUD Operations
  async createWidget(widget: Omit<DashboardWidget, 'id' | 'createdAt' | 'updatedAt'>): Promise<DashboardWidget> {
    const [createdWidget] = await db
      .insert(dashboardWidgets)
      .values({
        ...widget,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    
    return this.mapWidgetToEntity(createdWidget);
  }

  async findWidgetById(id: string, tenantId: string): Promise<DashboardWidget | null> {
    const [widget] = await db
      .select()
      .from(dashboardWidgets)
      .where(and(
        eq(dashboardWidgets.id, id),
        eq(dashboardWidgets.tenantId, tenantId)
      ));
    
    return widget ? this.mapWidgetToEntity(widget) : null;
  }

  async findWidgetsByDashboard(dashboardId: string, tenantId: string): Promise<DashboardWidget[]> {
    const result = await db
      .select()
      .from(dashboardWidgets)
      .where(and(
        eq(dashboardWidgets.dashboardId, dashboardId),
        eq(dashboardWidgets.tenantId, tenantId)
      ))
      .orderBy(asc(dashboardWidgets.zIndex));

    return result.map(this.mapWidgetToEntity);
  }

  async findAllWidgets(filters: DashboardWidgetFilters, limit = 50, offset = 0): Promise<DashboardWidget[]> {
    const conditions = [eq(dashboardWidgets.tenantId, filters.tenantId)];

    if (filters.dashboardId) {
      conditions.push(eq(dashboardWidgets.dashboardId, filters.dashboardId));
    }

    if (filters.type) {
      conditions.push(eq(dashboardWidgets.type, filters.type));
    }

    if (filters.reportId) {
      conditions.push(eq(dashboardWidgets.reportId, filters.reportId));
    }

    if (filters.isVisible !== undefined) {
      conditions.push(eq(dashboardWidgets.isVisible, filters.isVisible));
    }

    if (filters.isInteractive !== undefined) {
      conditions.push(eq(dashboardWidgets.isInteractive, filters.isInteractive));
    }

    const result = await db
      .select()
      .from(dashboardWidgets)
      .where(and(...conditions))
      .orderBy(asc(dashboardWidgets.zIndex))
      .limit(limit)
      .offset(offset);

    return result.map(this.mapWidgetToEntity);
  }

  async updateWidget(id: string, tenantId: string, updates: Partial<DashboardWidget>): Promise<DashboardWidget | null> {
    const [updatedWidget] = await db
      .update(dashboardWidgets)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(and(
        eq(dashboardWidgets.id, id),
        eq(dashboardWidgets.tenantId, tenantId)
      ))
      .returning();

    return updatedWidget ? this.mapWidgetToEntity(updatedWidget) : null;
  }

  async deleteWidget(id: string, tenantId: string): Promise<boolean> {
    const result = await db
      .delete(dashboardWidgets)
      .where(and(
        eq(dashboardWidgets.id, id),
        eq(dashboardWidgets.tenantId, tenantId)
      ));

    return result.rowCount > 0;
  }

  async deleteWidgetsByDashboard(dashboardId: string, tenantId: string): Promise<number> {
    const result = await db
      .delete(dashboardWidgets)
      .where(and(
        eq(dashboardWidgets.dashboardId, dashboardId),
        eq(dashboardWidgets.tenantId, tenantId)
      ));

    return result.rowCount;
  }

  // Widget Query Operations
  async findWidgetsByType(type: DashboardWidget['type'], tenantId: string): Promise<DashboardWidget[]> {
    const result = await db
      .select()
      .from(dashboardWidgets)
      .where(and(
        eq(dashboardWidgets.type, type),
        eq(dashboardWidgets.tenantId, tenantId)
      ))
      .orderBy(desc(dashboardWidgets.updatedAt));

    return result.map(this.mapWidgetToEntity);
  }

  async findWidgetsByReport(reportId: string, tenantId: string): Promise<DashboardWidget[]> {
    const result = await db
      .select()
      .from(dashboardWidgets)
      .where(and(
        eq(dashboardWidgets.reportId, reportId),
        eq(dashboardWidgets.tenantId, tenantId)
      ))
      .orderBy(desc(dashboardWidgets.updatedAt));

    return result.map(this.mapWidgetToEntity);
  }

  // Bulk Widget Operations
  async updateWidgetPositions(widgets: Array<{ id: string; position: DashboardWidget['position'] }>, tenantId: string): Promise<void> {
    // Use transaction for bulk update
    await db.transaction(async (tx) => {
      for (const widget of widgets) {
        await tx
          .update(dashboardWidgets)
          .set({
            position: widget.position,
            updatedAt: new Date()
          })
          .where(and(
            eq(dashboardWidgets.id, widget.id),
            eq(dashboardWidgets.tenantId, tenantId)
          ));
      }
    });
  }

  async reorderWidgets(dashboardId: string, widgetOrder: string[], tenantId: string): Promise<void> {
    await db.transaction(async (tx) => {
      for (let i = 0; i < widgetOrder.length; i++) {
        await tx
          .update(dashboardWidgets)
          .set({
            zIndex: i + 1,
            updatedAt: new Date()
          })
          .where(and(
            eq(dashboardWidgets.id, widgetOrder[i]),
            eq(dashboardWidgets.dashboardId, dashboardId),
            eq(dashboardWidgets.tenantId, tenantId)
          ));
      }
    });
  }

  // Dashboard Sharing Operations
  async generateShareToken(dashboardId: string, tenantId: string): Promise<string> {
    const shareToken = this.generateRandomToken();
    
    await db
      .update(dashboards)
      .set({
        shareToken,
        updatedAt: new Date()
      })
      .where(and(
        eq(dashboards.id, dashboardId),
        eq(dashboards.tenantId, tenantId)
      ));
    
    return shareToken;
  }

  async updateShareSettings(dashboardId: string, tenantId: string, shareSettings: {
    shareToken?: string;
    shareExpiresAt?: Date;
    isPublic?: boolean;
  }): Promise<Dashboard | null> {
    const [updatedDashboard] = await db
      .update(dashboards)
      .set({
        ...shareSettings,
        updatedAt: new Date()
      })
      .where(and(
        eq(dashboards.id, dashboardId),
        eq(dashboards.tenantId, tenantId)
      ))
      .returning();

    return updatedDashboard ? this.mapDashboardToEntity(updatedDashboard) : null;
  }

  async findByShareTokenWithAccess(shareToken: string): Promise<{ dashboard: Dashboard; isValid: boolean }> {
    const [dashboard] = await db
      .select()
      .from(dashboards)
      .where(eq(dashboards.shareToken, shareToken));
    
    if (!dashboard) {
      throw new Error('Dashboard not found');
    }

    const mappedDashboard = this.mapDashboardToEntity(dashboard);
    const isValid = !dashboard.shareExpiresAt || new Date() <= dashboard.shareExpiresAt;

    return { dashboard: mappedDashboard, isValid };
  }

  // Validation Operations
  async isDashboardNameUnique(name: string, tenantId: string, excludeId?: string): Promise<boolean> {
    const conditions = [
      eq(dashboards.name, name),
      eq(dashboards.tenantId, tenantId)
    ];

    if (excludeId) {
      conditions.push(sql`${dashboards.id} != ${excludeId}`);
    }

    const [existingDashboard] = await db
      .select()
      .from(dashboards)
      .where(and(...conditions));

    return !existingDashboard;
  }

  async validateWidgetPosition(dashboardId: string, widget: Partial<DashboardWidget>, tenantId: string): Promise<boolean> {
    if (!widget.position) return false;

    const existingWidgets = await this.findWidgetsByDashboard(dashboardId, tenantId);
    
    // Filter out the widget being updated if it has an ID
    const otherWidgets = widget.id 
      ? existingWidgets.filter(w => w.id !== widget.id)
      : existingWidgets;

    // Check for overlaps
    const { x, y, width, height } = widget.position;
    const newWidgetRight = x + width;
    const newWidgetBottom = y + height;

    for (const existingWidget of otherWidgets) {
      const existingRight = existingWidget.position.x + existingWidget.position.width;
      const existingBottom = existingWidget.position.y + existingWidget.position.height;

      const overlapsHorizontally = x < existingRight && newWidgetRight > existingWidget.position.x;
      const overlapsVertically = y < existingBottom && newWidgetBottom > existingWidget.position.y;

      if (overlapsHorizontally && overlapsVertically) {
        return false;
      }
    }

    return true;
  }

  // Dashboard Templates & Cloning
  async cloneDashboard(dashboardId: string, newName: string, ownerId: string, tenantId: string): Promise<Dashboard> {
    const originalDashboard = await this.findById(dashboardId, tenantId);
    if (!originalDashboard) {
      throw new Error('Dashboard not found');
    }

    const originalWidgets = await this.findWidgetsByDashboard(dashboardId, tenantId);

    return await db.transaction(async (tx) => {
      // Clone dashboard
      const [clonedDashboard] = await tx
        .insert(dashboards)
        .values({
          ...originalDashboard,
          name: newName,
          ownerId,
          shareToken: undefined,
          shareExpiresAt: undefined,
          isPublic: false,
          viewCount: 0,
          lastViewedAt: undefined,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: ownerId,
          updatedBy: undefined
        })
        .returning();

      // Clone widgets
      for (const widget of originalWidgets) {
        await tx
          .insert(dashboardWidgets)
          .values({
            ...widget,
            dashboardId: clonedDashboard.id,
            createdAt: new Date(),
            updatedAt: new Date()
          });
      }

      return this.mapDashboardToEntity(clonedDashboard);
    });
  }

  async createFromTemplate(templateId: string, name: string, ownerId: string, tenantId: string): Promise<Dashboard> {
    // This would integrate with template system
    throw new Error('Template creation not implemented yet');
  }

  // Performance & Maintenance
  async findMostViewed(tenantId: string, limit = 10): Promise<Dashboard[]> {
    const result = await db
      .select()
      .from(dashboards)
      .where(eq(dashboards.tenantId, tenantId))
      .orderBy(desc(dashboards.viewCount))
      .limit(limit);

    return result.map(this.mapDashboardToEntity);
  }

  async findRecentlyCreated(tenantId: string, limit = 10): Promise<Dashboard[]> {
    const result = await db
      .select()
      .from(dashboards)
      .where(eq(dashboards.tenantId, tenantId))
      .orderBy(desc(dashboards.createdAt))
      .limit(limit);

    return result.map(this.mapDashboardToEntity);
  }

  async cleanupExpiredShares(tenantId: string): Promise<number> {
    const result = await db
      .update(dashboards)
      .set({
        shareToken: null,
        shareExpiresAt: null,
        updatedAt: new Date()
      })
      .where(and(
        eq(dashboards.tenantId, tenantId),
        sql`${dashboards.shareExpiresAt} < NOW()`
      ));

    return result.rowCount;
  }

  // Dashboard Statistics
  async getDashboardStatistics(tenantId: string, dateFrom?: Date, dateTo?: Date): Promise<{
    totalDashboards: number;
    totalViews: number;
    avgWidgetsPerDashboard: number;
    mostUsedLayoutTypes: Array<{ layoutType: string; count: number }>;
    mostUsedWidgetTypes: Array<{ widgetType: string; count: number }>;
    topDashboards: Array<{ dashboardId: string; name: string; viewCount: number }>;
  }> {
    // Total dashboards
    const [totalDashboardsResult] = await db
      .select({ count: count() })
      .from(dashboards)
      .where(eq(dashboards.tenantId, tenantId));

    // Total views
    const [totalViewsResult] = await db
      .select({ 
        totalViews: sql<number>`SUM(${dashboards.viewCount})` 
      })
      .from(dashboards)
      .where(eq(dashboards.tenantId, tenantId));

    // Average widgets per dashboard
    const [avgWidgetsResult] = await db
      .select({ 
        avg: sql<number>`AVG(widget_count)` 
      })
      .from(
        db
          .select({ 
            dashboardId: dashboardWidgets.dashboardId,
            widgetCount: sql<number>`COUNT(*)`.as('widget_count')
          })
          .from(dashboardWidgets)
          .where(eq(dashboardWidgets.tenantId, tenantId))
          .groupBy(dashboardWidgets.dashboardId)
          .as('dashboard_widget_counts')
      );

    // Most used layout types
    const layoutTypesResult = await db
      .select({
        layoutType: dashboards.layoutType,
        count: count()
      })
      .from(dashboards)
      .where(eq(dashboards.tenantId, tenantId))
      .groupBy(dashboards.layoutType)
      .orderBy(desc(count()))
      .limit(5);

    // Most used widget types
    const widgetTypesResult = await db
      .select({
        widgetType: dashboardWidgets.type,
        count: count()
      })
      .from(dashboardWidgets)
      .where(eq(dashboardWidgets.tenantId, tenantId))
      .groupBy(dashboardWidgets.type)
      .orderBy(desc(count()))
      .limit(5);

    // Top dashboards
    const topDashboardsResult = await db
      .select({
        dashboardId: dashboards.id,
        name: dashboards.name,
        viewCount: dashboards.viewCount
      })
      .from(dashboards)
      .where(eq(dashboards.tenantId, tenantId))
      .orderBy(desc(dashboards.viewCount))
      .limit(5);

    return {
      totalDashboards: totalDashboardsResult.count,
      totalViews: totalViewsResult.totalViews || 0,
      avgWidgetsPerDashboard: Math.round(avgWidgetsResult.avg || 0),
      mostUsedLayoutTypes: layoutTypesResult,
      mostUsedWidgetTypes: widgetTypesResult,
      topDashboards: topDashboardsResult
    };
  }

  // Real-time Operations
  async findRealTimeDashboards(tenantId: string): Promise<Dashboard[]> {
    const result = await db
      .select()
      .from(dashboards)
      .where(and(
        eq(dashboards.tenantId, tenantId),
        eq(dashboards.isRealTime, true)
      ))
      .orderBy(desc(dashboards.updatedAt));

    return result.map(this.mapDashboardToEntity);
  }

  async updateRefreshStatus(dashboardId: string, tenantId: string, lastRefreshed: Date): Promise<void> {
    await db
      .update(dashboards)
      .set({
        lastViewedAt: lastRefreshed,
        updatedAt: new Date()
      })
      .where(and(
        eq(dashboards.id, dashboardId),
        eq(dashboards.tenantId, tenantId)
      ));
  }

  // Private helper methods
  private generateRandomToken(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';
    for (let i = 0; i < 32; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
  }

  private mapDashboardToEntity(dbRecord: any): Dashboard {
    return {
      id: dbRecord.id,
      tenantId: dbRecord.tenantId,
      name: dbRecord.name,
      description: dbRecord.description,
      layoutType: dbRecord.layoutType,
      status: dbRecord.status,
      layoutConfig: dbRecord.layoutConfig || {},
      themeConfig: dbRecord.themeConfig || {},
      styleConfig: dbRecord.styleConfig || {},
      ownerId: dbRecord.ownerId,
      isPublic: dbRecord.isPublic,
      shareToken: dbRecord.shareToken,
      shareExpiresAt: dbRecord.shareExpiresAt,
      accessLevel: dbRecord.accessLevel,
      allowedRoles: dbRecord.allowedRoles || [],
      allowedUsers: dbRecord.allowedUsers || [],
      isRealTime: dbRecord.isRealTime,
      refreshInterval: dbRecord.refreshInterval,
      autoRefresh: dbRecord.autoRefresh,
      mobileConfig: dbRecord.mobileConfig || {},
      tabletConfig: dbRecord.tabletConfig || {},
      desktopConfig: dbRecord.desktopConfig || {},
      isFavorite: dbRecord.isFavorite,
      viewCount: dbRecord.viewCount,
      lastViewedAt: dbRecord.lastViewedAt,
      tags: dbRecord.tags || [],
      metadata: dbRecord.metadata || {},
      version: dbRecord.version,
      createdAt: dbRecord.createdAt,
      updatedAt: dbRecord.updatedAt,
      createdBy: dbRecord.createdBy,
      updatedBy: dbRecord.updatedBy
    };
  }

  private mapWidgetToEntity(dbRecord: any): DashboardWidget {
    return {
      id: dbRecord.id,
      tenantId: dbRecord.tenantId,
      dashboardId: dbRecord.dashboardId,
      name: dbRecord.name,
      type: dbRecord.type,
      reportId: dbRecord.reportId,
      position: dbRecord.position,
      gridPosition: dbRecord.gridPosition || {},
      zIndex: dbRecord.zIndex,
      config: dbRecord.config || {},
      dataConfig: dbRecord.dataConfig || {},
      styleConfig: dbRecord.styleConfig || {},
      interactionConfig: dbRecord.interactionConfig || {},
      query: dbRecord.query,
      cacheConfig: dbRecord.cacheConfig || {},
      refreshInterval: dbRecord.refreshInterval,
      isRealTime: dbRecord.isRealTime,
      mobileConfig: dbRecord.mobileConfig || {},
      tabletConfig: dbRecord.tabletConfig || {},
      isVisible: dbRecord.isVisible,
      isInteractive: dbRecord.isInteractive,
      createdAt: dbRecord.createdAt,
      updatedAt: dbRecord.updatedAt
    };
  }
}