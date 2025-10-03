import { QueryClientProvider } from "@tanstack/react-query";
import { Route, Switch } from "wouter";

// Auth
import { AuthProvider, useAuth } from "./hooks/useAuth";
import { queryClient } from "./lib/queryClient";
import { SimpleTimerProvider } from "./contexts/SimpleTimerContext";
import { SidebarProvider } from "./contexts/SidebarContext";

// UI Components
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

// Pages
import AuthPage from "./pages/AuthPage";
import Dashboard from "./pages/Dashboard";
import TicketsTable from "./pages/TicketsTable";
import TicketDetails from "./pages/TicketDetails";
// CustomersTable removed - unified with Clientes.tsx
import Beneficiaries from "./pages/Beneficiaries";
// Locations import moved below to avoid duplication

import Analytics from "./pages/Analytics";
import AutomationRules from "./pages/AutomationRules";
import Settings from "./pages/SettingsSimple";
import SecuritySettings from "./pages/SecuritySettings";

import WorkSchedules from "./pages/WorkSchedules";
import TimecardReports from './pages/TimecardReports';
import CertificateManager from './pages/CertificateManager';
import TranslationManager from './pages/TranslationManager';
import HourBank from "./pages/HourBank";
import SaasAdmin from "./pages/SaasAdmin";
import TenantAdmin from "./pages/TenantAdmin";
import TenantProvisioning from "./pages/TenantProvisioning";
import Tenants from "./pages/Tenants";
import SaasAdminPerformance from "./pages/SaasAdminPerformance";
import SaasAdminBilling from "./pages/SaasAdminBilling";
import SaasAdminDisasterRecovery from "./pages/SaasAdminDisasterRecovery";
import SaasAdminIntegrations from "./pages/SaasAdminIntegrations";

import TenantAdminWorkflows from "./pages/TenantAdminWorkflows";
// Removed TenantAdminSLAs - replaced with new SLA module
import TenantAdminIntegrations from "./pages/TenantAdminIntegrations";
import TenantAdminBranding from "./pages/TenantAdminBranding";
import TenantAdminGeral from "./pages/TenantAdminGeral";
import ModuleIntegrityControl from "./pages/ModuleIntegrityControl";
import TicketConfiguration from "./pages/TicketConfiguration";
import { UserManagement } from "./pages/UserManagement";
// Removed: MultiTenantManagement - functionality eliminated from system
import NotFound from "./pages/not-found";
import { TemplateSelector } from "./pages/TemplateSelector";
import InternalForms from './pages/InternalForms';
import Companies from "./pages/Companies";
import TicketTemplates from "./pages/TicketTemplates";
import SlaManagement from "./pages/SlaManagement";

// Removed: ExternalContactsManagement - functionality eliminated
// Removed: Projects and ProjectActions - module completely eliminated
// Removed: OmniBridge import
// Removed: JourneyControl - functionality eliminated from system
import Timecard from "./pages/Timecard";
import TimecardAutonomous from "./pages/TimecardAutonomous";
import { EmploymentRouteGuard } from "./components/routing/EmploymentRouteGuard";
import AbsenceManagement from "./pages/AbsenceManagement";

import LocationsNew from "./pages/LocationsNew";
import HolidayCalendar from "./pages/HolidayCalendar";
import AgendaManager from "./pages/AgendaManager";
import UserProfile from "./pages/UserProfile";
import TeamManagement from "./pages/TeamManagement";
import ContractManagement from "./pages/ContractManagement";
import CorporateExpenseManagement from "./pages/CorporateExpenseManagement";

import ItemCatalog from "./pages/ItemCatalog";
import InteractiveMap from "./pages/InteractiveMap";
import GdprCompliancePage from "./pages/GdprCompliancePage";
import TicketMaterials from "./pages/TicketMaterials";
import { ApprovalManagement } from "./pages/ApprovalManagement";
import ActivityPlanner from "./pages/ActivityPlanner";
import { StockManagement } from "./pages/StockManagement";
import LPU from "./pages/LPU";
import { SupplierManagement } from "./pages/SupplierManagement";
import { CustomerItemMappings } from "./pages/CustomerItemMappings";

import AssetManagement from "./pages/AssetManagement";
import ComplianceManagement from "./pages/ComplianceManagement";
import CLTCompliance from "./pages/CLTCompliance";
import TimecardApprovalSettings from "./pages/TimecardApprovalSettings";

