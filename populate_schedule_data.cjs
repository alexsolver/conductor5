const { Pool, neonConfig } = require('@neondatabase/serverless');
const { randomUUID } = require('crypto');
const ws = require('ws');

neonConfig.webSocketConstructor = ws;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const TENANT_ID = '3f99462f-3621-4b1b-bea8-782acc50d62e';

// 10 agents with realistic names and UUID IDs
const agents = [
  { id: '550e8400-e29b-41d4-a716-446655440001', name: 'João Silva', email: 'joao.silva@conductor.com' },
  { id: '550e8400-e29b-41d4-a716-446655440002', name: 'Maria Santos', email: 'maria.santos@conductor.com' },
  { id: '550e8400-e29b-41d4-a716-446655440003', name: 'Pedro Oliveira', email: 'pedro.oliveira@conductor.com' },
  { id: '550e8400-e29b-41d4-a716-446655440004', name: 'Ana Costa', email: 'ana.costa@conductor.com' },
  { id: '550e8400-e29b-41d4-a716-446655440005', name: 'Carlos Ferreira', email: 'carlos.ferreira@conductor.com' },
  { id: '550e8400-e29b-41d4-a716-446655440006', name: 'Lucia Martins', email: 'lucia.martins@conductor.com' },
  { id: '550e8400-e29b-41d4-a716-446655440007', name: 'Roberto Lima', email: 'roberto.lima@conductor.com' },
  { id: '550e8400-e29b-41d4-a716-446655440008', name: 'Fernanda Rocha', email: 'fernanda.rocha@conductor.com' },
  { id: '550e8400-e29b-41d4-a716-446655440009', name: 'Antonio Souza', email: 'antonio.souza@conductor.com' },
  { id: '550e8400-e29b-41d4-a716-446655440010', name: 'Patricia Almeida', email: 'patricia.almeida@conductor.com' },
];

// Working hours for each agent (8:00-18:00 with variations)
const workingHours = [
  { agentId: '550e8400-e29b-41d4-a716-446655440001', start: '08:00', end: '18:00' },
  { agentId: '550e8400-e29b-41d4-a716-446655440002', start: '07:00', end: '17:00' },
  { agentId: '550e8400-e29b-41d4-a716-446655440003', start: '09:00', end: '19:00' },
  { agentId: '550e8400-e29b-41d4-a716-446655440004', start: '08:30', end: '18:30' },
  { agentId: '550e8400-e29b-41d4-a716-446655440005', start: '08:00', end: '18:00' },
  { agentId: '550e8400-e29b-41d4-a716-446655440006', start: '07:30', end: '17:30' },
  { agentId: '550e8400-e29b-41d4-a716-446655440007', start: '09:00', end: '19:00' },
  { agentId: '550e8400-e29b-41d4-a716-446655440008', start: '08:00', end: '18:00' },
  { agentId: '550e8400-e29b-41d4-a716-446655440009', start: '08:30', end: '18:30' },
  { agentId: '550e8400-e29b-41d4-a716-446655440010', start: '07:00', end: '17:00' },
];

// Activity types (using real UUIDs from database)
const activityTypes = [
  '25bc62b9-36d5-4910-92ac-0a15bb1858c7', // Visita Técnica
  '6a44a2d8-552b-4af4-88ed-1d0a53541d4c', // Instalação de Equipamento
  'b772ffd1-cb75-4019-bcab-2f831bd05a2d', // Manutenção Preventiva
  'ebd8357a-5bfd-4c28-aa5b-fab26702f407'  // Suporte Emergencial
];

// Task templates for realistic schedules
const taskTemplates = [
  { title: 'Instalação de equipamento', duration: 120, priority: 'high' },
  { title: 'Manutenção preventiva', duration: 90, priority: 'medium' },
  { title: 'Suporte técnico', duration: 60, priority: 'high' },
  { title: 'Visita comercial', duration: 45, priority: 'low' },
  { title: 'Reparo de emergência', duration: 180, priority: 'urgent' },
  { title: 'Treinamento cliente', duration: 120, priority: 'medium' },
  { title: 'Diagnóstico sistema', duration: 90, priority: 'high' },
  { title: 'Entrega de equipamento', duration: 30, priority: 'low' },
  { title: 'Configuração de rede', duration: 150, priority: 'medium' },
  { title: 'Reunião técnica', duration: 60, priority: 'low' },
];

const customers = ['c1ab5232-3e1c-4277-b4e7-8d9f1a2b3c4e', 'd2bc6343-4f2d-5388-c5e8-9e0f2b3c4d5f'];

function generateTimeSlot(workStart, workEnd) {
  const startHour = parseInt(workStart.split(':')[0]);
  const endHour = parseInt(workEnd.split(':')[0]);
  const hour = startHour + Math.floor(Math.random() * (endHour - startHour - 2));
  const minute = Math.random() < 0.5 ? 0 : 30;
  return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
}

