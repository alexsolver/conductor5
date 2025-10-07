import { Pool } from 'pg';
import { ticketListViews, insertTicketListViewSchema } from '@shared/schema';
import { z } from 'zod';

// Infer types from schema
type TicketListView = typeof ticketListViews.$inferSelect;
type InsertTicketListView = z.infer<typeof insertTicketListViewSchema>;

// User view preferences types (table doesn't exist yet, using any for now)
type UserViewPreference = any;

export class TicketViewsRepository {
  constructor(private pool: Pool) {}

  private async query(sql: string, params: any[] = []) {
    const result = await this.pool.query(sql, params);
    return result.rows;
  }

  // ========================================
  // TICKET LIST VIEWS MANAGEMENT
  // ========================================

  async getViewsForUser(tenantId: string, userId: string, userRole: string): Promise<TicketListView[]> {
    // Usuários comuns veem: suas próprias views + views públicas
    // Admins (tenant_admin/saas_admin) veem: todas as views do tenant
    const isAdmin = userRole === 'tenant_admin' || userRole === 'saas_admin';
    const sql = isAdmin ? `
      SELECT v.* FROM tenant_${tenantId.replace(/-/g, '_')}.ticket_list_views v
      WHERE v.tenant_id = $1 AND v.is_active = true
      ORDER BY v.is_default DESC, v.name ASC
    ` : `
      SELECT v.* FROM tenant_${tenantId.replace(/-/g, '_')}.ticket_list_views v
      WHERE v.tenant_id = $1 
        AND v.is_active = true
        AND (v.created_by_id = $2 OR v.is_public = true)
      ORDER BY v.is_default DESC, v.name ASC
    `;

    const params = isAdmin ? [tenantId] : [tenantId, userId];
    return await this.query(sql, params);
  }

  async getManageableViewsForUser(tenantId: string, userId: string, userRole: string): Promise<TicketListView[]> {
    // Retorna apenas visualizações que podem ser gerenciadas (exclui is_default = true)
    // Usuários comuns veem: suas próprias views + views públicas (exceto padrão)
    // Admins veem: todas as views do tenant (exceto padrão)
    const isAdmin = userRole === 'tenant_admin' || userRole === 'saas_admin';
    const sql = isAdmin ? `
      SELECT v.* FROM tenant_${tenantId.replace(/-/g, '_')}.ticket_list_views v
      WHERE v.tenant_id = $1 
        AND v.is_active = true 
        AND v.is_default = false
      ORDER BY v.name ASC
    ` : `
      SELECT v.* FROM tenant_${tenantId.replace(/-/g, '_')}.ticket_list_views v
      WHERE v.tenant_id = $1 
        AND v.is_active = true
        AND v.is_default = false
        AND (v.created_by_id = $2 OR v.is_public = true)
      ORDER BY v.name ASC
    `;

    const params = isAdmin ? [tenantId] : [tenantId, userId];
    return await this.query(sql, params);
  }

  async getViewById(tenantId: string, viewId: string): Promise<TicketListView | null> {
    const sql = `
      SELECT * FROM tenant_${tenantId.replace(/-/g, '_')}.ticket_list_views
      WHERE tenant_id = $1 AND id = $2 AND is_active = true
    `;
    const rows = await this.query(sql, [tenantId, viewId]);
    return rows[0] || null;
  }

