import { db } from './server/db.ts';
import { sql } from 'drizzle-orm';

// Migration script to create missing timecard tables
async function migrateTimecardTables() {
  const tenantId = '3f99462f-3621-4b1b-bea8-782acc50d62e';
  
  console.log('🔧 Starting timecard tables migration...');
  
  try {
    // Create timecard_entries table if not exists
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS timecard_entries (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id VARCHAR(36) NOT NULL,
        user_id UUID NOT NULL,
        check_in TIMESTAMP NOT NULL,
        check_out TIMESTAMP,
        break_start TIMESTAMP,
        break_end TIMESTAMP,
        total_hours DECIMAL(4,2),
        notes TEXT,
        location TEXT,
        is_manual_entry BOOLEAN DEFAULT false,
        approved_by UUID,
        status VARCHAR(20) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ Created timecard_entries table');
    
    // Create work_schedules table if not exists  
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS work_schedules (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL,
        user_id UUID NOT NULL,
        schedule_name VARCHAR(255),
        work_days JSONB,
        start_time TIME,
        end_time TIME,
        break_start TIME,
        break_end TIME,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ Created work_schedules table');
    
    // Create absence_requests table if not exists
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS absence_requests (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL,
        user_id UUID NOT NULL,
        absence_type VARCHAR(50) NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        reason TEXT,
        status VARCHAR(20) DEFAULT 'pending',
        medical_certificate TEXT,
        cover_user_id UUID,
        approved_by UUID,
        approved_at TIMESTAMP,
        rejection_reason TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ Created absence_requests table');
    
    // Create schedule_templates table if not exists
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS schedule_templates (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        schedule_type VARCHAR(50) NOT NULL,
        work_days JSONB,
        start_time TIME,
        end_time TIME,
        break_start TIME,
        break_end TIME,
        flexibility_window INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ Created schedule_templates table');
    
    console.log('🎉 Timecard tables migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Run migration
migrateTimecardTables()
  .then(() => {
    console.log('✅ Migration script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Migration script failed:', error);
    process.exit(1);
  });