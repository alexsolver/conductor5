import { Router } from 'express';
import { TimecardController } from '../modules/timecard/application/controllers/TimecardController';

const router = Router();
const timecardController = new TimecardController();

// Time Records - Registro de Ponto
router.post('/records', timecardController.createTimeRecord.bind(timecardController));
router.get('/users/:userId/records', timecardController.getUserTimeRecords.bind(timecardController));
router.get('/users/:userId/status', timecardController.getCurrentStatus.bind(timecardController));

// Timesheets - Espelho de Ponto
router.post('/users/:userId/timesheets/generate', timecardController.generateTimesheet.bind(timecardController));
router.get('/users/:userId/timesheets', timecardController.getUserTimesheets.bind(timecardController));
router.put('/timesheets/:timesheetId/approve', timecardController.approveTimesheet.bind(timecardController));
router.put('/timesheets/:timesheetId/sign', timecardController.signTimesheet.bind(timecardController));

// Hour Bank - Banco de Horas
router.get('/users/:userId/hour-bank', timecardController.getHourBank.bind(timecardController));

// Work Schedules - Escalas de Trabalho
router.post('/schedules', timecardController.createWorkSchedule.bind(timecardController));
router.get('/schedules', timecardController.getWorkSchedules.bind(timecardController));

// Alerts - Alertas
router.get('/alerts', timecardController.getActiveAlerts.bind(timecardController));
router.put('/alerts/:alertId/resolve', timecardController.resolveAlert.bind(timecardController));

// Reports - Relatórios
router.get('/users/:userId/reports/working-hours', timecardController.getUserWorkingHoursReport.bind(timecardController));
router.get('/reports/overtime', timecardController.getTenantOvertimeReport.bind(timecardController));
router.get('/reports/attendance', timecardController.getAttendanceReport.bind(timecardController));
router.get('/reports/compliance', timecardController.getComplianceReport.bind(timecardController));

export default router;