  async createView(tenantId: string, viewData: InsertTicketListView): Promise<TicketListView> {
    const sql = `
      INSERT INTO tenant_${tenantId.replace(/-/g, '_')}.ticket_list_views (
        tenant_id, name, description, created_by_id, is_public, is_default,
        columns, filters, sorting, page_size
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;

    const rows = await this.query(sql, [
      tenantId,
      viewData.name,
      viewData.description,
      viewData.createdById,
      viewData.isPublic,
      viewData.isDefault,
      JSON.stringify(viewData.columns),
      JSON.stringify(viewData.filters || []),
      JSON.stringify(viewData.sorting || []),
      viewData.pageSize || 25
    ]);

    return rows[0];
  }

  async updateView(tenantId: string, viewId: string, viewData: Partial<InsertTicketListView>): Promise<TicketListView | null> {
    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (viewData.name) {
      updates.push(`name = $${paramIndex++}`);
      params.push(viewData.name);
    }
    if (viewData.description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      params.push(viewData.description);
    }
    if (viewData.isPublic !== undefined) {
      updates.push(`is_public = $${paramIndex++}`);
      params.push(viewData.isPublic);
    }
    if (viewData.isDefault !== undefined) {
      updates.push(`is_default = $${paramIndex++}`);
      params.push(viewData.isDefault);
    }
    if (viewData.columns) {
      updates.push(`columns = $${paramIndex++}`);
      params.push(JSON.stringify(viewData.columns));
    }
    if (viewData.filters) {
      updates.push(`filters = $${paramIndex++}`);
      params.push(JSON.stringify(viewData.filters));
    }
    if (viewData.sorting) {
      updates.push(`sorting = $${paramIndex++}`);
      params.push(JSON.stringify(viewData.sorting));
    }
    if (viewData.pageSize) {
      updates.push(`page_size = $${paramIndex++}`);
      params.push(viewData.pageSize);
    }

    if (updates.length === 0) return null;

    updates.push(`updated_at = NOW()`);
    
    // Add WHERE clause parameters
    params.push(tenantId);
    const tenantParam = paramIndex++;
    
    params.push(viewId);
    const idParam = paramIndex;

    const sql = `
      UPDATE tenant_${tenantId.replace(/-/g, '_')}.ticket_list_views 
      SET ${updates.join(', ')}
      WHERE tenant_id = $${tenantParam} AND id = $${idParam}
      RETURNING *
    `;

    const rows = await this.query(sql, params);
    return rows[0] || null;
  }

  async deleteView(tenantId: string, viewId: string, userId: string, role?: string): Promise<boolean> {
    const isAdmin = role === 'tenant_admin' || role === 'saas_admin';
    
    console.log('🗑️ [REPO-DELETE] Delete view request:', {
      tenantId,
      viewId,
      userId,
      role,
      isAdmin
    });

    // Admins podem deletar qualquer view, outros usuários apenas suas próprias
    const sql = isAdmin 
      ? `
        UPDATE tenant_${tenantId.replace(/-/g, '_')}.ticket_list_views 
        SET is_active = false, updated_at = NOW()
        WHERE tenant_id = $1 AND id = $2
        RETURNING id, name, created_by_id
      `
      : `
        UPDATE tenant_${tenantId.replace(/-/g, '_')}.ticket_list_views 
        SET is_active = false, updated_at = NOW()
        WHERE tenant_id = $1 AND id = $2 AND created_by_id = $3
        RETURNING id, name, created_by_id
      `;

    const params = isAdmin ? [tenantId, viewId] : [tenantId, viewId, userId];
    
    console.log('🗑️ [REPO-DELETE] Executing SQL:', {
      sql: sql.split('\n').map(l => l.trim()).join(' '),
      params
    });

    const rows = await this.query(sql, params);
    
    console.log('🗑️ [REPO-DELETE] Query result:', {
      rowsAffected: rows.length,
      deletedView: rows[0] || null
    });

    return rows.length > 0;
  }

  // ========================================
  // USER PREFERENCES MANAGEMENT
  // ========================================

  async getUserPreferences(tenantId: string, userId: string): Promise<UserViewPreference | null> {
    const sql = `
      SELECT * FROM tenant_${tenantId.replace(/-/g, '_')}.user_view_preferences
      WHERE tenant_id = $1 AND user_id = $2
    `;
    const rows = await this.query(sql, [tenantId, userId]);
    return rows[0] || null;
  }

  async setUserActiveView(tenantId: string, userId: string, viewId: string): Promise<UserViewPreference> {
    const sql = `
      INSERT INTO tenant_${tenantId.replace(/-/g, '_')}.user_view_preferences (
        tenant_id, user_id, active_view_id, last_used_at
      ) VALUES ($1, $2, $3, NOW())
      ON CONFLICT (tenant_id, user_id) 
      DO UPDATE SET 
        active_view_id = $3,
        last_used_at = NOW(),
        updated_at = NOW()
      RETURNING *
    `;

    const rows = await this.query(sql, [tenantId, userId, viewId]);
    return rows[0];
  }

  async updatePersonalSettings(tenantId: string, userId: string, settings: any): Promise<UserViewPreference> {
    const sql = `
      INSERT INTO tenant_${tenantId.replace(/-/g, '_')}.user_view_preferences (
        tenant_id, user_id, personal_settings
      ) VALUES ($1, $2, $3)
      ON CONFLICT (tenant_id, user_id) 
      DO UPDATE SET 
        personal_settings = $3,
        updated_at = NOW()
      RETURNING *
    `;

    const rows = await this.query(sql, [tenantId, userId, JSON.stringify(settings)]);
    return rows[0];
  }

  // ========================================
  // DEFAULT VIEW CREATION
  // ========================================

  async createDefaultView(tenantId: string, userId: string): Promise<TicketListView> {
    const defaultColumns = [
      { id: 'ticketNumber', label: 'Número', visible: true, order: 1, width: 120 },
      { id: 'subject', label: 'Assunto', visible: true, order: 2, width: 300 },
      { id: 'status', label: 'Status', visible: true, order: 3, width: 120 },
      { id: 'priority', label: 'Prioridade', visible: true, order: 4, width: 120 },
      { id: 'assignedToName', label: 'Atribuído', visible: true, order: 5, width: 150 },
      { id: 'customerName', label: 'Cliente', visible: true, order: 6, width: 150 },
      { id: 'createdAt', label: 'Criado em', visible: true, order: 7, width: 150 },
      { id: 'category', label: 'Categoria', visible: true, order: 8, width: 120 },
      { id: 'tags', label: 'Tags', visible: false, order: 9, width: 200 },
      { id: 'updatedAt', label: 'Atualizado', visible: false, order: 10, width: 150 }
    ];

    const defaultView: InsertTicketListView = {
      tenantId,
      name: 'Visualização Padrão',
      description: 'Visualização padrão do sistema para lista de tickets',
      createdById: userId,
      isPublic: true,
      isDefault: true,
      columns: defaultColumns,
      filters: [],
      sorting: [{ column: 'createdAt', direction: 'desc' as const }],
      pageSize: 25
    };

    return await this.createView(tenantId, defaultView);
  }
}