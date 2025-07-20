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
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider, useAuth } from '@/hooks/useAuth';

// Import pages
import Landing from '@/pages/Landing';
import AuthPage from '@/pages/AuthPage';
import Dashboard from '@/pages/Dashboard';
import Tickets from '@/pages/Tickets';
import Customers from '@/pages/Customers';
import CustomerCompanies from '@/pages/CustomerCompanies';
import Locations from '@/pages/Locations';
import Projects from '@/pages/Projects';
import KnowledgeBase from '@/pages/KnowledgeBase';
import Analytics from '@/pages/Analytics';
import UserManagement from '@/pages/UserManagement';
import TenantAdminTeam from '@/pages/TenantAdminTeam';
import TenantAdminIntegrations from '@/pages/TenantAdminIntegrations';
import OmniBridge from '@/pages/OmniBridge';
import TenantAdminWorkflows from '@/pages/TenantAdminWorkflows';
import TenantAdminSLAs from '@/pages/TenantAdminSLAs';
import TenantAdminBranding from '@/pages/TenantAdminBranding';
import TicketTemplates from '@/pages/TicketTemplates';
import TicketConfiguration from '@/pages/TicketConfiguration';
import InternalForms from '@/pages/InternalForms';
import TechnicalSkills from '@/pages/TechnicalSkills';
import SaasAdmin from '@/pages/SaasAdmin';
import TenantProvisioning from '@/pages/TenantProvisioning';
import ModuleIntegrityControl from '@/pages/ModuleIntegrityControl';
import Settings from '@/pages/Settings';
import SecuritySettings from '@/pages/SecuritySettings';
import Compliance from '@/pages/Compliance';
import TranslationManager from '@/pages/TranslationManager';
import Roadmap from '@/pages/Roadmap';
import NotFound from '@/pages/not-found';
import AppShell from '@/components/layout/AppShell';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}

