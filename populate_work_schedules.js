/**
 * Script para Popular Work Schedules (Escalas de Trabalho)
 * Implementa os tipos de escala necessários para o sistema CLT
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { workSchedules, users } from './shared/schema.js';
import { eq } from 'drizzle-orm';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ DATABASE_URL não configurada');
  process.exit(1);
}

const sql = postgres(connectionString);
const db = drizzle(sql);

const workScheduleTemplates = [
  {
    scheduleName: 'Comercial 8h - Segunda a Sexta',
    workDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    startTime: '08:00',
    endTime: '17:00',
    breakStart: '12:00',
    breakEnd: '13:00',
    description: 'Jornada comercial padrão de 8 horas com 1h de almoço'
  },
  {
    scheduleName: 'Técnico 6x1 - Escala Rotativa',
    workDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
    startTime: '07:00',
    endTime: '16:00',
    breakStart: '11:30',
    breakEnd: '12:30',
    description: 'Escala técnica 6x1 com rodízio de domingo'
  },
  {
    scheduleName: 'Administrativo Meio-Período',
    workDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    startTime: '13:00',
    endTime: '17:00',
    breakStart: null,
    breakEnd: null,
    description: 'Jornada de meio período - 4h sem intervalo obrigatório'
  },
  {
    scheduleName: 'Suporte 24x7 - Turno Manhã',
    workDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
    startTime: '06:00',
    endTime: '14:00',
    breakStart: '10:00',
    breakEnd: '10:15',
    description: 'Turno manhã do suporte 24x7 com pausa de 15min'
  },
  {
    scheduleName: 'Suporte 24x7 - Turno Tarde',
    workDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
    startTime: '14:00',
    endTime: '22:00',
    breakStart: '18:00',
    breakEnd: '19:00',
    description: 'Turno tarde do suporte 24x7 com 1h de jantar'
  },
  {
    scheduleName: 'Suporte 24x7 - Turno Noite',
    workDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
    startTime: '22:00',
    endTime: '06:00',
    breakStart: '02:00',
    breakEnd: '02:30',
    description: 'Turno noite do suporte 24x7 com pausa de 30min'
  },
  {
    scheduleName: 'Vendas - Horário Estendido',
    workDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
    startTime: '09:00',
    endTime: '19:00',
    breakStart: '13:00',
    breakEnd: '14:00',
    description: 'Equipe de vendas com horário estendido até 19h'
  },
  {
    scheduleName: 'Flexível Home Office',
    workDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    startTime: '09:00',
    endTime: '18:00',
    breakStart: '12:30',
    breakEnd: '13:30',
    description: 'Jornada flexível para trabalho remoto'
  }
];

async function populateWorkSchedules() {
  try {
    console.log('🔄 Iniciando população de escalas de trabalho...');

    // Buscar tenants e usuários existentes
    const existingUsers = await db.select({
      id: users.id,
      tenantId: users.tenantId,
      firstName: users.firstName,
      lastName: users.lastName,
      role: users.role
    }).from(users).limit(20);

    if (existingUsers.length === 0) {
      console.log('⚠️ Nenhum usuário encontrado. Criando escalas genéricas...');
      return;
    }

    console.log(`📋 Encontrados ${existingUsers.length} usuários`);

    let totalCreated = 0;

    // Para cada usuário, criar uma escala baseada no role
    for (const user of existingUsers) {
      try {
        // Definir escala baseada no role do usuário
        let scheduleTemplate;
        
        switch (user.role) {
          case 'saas_admin':
          case 'tenant_admin':
            scheduleTemplate = workScheduleTemplates[0]; // Comercial 8h
            break;
          case 'agent':
            // Alternar entre escalas técnicas
            const agentSchedules = [
              workScheduleTemplates[1], // Técnico 6x1
              workScheduleTemplates[3], // Suporte Manhã
              workScheduleTemplates[4], // Suporte Tarde
              workScheduleTemplates[7]  // Flexível
            ];
            scheduleTemplate = agentSchedules[totalCreated % agentSchedules.length];
            break;
          case 'customer':
            scheduleTemplate = workScheduleTemplates[2]; // Meio período
            break;
          default:
            scheduleTemplate = workScheduleTemplates[0]; // Padrão comercial
        }

        // Verificar se já existe escala para este usuário
        const existingSchedule = await db.select()
          .from(workSchedules)
          .where(
            eq(workSchedules.userId, user.id)
          );

        if (existingSchedule.length > 0) {
          console.log(`⚠️ Usuário ${user.firstName} ${user.lastName} já possui escala`);
          continue;
        }

        // Criar escala para o usuário
        const newSchedule = await db.insert(workSchedules).values({
          tenantId: user.tenantId,
          userId: user.id,
          scheduleName: scheduleTemplate.scheduleName,
          workDays: scheduleTemplate.workDays,
          startTime: scheduleTemplate.startTime,
          endTime: scheduleTemplate.endTime,
          breakStart: scheduleTemplate.breakStart,
          breakEnd: scheduleTemplate.breakEnd,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }).returning();

        console.log(`✅ Criada escala "${scheduleTemplate.scheduleName}" para ${user.firstName} ${user.lastName} (${user.role})`);
        totalCreated++;

      } catch (userError) {
        console.error(`❌ Erro ao criar escala para usuário ${user.id}:`, userError.message);
        continue;
      }
    }

    console.log(`\n🎉 Processo concluído!`);
    console.log(`📊 Total de escalas criadas: ${totalCreated}`);
    console.log(`👥 Usuários processados: ${existingUsers.length}`);

  } catch (error) {
    console.error('❌ Erro durante população das escalas:', error);
    throw error;
  } finally {
    await sql.end();
  }
}

// Executar script
populateWorkSchedules()
  .then(() => {
    console.log('✅ Script de população concluído com sucesso');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Falha na execução do script:', error);
    process.exit(1);
  });

export { populateWorkSchedules };