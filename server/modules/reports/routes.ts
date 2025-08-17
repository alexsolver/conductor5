// ✅ 1QA.MD COMPLIANCE: REPORTS MODULE ROUTES
// Infrastructure Layer - HTTP Routes Definition

import { Router } from 'express';
import { ReportsController } from './application/controllers/ReportsController';
import { DashboardsController } from './application/controllers/DashboardsController';

// Initialize routers
const router = Router();

// Factory function to create routes with dependency injection
export function createReportsRoutes(
  reportsController: ReportsController,
  dashboardsController: DashboardsController
): Router {
  
  // ==================== REPORTS ROUTES ====================
  
  // Core Reports CRUD
  router.post('/reports', (req, res) => reportsController.createReport(req, res));
  router.get('/reports', (req, res) => reportsController.findReports(req, res));
  router.get('/reports/:id', (req, res) => reportsController.findReports(req, res));
  router.put('/reports/:id', (req, res) => reportsController.updateReport(req, res));
  router.delete('/reports/:id', (req, res) => reportsController.deleteReport(req, res));
  
  // Report Execution
  router.post('/reports/:id/execute', (req, res) => reportsController.executeReport(req, res));
  router.get('/reports/:id/executions', (req, res) => reportsController.getReportExecutions(req, res));
  
  // ✅ NEW: Module Integration Routes
  router.get('/modules/data-sources', (req, res) => reportsController.getModuleDataSources(req, res));
  router.post('/modules/query', (req, res) => reportsController.executeModuleQuery(req, res));
  router.get('/modules/:moduleName/templates', (req, res) => reportsController.getModuleTemplates(req, res));
  
  // ==================== DASHBOARDS ROUTES ====================
  
  // Core Dashboards CRUD
  router.post('/dashboards', (req, res) => dashboardsController.createDashboard(req, res));
  router.get('/dashboards', (req, res) => dashboardsController.findDashboards(req, res));
  router.get('/dashboards/:id', (req, res) => dashboardsController.findDashboards(req, res));
  router.put('/dashboards/:id', (req, res) => dashboardsController.updateDashboard(req, res));
  router.delete('/dashboards/:id', (req, res) => dashboardsController.deleteDashboard(req, res));
  
  // Dashboard Widgets
  router.post('/dashboards/:id/widgets', (req, res) => dashboardsController.addWidget(req, res));
  router.put('/dashboards/:dashboardId/widgets/:widgetId', (req, res) => dashboardsController.updateWidget(req, res));
  router.delete('/dashboards/:dashboardId/widgets/:widgetId', (req, res) => dashboardsController.removeWidget(req, res));
  
  // ✅ NEW: Real-time Dashboard Features
  router.get('/dashboards/:id/real-time-data', (req, res) => dashboardsController.getRealTimeData(req, res));
  router.post('/dashboards/:id/share', (req, res) => dashboardsController.shareDashboard(req, res));
  router.get('/dashboards/shared/:token', (req, res) => dashboardsController.getSharedDashboard(req, res));
  
  // ==================== TEMPLATE ROUTES ====================
  
  // Template Management
  router.get('/templates', (req, res) => reportsController.getAvailableTemplates(req, res));
  router.post('/templates', (req, res) => reportsController.createTemplate(req, res));
  router.get('/templates/:id', (req, res) => reportsController.getTemplate(req, res));
  router.put('/templates/:id', (req, res) => reportsController.updateTemplate(req, res));
  router.delete('/templates/:id', (req, res) => reportsController.deleteTemplate(req, res));
  
  // ✅ NEW: Template Features
  router.post('/templates/:id/clone', (req, res) => reportsController.cloneTemplate(req, res));
  router.get('/templates/module/:moduleName', (req, res) => reportsController.getModuleTemplates(req, res));
  
  // ==================== EXPORT ROUTES ====================
  
  // Multi-format Export
  router.post('/reports/:id/export/pdf', (req, res) => reportsController.exportToPDF(req, res));
  router.post('/reports/:id/export/excel', (req, res) => reportsController.exportToExcel(req, res));
  router.post('/reports/:id/export/csv', (req, res) => reportsController.exportToCSV(req, res));
  
  // ✅ NEW: WYSIWYG PDF Designer
  router.post('/reports/:id/design/pdf', (req, res) => reportsController.designPDF(req, res));
  router.get('/reports/:id/design/preview', (req, res) => reportsController.previewDesign(req, res));
  
  // ==================== SCHEDULING ROUTES ====================
  
  // ✅ NEW: Intelligent Scheduling
  router.post('/reports/:id/schedule', (req, res) => reportsController.scheduleReport(req, res));
  router.get('/reports/:id/schedules', (req, res) => reportsController.getReportSchedules(req, res));
  router.put('/schedules/:scheduleId', (req, res) => reportsController.updateSchedule(req, res));
  router.delete('/schedules/:scheduleId', (req, res) => reportsController.deleteSchedule(req, res));
  
  // ==================== NOTIFICATION ROUTES ====================
  
  // ✅ NEW: Notification Integration  
  router.post('/reports/:id/notifications', (req, res) => reportsController.configureNotifications(req, res));
  router.get('/reports/:id/notifications', (req, res) => reportsController.getNotificationSettings(req, res));
  router.post('/notifications/test', (req, res) => reportsController.testNotification(req, res));
  
  // ==================== APPROVAL WORKFLOW ROUTES ====================
  
  // ✅ NEW: Approval Integration
  router.post('/reports/:id/submit-approval', (req, res) => reportsController.submitForApproval(req, res));
  router.get('/reports/:id/approval-status', (req, res) => reportsController.getApprovalStatus(req, res));
  router.post('/reports/:id/approve', (req, res) => reportsController.approveReport(req, res));
  router.post('/reports/:id/reject', (req, res) => reportsController.rejectReport(req, res));
  
  // ==================== QUERY BUILDER ROUTES ====================
  
  // ✅ NEW: Visual Query Builder
  router.get('/query-builder/modules', (req, res) => reportsController.getQueryBuilderModules(req, res));
  router.post('/query-builder/validate', (req, res) => reportsController.validateQuery(req, res));
  router.post('/query-builder/execute', (req, res) => reportsController.executeQueryBuilder(req, res));
  router.post('/query-builder/save', (req, res) => reportsController.saveQuery(req, res));
  
  // ==================== ANALYTICS ROUTES ====================
  
  // ✅ NEW: Advanced Analytics
  router.get('/analytics/usage', (req, res) => reportsController.getUsageAnalytics(req, res));
  router.get('/analytics/performance', (req, res) => reportsController.getPerformanceMetrics(req, res));
  router.get('/analytics/trends', (req, res) => reportsController.getTrendAnalysis(req, res));
  
  return router;
}

export default router;