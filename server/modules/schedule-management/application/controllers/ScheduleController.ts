// Schedule Controller - Application Layer
// Using DTOs instead of express types in application layer
import { z } from 'zod';
import { IScheduleRepository } from '../../domain/ports/IScheduleRepository';

// Validation schemas
const createScheduleSchema = z.object({
  agentId: z.string().uuid(),
  customerId: z.string().uuid().optional(),
  activityTypeId: z.string().uuid(),
  title: z.string().min(1, 'Título é obrigatório'),
  description: z.string().optional(),
  startDateTime: z.string().datetime(),
  duration: z.number().min(15, 'Duração mínima de 15 minutos'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  locationAddress: z.string().optional(),
  coordinates: z.object({
    lat: z.number(),
    lng: z.number(),
  }).optional(),
  internalNotes: z.string().optional(),
  clientNotes: z.string().optional(),
  estimatedTravelTime: z.number().optional(),
  isRecurring: z.boolean().default(false),
  recurringPattern: z.object({
    type: z.enum(['daily', 'weekly', 'monthly']),
    interval: z.number().min(1),
  }).optional(),
});

const updateScheduleSchema = createScheduleSchema.partial();

const createActivityTypeSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Cor deve estar em formato hexadecimal'),
  duration: z.number().min(15, 'Duração mínima de 15 minutos'),
  category: z.enum(['visita_tecnica', 'instalacao', 'manutencao', 'suporte']),
});

const createAvailabilitySchema = z.object({
  agentId: z.string().uuid(),
  dayOfWeek: z.number().min(0).max(6),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido (HH:MM)'),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido (HH:MM)'),
  breakStartTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  breakEndTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  isAvailable: z.boolean().default(true),
  maxAppointments: z.number().min(1).default(8),
  preferredZones: z.array(z.string()).optional(),
});

export class ScheduleController {
  constructor(
    private scheduleRepository: IScheduleRepository
  ) {}

