import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useEmploymentDetection } from "@/hooks/useEmploymentDetection";
import { useState } from "react";
import { 
  BarChart3, 
  Users, 
  Ticket, 
  Bot, 
  BookOpen, 
  Plug, 
  Settings, 
  HelpCircle,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Zap,
  Map,
  MapPin,
  Shield,
  LogOut,
  Languages,
  Database,
  TrendingUp,
  Activity,
  CreditCard,
  HardDrive,
  DollarSign,
  UserCog,
  Workflow,
  Target,
  Palette,
  PieChart,
  Building2,
  Award,
  UserCheck,
  FileText,
  Mail,
  FolderOpen,
  Folder,
  Clock,
  Package,
  Warehouse,
  Route,
  Calendar,
  Globe2,
  Wrench,
  Bell,
  CheckCircle
} from "lucide-react";

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
}

// Base navigation with proper types
const baseNavigation: Array<{
  name: string;
  href?: string;
  icon: any;
  current?: boolean;
  badge?: string;
  children?: Array<{
    name: string;
    href: string;
    icon: any;
  }>;
}> = [
  { name: "Clientes", href: "/customers", icon: Users },
  { name: "Tickets", href: "/tickets", icon: Ticket },
  {
    name: "Controle de Jornadas",
    icon: Clock,
    children: [
      { name: "Registro de Ponto", href: "/timecard", icon: Clock },
      { name: "Escalas de Trabalho", href: "/work-schedules", icon: Calendar },
      { name: "Banco de Horas", href: "/hour-bank", icon: CreditCard },
      { name: "Calendário de Feriados", href: "/holiday-calendar", icon: Calendar },
      { name: "Relatórios", href: "/timecard-reports", icon: FileText },
      { name: "CLT Compliance", href: "/clt-compliance", icon: Shield },
      { name: "Aprovação de Registros", href: "/timecard-approvals", icon: CheckCircle },
      { name: "Configuração de Aprovações", href: "/timecard-approval-settings", icon: Settings },
      { name: "Gestão de Ausências", href: "/absence-management", icon: Calendar },
      { name: "Templates de Escalas", href: "/schedule-templates", icon: Settings },
    ]
  },
  { name: "Locais", href: "/locations", icon: MapPin },

  {
    name: "Materiais e Serviços",
    icon: Package,
    children: [

      { name: "Catálogo de Itens", href: "/item-catalog", icon: Package },
      { name: "Gestão de Estoque", href: "/stock-management", icon: Warehouse },
      { name: "Gestão de Fornecedores", href: "/supplier-management", icon: Building2 },
      { name: "Controle de Ativos", href: "/asset-management", icon: HardDrive },
      { name: "LPU - Lista de Preços", href: "/lpu-management", icon: DollarSign },
      { name: "Gestão de Compliance", href: "/compliance-management", icon: Shield },
    ]
  },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Knowledge Base", href: "/knowledge-base", icon: BookOpen },
  { name: "Compliance", href: "/compliance", icon: Shield },
  {
    name: "Reports",
    icon: PieChart,
    children: [
      { name: "Productivity Reports", href: "/productivity-reports", icon: PieChart },
      { name: "Team Performance", href: "/team-performance", icon: TrendingUp },
      { name: "System Analytics", href: "/system-analytics", icon: BarChart3 },
    ]
  },

];

