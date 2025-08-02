
import { schemaManager } from '../../db';

export interface WorkSchedule {
  id: string;
  userId: string;
  scheduleType: '5x2' | '6x1' | '12x36' | 'shift' | 'flexible' | 'intermittent';
  startDate: string;
  endDate?: string;
  workDays: number[];
  startTime: string;
  endTime: string;
  breakDurationMinutes: number;
  isActive: boolean;
  tenantId: string;
  createdBy?: string;
  updatedBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
  userName?: string;
}

export interface ScheduleTemplate {
  id: string;
  name: string;
  description: string;
  scheduleType: string;
  workDays: number[];
  startTime: string;
  endTime: string;
  breakDurationMinutes: number;
  tenantId: string;
}

export class WorkScheduleRepository {
  async getAllWorkSchedules(tenantId: string): Promise<WorkSchedule[]> {
    try {
      console.log('[DRIZZLE-QA] Fetching work schedules for tenant:', tenantId);
      
      const pool = schemaManager.getPool();
      const schemaName = schemaManager.getSchemaName(tenantId);

      const query = `
        SELECT 
          ws.*,
          COALESCE(u.first_name || ' ' || u.last_name, tm.first_name || ' ' || tm.last_name) as user_name
        FROM "${schemaName}".work_schedules ws
        LEFT JOIN "${schemaName}".users u ON ws.user_id = u.id
        LEFT JOIN "${schemaName}".team_members tm ON ws.user_id = tm.id
        WHERE ws.tenant_id = $1
        ORDER BY ws.created_at DESC
      `;

      const result = await pool.query(query, [tenantId]);
      
      console.log('[DRIZZLE-QA] Found schedules:', result.rows.length);
      
      return result.rows.map(row => ({
        id: row.id,
        userId: row.user_id,
        scheduleType: row.schedule_type,
        startDate: row.start_date,
        endDate: row.end_date,
        workDays: Array.isArray(row.work_days) ? row.work_days : [],
        startTime: row.start_time,
        endTime: row.end_time,
        breakDurationMinutes: row.break_duration_minutes || 60,
        isActive: row.is_active,
        tenantId: row.tenant_id,
        createdBy: row.created_by,
        updatedBy: row.updated_by,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        userName: row.user_name
      }));
    } catch (error: any) {
      console.error('[DRIZZLE-QA] Error fetching work schedules:', error);
      throw new Error(`Erro ao buscar escalas: ${error.message}`);
    }
  }

  async createWorkSchedule(scheduleData: Partial<WorkSchedule>): Promise<WorkSchedule> {
    try {
      const pool = schemaManager.getPool();
      const schemaName = schemaManager.getSchemaName(scheduleData.tenantId!);

      const query = `
        INSERT INTO "${schemaName}".work_schedules 
        (user_id, schedule_type, start_date, end_date, work_days, start_time, end_time, 
         break_duration_minutes, is_active, tenant_id, created_by, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
        RETURNING *
      `;

      const result = await pool.query(query, [
        scheduleData.userId,
        scheduleData.scheduleType,
        scheduleData.startDate,
        scheduleData.endDate,
        JSON.stringify(scheduleData.workDays),
        scheduleData.startTime,
        scheduleData.endTime,
        scheduleData.breakDurationMinutes,
        scheduleData.isActive,
        scheduleData.tenantId,
        scheduleData.createdBy
      ]);

      const row = result.rows[0];
      
      return {
        id: row.id,
        userId: row.user_id,
        scheduleType: row.schedule_type,
        startDate: row.start_date,
        endDate: row.end_date,
        workDays: JSON.parse(row.work_days || '[]'),
        startTime: row.start_time,
        endTime: row.end_time,
        breakDurationMinutes: row.break_duration_minutes,
        isActive: row.is_active,
        tenantId: row.tenant_id,
        createdBy: row.created_by,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };
    } catch (error: any) {
      console.error('[DRIZZLE-QA] Error creating work schedule:', error);
      throw new Error(`Erro ao criar escala: ${error.message}`);
    }
  }

  async updateWorkSchedule(id: string, tenantId: string, updateData: Partial<WorkSchedule>): Promise<WorkSchedule | null> {
    try {
      const pool = schemaManager.getPool();
      const schemaName = schemaManager.getSchemaName(tenantId);

      const query = `
        UPDATE "${schemaName}".work_schedules 
        SET user_id = $1, schedule_type = $2, start_date = $3, end_date = $4, 
            work_days = $5, start_time = $6, end_time = $7, 
            break_duration_minutes = $8, is_active = $9, updated_by = $10, updated_at = NOW()
        WHERE id = $11 AND tenant_id = $12
        RETURNING *
      `;

      const result = await pool.query(query, [
        updateData.userId,
        updateData.scheduleType,
        updateData.startDate,
        updateData.endDate,
        JSON.stringify(updateData.workDays),
        updateData.startTime,
        updateData.endTime,
        updateData.breakDurationMinutes,
        updateData.isActive,
        updateData.updatedBy,
        id,
        tenantId
      ]);

      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      
      return {
        id: row.id,
        userId: row.user_id,
        scheduleType: row.schedule_type,
        startDate: row.start_date,
        endDate: row.end_date,
        workDays: JSON.parse(row.work_days || '[]'),
        startTime: row.start_time,
        endTime: row.end_time,
        breakDurationMinutes: row.break_duration_minutes,
        isActive: row.is_active,
        tenantId: row.tenant_id,
        updatedBy: row.updated_by,
        updatedAt: row.updated_at
      };
    } catch (error: any) {
      console.error('[DRIZZLE-QA] Error updating work schedule:', error);
      throw new Error(`Erro ao atualizar escala: ${error.message}`);
    }
  }

  async deleteWorkSchedule(id: string, tenantId: string): Promise<void> {
    try {
      const pool = schemaManager.getPool();
      const schemaName = schemaManager.getSchemaName(tenantId);

      const query = `
        DELETE FROM "${schemaName}".work_schedules 
        WHERE id = $1 AND tenant_id = $2
      `;

      await pool.query(query, [id, tenantId]);
    } catch (error: any) {
      console.error('[DRIZZLE-QA] Error deleting work schedule:', error);
      throw new Error(`Erro ao excluir escala: ${error.message}`);
    }
  }

  async getScheduleTemplates(tenantId: string): Promise<ScheduleTemplate[]> {
    try {
      const pool = schemaManager.getPool();
      const schemaName = schemaManager.getSchemaName(tenantId);

      const query = `
        SELECT * FROM "${schemaName}".schedule_templates 
        WHERE tenant_id = $1 
        ORDER BY name
      `;

      const result = await pool.query(query, [tenantId]);
      
      return result.rows.map(row => ({
        id: row.id,
        name: row.name,
        description: row.description,
        scheduleType: row.schedule_type,
        workDays: JSON.parse(row.work_days || '[]'),
        startTime: row.start_time,
        endTime: row.end_time,
        breakDurationMinutes: row.break_duration_minutes,
        tenantId: row.tenant_id
      }));
    } catch (error: any) {
      console.error('[DRIZZLE-QA] Error fetching schedule templates:', error);
      // Return empty array if table doesn't exist yet
      return [];
    }
  }
}
