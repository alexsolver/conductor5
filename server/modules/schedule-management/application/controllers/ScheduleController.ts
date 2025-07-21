
import { Request, Response } from 'express';
import { IScheduleRepository } from '../../domain/repositories/IScheduleRepository';
import { DrizzleScheduleRepository } from '../../infrastructure/repositories/DrizzleScheduleRepository';

export class ScheduleController {
  private scheduleRepository: IScheduleRepository;

  constructor() {
    this.scheduleRepository = new DrizzleScheduleRepository();
  }

  async createSchedule(req: Request, res: Response) {
    try {
      const { tenantId, user } = req as any;
      const scheduleData = req.body;

      // Verificar conflitos
      const conflicts = await this.scheduleRepository.findConflicts(
        tenantId,
        scheduleData.userId || user.id,
        new Date(scheduleData.startTime),
        new Date(scheduleData.endTime)
      );

      const schedule = await this.scheduleRepository.create({
        ...scheduleData,
        tenantId,
        userId: scheduleData.userId || user.id
      });

      // Se há conflitos, criar registros de conflito
      for (const conflict of conflicts) {
        await this.scheduleRepository.createConflict({
          tenantId,
          scheduleId: schedule.id,
          conflictingScheduleId: conflict.id,
          conflictType: 'overlap',
          severity: 'medium'
        });
      }

      res.status(201).json({
        schedule,
        conflicts: conflicts.length > 0 ? conflicts : undefined
      });
    } catch (error) {
      console.error('Error creating schedule:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  }

  async getSchedules(req: Request, res: Response) {
    try {
      const { tenantId, user } = req as any;
      const { startDate, endDate, userId } = req.query;

      const targetUserId = userId || user.id;
      const start = startDate ? new Date(startDate as string) : undefined;
      const end = endDate ? new Date(endDate as string) : undefined;

      let schedules;
      if (start && end) {
        schedules = await this.scheduleRepository.findByDateRange(tenantId, start, end, targetUserId);
      } else {
        schedules = await this.scheduleRepository.findByUserId(targetUserId, tenantId);
      }

      res.json(schedules);
    } catch (error) {
      console.error('Error getting schedules:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  }

  async getScheduleById(req: Request, res: Response) {
    try {
      const { tenantId } = req as any;
      const { id } = req.params;

      const schedule = await this.scheduleRepository.findById(id, tenantId);
      
      if (!schedule) {
        return res.status(404).json({ message: 'Agenda não encontrada' });
      }

      const conflicts = await this.scheduleRepository.findConflictsByScheduleId(id, tenantId);

      res.json({
        schedule,
        conflicts
      });
    } catch (error) {
      console.error('Error getting schedule:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  }

  async updateSchedule(req: Request, res: Response) {
    try {
      const { tenantId } = req as any;
      const { id } = req.params;
      const updateData = req.body;

      const existingSchedule = await this.scheduleRepository.findById(id, tenantId);
      if (!existingSchedule) {
        return res.status(404).json({ message: 'Agenda não encontrada' });
      }

      // Se mudando horário, verificar novos conflitos
      if (updateData.startTime || updateData.endTime) {
        const startTime = new Date(updateData.startTime || existingSchedule.startTime);
        const endTime = new Date(updateData.endTime || existingSchedule.endTime);
        
        const conflicts = await this.scheduleRepository.findConflicts(
          tenantId,
          existingSchedule.userId,
          startTime,
          endTime,
          id
        );

        // Criar novos conflitos se necessário
        for (const conflict of conflicts) {
          await this.scheduleRepository.createConflict({
            tenantId,
            scheduleId: id,
            conflictingScheduleId: conflict.id,
            conflictType: 'overlap',
            severity: 'medium'
          });
        }
      }

      const schedule = await this.scheduleRepository.update(id, tenantId, updateData);

      res.json(schedule);
    } catch (error) {
      console.error('Error updating schedule:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  }

  async deleteSchedule(req: Request, res: Response) {
    try {
      const { tenantId } = req as any;
      const { id } = req.params;

      const schedule = await this.scheduleRepository.findById(id, tenantId);
      if (!schedule) {
        return res.status(404).json({ message: 'Agenda não encontrada' });
      }

      await this.scheduleRepository.delete(id, tenantId);

      res.json({ message: 'Agenda excluída com sucesso' });
    } catch (error) {
      console.error('Error deleting schedule:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  }

  async getAvailability(req: Request, res: Response) {
    try {
      const { tenantId, user } = req as any;
      const { userId } = req.query;

      const targetUserId = userId || user.id;
      const availability = await this.scheduleRepository.findAvailabilityByUserId(targetUserId, tenantId);

      res.json(availability);
    } catch (error) {
      console.error('Error getting availability:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  }

  async setAvailability(req: Request, res: Response) {
    try {
      const { tenantId, user } = req as any;
      const availabilityData = req.body;

      const availability = await this.scheduleRepository.createAvailability({
        ...availabilityData,
        tenantId,
        userId: availabilityData.userId || user.id
      });

      res.status(201).json(availability);
    } catch (error) {
      console.error('Error setting availability:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  }

  async resolveConflict(req: Request, res: Response) {
    try {
      const { tenantId } = req as any;
      const { conflictId } = req.params;
      const { resolutionNotes } = req.body;

      const conflict = await this.scheduleRepository.resolveConflict(conflictId, tenantId, resolutionNotes);

      res.json(conflict);
    } catch (error) {
      console.error('Error resolving conflict:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  }

  async findAvailableSlots(req: Request, res: Response) {
    try {
      const { tenantId } = req as any;
      const { userId, date, duration } = req.query;

      const targetDate = new Date(date as string);
      const slotDuration = parseInt(duration as string) || 60; // minutos

      // Buscar disponibilidade do usuário para o dia da semana
      const dayOfWeek = targetDate.getDay();
      const availability = await this.scheduleRepository.findAvailabilityByUserId(userId as string, tenantId);
      const dayAvailability = availability.find(a => a.dayOfWeek === dayOfWeek);

      if (!dayAvailability || !dayAvailability.isAvailable) {
        return res.json({ availableSlots: [] });
      }

      // Buscar agendamentos existentes para o dia
      const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
      const endOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate() + 1);
      
      const existingSchedules = await this.scheduleRepository.findByDateRange(tenantId, startOfDay, endOfDay, userId as string);

      // Calcular slots disponíveis
      const availableSlots = this.calculateAvailableSlots(
        dayAvailability.startTime,
        dayAvailability.endTime,
        existingSchedules,
        slotDuration,
        targetDate
      );

      res.json({ availableSlots });
    } catch (error) {
      console.error('Error finding available slots:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  }

  private calculateAvailableSlots(
    startTime: string,
    endTime: string,
    existingSchedules: any[],
    duration: number,
    date: Date
  ): { startTime: Date; endTime: Date }[] {
    const slots: { startTime: Date; endTime: Date }[] = [];
    
    // Converter horários de disponibilidade para Date objects
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);
    
    const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate(), startHour, startMinute);
    const dayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate(), endHour, endMinute);
    
    // Ordenar agendamentos existentes por horário de início
    const sortedSchedules = existingSchedules.sort((a, b) => 
      new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );
    
    let currentTime = dayStart;
    
    for (const schedule of sortedSchedules) {
      const scheduleStart = new Date(schedule.startTime);
      const scheduleEnd = new Date(schedule.endTime);
      
      // Se há tempo livre antes do próximo agendamento
      if (currentTime < scheduleStart) {
        const availableTime = scheduleStart.getTime() - currentTime.getTime();
        const availableMinutes = availableTime / (1000 * 60);
        
        if (availableMinutes >= duration) {
          slots.push({
            startTime: new Date(currentTime),
            endTime: new Date(currentTime.getTime() + duration * 60 * 1000)
          });
        }
      }
      
      currentTime = new Date(Math.max(currentTime.getTime(), scheduleEnd.getTime()));
    }
    
    // Verificar se há tempo livre após o último agendamento
    if (currentTime < dayEnd) {
      const availableTime = dayEnd.getTime() - currentTime.getTime();
      const availableMinutes = availableTime / (1000 * 60);
      
      if (availableMinutes >= duration) {
        slots.push({
          startTime: new Date(currentTime),
          endTime: new Date(currentTime.getTime() + duration * 60 * 1000)
        });
      }
    }
    
    return slots;
  }
}
