// ✅ 1QA.MD COMPLIANCE: INFRASTRUCTURE REPOSITORY - DATABASE IMPLEMENTATION
// Infrastructure Layer - Drizzle ORM implementation with tenant isolation
// CORREÇÃO CRÍTICA: Aplicando isolamento multi-tenant seguindo 1qa.md

import { eq, and, desc, asc, like, inArray, gte, lte, sql, count } from 'drizzle-orm';
import { db, pool } from '@shared/schema';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '@shared/schema';
import { dashboards, dashboardWidgets } from '@shared/schema-reports';
import { IDashboardsRepository } from '../../domain/repositories/IDashboardsRepository';
import { Dashboard, DashboardFilters, DashboardWidget, DashboardWidgetFilters } from '../../domain/entities/Dashboard';
import { Pool } from 'pg';

export class DashboardsRepository implements IDashboardsRepository {
  
  // ✅ 1QA.MD: Tenant Schema Isolation - seguindo padrão do sistema
  private getSchemaName(tenantId: string): string {
    return `tenant_${tenantId.replace(/-/g, '_')}`;
  }

  // ✅ 1QA.MD: Get tenant-specific database instance
  private async getTenantDb(tenantId: string) {
    const schemaName = this.getSchemaName(tenantId);
    const tenantPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      options: `-c search_path=${schemaName}`,
      ssl: false,
    });
    return drizzle({ client: tenantPool, schema });
  }
  
  // ✅ 1QA.MD: CRITICAL METHOD - Dashboard Creation with Tenant Isolation
  async create(dashboard: Omit<Dashboard, 'id' | 'createdAt' | 'updatedAt'>): Promise<Dashboard> {
    console.log('📊 [DASHBOARD-REPO] Creating dashboard in tenant schema:', this.getSchemaName(dashboard.tenantId));
    
    const tenantDb = await this.getTenantDb(dashboard.tenantId);
    
    const [createdDashboard] = await tenantDb
      .insert(dashboards)
      .values({
        ...dashboard,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    
    console.log('✅ [DASHBOARD-REPO] Dashboard created successfully in tenant schema');
    return this.mapDashboardToEntity(createdDashboard);
  }

  // ✅ 1QA.MD: CRITICAL METHOD - Find with Tenant Isolation
  async findById(id: string, tenantId: string): Promise<Dashboard | null> {
    console.log('🔍 [DASHBOARD-REPO] Finding dashboard by ID in tenant schema:', this.getSchemaName(tenantId));
    
    const tenantDb = await this.getTenantDb(tenantId);
    
    const [dashboard] = await tenantDb
      .select()
      .from(dashboards)
      .where(and(
        eq(dashboards.id, id),
        eq(dashboards.tenantId, tenantId)
      ));
    
    return dashboard ? this.mapDashboardToEntity(dashboard) : null;
  }

  // ✅ 1QA.MD: CRITICAL METHOD - List with Tenant Isolation
  async findAll(filters: DashboardFilters, limit = 20, offset = 0): Promise<Dashboard[]> {
    console.log('📊 [DASHBOARD-REPO] Finding all dashboards in tenant schema:', this.getSchemaName(filters.tenantId));
    
    const tenantDb = await this.getTenantDb(filters.tenantId);
    const conditions = [eq(dashboards.tenantId, filters.tenantId)];

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

    const result = await tenantDb
      .select()
      .from(dashboards)
      .where(and(...conditions))
      .orderBy(desc(dashboards.updatedAt))
      .limit(limit)
      .offset(offset);

    return result.map(this.mapDashboardToEntity);
  }

  // ✅ 1QA.MD: CRITICAL METHOD - Update with Tenant Isolation
  async update(id: string, tenantId: string, updates: Partial<Dashboard>): Promise<Dashboard | null> {
    console.log('✏️ [DASHBOARD-REPO] Updating dashboard in tenant schema:', this.getSchemaName(tenantId));
    
    const tenantDb = await this.getTenantDb(tenantId);
    
    const [updatedDashboard] = await tenantDb
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

  // ✅ 1QA.MD: CRITICAL METHOD - Delete with Tenant Isolation
  async delete(id: string, tenantId: string): Promise<boolean> {
    console.log('🗑️ [DASHBOARD-REPO] Deleting dashboard in tenant schema:', this.getSchemaName(tenantId));
    
    const tenantDb = await this.getTenantDb(tenantId);
    
    const result = await tenantDb
      .delete(dashboards)
      .where(and(
        eq(dashboards.id, id),
        eq(dashboards.tenantId, tenantId)
      ));

    return (result.rowCount ?? 0) > 0;
  }

  // ✅ 1QA.MD: Helper method for entity mapping
  private mapDashboardToEntity(dbDashboard: any): Dashboard {
    return {
      id: dbDashboard.id,
      tenantId: dbDashboard.tenantId,
      name: dbDashboard.name,
      description: dbDashboard.description,
      ownerId: dbDashboard.ownerId,
      layout: dbDashboard.layout,
      isPublic: dbDashboard.isPublic,
      refreshInterval: dbDashboard.refreshInterval,
      createdAt: dbDashboard.createdAt,
      updatedAt: dbDashboard.updatedAt,
      metadata: dbDashboard.metadata
    };
  }

  // ✅ 1QA.MD: Widget operations - simplified for essential functionality
  async createWidget(widget: Omit<DashboardWidget, 'id' | 'createdAt' | 'updatedAt'>): Promise<DashboardWidget> {
    console.log('🧩 [DASHBOARD-REPO] Creating widget in tenant schema');
    
    const tenantDb = await this.getTenantDb(widget.tenantId);
    
    const [createdWidget] = await tenantDb
      .insert(dashboardWidgets)
      .values({
        ...widget,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();

    return this.mapWidgetToEntity(createdWidget);
  }

  async findWidgetsByDashboard(dashboardId: string, tenantId: string): Promise<DashboardWidget[]> {
    console.log('🔍 [DASHBOARD-REPO] Finding widgets in tenant schema:', this.getSchemaName(tenantId));
    
    const tenantDb = await this.getTenantDb(tenantId);
    
    const result = await tenantDb
      .select()
      .from(dashboardWidgets)
      .where(and(
        eq(dashboardWidgets.dashboardId, dashboardId),
        eq(dashboardWidgets.tenantId, tenantId)
      ));

    return result.map(this.mapWidgetToEntity);
  }

  private mapWidgetToEntity(dbWidget: any): DashboardWidget {
    return {
      id: dbWidget.id,
      tenantId: dbWidget.tenantId,
      dashboardId: dbWidget.dashboardId,
      name: dbWidget.name,
      type: dbWidget.type,
      position: dbWidget.position,
      config: dbWidget.config,
      createdAt: dbWidget.createdAt,
      updatedAt: dbWidget.updatedAt
    };
  }

  // ✅ 1QA.MD: Essential count method with tenant isolation
  async getCount(filters: DashboardFilters): Promise<number> {
    console.log('🔢 [DASHBOARD-REPO] Counting dashboards in tenant schema:', this.getSchemaName(filters.tenantId));
    
    const tenantDb = await this.getTenantDb(filters.tenantId);
    
    const [result] = await tenantDb
      .select({ count: count() })
      .from(dashboards)
      .where(eq(dashboards.tenantId, filters.tenantId));

    return result.count;
  }
}