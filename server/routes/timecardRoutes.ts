import { Router } from 'express''[,;]
import { TimecardController } from '../modules/timecard/application/controllers/TimecardController''[,;]

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

// ===== NOVAS FUNCIONALIDADES: GESTÃO AVANÇADA DE JORNADAS =====

// Gestão de Ausências
router.post('/absence-requests', timecardController.createAbsenceRequest.bind(timecardController));
router.get('/users/:userId/absence-requests', timecardController.getUserAbsenceRequests.bind(timecardController));
router.get('/absence-requests/pending', timecardController.getPendingAbsenceRequests.bind(timecardController));
router.put('/absence-requests/:requestId/approve', timecardController.approveAbsenceRequest.bind(timecardController));

// Templates de Escalas
router.post('/schedule-templates', timecardController.createScheduleTemplate.bind(timecardController));
router.get('/schedule-templates', timecardController.getScheduleTemplates.bind(timecardController));

// Gestão Bulk de Escalas - UX Melhorada
router.post('/schedules/apply-to-multiple-users', timecardController.applyScheduleToMultipleUsers.bind(timecardController));
router.get('/schedules/available-users', timecardController.getAvailableUsers.bind(timecardController));
router.get('/schedules/by-users', timecardController.getSchedulesByUsers.bind(timecardController));
router.get('/schedule-templates/:templateId/history', timecardController.getTemplateApplicationHistory.bind(timecardController));
router.delete('/schedules/remove-from-multiple-users', timecardController.removeScheduleFromMultipleUsers.bind(timecardController));

// Troca de Turnos
router.post('/shift-swap-requests', timecardController.createShiftSwapRequest.bind(timecardController));
router.get('/shift-swap-requests', timecardController.getShiftSwapRequests.bind(timecardController));

// Jornadas Flexíveis
router.post('/flexible-work-arrangements', timecardController.createFlexibleWorkArrangement.bind(timecardController));
router.get('/flexible-work-arrangements', timecardController.getFlexibleWorkArrangements.bind(timecardController));

// Notificações
router.get('/users/:userId/notifications', timecardController.getUserNotifications.bind(timecardController));
router.put('/notifications/:notificationId/read', timecardController.markNotificationAsRead.bind(timecardController));

export default router;