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
        // Sort records by creation time to get the most recent
        const sortedRecords = todayRecords.sort((a, b) => 
          new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime()
        );
        lastRecord = sortedRecords[0];

        // Check for break status first (most specific)
        const onBreak = todayRecords.some(record => record.breakStart && !record.breakEnd);
        
        if (onBreak) {
          status = 'on_break';
        } else {
          // Filter out invalid records (must have at least checkIn)
          const validRecords = todayRecords.filter(record => record.checkIn);
          
          // Sort by creation time to get the most recent record for the current user
          const sortedValidRecords = validRecords.sort((a, b) => 
            new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime()
          );
          
          // Use only the most recent record to determine status
          const latestRecord = sortedValidRecords[0];
          
          if (latestRecord) {
            if (latestRecord.checkIn && !latestRecord.checkOut) {
              // Latest record has check-in but no check-out = currently working
              status = 'working';
            } else if (latestRecord.checkIn && latestRecord.checkOut) {
              // Latest record is complete = finished for the day
              status = 'finished';
            }
          }
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
      console.log('[TIMECARD-CREATE] Starting timecard entry creation...');
      
      // Validate authentication
      if (!req.user) {
        console.log('[TIMECARD-CREATE] No user found in request');
        return res.status(401).json({ 
          message: 'Usuário não autenticado',
          error: 'UNAUTHORIZED' 
        });
      }

      const tenantId = (req as any).user?.tenantId;
      const userId = (req as any).user?.id;
      
      console.log('[TIMECARD-CREATE] User info:', {
        userId: userId?.slice(-8),
        tenantId: tenantId?.slice(-8),
        hasUser: !!req.user
      });

      if (!tenantId || !userId) {
        console.log('[TIMECARD-CREATE] Missing tenant or user ID');
        return res.status(400).json({ 
          message: 'Dados de autenticação incompletos',
          error: 'MISSING_AUTH_DATA' 
        });
      }

      // Clean and validate request body
      console.log('[TIMECARD-CREATE] Raw request body:', req.body);
      
      const cleanBody = Object.fromEntries(
        Object.entries(req.body || {}).filter(([_, value]) => value !== undefined && value !== null)
      );
      
      console.log('[TIMECARD-CREATE] Cleaned body:', cleanBody);
      
      if (Object.keys(cleanBody).length === 0) {
        return res.status(400).json({ 
          message: 'Dados do registro de ponto são obrigatórios',
          error: 'EMPTY_BODY' 
        });
      }

      let validatedData;
      try {
        validatedData = createTimecardEntrySchema.parse(cleanBody);
        console.log('[TIMECARD-CREATE] Validation successful:', validatedData);
      } catch (validationError) {
        console.log('[TIMECARD-CREATE] Validation error:', validationError);
        return res.status(400).json({ 
          message: 'Dados inválidos para registro de ponto',
          error: 'VALIDATION_ERROR',
          details: validationError instanceof Error ? validationError.message : 'Unknown validation error'
        });
      }

      // Get today's records to validate business rules
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayRecords = await this.timecardRepository.getTimecardEntriesByUserAndDate(userId, today.toISOString(), tenantId);

      // If this is a check-out, validate that there's an active check-in
      if (validatedData.checkOut && !validatedData.checkIn) {
        const activeCheckIn = todayRecords.find(record => record.checkIn && !record.checkOut);
        if (!activeCheckIn) {
          return res.status(400).json({ 
            message: 'Não é possível registrar saída sem uma entrada ativa' 
          });
        }
        
        // Update the existing check-in record with check-out time
        const updatedEntry = await this.timecardRepository.updateTimecardEntry(
          activeCheckIn.id,
          tenantId,
          { checkOut: new Date(validatedData.checkOut) }
        );
        
        return res.status(201).json(updatedEntry);
      }

      // Use authenticated user ID instead of body userId
      const entryData = {
        ...validatedData,
        userId: userId || validatedData.userId,
        tenantId,
        checkIn: validatedData.checkIn ? new Date(validatedData.checkIn) : null,
        checkOut: validatedData.checkOut ? new Date(validatedData.checkOut) : null,
        breakStart: validatedData.breakStart ? new Date(validatedData.breakStart) : null,
        breakEnd: validatedData.breakEnd ? new Date(validatedData.breakEnd) : null,
      };

      console.log('[TIMECARD-CREATE] Creating entry with data:', entryData);
      
      const entry = await this.timecardRepository.createTimecardEntry(entryData);
      
      console.log('[TIMECARD-CREATE] Entry created successfully:', entry?.id);

      res.status(201).json({
        success: true,
        message: 'Ponto registrado com sucesso',
        data: entry
      });
    } catch (error: any) {
      console.error('[TIMECARD-CREATE] Error creating timecard entry:', error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          success: false,
          message: 'Dados inválidos para registro de ponto', 
          error: 'VALIDATION_ERROR',
          details: error.errors 
        });
      }
      
      // Handle database errors
      if (error?.code === '23505') {
        return res.status(409).json({ 
          success: false,
          message: 'Registro duplicado detectado',
          error: 'DUPLICATE_ENTRY'
        });
      }
      
      if (error?.code === '23503') {
        return res.status(400).json({ 
          success: false,
          message: 'Referência inválida nos dados',
          error: 'FOREIGN_KEY_ERROR'
        });
      }
      
      return res.status(500).json({ 
        success: false,
        message: 'Erro interno do servidor ao registrar ponto',
        error: 'INTERNAL_ERROR',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
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

  getHourBankSummary = async (req: Request, res: Response) => {
    try {
      const { tenantId } = (req as any).user;
      const userId = req.user?.id;

      if (!tenantId || !userId) {
        return res.status(400).json({ 
          success: false, 
          error: 'User ID é obrigatório' 
        });
      }

      console.log('[HOUR-BANK] Getting summary for user:', userId);

      // Buscar registros dos últimos 30 dias para calcular saldo
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const entries = await this.timecardRepository.getTimecardEntriesByUser(
        userId,
        tenantId,
        thirtyDaysAgo,
        new Date()
      );

      // Calcular saldo do banco de horas
      let totalHoursWorked = 0;
      let totalExpectedHours = 0;

      const workingDays = new Set();

      entries.forEach(entry => {
        if (entry.checkIn && entry.checkOut) {
          const date = new Date(entry.checkIn).toISOString().split('T')[0];
          workingDays.add(date);
          
          const start = new Date(entry.checkIn);
          const end = new Date(entry.checkOut);
          const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
          
          totalHoursWorked += hours;
        }
      });

      // 8 horas por dia útil trabalhado
      totalExpectedHours = workingDays.size * 8;
      
      const balance = totalHoursWorked - totalExpectedHours;
      
      const summary = {
        currentBalance: balance.toFixed(2),
        totalHoursWorked: totalHoursWorked.toFixed(2),
        expectedHours: totalExpectedHours.toFixed(2),
        workingDays: workingDays.size,
        status: balance >= 0 ? 'positive' : 'negative',
        lastUpdated: new Date().toISOString()
      };

      console.log('[HOUR-BANK] Summary calculated:', summary);

      res.json({
        success: true,
        summary
      });
    } catch (error: any) {
      console.error('[HOUR-BANK] Error getting summary:', error);
      res.status(500).json({ 
        success: false,
        error: 'Erro ao calcular banco de horas',
        details: error.message 
      });
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
    console.log('[ATTENDANCE-REPORT] Route hit - starting...');
    
    // Force JSON response immediately
    res.setHeader('Content-Type', 'application/json');
    
    try {
      const { period } = req.params;
      const tenantId = req.user?.tenantId;
      const userId = req.user?.id;

      console.log('[ATTENDANCE-REPORT] Auth check:', {
        hasUser: !!req.user,
        userId: userId?.slice(-8),
        tenantId: tenantId?.slice(-8),
        period
      });

      if (!tenantId || !userId) {
        console.log('[ATTENDANCE-REPORT] Missing auth data');
        return res.status(400).json({ 
          success: false, 
          error: 'Tenant ID e User ID são obrigatórios' 
        });
      }

      console.log('[ATTENDANCE-REPORT] Generating report for period:', period, 'user:', userId);

      // Parse period (formato: YYYY-MM)
      const [year, month] = period.split('-').map(Number);
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59); // Last moment of month

      console.log('[ATTENDANCE-REPORT] Date range:', startDate.toISOString(), 'to', endDate.toISOString());
      console.log('[ATTENDANCE-REPORT] User:', userId, 'Tenant:', tenantId);

      // Buscar APENAS registros aprovados do período usando query direta
      const { db } = await import('../../../../db');
      const { timecardEntries } = await import('@shared/schema');
      const { and, eq, gte, lte, sql } = await import('drizzle-orm');
      
      // Teste direto com SQL raw para debug
      console.log('[ATTENDANCE-REPORT] Query params:', {
        userId,
        tenantId,
        startDateStr: startDate.toISOString().split('T')[0],
        endDateStr: endDate.toISOString().split('T')[0]
      });

      // Buscar todos os registros aprovados do período (incluindo os sem check_in)
      console.log('[ATTENDANCE-REPORT] Executing query for user:', userId, 'tenant:', tenantId);
      
      const records = await db
        .select()
        .from(timecardEntries)
        .where(and(
          eq(timecardEntries.userId, userId),
          eq(timecardEntries.tenantId, tenantId),
          eq(timecardEntries.status, 'approved'),
          sql`(
            (${timecardEntries.checkIn} IS NOT NULL AND DATE(${timecardEntries.checkIn}) >= ${startDate.toISOString().split('T')[0]} AND DATE(${timecardEntries.checkIn}) <= ${endDate.toISOString().split('T')[0]})
            OR 
            (${timecardEntries.checkIn} IS NULL AND DATE(${timecardEntries.createdAt}) >= ${startDate.toISOString().split('T')[0]} AND DATE(${timecardEntries.createdAt}) <= ${endDate.toISOString().split('T')[0]})
          )`
        ))
        .orderBy(sql`COALESCE(${timecardEntries.checkIn}, ${timecardEntries.createdAt})`);

      console.log('[ATTENDANCE-REPORT] Found records:', records.length);
      console.log('[ATTENDANCE-REPORT] Date range check:', {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        startDateStr: startDate.toISOString().split('T')[0],
        endDateStr: endDate.toISOString().split('T')[0]
      });
      
      // Log detalhado dos primeiros registros encontrados
      if (records.length > 0) {
        console.log('[ATTENDANCE-REPORT] First 5 records found:', records.slice(0, 5).map(r => ({
          id: r.id.slice(-8),
          checkIn: r.checkIn,
          createdAt: r.createdAt,
          status: r.status,
          referenceDate: r.checkIn || r.createdAt
        })));
      } else {
        console.log('[ATTENDANCE-REPORT] No records found - checking criteria...');
        console.log('[ATTENDANCE-REPORT] Search criteria:', {
          userId,
          tenantId,
          dateRange: `${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`,
          status: 'approved'
        });
      }
      
      // Log first few records for debugging
      if (records.length > 0) {
        console.log('[ATTENDANCE-REPORT] Sample records:', records.slice(0, 3).map(r => ({
          id: r.id,
          checkIn: r.checkIn,
          checkOut: r.checkOut,
          status: r.status,
          date: r.checkIn ? new Date(r.checkIn).toISOString().split('T')[0] : 'no date'
        })));
      }

      // Filtrar apenas registros que têm tanto check_in quanto check_out
      const validRecords = records.filter(record => record.checkIn && record.checkOut);
      
      console.log('[ATTENDANCE-REPORT] Valid records (with both check_in and check_out):', validRecords.length);
      
      // Agrupar registros válidos por data
      const recordsByDate = new Map();
      
      validRecords.forEach(record => {
        const date = new Date(record.checkIn).toISOString().split('T')[0];
        
        if (!recordsByDate.has(date)) {
          recordsByDate.set(date, []);
        }
        recordsByDate.get(date).push(record);
      });

      // Processar cada dia para criar registros consolidados
      const processedRecords = [];
      
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        const dayRecords = recordsByDate.get(dateStr) || [];
        
        if (dayRecords.length > 0) {
          // Pegar primeiro registro do dia (normalmente deve ser único)
          const record = dayRecords[0];
          
          // Data para análise
          const workDate = new Date(record.checkIn);
          
          // Mapear para formato CLT brasileiro
          const cltRecord = await this.formatToCLTStandard(record, workDate);
          
          processedRecords.push(cltRecord);
        }
      }

      console.log('[ATTENDANCE-REPORT] Processed records:', processedRecords.length);
      console.log('[ATTENDANCE-REPORT] Sample processed records:', processedRecords.slice(0, 3));

      // Calcular totais
      const totalHours = processedRecords.reduce((sum, record) => 
        sum + parseFloat(record.totalHours || '0'), 0
      );
      
      const workingDays = processedRecords.filter(r => 
        parseFloat(r.totalHours || '0') > 0
      ).length;

      // 8 horas por dia é considerado normal
      const expectedHours = workingDays * 8;
      const overtimeHours = Math.max(0, totalHours - expectedHours);

      const report = {
        period,
        records: processedRecords,
        summary: {
          totalHours: totalHours.toFixed(1),
          workingDays,
          overtimeHours: overtimeHours.toFixed(1),
          averageHoursPerDay: workingDays > 0 ? (totalHours / workingDays).toFixed(1) : '0.0'
        }
      };

      console.log('[ATTENDANCE-REPORT] Final report summary:', report.summary);

      // Force JSON response with explicit headers
      res.setHeader('Content-Type', 'application/json');
      res.status(200).json({
        success: true,
        ...report
      });
    } catch (error: any) {
      console.error('[TIMECARD-CONTROLLER] Error generating attendance report:', error);
      res.setHeader('Content-Type', 'application/json');
      res.status(500).json({ 
        success: false, 
        error: 'Erro ao gerar relatório',
        details: error?.message || 'Unknown error'
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

  async getHourBankSummary(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        return res.status(400).json({ 
          success: false, 
          error: 'Tenant ID é obrigatório' 
        });
      }

      console.log('[HOUR-BANK-SUMMARY] Getting summary for tenant:', tenantId);

      // Mock data for hour bank summary
      const summary = {
        totalEmployees: 4,
        totalCreditHours: 120.5,
        totalDebitHours: 80.0,
        averageBalance: 10.125,
        expiringHours: 15.5
      };

      res.json(summary);
    } catch (error: any) {
      console.error('[TIMECARD-CONTROLLER] Error fetching hour bank summary:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Erro ao buscar resumo do banco de horas',
        details: error.message 
      });
    }
  }

  async getHourBankMovements(req: AuthenticatedRequest, res: Response) {
    try {
      const { userId, month } = req.params;
      const tenantId = req.user?.tenantId;

      if (!tenantId || !userId || !month) {
        return res.status(400).json({ 
          success: false, 
          error: 'Parâmetros obrigatórios: tenantId, userId, month' 
        });
      }

      console.log('[HOUR-BANK-MOVEMENTS] Getting movements for user:', userId, 'month:', month);

      // Mock data for hour bank movements
      const movements = [
        {
          id: '1',
          userId,
          movementDate: `${month}-15`,
          movementType: 'credit',
          hours: 2.5,
          description: 'Horas extras trabalhadas'
        },
        {
          id: '2',
          userId,
          movementDate: `${month}-20`,
          movementType: 'debit',
          hours: 1.0,
          description: 'Saída antecipada'
        }
      ];

      res.json({
        success: true,
        movements
      });
    } catch (error: any) {
      console.error('[TIMECARD-CONTROLLER] Error fetching hour bank movements:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Erro ao buscar movimentações do banco de horas',
        details: error.message 
      });
    }
  }

  async getOvertimeReport(req: AuthenticatedRequest, res: Response) {
    try {
      const { period } = req.params;
      const tenantId = req.user?.tenantId;
      const userId = req.user?.id;

      if (!tenantId || !userId) {
        return res.status(400).json({ 
          success: false, 
          error: 'Tenant ID e User ID são obrigatórios' 
        });
      }

      console.log('[OVERTIME-REPORT] Generating report for period:', period, 'user:', userId);

      // Parse period (formato: YYYY-MM)
      const [year, month] = period.split('-').map(Number);
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);

      console.log('[OVERTIME-REPORT] Date range:', startDate.toISOString(), 'to', endDate.toISOString());

      // Buscar registros aprovados com horas extras
      const { db } = await import('../../../../db');
      const { timecardEntries } = await import('@shared/schema');
      const { and, eq, sql } = await import('drizzle-orm');
      
      const records = await db
        .select()
        .from(timecardEntries)
        .where(and(
          eq(timecardEntries.userId, userId),
          eq(timecardEntries.tenantId, tenantId),
          eq(timecardEntries.status, 'approved'),
          sql`DATE(${timecardEntries.checkIn}) >= ${startDate.toISOString().split('T')[0]}`,
          sql`DATE(${timecardEntries.checkIn}) <= ${endDate.toISOString().split('T')[0]}`
        ));

      // Calcular horas extras (acima de 8h por dia)
      let totalOvertimeHours = 0;
      const overtimeDays = [];

      records.forEach(record => {
        if (record.checkIn && record.checkOut) {
          const checkInTime = new Date(record.checkIn);
          const checkOutTime = new Date(record.checkOut);
          const hoursWorked = (checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60);
          
          if (hoursWorked > 8) {
            const overtime = hoursWorked - 8;
            totalOvertimeHours += overtime;
            overtimeDays.push({
              date: checkInTime.toISOString().split('T')[0],
              overtimeHours: overtime.toFixed(2)
            });
          }
        }
      });

      const overtimeReport = {
        period,
        totalOvertimeHours: totalOvertimeHours.toFixed(2),
        totalOvertimeValue: (totalOvertimeHours * 25.5).toFixed(2), // R$ 25,50 por hora extra
        averageOvertimePerDay: (totalOvertimeHours / new Date(year, month, 0).getDate()).toFixed(2),
        overtimeDays,
        employeeDetails: [
          {
            userId,
            userName: 'Alex Santos',
            overtimeHours: totalOvertimeHours.toFixed(2),
            overtimeValue: (totalOvertimeHours * 25.5).toFixed(2),
            overtimeDays: overtimeDays.length
          }
        ]
      };

      res.json({
        success: true,
        ...overtimeReport
      });
    } catch (error: any) {
      console.error('[TIMECARD-CONTROLLER] Error generating overtime report:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Erro ao gerar relatório de horas extras',
        details: error.message 
      });
    }
  }

  /**
   * Formatar registro para padrão CLT brasileiro
   */
  private async formatToCLTStandard(record: any, workDate: Date) {
    // Dias da semana em português
    const daysOfWeek = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    
    // Formatações de data e hora brasileiras
    const dateStr = workDate.toLocaleDateString('pt-BR');
    const dayOfWeek = daysOfWeek[workDate.getDay()];
    
    // Horários no formato HH:MM
    const checkIn = record.checkIn ? new Date(record.checkIn).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : null;
    const checkOut = record.checkOut ? new Date(record.checkOut).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : null;
    const breakStart = record.breakStart ? new Date(record.breakStart).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : null;
    const breakEnd = record.breakEnd ? new Date(record.breakEnd).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : null;
    
    // Calcular horas trabalhadas e validar consistência
    let totalHours = '0:00';
    let overtimeHours = '0:00';
    let isConsistent = true;
    let inconsistencyReasons = [];
    
    if (record.checkIn && record.checkOut) {
      const workStart = new Date(record.checkIn);
      const workEnd = new Date(record.checkOut);
      let workMinutes = (workEnd.getTime() - workStart.getTime()) / (1000 * 60);
      
      // Validações de consistência
      
      // 1. Verificar se entrada é anterior à saída (mesmo dia)
      if (workStart.toDateString() === workEnd.toDateString() && workStart >= workEnd) {
        isConsistent = false;
        inconsistencyReasons.push('Entrada posterior à saída');
      }
      
      // 2. Verificar jornada muito longa (>16h) ou muito curta (<5min)
      if (workMinutes < 0) {
        // Turno noturno que cruza a meia-noite
        workMinutes += 24 * 60;
      }
      
      if (workMinutes > 960) { // >16h
        isConsistent = false;
        inconsistencyReasons.push('Jornada excessivamente longa (>16h)');
      } else if (workMinutes < 5) { // <5min
        isConsistent = false;
        inconsistencyReasons.push('Jornada muito curta (<5min)');
      }
      
      // 3. Validar horários de pausa
      let breakMinutes = 0;
      if (record.breakStart && record.breakEnd) {
        const pauseStart = new Date(record.breakStart);
        const pauseEnd = new Date(record.breakEnd);
        breakMinutes = (pauseEnd.getTime() - pauseStart.getTime()) / (1000 * 60);
        
        // Verificar se pausa está dentro do horário de trabalho
        if (pauseStart < workStart) {
          isConsistent = false;
          inconsistencyReasons.push('Pausa iniciada antes da entrada');
        }
        if (pauseEnd > workEnd) {
          isConsistent = false;
          inconsistencyReasons.push('Pausa finalizada após a saída');
        }
        if (pauseStart >= pauseEnd) {
          isConsistent = false;
          inconsistencyReasons.push('Horário de pausa inválido');
        }
        if (breakMinutes > 240) { // >4h de pausa
          isConsistent = false;
          inconsistencyReasons.push('Pausa excessivamente longa (>4h)');
        }
      }
      
      // 4. Validar se há pausa em jornadas longas (CLT exige pausa >6h)
      if (workMinutes > 360 && breakMinutes === 0) { // >6h sem pausa
        isConsistent = false;
        inconsistencyReasons.push('Jornada >6h sem pausa obrigatória');
      }
      
      const totalWorkMinutes = Math.max(0, workMinutes - breakMinutes);
      const hours = Math.floor(totalWorkMinutes / 60);
      const minutes = Math.floor(totalWorkMinutes % 60);
      totalHours = `${hours}:${minutes.toString().padStart(2, '0')}`;
      
      // Calcular horas extras (acima de 8h)
      if (totalWorkMinutes > 480) { // 8 horas = 480 minutos
        const overtimeMinutes = totalWorkMinutes - 480;
        const overtimeHrs = Math.floor(overtimeMinutes / 60);
        const overtimeMins = Math.floor(overtimeMinutes % 60);
        overtimeHours = `${overtimeHrs}:${overtimeMins.toString().padStart(2, '0')}`;
      }
    } else {
      // Dados incompletos
      isConsistent = false;
      inconsistencyReasons.push('Dados de entrada/saída incompletos');
    }
    
    // Status com base na consistência
    const status = !isConsistent ? 'Inconsistente' : 
                  record.status === 'approved' ? 'Aprovado' :
                  record.status === 'pending' ? 'Pendente' : 'Rejeitado';
    
    // Buscar tipo de escala do usuário (implementar depois)
    const scheduleType = await this.getScheduleTypeForUser(record.userId, record.tenantId);

    return {
      // Dados obrigatórios CLT
      date: dateStr,                    // DD/MM/AAAA
      dayOfWeek,                       // Seg, Ter, Qua, etc.
      firstEntry: checkIn,             // 1ª Entrada (HH:MM)
      firstExit: breakStart,           // 1ª Saída - almoço/pausa (HH:MM)
      secondEntry: breakEnd,           // 2ª Entrada - retorno (HH:MM)  
      secondExit: checkOut,            // 2ª Saída - fim da jornada (HH:MM)
      totalHours,                      // Horas trabalhadas
      status,                          // Status de aprovação
      
      // Informações complementares
      observations: !isConsistent ? inconsistencyReasons.join('; ') : '',
      overtimeHours,                   // Horas extras
      scheduleType: scheduleType || 'Não definido',    // Tipo de escala
      isConsistent,                    // Flag para frontend
      
      // Dados originais para debug
      originalRecord: {
        checkIn: record.checkIn,
        checkOut: record.checkOut,
        breakStart: record.breakStart,
        breakEnd: record.breakEnd
      }
    };
  }

  /**
   * Buscar tipo de escala do usuário
   */
  private async getScheduleTypeForUser(userId: string, tenantId: string): Promise<string | null> {
    try {
      const { db } = await import('../../../../db');
      const { workSchedules } = await import('../../../../shared/schema-master');
      const { eq, and } = await import('drizzle-orm');
      
      console.log(`[SCHEDULE-TYPE] Buscando escala para usuário ${userId} no tenant ${tenantId}`);
      
      const scheduleResult = await db
        .select({ 
          scheduleName: workSchedules.scheduleName 
        })
        .from(workSchedules)
        .where(and(
          eq(workSchedules.userId, userId),
          eq(workSchedules.tenantId, tenantId),
          eq(workSchedules.isActive, true)
        ))
        .limit(1);
        
      console.log(`[SCHEDULE-TYPE] Resultado da busca:`, scheduleResult);
      return scheduleResult[0]?.scheduleName || null;
    } catch (error) {
      console.error('[SCHEDULE-TYPE] Error fetching schedule:', error);
      return null;
    }
  }
}