
-- Fix foreign key constraints in chatbot schema
-- Remove incorrect foreign keys and create correct ones

-- Drop incorrect foreign keys
ALTER TABLE chatbot_flows DROP CONSTRAINT IF EXISTS chatbot_flows_bot_id_fkey;
ALTER TABLE chatbot_executions DROP CONSTRAINT IF EXISTS chatbot_executions_bot_id_fkey;
ALTER TABLE chatbot_schedules DROP CONSTRAINT IF EXISTS chatbot_schedules_bot_id_fkey;
ALTER TABLE chatbot_bot_channels DROP CONSTRAINT IF EXISTS chatbot_bot_channels_bot_id_fkey;

-- Add correct foreign keys pointing to chatbot_bots table
ALTER TABLE chatbot_flows 
ADD CONSTRAINT chatbot_flows_bot_id_fkey 
FOREIGN KEY (bot_id) REFERENCES chatbot_bots(id) ON DELETE CASCADE;

ALTER TABLE chatbot_executions 
ADD CONSTRAINT chatbot_executions_bot_id_fkey 
FOREIGN KEY (bot_id) REFERENCES chatbot_bots(id) ON DELETE CASCADE;

ALTER TABLE chatbot_schedules 
ADD CONSTRAINT chatbot_schedules_bot_id_fkey 
FOREIGN KEY (bot_id) REFERENCES chatbot_bots(id) ON DELETE CASCADE;

ALTER TABLE chatbot_bot_channels 
ADD CONSTRAINT chatbot_bot_channels_bot_id_fkey 
FOREIGN KEY (bot_id) REFERENCES chatbot_bots(id) ON DELETE CASCADE;
