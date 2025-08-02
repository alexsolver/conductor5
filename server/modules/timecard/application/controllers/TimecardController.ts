import { eq, and, gte, lte, desc, asc, sql, inArray } from 'drizzle-orm';
import { DrizzleTimecardRepository } from '../../infrastructure/repositories/DrizzleTimecardRepository';
import { Request, Response } from 'express';
import { z } from 'zod';
import { 
  createTimecardEntrySchema,
  createAbsenceRequestSchema,
  createScheduleTemplateSchema,
  createFlexibleWorkArrangementSchema
} from '../../../../../shared/timecard-validation';
import { AuthenticatedRequest } from '../../middleware/isAuthenticated';

// Validation schemas
const createWorkScheduleSchema = z.object({
  userId: z.string().uuid(),
  scheduleType: z.enum(['5x2', '6x1', '12x36', 'shift', 'flexible', 'intermittent']),
  startDate: z.string().min(1, 'Data de início é obrigatória'),
  endDate: z.string().optional().nullable(),
  workDays: z.array(z.number().min(0).max(6)).min(1, 'Pelo menos um dia da semana deve ser selecionado'),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido'),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido'),
  breakDurationMinutes: z.number().min(0).max(480).default(60),
  isActive: z.boolean().default(true),
});

const createScheduleTemplateSchema = z.object({
  name: z.string().min(3),
  description: z.string().optional(),
  category: z.enum(['fixed', 'rotating', 'flexible', 'shift']),
  scheduleType: z.string(),
  rotationCycleDays: z.number().optional(),
  configuration: z.object({
    workDays: z.array(z.number()),
    startTime: z.string(),
    endTime: z.string(),
    breakDuration: z.number(),
    flexTimeWindow: z.number().optional(),
  }),
  requiresApproval: z.boolean().default(true),
});

export class TimecardController {
  private timecardRepository: DrizzleTimecardRepository;

  constructor() {
    this.timecardRepository = new DrizzleTimecardRepository();
  }

