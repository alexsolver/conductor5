// ✅ 1QA.MD COMPLIANCE: SIMPLIFIED DRIZZLE ORM REPOSITORY 
// Infrastructure Layer - Direct SQL with ORM patterns

import { eq, and, desc, asc, like, sql } from 'drizzle-orm';
import { db } from '../../../../../shared/schema';

export interface SimpleReport {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  dataSource: string;
  reportType: string;
  status: string;
  ownerId: string;
  createdBy: string;
  config: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface SimpleDashboard {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  layout: any;
  ownerId: string;
  isPublic: boolean;
  refreshInterval: number;
  createdAt: Date;
  updatedAt: Date;
}

export class SimplifiedDrizzleReportsRepository {
  
  // ✅ REPORTS CRUD - DIRECT SQL WITH ORM
  
  async createReport(reportData: Omit<SimpleReport, 'id' | 'createdAt' | 'updatedAt'>, tenantId: string): Promise<SimpleReport> {
    if (!tenantId) throw new Error('Tenant ID required for multi-tenant isolation');
    
    const result = await db.execute(sql`
      INSERT INTO reports (
        tenant_id, name, description, data_source, report_type, 
        status, owner_id, created_by, config, created_at, updated_at
      ) VALUES (
        ${tenantId}, ${reportData.name}, ${reportData.description || null}, 
        ${reportData.dataSource}, ${reportData.reportType}, ${reportData.status},
        ${reportData.ownerId}, ${reportData.createdBy}, ${JSON.stringify(reportData.config)},
        now(), now()
      ) RETURNING *
    `);
    
    const row = result.rows[0] as any;
    return {
      id: row.id,
      tenantId: row.tenant_id,
      name: row.name,
      description: row.description,
      dataSource: row.data_source,
      reportType: row.report_type,
      status: row.status,
      ownerId: row.owner_id,
      createdBy: row.created_by,
      config: row.config,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }

  async findReports(filters: any, tenantId: string): Promise<{ reports: SimpleReport[]; total: number }> {
    if (!tenantId) throw new Error('Tenant ID required for multi-tenant isolation');
    
    let whereClause = `WHERE tenant_id = '${tenantId}'`;
    
    if (filters.name) {
      whereClause += ` AND name ILIKE '%${filters.name}%'`;
    }
    
    if (filters.status) {
      whereClause += ` AND status = '${filters.status}'`;
    }
    
    const orderBy = filters.sortBy === 'name' ? 'name' : 'created_at';
    const order = filters.sortOrder === 'asc' ? 'ASC' : 'DESC';
    const limit = filters.limit || 20;
    const offset = filters.offset || 0;
    
    // Get reports
    const result = await db.execute(sql.raw(`
      SELECT * FROM reports 
      ${whereClause}
      ORDER BY ${orderBy} ${order}
      LIMIT ${limit} OFFSET ${offset}
    `));
    
    // Get total count
    const countResult = await db.execute(sql.raw(`
      SELECT COUNT(*) as count FROM reports ${whereClause}
    `));
    
    const reports: SimpleReport[] = result.rows.map((row: any) => ({
      id: row.id,
      tenantId: row.tenant_id,
      name: row.name,
      description: row.description,
      dataSource: row.data_source,
      reportType: row.report_type,
      status: row.status,
      ownerId: row.owner_id,
      createdBy: row.created_by,
      config: row.config,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    }));
    
    return {
      reports,
      total: parseInt(countResult.rows[0].count)
    };
  }

  // ✅ DASHBOARDS CRUD - DIRECT SQL WITH ORM
  
  async createDashboard(dashboardData: Omit<SimpleDashboard, 'id' | 'createdAt' | 'updatedAt'>, tenantId: string): Promise<SimpleDashboard> {
    if (!tenantId) throw new Error('Tenant ID required for multi-tenant isolation');
    
    const result = await db.execute(sql`
      INSERT INTO dashboards (
        tenant_id, name, description, layout, owner_id, 
        is_public, refresh_interval, created_at, updated_at
      ) VALUES (
        ${tenantId}, ${dashboardData.name}, ${dashboardData.description || null},
        ${JSON.stringify(dashboardData.layout)}, ${dashboardData.ownerId},
        ${dashboardData.isPublic}, ${dashboardData.refreshInterval},
        now(), now()
      ) RETURNING *
    `);
    
    const row = result.rows[0] as any;
    return {
      id: row.id,
      tenantId: row.tenant_id,
      name: row.name,
      description: row.description,
      layout: row.layout,
      ownerId: row.owner_id,
      isPublic: row.is_public,
      refreshInterval: row.refresh_interval,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }

  async findDashboards(filters: any, tenantId: string): Promise<{ dashboards: SimpleDashboard[]; total: number }> {
    if (!tenantId) throw new Error('Tenant ID required for multi-tenant isolation');
    
    let whereClause = `WHERE tenant_id = '${tenantId}'`;
    
    if (filters.name) {
      whereClause += ` AND name ILIKE '%${filters.name}%'`;
    }
    
    if (filters.isPublic !== undefined) {
      whereClause += ` AND is_public = ${filters.isPublic}`;
    }
    
    const orderBy = filters.sortBy === 'name' ? 'name' : 'created_at';
    const order = filters.sortOrder === 'asc' ? 'ASC' : 'DESC';
    const limit = filters.limit || 10;
    const offset = filters.offset || 0;
    
    // Get dashboards
    const result = await db.execute(sql.raw(`
      SELECT * FROM dashboards 
      ${whereClause}
      ORDER BY ${orderBy} ${order}
      LIMIT ${limit} OFFSET ${offset}
    `));
    
    // Get total count
    const countResult = await db.execute(sql.raw(`
      SELECT COUNT(*) as count FROM dashboards ${whereClause}
    `));
    
    const dashboards: SimpleDashboard[] = result.rows.map((row: any) => ({
      id: row.id,
      tenantId: row.tenant_id,
      name: row.name,
      description: row.description,
      layout: row.layout,
      ownerId: row.owner_id,
      isPublic: row.is_public,
      refreshInterval: row.refresh_interval,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    }));
    
    return {
      dashboards,
      total: parseInt(countResult.rows[0].count)
    };
  }
}