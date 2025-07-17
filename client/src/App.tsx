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
import CustomersTable from "./pages/CustomersTable";
import KnowledgeBase from "./pages/KnowledgeBase";
import Analytics from "./pages/Analytics";
import Settings from "./pages/SettingsSimple";
import SecuritySettings from "./pages/SecuritySettings";
import Roadmap from "./pages/Roadmap";
import Compliance from "./pages/Compliance";
import SaasAdmin from "./pages/SaasAdmin";
import TenantAdmin from "./pages/TenantAdmin";
import TenantProvisioning from "./pages/TenantProvisioning";
import TranslationManager from "./pages/TranslationManager";
import SaasAdminPerformance from "./pages/SaasAdminPerformance";
import SaasAdminBilling from "./pages/SaasAdminBilling";
import SaasAdminDisasterRecovery from "./pages/SaasAdminDisasterRecovery";
import TenantAdminTeam from "./pages/TenantAdminTeam";
import TenantAdminWorkflows from "./pages/TenantAdminWorkflows";
import ModuleIntegrityControl from "./pages/ModuleIntegrityControl";
import NotFound from "./pages/not-found";
import { TemplateSelector } from "./pages/TemplateSelector";

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
        <Route path="/customers" component={CustomersTable} />
        <Route path="/knowledge-base" component={KnowledgeBase} />
        <Route path="/analytics" component={Analytics} />
        <Route path="/roadmap" component={Roadmap} />
        <Route path="/compliance" component={Compliance} />
        <Route path="/saas-admin" component={SaasAdmin} />
        <Route path="/saas-admin/performance" component={SaasAdminPerformance} />
        <Route path="/saas-admin/billing" component={SaasAdminBilling} />
        <Route path="/saas-admin/disaster-recovery" component={SaasAdminDisasterRecovery} />
        <Route path="/tenant-admin" component={TenantAdmin} />
        <Route path="/tenant-admin/team" component={TenantAdminTeam} />
        <Route path="/tenant-admin/workflows" component={TenantAdminWorkflows} />
        <Route path="/tenant-provisioning" component={TenantProvisioning} />
        <Route path="/translation-manager" component={TranslationManager} />
        <Route path="/module-integrity" component={ModuleIntegrityControl} />
        <Route path="/settings" component={Settings} />
        <Route path="/security" component={SecuritySettings} />
        <Route path="/templates" component={TemplateSelector} />
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