// Admin navigation with hierarchical structure
const adminNavigation = [
  { 
    name: "SaaS Admin", 
    icon: Shield, 
    roles: ['saas_admin'],
    children: [
      { name: "Dashboard", href: "/saas-admin", icon: BarChart3 },
      { name: "Gestão de Tenants", href: "/saas-admin/tenants", icon: Database },
      { name: "Performance & Saúde", href: "/saas-admin/performance", icon: TrendingUp },
      { name: "Configurações de Segurança", href: "/saas-admin/security", icon: Shield },
      { name: "Billing & Usage", href: "/saas-admin/billing", icon: CreditCard },
      { name: "Disaster Recovery", href: "/saas-admin/disaster-recovery", icon: HardDrive },
      { name: "Auto-Provisioning", href: "/tenant-provisioning", icon: Plug },
      { name: "Gerenciar Traduções", href: "/translation-manager", icon: Languages },
      { name: "Gestão de Usuários", href: "/user-management", icon: UserCog },
      // Removed: Multi-Tenant management - functionality eliminated from system
      { name: "Integrações", href: "/saas-admin/integrations", icon: Plug },
      { name: "Controle de Integridade", href: "/module-integrity", icon: Shield },
      { name: "Multilocation Settings", href: "/tenant-admin/multilocation", icon: Globe2 },
    ]
  },
  { 
    name: "Workspace Admin", 
    icon: Settings, 
    roles: ['saas_admin', 'tenant_admin'],
    children: [
      { name: "Geral", href: "/tenant-admin/geral", icon: BarChart3 },
      { name: "Dashboard", href: "/tenant-admin", icon: BarChart3 },
      { name: "Gestão de Equipe", href: "/team-management", icon: Users },
      { name: "Gestão de Contratos", href: "/contract-management", icon: FileText },
      { name: "Materiais e Serviços", href: "/materials-services-control", icon: Package },
      { name: "Habilidades Técnicas", href: "/technical-skills", icon: Award },
      { name: "Workflows", href: "/tenant-admin/workflows", icon: Workflow },
      { name: "SLAs", href: "/tenant-admin/slas", icon: Target },
      { name: "Integrações", href: "/tenant-admin/integrations", icon: Plug },
      { name: "Configurações de Tickets", href: "/ticket-configuration", icon: Settings },
      { name: "Templates de Tickets", href: "/ticket-templates", icon: FileText },
      { name: "Campos Customizados", href: "/custom-fields-admin", icon: Wrench },
      { name: "Clientes", href: "/customers", icon: Users },
      { name: "Pessoas", href: "/people", icon: UserCheck },
      { name: "Beneficiários", href: "/beneficiaries", icon: User },
      { name: "Formulários Internos", href: "/internal-forms", icon: FileText },

      { name: "Empresas", href: "/companies", icon: Building2 },
      { name: "OmniBridge", href: "/omnibridge", icon: Mail },
      { name: "Branding & Personalização", href: "/tenant-admin/branding", icon: Palette },
      { name: "Relatórios & Analytics", href: "/tenant-admin/reports", icon: PieChart },
    ]
  },
];

const secondaryNavigation = [
  { name: "Settings", href: "/settings", icon: Settings },
  { name: "Security", href: "/security", icon: Shield },
  { name: "Help & Support", href: "/help", icon: HelpCircle },
];

