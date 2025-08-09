import { Router } from 'express';
import { jwtAuth } from '../../middleware/jwtAuth';
import { TimecardController } from './application/controllers/TimecardController';

const timecardRouter = Router();
const timecardController = new TimecardController();

// Work Schedules routes - usando TimecardController unificado
timecardRouter.get('/work-schedules', jwtAuth, timecardController.getAllWorkSchedules.bind(timecardController));

timecardRouter.post('/work-schedules', jwtAuth, timecardController.createWorkSchedule.bind(timecardController));

timecardRouter.put('/work-schedules/:id', jwtAuth, timecardController.updateWorkSchedule.bind(timecardController));

timecardRouter.delete('/work-schedules/:id', jwtAuth, timecardController.deleteWorkSchedule.bind(timecardController));

timecardRouter.post('/work-schedules/bulk-assign', jwtAuth, timecardController.createBulkWorkSchedules.bind(timecardController));

// Schedule Templates routes
timecardRouter.get('/schedule-templates', jwtAuth, timecardController.getScheduleTemplates.bind(timecardController));

timecardRouter.post('/schedule-templates', jwtAuth, timecardController.createScheduleTemplate.bind(timecardController));

timecardRouter.put('/schedule-templates/:id', jwtAuth, timecardController.updateScheduleTemplate.bind(timecardController));

timecardRouter.delete('/schedule-templates/:id', jwtAuth, timecardController.deleteScheduleTemplate.bind(timecardController));

// Template Assignment routes
timecardRouter.post('/work-schedules/assign-template/:templateId', jwtAuth, timecardController.assignTemplateToUsers.bind(timecardController));

// Users route for dropdowns
timecardRouter.get('/users', jwtAuth, timecardController.getUsers.bind(timecardController));

// Timecard Entries routes
timecardRouter.get('/entries', jwtAuth, timecardController.getTimecardEntriesByUser.bind(timecardController));

timecardRouter.post('/timecard-entries', jwtAuth, timecardController.createTimecardEntry.bind(timecardController));

// Legacy route for compatibility
timecardRouter.post('/entries', jwtAuth, timecardController.createTimecardEntry.bind(timecardController));

// Hour Bank routes
timecardRouter.get('/hour-bank/summary', jwtAuth, timecardController.getHourBankSummary.bind(timecardController));

timecardRouter.get('/hour-bank/:userId', jwtAuth, timecardController.getHourBankByUser.bind(timecardController));

timecardRouter.get('/hour-bank/movements/:userId/:month', jwtAuth, timecardController.getHourBankMovements.bind(timecardController));

// Absence Requests routes
timecardRouter.get('/absence-requests/pending', jwtAuth, timecardController.getPendingAbsenceRequests.bind(timecardController));

// Reports routes with error handling wrapper
timecardRouter.get('/reports/attendance/:period', jwtAuth, async (req, res) => {
  try {
    console.log('[TIMECARD-ROUTES] Processing attendance report request for period:', req.params.period);
    res.setHeader('Content-Type', 'application/json');
    
    // Check if response was already sent
    if (res.headersSent) {
      console.log('[TIMECARD-ROUTES] Response already sent, skipping');
      return;
    }
    
    await timecardController.getAttendanceReport(req, res);
  } catch (error) {
    console.error('[TIMECARD-ROUTES] Error in attendance report:', error);
    
    // Only send error if response wasn't sent yet
    if (!res.headersSent) {
      res.setHeader('Content-Type', 'application/json');
      res.status(500).json({
        success: false,
        error: 'Erro ao gerar relatório de frequência',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
});

timecardRouter.get('/reports/overtime/:period', jwtAuth, async (req, res) => {
  try {
    console.log('[TIMECARD-ROUTES] Processing overtime report request for period:', req.params.period);
    res.setHeader('Content-Type', 'application/json');
    
    // Check if response was already sent
    if (res.headersSent) {
      console.log('[TIMECARD-ROUTES] Response already sent, skipping');
      return;
    }
    
    await timecardController.getOvertimeReport(req, res);
  } catch (error) {
    console.error('[TIMECARD-ROUTES] Error in overtime report:', error);
    
    // Only send error if response wasn't sent yet
    if (!res.headersSent) {
      res.setHeader('Content-Type', 'application/json');
      res.status(500).json({
        success: false,
        error: 'Erro ao gerar relatório de horas extras',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
});

timecardRouter.get('/reports/compliance/:period', jwtAuth, async (req, res) => {
  try {
    console.log('[TIMECARD-ROUTES] Processing compliance report request for period:', req.params.period);
    res.setHeader('Content-Type', 'application/json');
    
    // Check if response was already sent
    if (res.headersSent) {
      console.log('[TIMECARD-ROUTES] Response already sent, skipping');
      return;
    }
    
    await timecardController.getComplianceReport(req, res);
  } catch (error) {
    console.error('[TIMECARD-ROUTES] Error in compliance report:', error);
    
    // Only send error if response wasn't sent yet
    if (!res.headersSent) {
      res.setHeader('Content-Type', 'application/json');
      res.status(500).json({
        success: false,
        error: 'Erro ao gerar relatório de compliance',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
});

// Current status route
timecardRouter.get('/current-status', jwtAuth, timecardController.getCurrentStatus.bind(timecardController));

export { timecardRouter };