  // Get current status for user
  getCurrentStatus = async (req: Request, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      const userId = req.user?.id;

      if (!tenantId || !userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Get today's records
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayRecords = await this.timecardRepository.getTimecardEntriesByUserAndDate(userId, today.toISOString(), tenantId);

      // Determine current status by analyzing all records
      let status = 'not_started';
      let lastRecord = null;

      if (todayRecords.length > 0) {
        lastRecord = todayRecords[todayRecords.length - 1];

        // Check if there's any checkout record today
        const hasCheckOut = todayRecords.some(record => record.checkOut);
        // Check if there's any checkin record today  
        const hasCheckIn = todayRecords.some(record => record.checkIn);
        // Check for break status
        const onBreak = todayRecords.some(record => record.breakStart && !record.breakEnd);

        if (onBreak) {
          status = 'on_break';
        } else if (hasCheckOut && hasCheckIn) {
          // Has both checkin and checkout - finished for the day
          status = 'finished';
        } else if (hasCheckIn) {
          // Has checkin but no checkout - currently working
          status = 'working';
        }
      }

      const response = {
        status,
        todayRecords,
        lastRecord,
        timesheet: {
          totalHours: todayRecords.reduce((sum, record) => {
            return sum + (record.totalHours ? parseFloat(record.totalHours) : 0);
          }, 0)
        }
      };

      res.json(response);
    } catch (error) {
      console.error('Error getting current status:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  // Timecard Entries
  createTimecardEntry = async (req: Request, res: Response) => {
    try {
      const { tenantId } = (req as any).user;
      const validatedData = createTimecardEntrySchema.parse(req.body);

      // Use authenticated user ID instead of body userId
      const entryData = {
        ...validatedData,
        userId: req.user?.id || validatedData.userId,
        tenantId,
        checkIn: validatedData.checkIn ? new Date(validatedData.checkIn) : null,
        checkOut: validatedData.checkOut ? new Date(validatedData.checkOut) : null,
        breakStart: validatedData.breakStart ? new Date(validatedData.breakStart) : null,
        breakEnd: validatedData.breakEnd ? new Date(validatedData.breakEnd) : null,
      };

      const entry = await this.timecardRepository.createTimecardEntry(entryData);

      res.status(201).json(entry);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Dados inválidos', errors: error.errors });
      }
      console.error('Error creating timecard entry:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  };

  getTimecardEntriesByUser = async (req: Request, res: Response) => {
    try {
      const { tenantId } = (req as any).user;
      const { userId } = req.params;
      const { startDate, endDate } = req.query;

      const entries = await this.timecardRepository.getTimecardEntriesByUser(
        userId,
        tenantId,
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );

      res.json({ entries });
    } catch (error) {
      console.error('Error fetching timecard entries:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  };

  updateTimecardEntry = async (req: Request, res: Response) => {
    try {
      const { tenantId } = (req as any).user;
      const { id } = req.params;

      const entry = await this.timecardRepository.updateTimecardEntry(id, tenantId, req.body);
      res.json(entry);
    } catch (error) {
      console.error('Error updating timecard entry:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  };

  deleteTimecardEntry = async (req: Request, res: Response) => {
    try {
      const { tenantId } = (req as any).user;
      const { id } = req.params;

      await this.timecardRepository.deleteTimecardEntry(id, tenantId);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting timecard entry:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  };

  getWorkSchedulesByUser = async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const { tenantId } = (req as any).user;

      console.log('[CONTROLLER-QA] Getting work schedules for user:', userId, 'tenant:', tenantId);
      const schedules = await this.timecardRepository.getWorkSchedulesByUser(userId, tenantId);
      res.json({ schedules });
    } catch (error) {
      console.error('Error fetching work schedules:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  };

  getAllWorkSchedules = async (req: Request, res: Response) => {
    try {
      console.log('[CONTROLLER-QA] Getting work schedules for tenant:', (req as any).user.tenantId);
      const { tenantId } = (req as any).user;
      const schedules = await this.timecardRepository.getAllWorkSchedules(tenantId);

      console.log('[CONTROLLER-QA] Returning schedules count:', schedules.length);
      res.json(schedules); // Direct array response
    } catch (error: any) {
      console.error('[CONTROLLER-QA] Error getting work schedules:', error);
      res.status(500).json({ 
        error: 'Failed to retrieve work schedules',
        details: error.message 
      });
    }
  };

  createWorkSchedule = async (req: Request, res: Response) => {
    try {
      const { tenantId, userId: currentUserId } = (req as any).user;

      const scheduleData = {
        ...req.body,
        tenantId,
        createdBy: currentUserId
      };

      console.log('[CONTROLLER-QA] Creating work schedule:', scheduleData);
      const schedule = await this.timecardRepository.createWorkSchedule(scheduleData);
      res.status(201).json(schedule);
    } catch (error: any) {
      console.error('[CONTROLLER-QA] Error creating work schedule:', error);
      res.status(500).json({ 
        error: 'Failed to create work schedule',
        details: error.message 
      });
    }
  };

  updateWorkSchedule = async (req: Request, res: Response) => {
    try {
      const { tenantId, userId: currentUserId } = (req as any).user;
      const { id } = req.params;

      const updateData = {
        ...req.body,
        updatedBy: currentUserId
      };

      console.log('[CONTROLLER-QA] Updating work schedule:', id, updateData);
      const schedule = await this.timecardRepository.updateWorkSchedule(id, tenantId, updateData);
      res.json(schedule);
    } catch (error: any) {
      console.error('[CONTROLLER-QA] Error updating work schedule:', error);
      res.status(500).json({ 
        error: 'Failed to update work schedule',
        details: error.message 
      });
    }
  };

  createBulkWorkSchedules = async (req: Request, res: Response) => {
    try {
      const { tenantId } = (req as any).user;
      const { userIds, scheduleData } = req.body;

      if (!Array.isArray(userIds) || userIds.length === 0) {
        return res.status(400).json({ message: 'Lista de usuários é obrigatória' });
      }

      console.log('[BULK-QA] Processing bulk assignment for', userIds.length, 'users');

      const schedules = await this.timecardRepository.createBulkWorkSchedules(userIds, scheduleData, tenantId);
      
      res.status(201).json({ 
        message: `${schedules.length} escalas criadas com sucesso`,
        schedules 
      });
    } catch (error) {
      console.error('Error creating bulk work schedules:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  };

  deleteWorkSchedule = async (req: Request, res: Response) => {
    try {
      const { tenantId } = (req as any).user;
      const { id } = req.params;

      console.log('[CONTROLLER-QA] Deleting work schedule:', id);
      await this.timecardRepository.deleteWorkSchedule(id, tenantId);
      res.status(204).send();
    } catch (error: any) {
      console.error('[CONTROLLER-QA] Error deleting work schedule:', error);
      res.status(500).json({ 
        error: 'Failed to delete work schedule',
        details: error.message 
      });
    }
  };

  // Absence Requests
  createAbsenceRequest = async (req: Request, res: Response) => {
    try {
      const { tenantId } = (req as any).user;
      const validatedData = createAbsenceRequestSchema.parse(req.body);

      const request = await this.timecardRepository.createAbsenceRequest({
        ...validatedData,
        tenantId,
        status: 'pending',
      });

      res.status(201).json(request);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Dados inválidos', errors: error.errors });
      }
      console.error('Error creating absence request:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  };

  getAbsenceRequestsByUser = async (req: Request, res: Response) => {
    try {
      const { tenantId } = (req as any).user;
      const { userId } = req.params;

      const requests = await this.timecardRepository.getAbsenceRequestsByUser(userId, tenantId);
      res.json({ requests });
    } catch (error) {
      console.error('Error fetching absence requests:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  };

  getPendingAbsenceRequests = async (req: Request, res: Response) => {
    try {
      const { tenantId } = (req as any).user;

      const requests = await this.timecardRepository.getPendingAbsenceRequests(tenantId);
      res.json({ requests });
    } catch (error) {
      console.error('Error fetching pending absence requests:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  };

  approveAbsenceRequest = async (req: Request, res: Response) => {
    try {
      const { tenantId, id: approvedBy } = (req as any).user;
      const { id } = req.params;

      const request = await this.timecardRepository.approveAbsenceRequest(id, tenantId, approvedBy);
      res.json(request);
    } catch (error) {
      console.error('Error approving absence request:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  };

  rejectAbsenceRequest = async (req: Request, res: Response) => {
    try {
      const { tenantId, id: approvedBy } = (req as any).user;
      const { id } = req.params;
      const { reason } = req.body;

      if (!reason) {
        return res.status(400).json({ message: 'Motivo da rejeição é obrigatório' });
      }

      const request = await this.timecardRepository.rejectAbsenceRequest(id, tenantId, approvedBy, reason);
      res.json(request);
    } catch (error) {
      console.error('Error rejecting absence request:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  };

  // Schedule Templates
  createScheduleTemplate = async (req: Request, res: Response) => {
    try {
      const { tenantId, id: createdBy } = (req as any).user;
      const validatedData = createScheduleTemplateSchema.parse(req.body);

      const template = await this.timecardRepository.createScheduleTemplate({
        ...validatedData,
        tenantId,
        createdBy,
      });

      res.status(201).json(template);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Dados inválidos', errors: error.errors });
      }
      console.error('Error creating schedule template:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  };

  getScheduleTemplates = async (req: Request, res: Response) => {
    try {
      const { tenantId } = (req as any).user;

      const templates = await this.timecardRepository.getScheduleTemplates(tenantId);
      res.json({ templates });
    } catch (error) {
      console.error('Error fetching schedule templates:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  };

  // Novo endpoint que retorna templates customizados + tipos padrão
  getAllScheduleOptions = async (req: Request, res: Response) => {
    try {
      const { tenantId } = (req as any).user;

      // Buscar templates customizados
      const customTemplates = await this.timecardRepository.getScheduleTemplates(tenantId);

      // Tipos de escala padrão
      const defaultScheduleTypes = [
        { id: '5x2', name: '5x2', description: '5 dias úteis, 2 dias de folga', scheduleType: '5x2', workDaysPerWeek: 5, hoursPerDay: '8h', isActive: true },
        { id: '4x3', name: '4x3', description: '4 dias úteis, 3 dias de folga', scheduleType: '4x3', workDaysPerWeek: 4, hoursPerDay: '10h', isActive: true },
        { id: '6x1', name: '6x1', description: '6 dias úteis, 1 dia de folga', scheduleType: '6x1', workDaysPerWeek: 6, hoursPerDay: '8h', isActive: true },
        { id: '12x36', name: '12x36', description: '12 horas trabalhadas, 36 horas de descanso', scheduleType: '12x36', workDaysPerWeek: 3.5, hoursPerDay: '12h', isActive: true },
        { id: 'flexible', name: 'Horário Flexível', description: 'Horário flexível conforme demanda', scheduleType: 'flexible', workDaysPerWeek: 5, hoursPerDay: '8h', isActive: true },
        { id: 'part-time', name: 'Meio Período', description: 'Trabalho em meio período', scheduleType: 'part-time', workDaysPerWeek: 5, hoursPerDay: '4h', isActive: true }
      ];

      // Combinar templates customizados com tipos padrão
      const allTemplates = [...customTemplates, ...defaultScheduleTypes];

      res.json({ templates: allTemplates });
    } catch (error) {
      console.error('Error fetching all schedule options:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  };

  updateScheduleTemplate = async (req: Request, res: Response) => {
    try {
      const { tenantId } = (req as any).user;
      const { id } = req.params;

      const template = await this.timecardRepository.updateScheduleTemplate(id, tenantId, req.body);
      res.json(template);
    } catch (error) {
      console.error('Error updating schedule template:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  };

  deleteScheduleTemplate = async (req: Request, res: Response) => {
    try {
      const { tenantId } = (req as any).user;
      const { id } = req.params;

      await this.timecardRepository.deleteScheduleTemplate(id, tenantId);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting schedule template:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  };

  // Hour Bank
  getHourBankByUser = async (req: Request, res: Response) => {
    try {
      const { tenantId } = (req as any).user;
      const { userId } = req.params;
      const { year, month } = req.query;

      const entries = await this.timecardRepository.getHourBankByUser(
        userId,
        tenantId,
        year ? parseInt(year as string) : undefined,
        month ? parseInt(month as string) : undefined
      );

      const balance = await this.timecardRepository.calculateHourBankBalance(userId, tenantId);

      res.json({ entries, balance });
    } catch (error) {
      console.error('Error fetching hour bank:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  };

  // Flexible Work Arrangements
  createFlexibleWorkArrangement = async (req: Request, res: Response) => {
    try {
      const { tenantId } = (req as any).user;
      const validatedData = createFlexibleWorkArrangementSchema.parse(req.body);

      const arrangement = await this.timecardRepository.createFlexibleWorkArrangement({
        ...validatedData,
        tenantId,
        status: 'pending',
      });

      res.status(201).json(arrangement);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Dados inválidos', errors: error.errors });
      }
      console.error('Error creating flexible work arrangement:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  };

  getFlexibleWorkArrangements = async (req: Request, res: Response) => {
    try {
      const { tenantId } = (req as any).user;

      const arrangements = await this.timecardRepository.getFlexibleWorkArrangements(tenantId);
      res.json({ arrangements });
    } catch (error) {
      console.error('Error fetching flexible work arrangements:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  };

  // Notifications for users  
  getUserNotifications = async (req: Request, res: Response) => {
    try {
      const { tenantId, id: userId } = (req as any).user;
      const { unreadOnly } = req.query;

      // Mock implementation - você pode implementar um sistema real de notificações
      const notifications = [
        {
          id: '1',
          type: 'absence_request_approved',
          title: 'Solicitação de férias aprovada',
          message: 'Sua solicitação de férias de 15-20/12 foi aprovada.',
          read: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: '2',
          type: 'schedule_changed',
          title: 'Escala alterada',
          message: 'Sua escala foi alterada para começar às 09:00.',
          read: unreadOnly === 'true' ? false : true,
          createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        }
      ];

      const filteredNotifications = unreadOnly === 'true' 
        ? notifications.filter(n => !n.read)
        : notifications;

      res.json({ notifications: filteredNotifications });
    } catch (error) {
      console.error('Error fetching user notifications:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  };

  markNotificationAsRead = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      // Mock implementation - implementar lógica real de marcação
      res.json({ success: true, message: 'Notificação marcada como lida' });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  };

  // Shift Swap Requests
  createShiftSwapRequest = async (req: Request, res: Response) => {
    try {
      const { tenantId, id: requesterId } = (req as any).user;
      const { targetUserId, originalShiftDate, proposedShiftDate, reason } = req.body;

      const request = await this.timecardRepository.createShiftSwapRequest({
        tenantId,
        requesterId,
        targetUserId,
        originalShiftDate,
        proposedShiftDate,
        reason,
        status: 'pending',
      });

      res.status(201).json(request);
    } catch (error) {
      console.error('Error creating shift swap request:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  };

  getShiftSwapRequests = async (req: Request, res: Response) => {
    try {
      const { tenantId } = (req as any).user;

      const requests = await this.timecardRepository.getShiftSwapRequests(tenantId);
      res.json({ requests });
    } catch (error) {
      console.error('Error fetching shift swap requests:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  };

  async getAttendanceReport(req: AuthenticatedRequest, res: Response) {
    try {
      const { period } = req.params;
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        return res.status(400).json({ 
          success: false, 
          error: 'Tenant ID é obrigatório' 
        });
      }

      // TODO: Implementar relatório de ponto
      const report = {
        period,
        data: [],
        summary: {
          totalHours: 0,
          overtimeHours: 0,
          absentDays: 0
        }
      };

      res.json({
        success: true,
        report
      });
    } catch (error: any) {
      console.error('[TIMECARD-CONTROLLER] Error generating attendance report:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Erro ao gerar relatório',
        details: error.message 
      });
    }
  }

  async getUsers(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        return res.status(400).json({ 
          success: false, 
          error: 'Tenant ID é obrigatório' 
        });
      }

      const users = await this.timecardRepository.getUsers(tenantId);

      res.json({
        success: true,
        users
      });
    } catch (error: any) {
      console.error('[TIMECARD-CONTROLLER] Error fetching users:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Erro ao buscar usuários',
        details: error.message 
      });
    }
  }
}