import CustomFieldsAdministrator from './pages/CustomFieldsAdministrator';
import DragDropDemo from './pages/DragDropDemo';
import ProductivityReports from './pages/ProductivityReports';
import TimecardApprovals from './pages/TimecardApprovals';
import NotificationsPage from './pages/NotificationsPage';
import UserNotificationsPage from './pages/UserNotifications';
import Reports from './pages/Reports';
import Dashboards from './pages/Dashboards';
import DashboardView from "./pages/DashboardView";

// import { GlobalGeolocation } from "./components/GlobalGeolocation"; // Temporarily disabled due to TypeScript syntax issue
import Customers from "./pages/Customers";

// OmniBridge Module - Full Interface
import OmniBridge from "./pages/OmniBridge";
import ConversationDetailPage from "./pages/ConversationDetailPage";

// Knowledge Base Module
import KnowledgeBase from "./pages/KnowledgeBase";

// Components
import { AppShell } from "./components/layout/AppShell";

// Assuming TicketAdvancedConfiguration is in the same directory
import TicketAdvancedConfiguration from "./pages/TicketAdvancedConfiguration";

// Assuming ReportEdit is in the same directory
import ReportEdit from "./pages/ReportEdit";
// Assuming ReportCreate is in the same directory
import ReportCreate from "./pages/ReportCreate";

// Import i18n for language management
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import Backend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';
import React from 'react'; // Ensure React is imported

// Placeholder for Router and AppRoutes if they are not defined in this file
// If they are defined elsewhere, ensure they are correctly imported.
// For this example, assuming they are available in the scope.
// import { Router } from "your-router-library"; // e.g., wouter's <Router> or react-router-dom's <BrowserRouter>
// import AppRoutes from "./AppRoutes"; // Assuming AppRoutes is a component that handles routing

// Mock Router and AppRoutes for demonstration if not provided
const Router = ({ children }: { children: React.ReactNode }) => <Switch>{children}</Switch>;
const AppRoutes = ({ children }: { children: React.ReactNode }) => <>{children}</>; // Placeholder, replace with actual routing component


