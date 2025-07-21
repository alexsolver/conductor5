import { Request, Response } from 'express''[,;]
import { DrizzleTimecardRepository } from '../../infrastructure/repositories/DrizzleTimecardRepository''[,;]
import { CreateTimeRecordRequest } from '../../domain/entities/TimeRecord''[,;]
import { z } from 'zod''[,;]

const timecardRepository = new DrizzleTimecardRepository();

export class TimecardController {
  
  // Registrar ponto
  async createTimeRecord(req: Request, res: Response) {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const userId = req.headers['x-user-id'] as string;
      
      if (!tenantId || !userId) {
        return res.status(400).json({ error: 'Tenant ID and User ID are required' });
      }

      const schema = z.object({
        recordType: z.enum(['clock_in', 'clock_out', 'break_start', 'break_end']),
        deviceType: z.enum(['web', 'mobile', 'totem', 'api', 'biometric']),
        location: z.object({
          latitude: z.number(),
          longitude: z.number(),
          address: z.string().optional(),
        }).optional(),
        notes: z.string().optional(),
        biometricData: z.string().optional(),
        isOfflineRecord: z.boolean().optional(),
        originalDeviceId: z.string().optional(),
      });

      const data = schema.parse(req.body);
      const record = await timecardRepository.createTimeRecord(tenantId, userId, data);
      
      res.json(record);
    } catch (error) {
      console.error('Error creating time record:', error);
      res.status(500).json({ error: 'Failed to create time record' });
    }
  }

  // Buscar registros do usuário
  async getUserTimeRecords(req: Request, res: Response) {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const userId = req.params.userId;
      const { startDate, endDate } = req.query;

      const start = startDate ? new Date(startDate as string) : undefined;
      const end = endDate ? new Date(endDate as string) : undefined;

      const records = await timecardRepository.findTimeRecordsByUserId(userId, tenantId, start, end);
      res.json(records);
    } catch (error) {
      console.error('Error fetching time records:', error);
      res.status(500).json({ error: 'Failed to fetch time records' });
    }
  }

  // Gerar espelho de ponto
  async generateTimesheet(req: Request, res: Response) {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const userId = req.params.userId;
      const { date } = req.body;

      const workDate = new Date(date);
      const timesheet = await timecardRepository.generateDailyTimesheet(userId, tenantId, workDate);
      
      res.json(timesheet);
    } catch (error) {
      console.error('Error generating timesheet:', error);
      res.status(500).json({ error: 'Failed to generate timesheet' });
    }
  }

  // Buscar espelhos de ponto
  async getUserTimesheets(req: Request, res: Response) {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const userId = req.params.userId;
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({ error: 'Start date and end date are required' });
      }

      const start = new Date(startDate as string);
      const end = new Date(endDate as string);

      const timesheets = await timecardRepository.findTimesheetsByUserId(userId, tenantId, start, end);
      res.json(timesheets);
    } catch (error) {
      console.error('Error fetching timesheets:', error);
      res.status(500).json({ error: 'Failed to fetch timesheets' });
    }
  }

  // Aprovar espelho de ponto
  async approveTimesheet(req: Request, res: Response) {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const approvedBy = req.headers['x-user-id'] as string;
      const { timesheetId } = req.params;

      const approved = await timecardRepository.approveTimesheet(timesheetId, tenantId, approvedBy);
      res.json(approved);
    } catch (error) {
      console.error('Error approving timesheet:', error);
      res.status(500).json({ error: 'Failed to approve timesheet' });
    }
  }

  // Assinar espelho de ponto
  async signTimesheet(req: Request, res: Response) {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const { timesheetId } = req.params;
      const { signature } = req.body;

      const signed = await timecardRepository.signTimesheet(timesheetId, tenantId, signature);
      res.json(signed);
    } catch (error) {
      console.error('Error signing timesheet:', error);
      res.status(500).json({ error: 'Failed to sign timesheet' });
    }
  }

  // Banco de horas
  async getHourBank(req: Request, res: Response) {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const userId = req.params.userId;

      const entries = await timecardRepository.findHourBankByUserId(userId, tenantId);
      const balance = await timecardRepository.calculateHourBankBalance(userId, tenantId);
      
      res.json({ entries, balance });
    } catch (error) {
      console.error('Error fetching hour bank:', error);
      res.status(500).json({ error: 'Failed to fetch hour bank' });
    }
  }

  // Escalas de trabalho
  async createWorkSchedule(req: Request, res: Response) {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      
      const schema = z.object({
        name: z.string(),
        code: z.string(),
        scheduleType: z.enum(['5x2', '6x1', '12x36', 'plantao', 'intermitente']),
        workDaysPerWeek: z.number(),
        hoursPerDay: z.string(),
        hoursPerWeek: z.string(),
        standardStart: z.string().optional(),
        standardEnd: z.string().optional(),
        breakDuration: z.number().optional(),
        lunchDuration: z.number().optional(),
        allowsFlexTime: z.boolean().optional(),
        flexTimeToleranceMinutes: z.number().optional(),
        nightShiftStart: z.string().optional(),
        nightShiftEnd: z.string().optional(),
        allowsHourBank: z.boolean().optional(),
        hourBankLimit: z.string().optional(),
        overtimeMultiplier: z.string().optional(),
        configuration: z.any().optional(),
        isActive: z.boolean().optional(),
      });

      const data = schema.parse(req.body);
      const schedule = await timecardRepository.createWorkSchedule(tenantId, {
        ...data,
        tenantId,
        allowsFlexTime: data.allowsFlexTime ?? false,
        allowsHourBank: data.allowsHourBank ?? false,
        flexTimeToleranceMinutes: data.flexTimeToleranceMinutes ?? 0,
        breakDuration: data.breakDuration ?? 0,
        lunchDuration: data.lunchDuration ?? 0,
        isActive: data.isActive ?? true
      });
      
      res.json(schedule);
    } catch (error) {
      console.error('Error creating work schedule:', error);
      res.status(500).json({ error: 'Failed to create work schedule' });
    }
  }

  async getWorkSchedules(req: Request, res: Response) {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      
      const schedules = await timecardRepository.findWorkSchedulesByTenant(tenantId);
      res.json(schedules);
    } catch (error) {
      console.error('Error fetching work schedules:', error);
      res.status(500).json({ error: 'Failed to fetch work schedules' });
    }
  }

  // Alertas
  async getActiveAlerts(req: Request, res: Response) {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const userId = req.query.userId as string;
      
      const alerts = await timecardRepository.findActiveAlerts(tenantId, userId);
      res.json(alerts);
    } catch (error) {
      console.error('Error fetching alerts:', error);
      res.status(500).json({ error: 'Failed to fetch alerts' });
    }
  }

  async resolveAlert(req: Request, res: Response) {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const resolvedBy = req.headers['x-user-id'] as string;
      const { alertId } = req.params;
      const { notes } = req.body;

      const resolved = await timecardRepository.resolveAlert(alertId, tenantId, resolvedBy, notes);
      res.json(resolved);
    } catch (error) {
      console.error('Error resolving alert:', error);
      res.status(500).json({ error: 'Failed to resolve alert' });
    }
  }

  // Relatórios
  async getUserWorkingHoursReport(req: Request, res: Response) {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const userId = req.params.userId;
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({ error: 'Start date and end date are required' });
      }

      const start = new Date(startDate as string);
      const end = new Date(endDate as string);

      const report = await timecardRepository.getUserWorkingHoursReport(userId, tenantId, start, end);
      res.json(report);
    } catch (error) {
      console.error('Error generating user report:', error);
      res.status(500).json({ error: 'Failed to generate user report' });
    }
  }

  async getTenantOvertimeReport(req: Request, res: Response) {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({ error: 'Start date and end date are required' });
      }

      const start = new Date(startDate as string);
      const end = new Date(endDate as string);

      const report = await timecardRepository.getTenantOvertimeReport(tenantId, start, end);
      res.json(report);
    } catch (error) {
      console.error('Error generating overtime report:', error);
      res.status(500).json({ error: 'Failed to generate overtime report' });
    }
  }

  async getAttendanceReport(req: Request, res: Response) {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({ error: 'Start date and end date are required' });
      }

      const start = new Date(startDate as string);
      const end = new Date(endDate as string);

      const report = await timecardRepository.getAttendanceReport(tenantId, start, end);
      res.json(report);
    } catch (error) {
      console.error('Error generating attendance report:', error);
      res.status(500).json({ error: 'Failed to generate attendance report' });
    }
  }

  async getComplianceReport(req: Request, res: Response) {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({ error: 'Start date and end date are required' });
      }

      const start = new Date(startDate as string);
      const end = new Date(endDate as string);

      const report = await timecardRepository.generateComplianceReport(tenantId, start, end);
      res.json(report);
    } catch (error) {
      console.error('Error generating compliance report:', error);
      res.status(500).json({ error: 'Failed to generate compliance report' });
    }
  }

  // Status atual do usuário
  async getCurrentStatus(req: Request, res: Response) {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const userId = req.params.userId;

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todayRecords = await timecardRepository.findTimeRecordsByDate(tenantId, today);
      const userRecords = todayRecords.filter(r => r.userId === userId);
      
      // Determinar status atual
      const lastRecord = userRecords[userRecords.length - 1];
      let status = 'not_started''[,;]
      
      if (lastRecord) {
        switch (lastRecord.recordType) {
          case 'clock_in':
            status = 'working''[,;]
            break;
          case 'clock_out':
            status = 'finished''[,;]
            break;
          case 'break_start':
            status = 'on_break''[,;]
            break;
          case 'break_end':
            status = 'working''[,;]
            break;
        }
      }

      const timesheet = await timecardRepository.findTimesheetByUserAndDate(userId, tenantId, today);
      
      res.json({
        status,
        todayRecords: userRecords,
        timesheet,
        lastRecord,
      });
    } catch (error) {
      console.error('Error fetching current status:', error);
      res.status(500).json({ error: 'Failed to fetch current status' });
    }
  }

  // ===== GESTÃO DE AUSÊNCIAS =====
  
  async createAbsenceRequest(req: Request, res: Response) {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      
      const schema = z.object({
        userId: z.string(),
        absenceType: z.enum(['vacation', 'sick_leave', 'maternity', 'paternity', 'bereavement', 'personal', 'justified_absence', 'unjustified_absence']),
        startDate: z.string().transform(str => new Date(str)),
        endDate: z.string().transform(str => new Date(str)),
        reason: z.string(),
        attachments: z.array(z.string()).optional(),
        medicalCertificate: z.string().optional(),
        coverUserId: z.string().optional(),
      });

      const data = schema.parse(req.body);
      
      // Calcular total de dias
      const totalDays = Math.ceil((data.endDate.getTime() - data.startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      
      const request = await timecardRepository.createAbsenceRequest(tenantId, {
        ...data,
        totalDays,
      });
      
      res.json(request);
    } catch (error) {
      console.error('Error creating absence request:', error);
      res.status(500).json({ error: 'Failed to create absence request' });
    }
  }

  async getUserAbsenceRequests(req: Request, res: Response) {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const userId = req.params.userId;
      
      const requests = await timecardRepository.findAbsenceRequestsByUser(userId, tenantId);
      res.json(requests);
    } catch (error) {
      console.error('Error fetching absence requests:', error);
      res.status(500).json({ error: 'Failed to fetch absence requests' });
    }
  }

  async getPendingAbsenceRequests(req: Request, res: Response) {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      
      const requests = await timecardRepository.findPendingAbsenceRequests(tenantId);
      res.json(requests);
    } catch (error) {
      console.error('Error fetching pending requests:', error);
      res.status(500).json({ error: 'Failed to fetch pending requests' });
    }
  }

  async approveAbsenceRequest(req: Request, res: Response) {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const reviewedBy = req.headers['x-user-id'] as string;
      const { requestId } = req.params;
      const { notes } = req.body;

      const approved = await timecardRepository.approveAbsenceRequest(requestId, tenantId, reviewedBy, notes);
      res.json(approved);
    } catch (error) {
      console.error('Error approving absence request:', error);
      res.status(500).json({ error: 'Failed to approve absence request' });
    }
  }

  // ===== TEMPLATES DE ESCALAS =====
  
  async createScheduleTemplate(req: Request, res: Response) {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const createdBy = req.headers['x-user-id'] as string;
      
      const schema = z.object({
        name: z.string(),
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
          shiftRotations: z.array(z.object({
            name: z.string(),
            startTime: z.string(),
            endTime: z.string(),
            daysOfWeek: z.array(z.number()),
          })).optional(),
        }),
        requiresApproval: z.boolean().optional(),
      });

      const data = schema.parse(req.body);
      
      const template = await timecardRepository.createScheduleTemplate(tenantId, {
        ...data,
        createdBy,
      });
      
      res.json(template);
    } catch (error) {
      console.error('Error creating schedule template:', error);
      res.status(500).json({ error: 'Failed to create schedule template' });
    }
  }

  async getScheduleTemplates(req: Request, res: Response) {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const isActive = req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined;
      
      const templates = await timecardRepository.findScheduleTemplates(tenantId, isActive);
      res.json(templates);
    } catch (error) {
      console.error('Error fetching schedule templates:', error);
      res.status(500).json({ error: 'Failed to fetch schedule templates' });
    }
  }

  // ===== TROCA DE TURNOS =====
  
  async createShiftSwapRequest(req: Request, res: Response) {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const requesterId = req.headers['x-user-id'] as string;
      
      const schema = z.object({
        targetUserId: z.string().optional(),
        originalShiftDate: z.string().transform(str => new Date(str)),
        originalShiftStart: z.string().transform(str => new Date(str)),
        originalShiftEnd: z.string().transform(str => new Date(str)),
        swapShiftDate: z.string().transform(str => new Date(str)).optional(),
        swapShiftStart: z.string().transform(str => new Date(str)).optional(),
        swapShiftEnd: z.string().transform(str => new Date(str)).optional(),
        swapType: z.enum(['direct_swap', 'coverage_request', 'time_off_request']),
        reason: z.string(),
        managerApprovalRequired: z.boolean().optional(),
      });

      const data = schema.parse(req.body);
      
      const request = await timecardRepository.createShiftSwapRequest(tenantId, {
        ...data,
        requesterId,
      });
      
      res.json(request);
    } catch (error) {
      console.error('Error creating shift swap request:', error);
      res.status(500).json({ error: 'Failed to create shift swap request' });
    }
  }

  async getShiftSwapRequests(req: Request, res: Response) {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const userId = req.query.userId as string;
      const status = req.query.status as string;
      
      const requests = await timecardRepository.findShiftSwapRequests(tenantId, userId, status);
      res.json(requests);
    } catch (error) {
      console.error('Error fetching shift swap requests:', error);
      res.status(500).json({ error: 'Failed to fetch shift swap requests' });
    }
  }

  // ===== JORNADAS FLEXÍVEIS =====
  
  async createFlexibleWorkArrangement(req: Request, res: Response) {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const approvedBy = req.headers['x-user-id'] as string;
      
      const schema = z.object({
        userId: z.string(),
        arrangementType: z.enum(['flexible_hours', 'remote_work', 'hybrid', 'compressed_workweek', 'job_sharing']),
        coreHoursStart: z.string().optional(),
        coreHoursEnd: z.string().optional(),
        flexWindowStart: z.string().optional(),
        flexWindowEnd: z.string().optional(),
        remoteWorkDays: z.array(z.number()).optional(),
        remoteWorkLocation: z.string().optional(),
        compressedWeekConfig: z.object({
          daysPerWeek: z.number(),
          hoursPerDay: z.number(),
          schedule: z.array(z.object({
            day: z.number(),
            startTime: z.string(),
            endTime: z.string(),
          })),
        }).optional(),
        multipleContracts: z.array(z.object({
          contractId: z.string(),
          role: z.string(),
          hoursPerWeek: z.number(),
          schedule: z.string(),
          location: z.string(),
        })).optional(),
        startDate: z.string().transform(str => new Date(str)),
        endDate: z.string().transform(str => new Date(str)).optional(),
      });

      const data = schema.parse(req.body);
      
      const arrangement = await timecardRepository.createFlexibleWorkArrangement(tenantId, {
        ...data,
        approvedBy,
        approvedAt: new Date(),
      });
      
      res.json(arrangement);
    } catch (error) {
      console.error('Error creating flexible work arrangement:', error);
      res.status(500).json({ error: 'Failed to create flexible work arrangement' });
    }
  }

  async getFlexibleWorkArrangements(req: Request, res: Response) {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const userId = req.query.userId as string;
      
      const arrangements = await timecardRepository.findFlexibleWorkArrangements(tenantId, userId);
      res.json(arrangements);
    } catch (error) {
      console.error('Error fetching flexible work arrangements:', error);
      res.status(500).json({ error: 'Failed to fetch flexible work arrangements' });
    }
  }

  // ===== NOTIFICAÇÕES =====
  
  async getUserNotifications(req: Request, res: Response) {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const userId = req.params.userId;
      const unreadOnly = req.query.unreadOnly === 'true''[,;]
      
      const notifications = await timecardRepository.findUserNotifications(userId, tenantId, unreadOnly);
      res.json(notifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      res.status(500).json({ error: 'Failed to fetch notifications' });
    }
  }

  async markNotificationAsRead(req: Request, res: Response) {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const userId = req.headers['x-user-id'] as string;
      const { notificationId } = req.params;
      
      const updated = await timecardRepository.markNotificationAsRead(notificationId, tenantId, userId);
      res.json(updated);
    } catch (error) {
      console.error('Error marking notification as read:', error);
      res.status(500).json({ error: 'Failed to mark notification as read' });
    }
  }

  // ===== GESTÃO BULK DE ESCALAS =====

  async applyScheduleToMultipleUsers(req: Request, res: Response) {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const assignedBy = req.headers['x-user-id'] as string;
      const { templateId, userIds, startDate } = req.body;

      if (!templateId || !userIds || !Array.isArray(userIds) || userIds.length === 0) {
        return res.status(400).json({ 
          error: 'Template ID e lista de usuários são obrigatórios' 
        });
      }

      const schedules = await timecardRepository.applyScheduleTemplateToMultipleUsers(
        templateId,
        userIds,
        tenantId,
        new Date(startDate),
        assignedBy
      );

      res.json({
        success: true,
        message: `Escala aplicada para ${userIds.length} funcionários`,
        schedules,
        applied_count: schedules.length
      });
    } catch (error) {
      console.error('Error applying schedule to multiple users:', error);
      res.status(500).json({ error: 'Failed to apply schedule to multiple users' });
    }
  }

  async getAvailableUsers(req: Request, res: Response) {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const excludeUserIds = req.query.exclude ? 
        (req.query.exclude as string).split(',') : [];

      const users = await timecardRepository.findAvailableUsersForSchedule(tenantId, excludeUserIds);
      res.json(users);
    } catch (error) {
      console.error('Error fetching available users:', error);
      res.status(500).json({ error: 'Failed to fetch available users' });
    }
  }

  async getSchedulesByUsers(req: Request, res: Response) {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const userIds = req.query.userIds ? 
        (req.query.userIds as string).split(',') : [];

      if (userIds.length === 0) {
        return res.status(400).json({ error: 'Lista de usuários é obrigatória' });
      }

      const schedules = await timecardRepository.findActiveSchedulesByUsers(userIds, tenantId);
      res.json(schedules);
    } catch (error) {
      console.error('Error fetching schedules by users:', error);
      res.status(500).json({ error: 'Failed to fetch schedules by users' });
    }
  }

  async getTemplateApplicationHistory(req: Request, res: Response) {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const { templateId } = req.params;

      const history = await timecardRepository.findTemplateApplicationHistory(templateId, tenantId);
      res.json(history);
    } catch (error) {
      console.error('Error fetching template application history:', error);
      res.status(500).json({ error: 'Failed to fetch template application history' });
    }
  }

  async removeScheduleFromMultipleUsers(req: Request, res: Response) {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const { templateId, userIds } = req.body;

      if (!templateId || !userIds || !Array.isArray(userIds) || userIds.length === 0) {
        return res.status(400).json({ 
          error: 'Template ID e lista de usuários são obrigatórios' 
        });
      }

      const removedCount = await timecardRepository.removeSchedulesFromMultipleUsers(
        userIds,
        templateId,
        tenantId
      );

      res.json({
        success: true,
        message: `${removedCount} escalas removidas com sucesso`,
        removed_count: removedCount
      });
    } catch (error) {
      console.error('Error removing schedules from multiple users:', error);
      res.status(500).json({ error: 'Failed to remove schedules from multiple users' });
    }
  }
}