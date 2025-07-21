import { QueryClientProvider } from "@tanstack/react-query";
import { Route, Switch } from "wouter";

// Auth
import { AuthProvider, useAuth } from "./hooks/useAuth";
import { queryClient } from "./lib/queryClient";

// UI Components
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

// Pages
import AuthPage from "./pages/AuthPage";
import Dashboard from "./pages/Dashboard";
import TicketsTable from "./pages/TicketsTable";
import TicketEdit from "./pages/TicketEdit";
import CustomersTable from "./pages/CustomersTable";
import FavorecidosTable from "./pages/FavorecidosTable";
import Locations from "./pages/Locations";
import KnowledgeBase from "./pages/KnowledgeBase";
import Analytics from "./pages/Analytics";
import Settings from "./pages/SettingsSimple";
import SecuritySettings from "./pages/SecuritySettings";
import Roadmap from "./pages/Roadmap";
import WorkSchedules from "./pages/WorkSchedules";
import TimecardReports from "./pages/TimecardReports";
import HourBank from "./pages/HourBank";
import Compliance from "./pages/Compliance";
import SaasAdmin from "./pages/SaasAdmin";
import TenantAdmin from "./pages/TenantAdmin";
import TenantProvisioning from "./pages/TenantProvisioning";
import TranslationManager from "./pages/TranslationManager";
import SaasAdminPerformance from "./pages/SaasAdminPerformance";
import SaasAdminBilling from "./pages/SaasAdminBilling";
import SaasAdminDisasterRecovery from "./pages/SaasAdminDisasterRecovery";
import SaasAdminIntegrations from "./pages/SaasAdminIntegrations";
import TenantAdminTeam from "./pages/TenantAdminTeam";
import TenantAdminWorkflows from "./pages/TenantAdminWorkflows";
import TenantAdminSLAs from "./pages/TenantAdminSLAs";
import TenantAdminIntegrations from "./pages/TenantAdminIntegrations";
import TenantAdminBranding from "./pages/TenantAdminBranding";
import ModuleIntegrityControl from "./pages/ModuleIntegrityControl";
import TicketConfiguration from "./pages/TicketConfiguration";
import { UserManagement } from "./pages/UserManagement";
// Removed: MultiTenantManagement - functionality eliminated from system
import NotFound from "./pages/not-found";
import { TemplateSelector } from "./pages/TemplateSelector";
import InternalForms from './pages/InternalForms';
import CustomerCompanies from "./pages/CustomerCompanies";
import TechnicalSkills from "./pages/TechnicalSkills";
import TicketTemplates from "./pages/TicketTemplates";

// Removed: ExternalContactsManagement - functionality eliminated
import Projects from "./pages/Projects"; // Import the Projects component
import ProjectActions from "./pages/ProjectActions"; // Import the Project Actions component
import OmniBridge from "./pages/OmniBridge";
// Removed: JourneyControl - functionality eliminated from system
import Timecard from "./pages/Timecard";
import AbsenceManagement from "./pages/AbsenceManagement";
import ScheduleTemplates from "./pages/ScheduleTemplates";
import MultilocationAdmin from "./pages/MultilocationAdmin";
import HolidayCalendar from "./pages/HolidayCalendar";
// import { GlobalGeolocation } from "./components/GlobalGeolocation"; // Temporarily disabled due to TypeScript syntax issue

// Components
import { AppShell } from "./components/layout/AppShell";

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
        <Route path="/tickets/edit/:id" component={TicketEdit} />
        <Route path="/solicitantes" component={CustomersTable} />
        <Route path="/tenant-admin/solicitantes" component={CustomersTable} />
        <Route path="/tenant-admin/favorecidos" component={FavorecidosTable} />
        <Route path="/customer-companies" component={CustomerCompanies} />
        <Route path="/technical-skills" component={TechnicalSkills} />
        {/* Removed: external-contacts route - functionality eliminated */}
        <Route path="/locations" component={Locations} />
        <Route path="/knowledge-base" component={KnowledgeBase} />
        <Route path="/analytics" component={Analytics} />
        <Route path="/roadmap" component={Roadmap} />
        <Route path="/compliance" component={Compliance} />
        <Route path="/saas-admin" component={SaasAdmin} />
        <Route path="/saas-admin/performance" component={SaasAdminPerformance} />
        <Route path="/saas-admin/billing" component={SaasAdminBilling} />
        <Route path="/saas-admin/disaster-recovery" component={SaasAdminDisasterRecovery} />
        <Route path="/saas-admin/integrations" component={SaasAdminIntegrations} />
        <Route path="/tenant-admin" component={TenantAdmin} />
        <Route path="/tenant-admin/team" component={TenantAdminTeam} />
        <Route path="/tenant-admin/workflows" component={TenantAdminWorkflows} />
        <Route path="/tenant-admin/slas" component={TenantAdminSLAs} />
        <Route path="/tenant-admin/integrations" component={TenantAdminIntegrations} />
        <Route path="/tenant-admin/branding" component={TenantAdminBranding} />
        <Route path="/tenant-admin/multilocation" component={MultilocationAdmin} />
        {/* <Route path="/global-geolocation" component={GlobalGeolocation} /> */}
        <Route path="/ticket-templates" component={TicketTemplates} />
        <Route path="/tenant-provisioning" component={TenantProvisioning} />
        <Route path="/translation-manager" component={TranslationManager} />
        <Route path="/module-integrity" component={ModuleIntegrityControl} />
        <Route path="/ticket-configuration" component={TicketConfiguration} />
        <Route path="/user-management" component={UserManagement} />
        {/* Removed: Multi-tenant management route - functionality eliminated */}
        <Route path="/settings" component={Settings} />
        <Route path="/security" component={SecuritySettings} />
        <Route path="/layouts" component={TemplateSelector} />
        <Route path="/internal-forms" component={InternalForms} />
        <Route path="/projects" component={Projects} />
        <Route path="/project-actions" component={ProjectActions} />
        {/* Removed: journey-control route - functionality eliminated */}
        <Route path="/timecard" component={Timecard} />
        <Route path="/work-schedules" component={WorkSchedules} />
        <Route path="/timecard-reports" component={TimecardReports} />
        <Route path="/hour-bank" component={HourBank} />
        <Route path="/absence-management" component={AbsenceManagement} />
        <Route path="/schedule-templates" component={ScheduleTemplates} />
        <Route path="/holiday-calendar" component={HolidayCalendar} />
        <Route path="/omnibridge" component={OmniBridge} />

        <Route path="/customer-companies" component={CustomerCompanies} />
        <Route component={NotFound} />
      </Switch>
    </AppShell>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <AppRouter />
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;