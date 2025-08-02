
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
      console.log('[REPOSITORY-QA] Fetching work schedules for tenant:', tenantId);
      
      const pool = schemaManager.getPool();
      const schemaName = schemaManager.getSchemaName(tenantId);

      // First, check if work_schedules table exists, if not, return empty array
      const tableCheck = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = $1 AND table_name = 'work_schedules'
        )
      `, [schemaName]);

      if (!tableCheck.rows[0].exists) {
        console.log('[REPOSITORY-QA] work_schedules table does not exist, creating...');
        
        // Create the table
        await pool.query(`
          CREATE TABLE IF NOT EXISTS "${schemaName}".work_schedules (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id UUID NOT NULL,
            user_id UUID NOT NULL,
            schedule_type VARCHAR(20) DEFAULT '5x2',
            start_date DATE NOT NULL,
            end_date DATE,
            work_days JSONB DEFAULT '[1,2,3,4,5]',
            start_time TIME DEFAULT '08:00',
            end_time TIME DEFAULT '18:00',
            break_duration_minutes INTEGER DEFAULT 60,
            is_active BOOLEAN DEFAULT true,
            created_by UUID,
            updated_by UUID,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
          )
        `);
        
        console.log('[REPOSITORY-QA] work_schedules table created');
        return []; // Return empty array for new table
      }

      const query = `
        SELECT 
          ws.*,
          COALESCE(
            u.first_name || ' ' || u.last_name, 
            tm.first_name || ' ' || tm.last_name,
            'Usuário'
          ) as user_name
        FROM "${schemaName}".work_schedules ws
        LEFT JOIN "${schemaName}".users u ON ws.user_id = u.id
        LEFT JOIN "${schemaName}".team_members tm ON ws.user_id = tm.id
        WHERE ws.tenant_id = $1
        ORDER BY ws.created_at DESC
      `;

      const result = await pool.query(query, [tenantId]);
      
      console.log('[REPOSITORY-QA] Found schedules:', result.rows.length);
      
      return result.rows.map(row => ({
        id: row.id,
        userId: row.user_id,
        scheduleType: row.schedule_type || '5x2',
        startDate: row.start_date,
        endDate: row.end_date,
        workDays: Array.isArray(row.work_days) ? row.work_days : 
                  (typeof row.work_days === 'string' ? JSON.parse(row.work_days) : [1,2,3,4,5]),
        startTime: row.start_time || '08:00',
        endTime: row.end_time || '18:00',
        breakDurationMinutes: row.break_duration_minutes || 60,
        isActive: row.is_active !== false,
        tenantId: row.tenant_id,
        createdBy: row.created_by,
        updatedBy: row.updated_by,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        userName: row.user_name || 'Usuário'
      }));
    } catch (error: any) {
      console.error('[REPOSITORY-QA] Error fetching work schedules:', error);
      // Return empty array instead of throwing error
      return [];
    }
  }

  async createWorkSchedule(scheduleData: Partial<WorkSchedule>): Promise<WorkSchedule> {
    try {
      const pool = schemaManager.getPool();
      const schemaName = schemaManager.getSchemaName(scheduleData.tenantId!);

      // Ensure table exists
      await pool.query(`
        CREATE TABLE IF NOT EXISTS "${schemaName}".work_schedules (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          tenant_id UUID NOT NULL,
          user_id UUID NOT NULL,
          schedule_type VARCHAR(20) DEFAULT '5x2',
          start_date DATE NOT NULL,
          end_date DATE,
          work_days JSONB DEFAULT '[1,2,3,4,5]',
          start_time TIME DEFAULT '08:00',
          end_time TIME DEFAULT '18:00',
          break_duration_minutes INTEGER DEFAULT 60,
          is_active BOOLEAN DEFAULT true,
          created_by UUID,
          updated_by UUID,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);

      const query = `
        INSERT INTO "${schemaName}".work_schedules 
        (tenant_id, user_id, schedule_type, start_date, end_date, work_days, start_time, end_time, 
         break_duration_minutes, is_active, created_by, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
        RETURNING *
      `;

      const workDaysJson = JSON.stringify(scheduleData.workDays || [1,2,3,4,5]);

      const result = await pool.query(query, [
        scheduleData.tenantId,
        scheduleData.userId,
        scheduleData.scheduleType || '5x2',
        scheduleData.startDate,
        scheduleData.endDate,
        workDaysJson,
        scheduleData.startTime || '08:00',
        scheduleData.endTime || '18:00',
        scheduleData.breakDurationMinutes || 60,
        scheduleData.isActive !== false,
        scheduleData.createdBy
      ]);

      const row = result.rows[0];
      
      return {
        id: row.id,
        userId: row.user_id,
        scheduleType: row.schedule_type,
        startDate: row.start_date,
        endDate: row.end_date,
        workDays: JSON.parse(row.work_days || '[1,2,3,4,5]'),
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
      console.error('[REPOSITORY-QA] Error creating work schedule:', error);
      throw new Error(`Erro ao criar escala: ${error.message}`);
    }
  }

  async updateWorkSchedule(id: string, tenantId: string, updateData: Partial<WorkSchedule>): Promise<WorkSchedule | null> {
    try {
      const pool = schemaManager.getPool();
      const schemaName = schemaManager.getSchemaName(tenantId);

      const workDaysJson = updateData.workDays ? JSON.stringify(updateData.workDays) : null;

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
        workDaysJson,
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
        workDays: JSON.parse(row.work_days || '[1,2,3,4,5]'),
        startTime: row.start_time,
        endTime: row.end_time,
        breakDurationMinutes: row.break_duration_minutes,
        isActive: row.is_active,
        tenantId: row.tenant_id,
        updatedBy: row.updated_by,
        updatedAt: row.updated_at
      };
    } catch (error: any) {
      console.error('[REPOSITORY-QA] Error updating work schedule:', error);
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
      console.error('[REPOSITORY-QA] Error deleting work schedule:', error);
      throw new Error(`Erro ao excluir escala: ${error.message}`);
    }
  }

  async getScheduleTemplates(tenantId: string): Promise<ScheduleTemplate[]> {
    try {
      const pool = schemaManager.getPool();
      const schemaName = schemaManager.getSchemaName(tenantId);

      // Check if table exists
      const tableCheck = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = $1 AND table_name = 'schedule_templates'
        )
      `, [schemaName]);

      if (!tableCheck.rows[0].exists) {
        // Create basic schedule templates table
        await pool.query(`
          CREATE TABLE IF NOT EXISTS "${schemaName}".schedule_templates (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id UUID NOT NULL,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            schedule_type VARCHAR(20) DEFAULT '5x2',
            work_days JSONB DEFAULT '[1,2,3,4,5]',
            start_time TIME DEFAULT '08:00',
            end_time TIME DEFAULT '18:00',
            break_duration_minutes INTEGER DEFAULT 60,
            created_at TIMESTAMP DEFAULT NOW()
          )
        `);

        // Insert default templates
        await pool.query(`
          INSERT INTO "${schemaName}".schedule_templates 
          (tenant_id, name, description, schedule_type, work_days, start_time, end_time, break_duration_minutes)
          VALUES 
          ($1, 'Comercial (5x2)', 'Segunda a sexta, 8h às 18h', '5x2', '[1,2,3,4,5]', '08:00', '18:00', 60),
          ($1, 'Seis por Um (6x1)', 'Seis dias trabalhados, um de folga', '6x1', '[1,2,3,4,5,6]', '08:00', '18:00', 60),
          ($1, 'Plantão 12x36', 'Doze horas trabalhadas, trinta e seis de descanso', '12x36', '[1,3,5]', '07:00', '19:00', 120)
        `, [tenantId]);
      }

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
        workDays: JSON.parse(row.work_days || '[1,2,3,4,5]'),
        startTime: row.start_time,
        endTime: row.end_time,
        breakDurationMinutes: row.break_duration_minutes,
        tenantId: row.tenant_id
      }));
    } catch (error: any) {
      console.error('[REPOSITORY-QA] Error fetching schedule templates:', error);
      // Return default templates if error
      return [
        {
          id: 'default-1',
          name: 'Comercial (5x2)', 
          description: 'Segunda a sexta, 8h às 18h',
          scheduleType: '5x2',
          workDays: [1,2,3,4,5],
          startTime: '08:00',
          endTime: '18:00',
          breakDurationMinutes: 60,
          tenantId: tenantId
        }
      ];
    }
  }
}
