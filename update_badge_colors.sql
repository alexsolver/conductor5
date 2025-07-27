-- Script para atualizar cores dos badges para melhor contraste
-- Execute este script para corrigir as cores em todo o sistema

-- Atualizar cores de prioridade com melhor contraste
UPDATE tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.ticket_field_options 
SET 
  bg_color = 'bg-emerald-600',
  text_color = 'text-white'
WHERE field_name = 'priority' AND value = 'low';

UPDATE tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.ticket_field_options 
SET 
  bg_color = 'bg-amber-600',
  text_color = 'text-white'
WHERE field_name = 'priority' AND value = 'medium';

UPDATE tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.ticket_field_options 
SET 
  bg_color = 'bg-orange-600',
  text_color = 'text-white'
WHERE field_name = 'priority' AND value = 'high';

UPDATE tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.ticket_field_options 
SET 
  bg_color = 'bg-red-600',
  text_color = 'text-white'
WHERE field_name = 'priority' AND value = 'critical';

-- Atualizar cores de urgência
UPDATE tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.ticket_field_options 
SET 
  bg_color = 'bg-emerald-600',
  text_color = 'text-white'
WHERE field_name = 'urgency' AND value = 'low';

UPDATE tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.ticket_field_options 
SET 
  bg_color = 'bg-amber-600',
  text_color = 'text-white'
WHERE field_name = 'urgency' AND value = 'medium';

UPDATE tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.ticket_field_options 
SET 
  bg_color = 'bg-orange-600',
  text_color = 'text-white'
WHERE field_name = 'urgency' AND value = 'high';

UPDATE tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.ticket_field_options 
SET 
  bg_color = 'bg-red-600',
  text_color = 'text-white'
WHERE field_name = 'urgency' AND value = 'critical';

-- Atualizar cores de impacto
UPDATE tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.ticket_field_options 
SET 
  bg_color = 'bg-emerald-600',
  text_color = 'text-white'
WHERE field_name = 'impact' AND value = 'low';

UPDATE tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.ticket_field_options 
SET 
  bg_color = 'bg-amber-600',
  text_color = 'text-white'
WHERE field_name = 'impact' AND value = 'medium';

UPDATE tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.ticket_field_options 
SET 
  bg_color = 'bg-orange-600',
  text_color = 'text-white'
WHERE field_name = 'impact' AND value = 'high';

UPDATE tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.ticket_field_options 
SET 
  bg_color = 'bg-red-600',
  text_color = 'text-white'
WHERE field_name = 'impact' AND value = 'critical';

-- Atualizar cores de status com melhor contraste
UPDATE tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.ticket_field_options 
SET 
  bg_color = 'bg-blue-600',
  text_color = 'text-white'
WHERE field_name = 'status' AND value = 'open';

UPDATE tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.ticket_field_options 
SET 
  bg_color = 'bg-amber-600',
  text_color = 'text-white'
WHERE field_name = 'status' AND value = 'in_progress';

UPDATE tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.ticket_field_options 
SET 
  bg_color = 'bg-slate-600',
  text_color = 'text-white'
WHERE field_name = 'status' AND value = 'pending';

UPDATE tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.ticket_field_options 
SET 
  bg_color = 'bg-emerald-600',
  text_color = 'text-white'
WHERE field_name = 'status' AND value = 'resolved';

UPDATE tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.ticket_field_options 
SET 
  bg_color = 'bg-slate-500',
  text_color = 'text-white'
WHERE field_name = 'status' AND value = 'closed';