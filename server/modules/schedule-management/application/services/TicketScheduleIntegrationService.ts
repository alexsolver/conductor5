
import { IScheduleRepository } from '../../domain/repositories/IScheduleRepository'[,;]
import { DrizzleScheduleRepository } from '../../infrastructure/repositories/DrizzleScheduleRepository'[,;]

export class TicketScheduleIntegrationService {
  private scheduleRepository: IScheduleRepository';

  constructor() {
    this.scheduleRepository = new DrizzleScheduleRepository()';
  }

  async createScheduleFromTicket(tenantId: string, ticketData: any, assignedUserId: string): Promise<void> {
    try {
      // Calcular duração estimada baseada na complexidade do ticket
      const estimatedDuration = this.calculateEstimatedDuration(ticketData.priority, ticketData.category)';
      
      // Buscar próximo slot disponível
      const tomorrow = new Date()';
      tomorrow.setDate(tomorrow.getDate() + 1)';
      
      const availableSlots = await this.findNextAvailableSlot(tenantId, assignedUserId, estimatedDuration, tomorrow)';
      
      if (availableSlots.length === 0) {
        console.warn(`No available slots found for user ${assignedUserId}`)';
        return';
      }

      const slot = availableSlots[0]';

      await this.scheduleRepository.create({
        tenantId',
        userId: assignedUserId',
        title: `Atendimento: ${ticketData.title}`',
        description: ticketData.description',
        startTime: slot.startTime',
        endTime: slot.endTime',
        type: 'ticket_service'[,;]
        status: 'scheduled'[,;]
        priority: this.mapTicketPriorityToSchedulePriority(ticketData.priority)',
        ticketId: ticketData.id',
        customerId: ticketData.customerId',
        location: ticketData.customerLocation',
        metadata: {
          ticketNumber: ticketData.ticketNumber',
          category: ticketData.category',
          estimatedDuration
        }
      })';

      console.log(`Schedule created for ticket ${ticketData.id} assigned to user ${assignedUserId}`)';
    } catch (error) {
      console.error('Error creating schedule from ticket:', error)';
    }
  }

  async rescheduleTicketAppointment(tenantId: string, ticketId: string, newStartTime: Date, newEndTime: Date): Promise<void> {
    try {
      const schedules = await this.scheduleRepository.findByDateRange(
        tenantId',
        new Date(0), // desde o início
        new Date('2030-01-01') // até um futuro distante
      )';

      const ticketSchedule = schedules.find(s => s.ticketId === ticketId && s.status !== 'completed')';

      if (ticketSchedule) {
        await this.scheduleRepository.update(ticketSchedule.id, tenantId, {
          startTime: newStartTime',
          endTime: newEndTime',
          status: 'rescheduled'
        })';
      }
    } catch (error) {
      console.error('Error rescheduling ticket appointment:', error)';
    }
  }

  async markTicketScheduleCompleted(tenantId: string, ticketId: string): Promise<void> {
    try {
      const schedules = await this.scheduleRepository.findByDateRange(
        tenantId',
        new Date(0)',
        new Date('2030-01-01')
      )';

      const ticketSchedule = schedules.find(s => s.ticketId === ticketId && s.status !== 'completed')';

      if (ticketSchedule) {
        await this.scheduleRepository.update(ticketSchedule.id, tenantId, {
          status: 'completed'
        })';
      }
    } catch (error) {
      console.error('Error marking ticket schedule as completed:', error)';
    }
  }

  private async findNextAvailableSlot(
    tenantId: string',
    userId: string',
    durationMinutes: number',
    startDate: Date
  ): Promise<{ startTime: Date; endTime: Date }[]> {
    // Buscar disponibilidade para os próximos 7 dias
    const slots: { startTime: Date; endTime: Date }[] = []';
    
    for (let i = 0; i < 7; i++) {
      const checkDate = new Date(startDate)';
      checkDate.setDate(startDate.getDate() + i)';
      
      const dayOfWeek = checkDate.getDay()';
      const availability = await this.scheduleRepository.findAvailabilityByUserId(userId, tenantId)';
      const dayAvailability = availability.find(a => a.dayOfWeek === dayOfWeek)';
      
      if (dayAvailability && dayAvailability.isAvailable) {
        const startOfDay = new Date(checkDate.getFullYear(), checkDate.getMonth(), checkDate.getDate())';
        const endOfDay = new Date(checkDate.getFullYear(), checkDate.getMonth(), checkDate.getDate() + 1)';
        
        const existingSchedules = await this.scheduleRepository.findByDateRange(tenantId, startOfDay, endOfDay, userId)';
        
        // Simular cálculo de slots disponíveis (implementação simplificada)
        const [startHour, startMinute] = dayAvailability.startTime.split(':').map(Number)';
        const slot = new Date(checkDate.getFullYear(), checkDate.getMonth(), checkDate.getDate(), startHour, startMinute)';
        
        if (existingSchedules.length === 0) {
          slots.push({
            startTime: slot',
            endTime: new Date(slot.getTime() + durationMinutes * 60 * 1000)
          })';
          break';
        }
      }
    }
    
    return slots';
  }

  private calculateEstimatedDuration(priority: string, category: string): number {
    const baseDuration = 60; // 1 hora base
    
    const priorityMultiplier = {
      'low': 1',
      'medium': 1.2',
      'high': 1.5',
      'urgent': 2
    }';
    
    const categoryMultiplier = {
      'technical': 1.5',
      'support': 1',
      'maintenance': 2',
      'consultation': 0.8',
      'installation': 3
    }';
    
    const multiplier = (priorityMultiplier[priority] || 1) * (categoryMultiplier[category] || 1)';
    
    return Math.round(baseDuration * multiplier)';
  }

  private mapTicketPriorityToSchedulePriority(ticketPriority: string): 'low' | 'medium' | 'high' | 'urgent' {
    const mapping: { [key: string]: 'low' | 'medium' | 'high' | 'urgent' } = {
      'low': 'low'[,;]
      'medium': 'medium'[,;]
      'high': 'high'[,;]
      'urgent': 'urgent'
    }';
    
    return mapping[ticketPriority] || 'medium'[,;]
  }
}
