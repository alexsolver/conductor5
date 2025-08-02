-- Script para testar se as escalas de trabalho estão funcionando
-- Verificar dados existentes
SELECT id, schedule_type, user_id, start_date, work_days, start_time, end_time 
FROM tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.work_schedules 
LIMIT 5;

-- Inserir uma escala de teste se não existir
INSERT INTO tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.work_schedules 
(tenant_id, user_id, schedule_type, start_date, work_days, start_time, end_time, break_duration_minutes, is_active) 
VALUES 
('3f99462f-3621-4b1b-bea8-782acc50d62e', 
 '550e8400-e29b-41d4-a716-446655440001',
 'Template Personalizado', -- Usando o nome do template criado
 CURRENT_DATE,
 ARRAY[1,2,3,4,5],
 '08:00',
 '18:00',
 60,
 true)
ON CONFLICT DO NOTHING;