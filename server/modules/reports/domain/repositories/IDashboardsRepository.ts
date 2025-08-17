// ✅ 1QA.MD COMPLIANCE: DOMAIN REPOSITORY INTERFACE - PURE ABSTRACTION
// Domain Layer - No implementation details, only contracts

import { Dashboard, DashboardFilters, DashboardWidget, DashboardWidgetFilters } from '../entities/Dashboard';

export interface IDashboardsRepository {
  // Dashboard CRUD Operations
  create(dashboard: Omit<Dashboard, 'id' | 'createdAt' | 'updatedAt'>): Promise<Dashboard>;
  findById(id: string, tenantId: string): Promise<Dashboard | null>;
  findAll(filters: DashboardFilters, limit?: number, offset?: number): Promise<Dashboard[]>;
  update(id: string, tenantId: string, updates: Partial<Dashboard>): Promise<Dashboard | null>;
  delete(id: string, tenantId: string): Promise<boolean>;
  
  // Dashboard Query Operations
  findByOwner(ownerId: string, tenantId: string): Promise<Dashboard[]>;
  findPublicDashboards(tenantId: string): Promise<Dashboard[]>;
  findFavorites(userId: string, tenantId: string): Promise<Dashboard[]>;
  findByShareToken(shareToken: string): Promise<Dashboard | null>;
  findRecentlyViewed(userId: string, tenantId: string, limit?: number): Promise<Dashboard[]>;
  
  // Dashboard Search Operations
  search(searchTerm: string, tenantId: string, limit?: number): Promise<Dashboard[]>;
  findByTags(tags: string[], tenantId: string): Promise<Dashboard[]>;
  
  // Dashboard Access Control
  findAccessibleDashboards(userId: string, userRoles: string[], tenantId: string): Promise<Dashboard[]>;
  checkUserAccess(dashboardId: string, userId: string, userRoles: string[], tenantId: string): Promise<boolean>;
  
  // Dashboard Analytics
  updateViewCount(id: string, tenantId: string): Promise<void>;
  recordView(dashboardId: string, userId: string, tenantId: string): Promise<void>;
  
  // Widget CRUD Operations
  createWidget(widget: Omit<DashboardWidget, 'id' | 'createdAt' | 'updatedAt'>): Promise<DashboardWidget>;
  findWidgetById(id: string, tenantId: string): Promise<DashboardWidget | null>;
  findWidgetsByDashboard(dashboardId: string, tenantId: string): Promise<DashboardWidget[]>;
  findAllWidgets(filters: DashboardWidgetFilters, limit?: number, offset?: number): Promise<DashboardWidget[]>;
  updateWidget(id: string, tenantId: string, updates: Partial<DashboardWidget>): Promise<DashboardWidget | null>;
  deleteWidget(id: string, tenantId: string): Promise<boolean>;
  deleteWidgetsByDashboard(dashboardId: string, tenantId: string): Promise<number>;
  
  // Widget Query Operations
  findWidgetsByType(type: DashboardWidget['type'], tenantId: string): Promise<DashboardWidget[]>;
  findWidgetsByReport(reportId: string, tenantId: string): Promise<DashboardWidget[]>;
  
  // Bulk Widget Operations
  updateWidgetPositions(widgets: Array<{ id: string; position: DashboardWidget['position'] }>, tenantId: string): Promise<void>;
  reorderWidgets(dashboardId: string, widgetOrder: string[], tenantId: string): Promise<void>;
  
  // Dashboard Sharing Operations
  generateShareToken(dashboardId: string, tenantId: string): Promise<string>;
  updateShareSettings(dashboardId: string, tenantId: string, shareSettings: {
    shareToken?: string;
    shareExpiresAt?: Date;
    isPublic?: boolean;
  }): Promise<Dashboard | null>;
  findByShareTokenWithAccess(shareToken: string): Promise<{ dashboard: Dashboard; isValid: boolean }>;
  
  // Validation Operations
  isDashboardNameUnique(name: string, tenantId: string, excludeId?: string): Promise<boolean>;
  validateWidgetPosition(dashboardId: string, widget: Partial<DashboardWidget>, tenantId: string): Promise<boolean>;
  
  // Dashboard Templates & Cloning
  cloneDashboard(dashboardId: string, newName: string, ownerId: string, tenantId: string): Promise<Dashboard>;
  createFromTemplate(templateId: string, name: string, ownerId: string, tenantId: string): Promise<Dashboard>;
  
  // Performance & Maintenance
  findMostViewed(tenantId: string, limit?: number): Promise<Dashboard[]>;
  findRecentlyCreated(tenantId: string, limit?: number): Promise<Dashboard[]>;
  cleanupExpiredShares(tenantId: string): Promise<number>;
  
  // Dashboard Statistics
  getDashboardStatistics(tenantId: string, dateFrom?: Date, dateTo?: Date): Promise<{
    totalDashboards: number;
    totalViews: number;
    avgWidgetsPerDashboard: number;
    mostUsedLayoutTypes: Array<{ layoutType: string; count: number }>;
    mostUsedWidgetTypes: Array<{ widgetType: string; count: number }>;
    topDashboards: Array<{ dashboardId: string; name: string; viewCount: number }>;
  }>;
  
  // Real-time Operations
  findRealTimeDashboards(tenantId: string): Promise<Dashboard[]>;
  updateRefreshStatus(dashboardId: string, tenantId: string, lastRefreshed: Date): Promise<void>;
}