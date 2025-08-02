import { Router, Request, Response } from 'express';
import { TimecardController } from '../modules/timecard/application/controllers/TimecardController';
import { jwtAuth } from '../middleware/jwtAuth';
import { AuthenticatedRequest } from '../middleware/jwtAuth';
import { db } from '../db';
import { users } from '../db/schema';
import { scheduleTemplates as scheduleTemplatesTable } from '@shared/schema';
import { eq, and, sql } from 'drizzle-orm';

const router = Router();
const timecardController = new TimecardController();

// Aplicar autenticação JWT em todas as rotas
router.use(jwtAuth);

// Timecard Entries
router.get('/current-status', timecardController.getCurrentStatus);
router.post('/timecard-entries', timecardController.createTimecardEntry);
router.get('/users/:userId/timecard-entries', timecardController.getTimecardEntriesByUser);
router.put('/timecard-entries/:id', timecardController.updateTimecardEntry);
router.delete('/timecard-entries/:id', timecardController.deleteTimecardEntry);

// Work Schedules
router.get('/work-schedules', timecardController.getAllWorkSchedules);
router.get('/work-schedules/user/:userId', timecardController.getWorkSchedulesByUser);
router.post('/work-schedules', timecardController.createWorkSchedule);
router.put('/work-schedules/:id', timecardController.updateWorkSchedule);
router.delete('/work-schedules/:id', timecardController.deleteWorkSchedule);

// Absence Requests
router.post('/absence-requests', timecardController.createAbsenceRequest);
router.get('/users/:userId/absence-requests', timecardController.getAbsenceRequestsByUser);
router.get('/absence-requests/pending', timecardController.getPendingAbsenceRequests);
router.put('/absence-requests/:id/approve', timecardController.approveAbsenceRequest);
router.put('/absence-requests/:id/reject', timecardController.rejectAbsenceRequest);

// Schedule Templates
router.post('/schedule-templates', timecardController.createScheduleTemplate);
router.get('/schedule-templates', timecardController.getScheduleTemplates);
router.get('/schedule-templates/all', timecardController.getAllScheduleOptions);
router.put('/schedule-templates/:id', timecardController.updateScheduleTemplate);
router.delete('/schedule-templates/:id', timecardController.deleteScheduleTemplate);

// Hour Bank
router.get('/users/:userId/hour-bank', timecardController.getHourBankByUser);

// Flexible Work Arrangements
router.post('/flexible-work-arrangements', timecardController.createFlexibleWorkArrangement);
router.get('/flexible-work-arrangements', timecardController.getFlexibleWorkArrangements);

// User Notifications
router.get('/users/:userId/notifications', timecardController.getUserNotifications);
router.put('/notifications/:id/read', timecardController.markNotificationAsRead);

// Shift Swap Requests
router.post('/shift-swap-requests', timecardController.createShiftSwapRequest);
router.get('/shift-swap-requests', timecardController.getShiftSwapRequests);

// Rota para buscar usuários disponíveis para escalas
router.get('/available-users', async (req: AuthenticatedRequest, res) => {
  try {
    const { user } = req;
    if (!user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    console.log('[TIMECARD-USERS] Fetching available users for tenant:', user.tenantId);

    // Buscar usuários ativos do tenant
    const availableUsers = await db.select({
      id: users.id,
      name: sql<string>`COALESCE(${users.name}, CONCAT(COALESCE(${users.firstName}, ''), ' ', COALESCE(${users.lastName}, '')))`.as('name'),
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
      role: users.role,
      position: users.position,
      department: users.department,
      isActive: users.isActive
    })
    .from(users)
    .where(and(
      eq(users.tenantId, user.tenantId),
      eq(users.isActive, true)
    ))
    .orderBy(users.firstName, users.lastName);

    console.log('[TIMECARD-USERS] Found users:', availableUsers.length);

    res.json({ users: availableUsers });
  } catch (error) {
    console.error('Error fetching available users for timecard:', error);
    res.status(500).json({ message: 'Failed to fetch available users' });
  }
});

// Rota para buscar templates de escala
router.get('/schedule-templates', async (req: AuthenticatedRequest, res) => {
  try {
    const { user } = req;
    if (!user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const scheduleTemplates = await db.select().from(scheduleTemplatesTable).where(eq(scheduleTemplatesTable.tenantId, user.tenantId));
    res.json(scheduleTemplates);
  } catch (error) {
    console.error('Error fetching schedule templates:', error);
    res.status(500).json({ message: 'Failed to fetch schedule templates' });
  }
});

export { router as timecardRoutes };