// Role-based Route Component
function RoleBasedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles: string[] }) {
  const { user } = useAuth();

  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-gray-50">
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Landing />} />
              <Route path="/auth" element={<AuthPage />} />

              {/* Protected routes with AppShell */}
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <AppShell>
                    <Dashboard />
                  </AppShell>
                </ProtectedRoute>
              } />

              <Route path="/tickets" element={
                <ProtectedRoute>
                  <AppShell>
                    <Tickets />
                  </AppShell>
                </ProtectedRoute>
              } />

              <Route path="/customers" element={
                <ProtectedRoute>
                  <RoleBasedRoute allowedRoles={['agent', 'admin', 'tenant_admin', 'saas_admin']}>
                    <AppShell>
                      <Customers />
                    </AppShell>
                  </RoleBasedRoute>
                </ProtectedRoute>
              } />

              <Route path="/customer-companies" element={
                <ProtectedRoute>
                  <RoleBasedRoute allowedRoles={['agent', 'admin', 'tenant_admin', 'saas_admin']}>
                    <AppShell>
                      <CustomerCompanies />
                    </AppShell>
                  </RoleBasedRoute>
                </ProtectedRoute>
              } />

              <Route path="/locations" element={
                <ProtectedRoute>
                  <RoleBasedRoute allowedRoles={['agent', 'admin', 'tenant_admin', 'saas_admin']}>
                    <AppShell>
                      <Locations />
                    </AppShell>
                  </RoleBasedRoute>
                </ProtectedRoute>
              } />

              <Route path="/projects" element={
                <ProtectedRoute>
                  <RoleBasedRoute allowedRoles={['agent', 'admin', 'tenant_admin', 'saas_admin']}>
                    <AppShell>
                      <Projects />
                    </AppShell>
                  </RoleBasedRoute>
                </ProtectedRoute>
              } />

              <Route path="/knowledge-base" element={
                <ProtectedRoute>
                  <RoleBasedRoute allowedRoles={['agent', 'admin', 'tenant_admin', 'saas_admin']}>
                    <AppShell>
                      <KnowledgeBase />
                    </AppShell>
                  </RoleBasedRoute>
                </ProtectedRoute>
              } />

              <Route path="/analytics" element={
                <ProtectedRoute>
                  <RoleBasedRoute allowedRoles={['admin', 'tenant_admin', 'saas_admin']}>
                    <AppShell>
                      <Analytics />
                    </AppShell>
                  </RoleBasedRoute>
                </ProtectedRoute>
              } />

              {/* Workspace Admin Routes */}
              <Route path="/user-management" element={
                <ProtectedRoute>
                  <RoleBasedRoute allowedRoles={['tenant_admin', 'saas_admin']}>
                    <AppShell>
                      <UserManagement />
                    </AppShell>
                  </RoleBasedRoute>
                </ProtectedRoute>
              } />

              <Route path="/tenant-admin/team" element={
                <ProtectedRoute>
                  <RoleBasedRoute allowedRoles={['tenant_admin', 'saas_admin']}>
                    <AppShell>
                      <TenantAdminTeam />
                    </AppShell>
                  </RoleBasedRoute>
                </ProtectedRoute>
              } />

              <Route path="/tenant-admin/integrations" element={
                <ProtectedRoute>
                  <RoleBasedRoute allowedRoles={['tenant_admin', 'saas_admin']}>
                    <AppShell>
                      <TenantAdminIntegrations />
                    </AppShell>
                  </RoleBasedRoute>
                </ProtectedRoute>
              } />

              <Route path="/omni-bridge" element={
                <ProtectedRoute>
                  <RoleBasedRoute allowedRoles={['tenant_admin', 'saas_admin']}>
                    <AppShell>
                      <OmniBridge />
                    </AppShell>
                  </RoleBasedRoute>
                </ProtectedRoute>
              } />

              <Route path="/tenant-admin/workflows" element={
                <ProtectedRoute>
                  <RoleBasedRoute allowedRoles={['tenant_admin', 'saas_admin']}>
                    <AppShell>
                      <TenantAdminWorkflows />
                    </AppShell>
                  </RoleBasedRoute>
                </ProtectedRoute>
              } />

              <Route path="/tenant-admin/slas" element={
                <ProtectedRoute>
                  <RoleBasedRoute allowedRoles={['tenant_admin', 'saas_admin']}>
                    <AppShell>
                      <TenantAdminSLAs />
                    </AppShell>
                  </RoleBasedRoute>
                </ProtectedRoute>
              } />

              <Route path="/tenant-admin/branding" element={
                <ProtectedRoute>
                  <RoleBasedRoute allowedRoles={['tenant_admin', 'saas_admin']}>
                    <AppShell>
                      <TenantAdminBranding />
                    </AppShell>
                  </RoleBasedRoute>
                </ProtectedRoute>
              } />

              <Route path="/ticket-templates" element={
                <ProtectedRoute>
                  <RoleBasedRoute allowedRoles={['tenant_admin', 'saas_admin']}>
                    <AppShell>
                      <TicketTemplates />
                    </AppShell>
                  </RoleBasedRoute>
                </ProtectedRoute>
              } />

              <Route path="/ticket-configuration" element={
                <ProtectedRoute>
                  <RoleBasedRoute allowedRoles={['tenant_admin', 'saas_admin']}>
                    <AppShell>
                      <TicketConfiguration />
                    </AppShell>
                  </RoleBasedRoute>
                </ProtectedRoute>
              } />

              <Route path="/internal-forms" element={
                <ProtectedRoute>
                  <RoleBasedRoute allowedRoles={['tenant_admin', 'saas_admin']}>
                    <AppShell>
                      <InternalForms />
                    </AppShell>
                  </RoleBasedRoute>
                </ProtectedRoute>
              } />

              <Route path="/technical-skills" element={
                <ProtectedRoute>
                  <RoleBasedRoute allowedRoles={['tenant_admin', 'saas_admin']}>
                    <AppShell>
                      <TechnicalSkills />
                    </AppShell>
                  </RoleBasedRoute>
                </ProtectedRoute>
              } />

              {/* System Admin Routes */}
              <Route path="/saas-admin" element={
                <ProtectedRoute>
                  <RoleBasedRoute allowedRoles={['saas_admin']}>
                    <AppShell>
                      <SaasAdmin />
                    </AppShell>
                  </RoleBasedRoute>
                </ProtectedRoute>
              } />

              <Route path="/tenant-provisioning" element={
                <ProtectedRoute>
                  <RoleBasedRoute allowedRoles={['saas_admin']}>
                    <AppShell>
                      <TenantProvisioning />
                    </AppShell>
                  </RoleBasedRoute>
                </ProtectedRoute>
              } />

              <Route path="/module-integrity-control" element={
                <ProtectedRoute>
                  <RoleBasedRoute allowedRoles={['saas_admin']}>
                    <AppShell>
                      <ModuleIntegrityControl />
                    </AppShell>
                  </RoleBasedRoute>
                </ProtectedRoute>
              } />

              <Route path="/settings" element={
                <ProtectedRoute>
                  <RoleBasedRoute allowedRoles={['admin', 'tenant_admin', 'saas_admin']}>
                    <AppShell>
                      <Settings />
                    </AppShell>
                  </RoleBasedRoute>
                </ProtectedRoute>
              } />

              <Route path="/security-settings" element={
                <ProtectedRoute>
                  <RoleBasedRoute allowedRoles={['admin', 'tenant_admin', 'saas_admin']}>
                    <AppShell>
                      <SecuritySettings />
                    </AppShell>
                  </RoleBasedRoute>
                </ProtectedRoute>
              } />

              <Route path="/compliance" element={
                <ProtectedRoute>
                  <RoleBasedRoute allowedRoles={['admin', 'tenant_admin', 'saas_admin']}>
                    <AppShell>
                      <Compliance />
                    </AppShell>
                  </RoleBasedRoute>
                </ProtectedRoute>
              } />

              <Route path="/translation-manager" element={
                <ProtectedRoute>
                  <RoleBasedRoute allowedRoles={['saas_admin']}>
                    <AppShell>
                      <TranslationManager />
                    </AppShell>
                  </RoleBasedRoute>
                </ProtectedRoute>
              } />

              <Route path="/roadmap" element={
                <ProtectedRoute>
                  <RoleBasedRoute allowedRoles={['saas_admin']}>
                    <AppShell>
                      <Roadmap />
                    </AppShell>
                  </RoleBasedRoute>
                </ProtectedRoute>
              } />

              {/* 404 Route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
          <Toaster />
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