function createSchedule(agentId, date, type, taskTemplate, timeSlot) {
  const startDateTime = new Date(`${date}T${timeSlot}:00.000Z`);
  const endDateTime = new Date(startDateTime.getTime() + taskTemplate.duration * 60000);
  
  return {
    id: randomUUID(),
    tenant_id: TENANT_ID,
    agent_id: agentId,
    customer_id: customers[Math.floor(Math.random() * customers.length)],
    activity_type_id: activityTypes[Math.floor(Math.random() * activityTypes.length)],
    title: taskTemplate.title,
    description: `${taskTemplate.title} - ${type === 'planned' ? 'Previsto' : 'Realizado'}`,
    start_datetime: startDateTime.toISOString(),
    end_datetime: endDateTime.toISOString(),
    duration: taskTemplate.duration,
    status: type === 'planned' ? 'scheduled' : 'completed',
    priority: taskTemplate.priority,
    location_address: `Rua Exemplo, ${Math.floor(Math.random() * 1000)}, São Paulo, SP`,
    coordinates: null,
    internal_notes: `Observações internas para ${taskTemplate.title}`,
    client_notes: type === 'planned' ? null : `Cliente informado sobre ${taskTemplate.title}`,
    estimated_travel_time: Math.floor(Math.random() * 45 + 15), // 15-60 minutes
    actual_start_time: type === 'actual' ? startDateTime.toISOString() : null,
    actual_end_time: type === 'actual' ? endDateTime.toISOString() : null,
    is_recurring: false,
    recurring_pattern: null,
    parent_schedule_id: null,
    type: type,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
}

async function populateScheduleData() {
  try {
    console.log('🚀 Starting schedule data population...');
    
    // Get today's date and next 2 days
    const today = new Date();
    const dates = [
      today.toISOString().split('T')[0],
      new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    ];

    console.log(`📅 Creating schedules for dates: ${dates.join(', ')}`);

    const schedules = [];

    // Create schedules for each agent and each day
    agents.forEach(agent => {
      const agentWorkHours = workingHours.find(wh => wh.agentId === agent.id);
      
      dates.forEach(date => {
        // Create 2-4 planned tasks per agent per day
        const plannedTasksCount = 2 + Math.floor(Math.random() * 3);
        for (let i = 0; i < plannedTasksCount; i++) {
          const taskTemplate = taskTemplates[Math.floor(Math.random() * taskTemplates.length)];
          const timeSlot = generateTimeSlot(agentWorkHours.start, agentWorkHours.end);
          schedules.push(createSchedule(agent.id, date, 'planned', taskTemplate, timeSlot));
        }

        // Create 1-3 actual tasks per agent per day
        const actualTasksCount = 1 + Math.floor(Math.random() * 3);
        for (let i = 0; i < actualTasksCount; i++) {
          const taskTemplate = taskTemplates[Math.floor(Math.random() * taskTemplates.length)];
          const timeSlot = generateTimeSlot(agentWorkHours.start, agentWorkHours.end);
          schedules.push(createSchedule(agent.id, date, 'actual', taskTemplate, timeSlot));
        }
      });
    });

    console.log(`📊 Generated ${schedules.length} schedule entries`);

    // Insert schedules in batches
    const batchSize = 50;
    for (let i = 0; i < schedules.length; i += batchSize) {
      const batch = schedules.slice(i, i + batchSize);
      
      const values = batch.map((schedule, index) => {
        const baseIndex = index * 22;
        return `($${baseIndex + 1}, $${baseIndex + 2}, $${baseIndex + 3}, $${baseIndex + 4}, $${baseIndex + 5}, $${baseIndex + 6}, $${baseIndex + 7}, $${baseIndex + 8}, $${baseIndex + 9}, $${baseIndex + 10}, $${baseIndex + 11}, $${baseIndex + 12}, $${baseIndex + 13}, $${baseIndex + 14}, $${baseIndex + 15}, $${baseIndex + 16}, $${baseIndex + 17}, $${baseIndex + 18}, $${baseIndex + 19}, $${baseIndex + 20}, $${baseIndex + 21}, $${baseIndex + 22})`;
      }).join(', ');

      const params = batch.flatMap(schedule => [
        schedule.id,
        schedule.tenant_id,
        schedule.agent_id,
        schedule.customer_id,
        schedule.activity_type_id,
        schedule.title,
        schedule.description,
        schedule.start_datetime,
        schedule.end_datetime,
        schedule.duration,
        schedule.status,
        schedule.priority,
        schedule.location_address,
        schedule.coordinates,
        schedule.internal_notes,
        schedule.client_notes,
        schedule.estimated_travel_time,
        schedule.actual_start_time,
        schedule.actual_end_time,
        schedule.is_recurring,
        schedule.recurring_pattern,
        schedule.type
      ]);

      const query = `
        INSERT INTO "tenant_${TENANT_ID.replace(/-/g, '_')}".schedules 
        (id, tenant_id, agent_id, customer_id, activity_type_id, title, description, start_datetime, 
         end_datetime, duration, status, priority, location_address, coordinates, internal_notes, 
         client_notes, estimated_travel_time, actual_start_time, actual_end_time, is_recurring, 
         recurring_pattern, type)
        VALUES ${values}
        ON CONFLICT (id) DO NOTHING
      `;

      await pool.query(query, params);
      console.log(`✅ Inserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(schedules.length / batchSize)}`);
    }

    console.log('🎉 Schedule data population completed successfully!');
    console.log(`📈 Total schedules created: ${schedules.length}`);
    console.log(`👥 Agents: ${agents.length}`);
    console.log(`📅 Days: ${dates.length}`);
    
  } catch (error) {
    console.error('❌ Error populating schedule data:', error);
    throw error;
  }
}

// Execute if called directly
if (require.main === module) {
  populateScheduleData()
    .then(() => {
      console.log('✅ Population completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Population failed:', error);
      process.exit(1);
    });
}

module.exports = { populateScheduleData };