  // Schedule endpoints
  createSchedule = async (req: Request, res: Response) => {
    try {
      const { tenantId } = (req as any).user;
      const validatedData = createScheduleSchema.parse(req.body);
      
      const startDateTime = new Date(validatedData.startDateTime);
      const endDateTime = new Date(startDateTime.getTime() + validatedData.duration * 60000);
      
      // Check for conflicts
      const conflicts = await this.scheduleRepository.detectConflicts({
        ...validatedData,
        tenantId,
        startDateTime,
        endDateTime,
      }, tenantId);
      
      if (conflicts.length > 0) {
        return res.status(409).json({
          message: 'Conflito de horário detectado',
          conflicts: conflicts.map(c => ({
            type: c.conflictType,
            details: c.conflictDetails,
            severity: c.severity,
          })),
        });
      }
      
      const schedule = await this.scheduleRepository.createSchedule({
        ...validatedData,
        tenantId,
        startDateTime,
        endDateTime,
        status: 'scheduled',
      });
      
      res.status(201).json(schedule);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Dados inválidos', errors: error.errors });
      }
      console.error('Error creating schedule:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  };

  getSchedulesByDateRange = async (req: Request, res: Response) => {
    try {
      const { tenantId } = (req as any).user;
      const { startDate, endDate } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({ message: 'startDate e endDate são obrigatórios' });
      }
      
      const schedules = await this.scheduleRepository.getSchedulesByDateRange(
        tenantId,
        new Date(startDate as string),
        new Date(endDate as string)
      );
      
      res.json({ schedules });
    } catch (error) {
      console.error('Error fetching schedules by date range:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  };

  getSchedulesByAgent = async (req: Request, res: Response) => {
    try {
      const { tenantId } = (req as any).user;
      const { agentId } = req.params;
      const { startDate, endDate } = req.query;
      
      const schedules = await this.scheduleRepository.getSchedulesByAgent(
        agentId,
        tenantId,
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );
      
      res.json({ schedules });
    } catch (error) {
      console.error('Error fetching schedules by agent:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  };

  updateSchedule = async (req: Request, res: Response) => {
    try {
      const { tenantId } = (req as any).user;
      const { id } = req.params;
      const validatedData = updateScheduleSchema.parse(req.body);
      
      let updateData: any = { ...validatedData };
      
      if (validatedData.startDateTime && validatedData.duration) {
        const startDateTime = new Date(validatedData.startDateTime);
        const endDateTime = new Date(startDateTime.getTime() + validatedData.duration * 60000);
        updateData.startDateTime = startDateTime;
        updateData.endDateTime = endDateTime;
        
        // Check for conflicts when updating time
        const conflicts = await this.scheduleRepository.detectConflicts({
          id,
          ...updateData,
          tenantId,
        }, tenantId);
        
        if (conflicts.length > 0) {
          return res.status(409).json({
            message: 'Conflito de horário detectado',
            conflicts: conflicts.map(c => ({
              type: c.conflictType,
              details: c.conflictDetails,
              severity: c.severity,
            })),
          });
        }
      }
      
      const schedule = await this.scheduleRepository.updateSchedule(id, tenantId, updateData);
      res.json(schedule);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Dados inválidos', errors: error.errors });
      }
      console.error('Error updating schedule:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  };

  deleteSchedule = async (req: Request, res: Response) => {
    try {
      const { tenantId } = (req as any).user;
      const { id } = req.params;
      
      await this.scheduleRepository.deleteSchedule(id, tenantId);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting schedule:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  };

  // Activity Types endpoints
  createActivityType = async (req: Request, res: Response) => {
    try {
      const { tenantId } = (req as any).user;
      const validatedData = createActivityTypeSchema.parse(req.body);
      
      const activityType = await this.scheduleRepository.createActivityType({
        ...validatedData,
        tenantId,
        isActive: true,
      });
      
      res.status(201).json(activityType);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Dados inválidos', errors: error.errors });
      }
      console.error('Error creating activity type:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  };

  getActivityTypes = async (req: Request, res: Response) => {
    try {
      const { tenantId } = (req as any).user;
      const activityTypes = await this.scheduleRepository.getActivityTypes(tenantId);
      res.json({ activityTypes });
    } catch (error) {
      console.error('Error fetching activity types:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  };

  // Agent Availability endpoints
  createAgentAvailability = async (req: Request, res: Response) => {
    try {
      const { tenantId } = (req as any).user;
      const validatedData = createAvailabilitySchema.parse(req.body);
      
      const availability = await this.scheduleRepository.createAgentAvailability({
        ...validatedData,
        tenantId,
      });
      
      res.status(201).json(availability);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Dados inválidos', errors: error.errors });
      }
      console.error('Error creating agent availability:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  };

  getAgentAvailability = async (req: Request, res: Response) => {
    try {
      const { tenantId } = (req as any).user;
      const { agentId } = req.params;
      
      const availability = await this.scheduleRepository.getAgentAvailability(agentId, tenantId);
      res.json({ availability });
    } catch (error) {
      console.error('Error fetching agent availability:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  };

  // Analytics endpoints
  getAgentScheduleStats = async (req: Request, res: Response) => {
    try {
      const { tenantId } = (req as any).user;
      const { agentId } = req.params;
      const { startDate, endDate } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({ message: 'startDate e endDate são obrigatórios' });
      }
      
      const stats = await this.scheduleRepository.getAgentScheduleStats(
        agentId,
        tenantId,
        new Date(startDate as string),
        new Date(endDate as string)
      );
      
      res.json(stats);
    } catch (error) {
      console.error('Error fetching agent schedule stats:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  };

  getTeamScheduleOverview = async (req: Request, res: Response) => {
    try {
      const { tenantId } = (req as any).user;
      const { startDate, endDate } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({ message: 'startDate e endDate são obrigatórios' });
      }
      
      const overview = await this.scheduleRepository.getTeamScheduleOverview(
        tenantId,
        new Date(startDate as string),
        new Date(endDate as string)
      );
      
      res.json(overview);
    } catch (error) {
      console.error('Error fetching team schedule overview:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  };

  searchSchedules = async (req: Request, res: Response) => {
    try {
      const { tenantId } = (req as any).user;
      const {
        agentIds,
        customerIds,
        activityTypeIds,
        statuses,
        priorities,
        startDate,
        endDate,
        searchText,
      } = req.query;
      
      const filters: any = {};
      
      if (agentIds) filters.agentIds = (agentIds as string).split(',');
      if (customerIds) filters.customerIds = (customerIds as string).split(',');
      if (activityTypeIds) filters.activityTypeIds = (activityTypeIds as string).split(',');
      if (statuses) filters.statuses = (statuses as string).split(',');
      if (priorities) filters.priorities = (priorities as string).split(',');
      if (startDate) filters.startDate = new Date(startDate as string);
      if (endDate) filters.endDate = new Date(endDate as string);
      if (searchText) filters.searchText = searchText as string;
      
      const schedules = await this.scheduleRepository.searchSchedules(tenantId, filters);
      res.json({ schedules });
    } catch (error) {
      console.error('Error searching schedules:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  };

  createRecurringSchedules = async (req: Request, res: Response) => {
    try {
      const { tenantId } = (req as any).user;
      const { recurrenceEnd, ...scheduleData } = req.body;
      
      const validatedData = createScheduleSchema.parse(scheduleData);
      
      if (!validatedData.isRecurring || !validatedData.recurringPattern) {
        return res.status(400).json({ message: 'Padrão de recorrência é obrigatório' });
      }
      
      if (!recurrenceEnd) {
        return res.status(400).json({ message: 'Data final da recorrência é obrigatória' });
      }
      
      const startDateTime = new Date(validatedData.startDateTime);
      const endDateTime = new Date(startDateTime.getTime() + validatedData.duration * 60000);
      
      const schedules = await this.scheduleRepository.createRecurringSchedules(
        {
          ...validatedData,
          tenantId,
          startDateTime,
          endDateTime,
          status: 'scheduled',
        },
        new Date(recurrenceEnd)
      );
      
      res.status(201).json({ schedules, count: schedules.length });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Dados inválidos', errors: error.errors });
      }
      console.error('Error creating recurring schedules:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  };
}