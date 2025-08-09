-- Add new columns for weekly schedule support
ALTER TABLE work_schedules ADD COLUMN IF NOT EXISTS use_weekly_schedule BOOLEAN DEFAULT FALSE;
ALTER TABLE work_schedules ADD COLUMN IF NOT EXISTS weekly_schedule JSONB;

-- Make legacy time columns optional
ALTER TABLE work_schedules ALTER COLUMN start_time DROP NOT NULL;
ALTER TABLE work_schedules ALTER COLUMN end_time DROP NOT NULL;

-- Add comment explaining the new structure
COMMENT ON COLUMN work_schedules.weekly_schedule IS 'JSON object with day-specific schedules: {monday: {startTime, endTime, breakStart, breakEnd}, ...}';
COMMENT ON COLUMN work_schedules.use_weekly_schedule IS 'If true, use weekly_schedule instead of legacy time fields';