function AppRouter() {
  const { isAuthenticated, isLoading } = useAuth();

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-lg text-slate-600 dark:text-slate-300">Loading...</span>
        </div>
      </div>
    );
  }

  // Show auth page if not authenticated
  if (!isAuthenticated) {
    return (
      <Switch>
        <Route path="/auth" component={AuthPage} />
        <Route component={AuthPage} />
      </Switch>
    );
  }

  // Show main app if authenticated
  return (
    <AppShell>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/tickets" component={TicketsTable} />
        <Route path="/tickets/:id" component={TicketDetails} />
        <Route path="/customers" component={Customers} />
        <Route path="/tenant-admin/solicitantes" component={Customers} />
        <Route path="/tenant-admin/beneficiaries" component={Beneficiaries} />
        <Route path="/companies" component={Companies} />
        {/* TechnicalSkills migrated to TeamManagement skills tab per 1qa.md */}
        {/* Removed: external-contacts route - functionality eliminated */}
        <Route path="/locations" component={LocationsNew} />

        <Route path="/analytics" component={Analytics} />
        <Route path="/automation-rules" component={AutomationRules} />
        <Route path="/notifications" component={NotificationsPage} />
        <Route path="/my-notifications" component={UserNotificationsPage} />
        <Route path="/clt-compliance" component={CLTCompliance} />
        {/* Unified Tenants Management Page */}
        <Route path="/tenants" component={Tenants} />
        <Route path="/saas-admin" component={Tenants} />
        <Route path="/saas-admin/performance" component={SaasAdminPerformance} />
        <Route path="/saas-admin/billing" component={SaasAdminBilling} />
        <Route path="/saas-admin/disaster-recovery" component={SaasAdminDisasterRecovery} />
        <Route path="/saas-admin/integrations" component={SaasAdminIntegrations} />
        <Route path="/tenant-admin" component={Tenants} />
        <Route path="/tenant-admin/geral" component={TenantAdminGeral} />
        <Route path="/tenant-admin/workflows" component={TenantAdminWorkflows} />
        <Route path="/slas" component={SlaManagement} />
        <Route path="/approvals" component={ApprovalManagement} />
        <Route path="/activity-planner" component={ActivityPlanner} />
        <Route path="/tenant-admin/integrations" component={TenantAdminIntegrations} />
        <Route path="/tenant-admin/branding" component={TenantAdminBranding} />

        {/* <Route path="/global-geolocation" component={GlobalGeolocation} /> */}
        <Route path="/ticket-templates" component={TicketTemplates} />
        <Route path="/tenant-provisioning" component={Tenants} />
        <Route path="/saas-admin/tenant-provisioning" component={Tenants} />
        <Route path="/translation-manager" component={TranslationManager} />
        <Route path="/saas-admin/translation-manager" component={TranslationManager} />
        <Route path="/module-integrity" component={ModuleIntegrityControl} />
        <Route path="/saas-admin/module-integrity" component={ModuleIntegrityControl} />
        <Route path="/ticket-configuration" component={TicketConfiguration} />
        <Route path="/ticket-configuration/advanced" component={TicketAdvancedConfiguration} />
        <Route path="/user-management" component={UserManagement} />
        <Route path="/saas-admin/user-management" component={UserManagement} />
        {/* Removed: Multi-tenant management route - functionality eliminated */}
        <Route path="/settings" component={Settings} />
        <Route path="/security" component={SecuritySettings} />
        <Route path="/layouts" component={TemplateSelector} />
        <Route path="/internal-forms" component={InternalForms} />
        {/* Removed: Projects and ProjectActions routes - module completely eliminated */}
        {/* Employment-specific timecard routes with route guards */}
        <Route path="/timecard">
          {() => (
            <EmploymentRouteGuard requiredType="clt">
              <Timecard />
            </EmploymentRouteGuard>
          )}
        </Route>
        <Route path="/timecard-autonomous">
          {() => (
            <EmploymentRouteGuard requiredType="autonomo">
              <TimecardAutonomous />
            </EmploymentRouteGuard>
          )}
        </Route>
        <Route path="/work-schedules" component={WorkSchedules} />
        <Route path="/timecard-reports" component={TimecardReports} />
        <Route path="/certificate-manager" component={CertificateManager} />
        <Route path="/timecard-approval-settings" component={TimecardApprovalSettings} />
        <Route path="/timecard-approvals" component={TimecardApprovals} />
        <Route path="/hour-bank" component={HourBank} />
        <Route path="/absence-management" component={AbsenceManagement} />
        <Route path="/holiday-calendar" component={HolidayCalendar} />
        <Route path="/agenda-manager" component={AgendaManager} />
        {/* OmniBridge Route - Full Interface */}
        <Route path="/omnibridge" component={OmniBridge} />
        <Route path="/omnibridge/conversations/:id" component={ConversationDetailPage} />
        <Route path="/profile" component={UserProfile} />
        <Route path="/team-management" component={TeamManagement} />
        <Route path="/contract-management" component={ContractManagement} />
        <Route path="/contracts" component={ContractManagement} />
        <Route path="/expense-management" component={CorporateExpenseManagement} />
        <Route path="/corporate-expenses" component={CorporateExpenseManagement} />

        <Route path="/item-catalog" component={ItemCatalog} />
        <Route path="/interactive-map" component={InteractiveMap} />
        <Route path="/tickets/:id/materials" component={TicketMaterials} />
        <Route path="/stock-management" component={StockManagement} />
        <Route path="/supplier-management" component={SupplierManagement} />
        <Route path="/customer-item-mappings" component={CustomerItemMappings} />
        <Route path="/lpu" component={LPU} />
        <Route path="/lpu-management" component={LPU} />

        <Route path="/asset-management" component={AssetManagement} />
        <Route path="/compliance-management" component={ComplianceManagement} />
        <Route path="/gdpr-compliance" component={GdprCompliancePage} />

        <Route path="/custom-fields-admin" component={CustomFieldsAdministrator} />
        <Route path="/drag-drop-demo" component={DragDropDemo} />
        <Route path="/productivity-reports" component={ProductivityReports} />
        <Route path="/notifications" component={NotificationsPage} />
        <Route path="/reports" component={Reports} />
        <Route path="/reports/create" component={ReportCreate} />
        <Route path="/reports/:id/edit" component={ReportEdit} />
        <Route path="/report-edit" component={ReportEdit} />
        <Route path="/dashboards" component={Dashboards} />
        <Route path="/dashboard/:id" component={DashboardView} />
        <Route path="/dashboard/:id/edit" component={DashboardView} />

        <Route path="/companies" component={Companies} />

        {/* Knowledge Base Route */}
        <Route path="/knowledge-base" component={KnowledgeBase} />

        <Route component={NotFound} />
      </Switch>
    </AppShell>
  );
}

function App() {
  // Initialize language on app start
  React.useEffect(() => {
    const savedLanguage = localStorage.getItem('preferred-language') || 'pt-BR';
    if (savedLanguage && i18n.language !== savedLanguage) {
      i18n.changeLanguage(savedLanguage);
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SidebarProvider>
          <SimpleTimerProvider>
            <TooltipProvider>
              <AppRouter />
              <Toaster />
            </TooltipProvider>
          </SimpleTimerProvider>
        </SidebarProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;