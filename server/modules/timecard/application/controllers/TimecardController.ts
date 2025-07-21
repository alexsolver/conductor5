import { Request, Response } from 'express';
import { DrizzleTimecardRepository } from '../../infrastructure/repositories/DrizzleTimecardRepository';
import { CreateTimeRecordRequest } from '../../domain/entities/TimeRecord';
import { z } from 'zod';

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
      const schedule = await timecardRepository.createWorkSchedule(tenantId, data);
      
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
      let status = 'not_started';
      
      if (lastRecord) {
        switch (lastRecord.recordType) {
          case 'clock_in':
            status = 'working';
            break;
          case 'clock_out':
            status = 'finished';
            break;
          case 'break_start':
            status = 'on_break';
            break;
          case 'break_end':
            status = 'working';
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
}