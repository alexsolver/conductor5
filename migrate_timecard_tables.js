const { Pool } = require('pg');

async function createTimecardTables() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: false
  });

  const tenantId = '3f99462f-3621-4b1b-bea8-782acc50d62e';
  const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;

  try {
    // Verificar se time_records existe e criar timecard_entries como view ou migrar dados
    const checkTimeRecords = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = $1 AND table_name = 'time_records'
      )
    `, [schemaName]);

    if (checkTimeRecords.rows[0].exists) {
      console.log('✅ time_records table exists, creating timecard_entries view...');
      
      await pool.query(`
        SET search_path TO ${schemaName};
        
        -- Create timecard_entries as a view of time_records for compatibility
        CREATE OR REPLACE VIEW timecard_entries AS 
        SELECT 
          id,
          tenant_id as "tenantId",
          user_id as "userId", 
          check_in as "checkIn",
          check_out as "checkOut",
          break_start as "breakStart", 
          break_end as "breakEnd",
          total_worked_minutes as "totalWorkedMinutes",
          break_duration_minutes as "breakDurationMinutes",
          overtime_minutes as "overtimeMinutes",
          status,
          notes,
          location,
          ip_address as "ipAddress",
          device,
          is_manual_entry as "isManualEntry",
          is_active as "isActive",
          timestamp,
          created_at as "createdAt",
          updated_at as "updatedAt"
        FROM time_records;
        
        -- Create work_schedules table if not exists
        CREATE TABLE IF NOT EXISTS work_schedules (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          tenant_id UUID NOT NULL,
          user_id UUID NOT NULL,
          schedule_type VARCHAR(50) DEFAULT '5x2',
          schedule_name VARCHAR(255) DEFAULT 'Escala de Trabalho',
          work_days JSONB DEFAULT '[1,2,3,4,5]',
          start_time TIME DEFAULT '08:00',
          end_time TIME DEFAULT '18:00', 
          break_start TIME DEFAULT '12:00',
          break_end TIME DEFAULT '13:00',
          break_duration_minutes INTEGER DEFAULT 60,
          is_active BOOLEAN DEFAULT true,
          use_weekly_schedule BOOLEAN DEFAULT false,
          weekly_schedule JSONB,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW(),
          UNIQUE(tenant_id, user_id)
        );
      `);
      
      console.log('✅ Timecard compatibility tables created successfully!');
    } else {
      console.log('❌ time_records table not found in tenant schema');
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await pool.end();
  }
}

createTimecardTables();