export function Sidebar({ collapsed, onToggleCollapse }: SidebarProps) {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const { terminology, employmentType } = useEmploymentDetection();
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});

  // Fetch tickets count for badge
  const { data: ticketsData } = useQuery({
    queryKey: ["/api/tickets"], // Simple query key for consistent caching
    enabled: !!user,
    staleTime: 30000, // Cache for 30 seconds
  });

  // Fetch tenant data for current user
  const { data: tenantData } = useQuery({
    queryKey: ["/api/tenants/current"],
    enabled: !!user?.tenantId,
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/tenants/${user?.tenantId}`);
      return response.json();
    },
    staleTime: 300000, // Cache for 5 minutes
  });

  const activeTicketsCount = Array.isArray(ticketsData) ? ticketsData.length : 0;

  // Create navigation with dynamic badges and employment-specific terminology
  const navigation = baseNavigation.map(item => {
    if (item.name === "Tickets" && activeTicketsCount > 0) {
      return { ...item, badge: activeTicketsCount.toString() };
    }

    // Update timecard section based on employment type
    if (item.name === "Controle de Jornadas") {
      const timecardRoute = employmentType === 'autonomo' ? '/timecard-autonomous' : '/timecard';
      return {
        ...item,
        name: employmentType === 'autonomo' ? 'Controle de Jornada' : 'Controle de Jornadas',
        children: [
          { 
            name: terminology.recordLabel, 
            href: timecardRoute, 
            icon: Clock 
          },
          { name: "Escalas de Trabalho", href: "/work-schedules", icon: Calendar },
          { 
            name: terminology.timeControlLabel, 
            href: "/hour-bank", 
            icon: CreditCard 
          },
          { name: "Calendário de Feriados", href: "/holiday-calendar", icon: Calendar },
          { 
            name: terminology.reportLabel, 
            href: "/timecard-reports", 
            icon: FileText 
          },
          { name: "CLT Compliance", href: "/clt-compliance", icon: Shield },
          { 
            name: terminology.approvalLabel, 
            href: "/timecard-approvals", 
            icon: CheckCircle 
          },
          { name: "Configuração de Aprovações", href: "/timecard-approval-settings", icon: Settings },
          { name: "Gestão de Ausências", href: "/absence-management", icon: Calendar },
        ]
      };
    }

    return item;
  });

  // Toggle menu function
  const toggleMenu = (menuName: string) => {
    setOpenMenus(prev => ({ ...prev, [menuName]: !prev[menuName] }));
  };

  return (
    <div className={`hidden lg:flex lg:flex-col transition-all duration-300 ${
      collapsed ? 'lg:w-16' : 'lg:w-64'
    }`}>
      <div className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto" style={{
        background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
        color: 'white'
      }}>
        {/* Logo */}
        <div className={`flex items-center transition-all duration-300 ${
          collapsed ? 'px-2 justify-center' : 'px-4 justify-between'
        }`}>
          <div className={`flex items-center transition-all duration-300 ${
            collapsed ? 'justify-center w-full' : ''
          }`}>
            <div className={`bg-white rounded-lg flex items-center justify-center transition-all duration-300 ${
              collapsed ? 'w-10 h-10' : 'w-8 h-8 mr-3'
            }`}>
              <Zap className={`text-purple-600 transition-all duration-300 ${
                collapsed ? 'w-6 h-6' : 'w-5 h-5'
              }`} />
            </div>
            {!collapsed && (
              <h1 className="text-xl font-bold text-white transition-opacity duration-300">
                Conductor
              </h1>
            )}
          </div>

          {/* Toggle Button - Always visible and properly positioned */}
          {!collapsed && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleCollapse}
              className="h-8 w-8 p-0 text-white hover:bg-white hover:bg-opacity-10 transition-all duration-300"
              title="Retrair sidebar"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Expand Button - Only visible when collapsed, positioned below logo */}
        {collapsed && (
          <div className="px-2 mt-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleCollapse}
              className="w-full h-10 p-0 text-white hover:bg-white hover:bg-opacity-20 bg-white bg-opacity-10 rounded-lg shadow-lg transition-all duration-300 hover:scale-105"
              title="Expandir sidebar"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        )}

        {/* Tenant Selector */}
        <div className={`mt-6 transition-all duration-300 ${collapsed ? 'px-2' : 'px-4'}`}>
          <div className={`rounded-lg border transition-all duration-300 ${
            collapsed ? 'p-2' : 'p-3'
          }`} style={{
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            borderColor: 'rgba(255, 255, 255, 0.2)'
          }}>
            <div className={`flex items-center transition-all duration-300 ${
              collapsed ? 'justify-center' : 'justify-between'
            }`}>
              <div className={`flex items-center transition-all duration-300 ${
                collapsed ? 'justify-center' : ''
              }`}>
                <div className={`bg-white rounded-full flex items-center justify-center transition-all duration-300 ${
                  collapsed ? 'w-8 h-8' : 'w-6 h-6 mr-2'
                }`}>
                  <span className={`font-semibold text-purple-600 transition-all duration-300 ${
                    collapsed ? 'text-sm' : 'text-xs'
                  }`}>AC</span>
                </div>
                {!collapsed && (
                  <span className="text-sm font-medium text-white transition-opacity duration-300">
                    {tenantData?.name || 'Carregando...'}
                  </span>
                )}
              </div>
              {!collapsed && <ChevronDown className="w-4 h-4 text-white" />}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="mt-6 flex-1 px-2 space-y-1">
          {navigation.map((item) => {
            // If item has children, render as collapsible menu
            if (item.children) {
              const isOpen = openMenus[item.name] || false;
              const hasActiveChild = item.children.some(child => location === child.href);

              // In collapsed mode, don't show submenu items - larger icons and better spacing
              if (collapsed) {
                return (
                  <div key={item.name} className="relative group">
                    <div className={cn(
                      "flex items-center justify-center py-3 px-2 text-sm font-medium rounded-md transition-all duration-300 cursor-pointer hover:scale-105",
                      hasActiveChild
                        ? "text-white shadow-lg"
                        : "text-white hover:bg-white hover:bg-opacity-20"
                    )} style={hasActiveChild ? {
                      backgroundColor: 'var(--accent)',
                      color: 'white'
                    } : {}}
                    title={item.name}>
                      <item.icon className="h-6 w-6 flex-shrink-0" />
                      {item.badge && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                          <span className="text-xs font-bold text-white">{item.badge}</span>
                        </div>
                      )}
                    </div>
                    {/* Tooltip for collapsed state */}
                    <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                      {item.name}
                    </div>
                  </div>
                );
              }

              return (
                <Collapsible key={item.name} open={isOpen} onOpenChange={() => toggleMenu(item.name)}>
                  <CollapsibleTrigger className="w-full">
                    <div className={cn(
                      "group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer",
                      hasActiveChild
                        ? "text-white"
                        : "text-white hover:bg-white hover:bg-opacity-10"
                    )} style={hasActiveChild ? {
                      backgroundColor: 'var(--accent)',
                      color: 'white'
                    } : {}}>
                      <item.icon className="mr-3 h-4 w-4 flex-shrink-0" />
                      {item.name}
                      {item.badge && (
                        <Badge variant="destructive" className="ml-2">
                          {item.badge}
                        </Badge>
                      )}
                      {isOpen ? (
                        <ChevronDown className="ml-auto h-4 w-4" />
                      ) : (
                        <ChevronRight className="ml-auto h-4 w-4" />
                      )}
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="ml-4 mt-1 space-y-1">
                    {item.children.map((child) => {
                      const isActive = location === child.href;
                      return (
                        <Link key={child.name} href={child.href}>
                          <div className={cn(
                            "group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer",
                            isActive
                              ? "text-white"
                              : "text-white hover:bg-white hover:bg-opacity-10"
                          )} style={isActive ? {
                            backgroundColor: 'var(--accent)',
                            color: 'white'
                          } : {}}>
                            <child.icon className="mr-3 h-4 w-4 flex-shrink-0" />
                            {child.name}
                          </div>
                        </Link>
                      );
                    })}
                  </CollapsibleContent>
                </Collapsible>
              );
            }

            // If item has no children, render as simple link
            if (!item.href) return null; // Skip items without href
            const isActive = location === item.href;

            // In collapsed mode, show only icons - larger and better spaced
            if (collapsed) {
              return (
                <Link key={item.name} href={item.href}>
                  <div className={cn(
                    "group flex items-center justify-center py-3 px-2 text-sm font-medium rounded-md transition-all duration-300 cursor-pointer relative hover:scale-105",
                    isActive
                      ? "text-white shadow-lg"
                      : "text-white hover:bg-white hover:bg-opacity-20"
                  )} style={isActive ? {
                    backgroundColor: 'var(--accent)',
                    color: 'white'
                  } : {}}
                  title={item.name}>
                    <item.icon className="h-6 w-6 flex-shrink-0" />
                    {item.badge && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                        <span className="text-xs font-bold text-white">{item.badge}</span>
                      </div>
                    )}
                    {/* Tooltip for collapsed state */}
                    <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                      {item.name}
                    </div>
                  </div>
                </Link>
              );
            }

            return (
              <Link key={item.name} href={item.href}>
                <div className={cn(
                  "group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer",
                  isActive
                    ? "text-white"
                    : "text-white hover:bg-white hover:bg-opacity-10"
                )} style={isActive ? {
                  backgroundColor: 'var(--accent)',
                  color: 'white'
                } : {}}>
                  <item.icon className="mr-3 h-4 w-4 flex-shrink-0" />
                  {item.name}
                  {item.badge && (
                    <Badge variant="destructive" className="ml-auto">
                      {item.badge}
                    </Badge>
                  )}
                </div>
              </Link>
            );
          })}

          {/* Admin Navigation - Role-based with hierarchy */}
          {user && ['saas_admin', 'tenant_admin'].includes(user.role) && (
            <div className="pt-4 mt-4 border-t border-white border-opacity-20">
              {!collapsed && (
                <div className="px-2 mb-2">
                  <span className="text-xs text-white text-opacity-70 uppercase tracking-wider font-medium">
                    Administração
                  </span>
                </div>
              )}
              {adminNavigation
                .filter(item => item.roles.includes(user.role))
                .map((item) => {
                  const isOpen = openMenus[item.name] || false;
                  const hasActiveChild = item.children?.some(child => location === child.href);

                  // In collapsed mode, show only parent icon with tooltip
                  if (collapsed) {
                    return (
                      <div key={item.name} className="relative group">
                        <div className={cn(
                          "flex items-center justify-center py-3 px-2 text-sm font-medium rounded-md transition-all duration-300 cursor-pointer hover:scale-105",
                          hasActiveChild
                            ? "text-white shadow-lg"
                            : "text-white hover:bg-white hover:bg-opacity-20"
                        )} style={hasActiveChild ? {
                          backgroundColor: 'var(--accent)',
                          color: 'white'
                        } : {}}>
                          <item.icon className="h-6 w-6 flex-shrink-0" />
                          {/* Tooltip for collapsed state */}
                          <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                            {item.name}
                          </div>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <Collapsible key={item.name} open={isOpen} onOpenChange={() => toggleMenu(item.name)}>
                      <CollapsibleTrigger className="w-full">
                        <div className={cn(
                          "group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer",
                          hasActiveChild
                            ? "text-white"
                            : "text-white hover:bg-white hover:bg-opacity-10"
                        )} style={hasActiveChild ? {
                          backgroundColor: 'var(--accent)',
                          color: 'white'
                        } : {}}>
                          <item.icon className="mr-3 h-4 w-4 flex-shrink-0" />
                          {item.name}
                          {isOpen ? (
                            <ChevronDown className="ml-auto h-4 w-4" />
                          ) : (
                            <ChevronRight className="ml-auto h-4 w-4" />
                          )}
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="ml-4 mt-1 space-y-1">
                        {item.children?.map((child) => {
                          const isActive = location === child.href;
                          return (
                            <Link key={child.name} href={child.href}>
                              <div className={cn(
                                "group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer",
                                isActive
                                  ? "text-white"
                                  : "text-white hover:bg-white hover:bg-opacity-10"
                              )} style={isActive ? {
                                backgroundColor: 'var(--accent)',
                                color: 'white'
                              } : {}}>
                                <child.icon className="mr-3 h-4 w-4 flex-shrink-0" />
                                {child.name}
                              </div>
                            </Link>
                          );
                        })}
                      </CollapsibleContent>
                    </Collapsible>
                  );
                })}
            </div>
          )}

          <div className="pt-4 mt-4 border-t border-white border-opacity-20">
            {/* Aparência Link */}
            <Link key="Aparência" href="/layouts">
              <div className={cn(
                "group flex items-center rounded-md transition-all duration-300 cursor-pointer relative",
                collapsed ? "justify-center py-3 px-2 hover:scale-105" : "px-2 py-2",
                location === "/layouts"
                  ? "text-white shadow-lg"
                  : "text-white hover:bg-white hover:bg-opacity-10"
              )} style={location === "/layouts" ? {
                backgroundColor: 'var(--accent)',
                color: 'white'
              } : {}}>
                <Palette className={collapsed ? "h-6 w-6 flex-shrink-0" : "mr-3 h-4 w-4 flex-shrink-0"} />
                {!collapsed && "Aparência"}
                {/* Tooltip for collapsed state */}
                {collapsed && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                    Aparência
                  </div>
                )}
              </div>
            </Link>

            {/* Secondary Navigation */}
            {secondaryNavigation.map((item) => {
              const isActive = location === item.href;
              return (
                <Link key={item.name} href={item.href}>
                  <div className={cn(
                    "group flex items-center rounded-md transition-all duration-300 cursor-pointer relative",
                    collapsed ? "justify-center py-3 px-2 hover:scale-105" : "px-2 py-2",
                    isActive
                      ? "text-white shadow-lg"
                      : "text-white hover:bg-white hover:bg-opacity-10"
                  )} style={isActive ? {
                    backgroundColor: 'var(--accent)',
                    color: 'white'
                  } : {}}>
                    <item.icon className={collapsed ? "h-6 w-6 flex-shrink-0" : "mr-3 h-4 w-4 flex-shrink-0"} />
                    {!collapsed && item.name}
                    {/* Tooltip for collapsed state */}
                    {collapsed && (
                      <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                        {item.name}
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Footer - User info and logout */}
        <div className="flex-shrink-0 flex border-t border-white border-opacity-20">
          <div className="w-full">
            <div className={`flex items-center transition-all duration-300 ${
              collapsed ? 'justify-center p-3' : 'p-3'
            }`}>
              {!collapsed ? (
                <div className="flex items-center w-full">
                  <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center mr-3">
                    <span className="text-sm font-medium text-purple-600">
                      {user?.email?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {user?.email}
                    </p>
                    <p className="text-xs text-white text-opacity-70 truncate">
                      {user?.role === 'saas_admin' ? 'SaaS Admin' : 
                       user?.role === 'tenant_admin' ? 'Admin' : 
                       user?.role === 'agent' ? 'Agente' : 'Usuário'}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => logoutMutation.mutate()}
                    className="h-8 w-8 p-0 text-white hover:bg-white hover:bg-opacity-10"
                    title="Fazer logout"
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="relative group">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => logoutMutation.mutate()}
                    className="h-10 w-10 p-0 text-white hover:bg-white hover:bg-opacity-20 bg-white bg-opacity-10 rounded-lg transition-all duration-300"
                    title="Fazer logout"
                  >
                    <LogOut className="h-5 w-5" />
                  </Button>
                  {/* Tooltip for collapsed state */}
                  <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                    Fazer logout
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}