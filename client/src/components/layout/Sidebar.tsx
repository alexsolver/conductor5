import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
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
  Route,
  Calendar,
  Globe2
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
  { name: "Clientes", href: "/clientes", icon: Users },
  {
    name: "Controle de Jornadas",
    icon: Clock,
    children: [
      { name: "Escalas de Trabalho", href: "/work-schedules", icon: Calendar },
      { name: "Banco de Horas", href: "/hour-bank", icon: CreditCard },
      { name: "Calendário de Feriados", href: "/holiday-calendar", icon: Calendar },
      { name: "Relatórios", href: "/timecard-reports", icon: FileText },
      { name: "Gestão de Ausências", href: "/absence-management", icon: Calendar },
      { name: "Templates de Escalas", href: "/schedule-templates", icon: Settings },
    ]
  },
  { name: "Locais", href: "/locations", icon: MapPin },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Knowledge Base", href: "/knowledge-base", icon: BookOpen },
  { name: "Compliance", href: "/compliance", icon: Shield },
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

      { name: "Habilidades Técnicas", href: "/technical-skills", icon: Award },
      { name: "Workflows", href: "/tenant-admin/workflows", icon: Workflow },
      { name: "SLAs", href: "/tenant-admin/slas", icon: Target },
      { name: "Integrações", href: "/tenant-admin/integrations", icon: Plug },
      { name: "Configurações de Tickets", href: "/ticket-configuration", icon: Settings },
      { name: "Templates de Abertura", href: "/ticket-templates", icon: FileText },
      { name: "Clientes", href: "/clientes", icon: Users },
      { name: "Gestão de Favorecidos", href: "/tenant-admin/favorecidos", icon: UserCheck },
      { name: "Formulários Internos", href: "/internal-forms", icon: FileText },

      { name: "Empresas Clientes", href: "/customer-companies", icon: Building2 },
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

  // Create navigation with dynamic badges
  const navigation = baseNavigation.map(item => {
    if (item.name === "Tickets" && activeTicketsCount > 0) {
      return { ...item, badge: activeTicketsCount.toString() };
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
        <div className="flex items-center flex-shrink-0 px-4">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center mr-3">
              <Zap className="w-5 h-5 text-purple-600" />
            </div>
            {!collapsed && (
              <h1 className="text-xl font-bold text-white">Conductor</h1>
            )}
          </div>
          {/* Toggle Button */}
          <div className="ml-auto">
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleCollapse}
              className="h-8 w-8 p-0 text-white hover:bg-white hover:bg-opacity-10"
            >
              {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Tenant Selector */}
        <div className="mt-6 px-4">
          <div className="rounded-lg p-3 border" style={{
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            borderColor: 'rgba(255, 255, 255, 0.2)'
          }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center mr-2">
                  <span className="text-xs font-semibold text-purple-600">AC</span>
                </div>
                {!collapsed && (
                  <span className="text-sm font-medium text-white">
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

              // In collapsed mode, don't show submenu items
              if (collapsed) {
                return (
                  <div key={item.name} className="relative group">
                    <div className={cn(
                      "flex items-center justify-center px-2 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer",
                      hasActiveChild
                        ? "text-white"
                        : "text-white hover:bg-white hover:bg-opacity-10"
                    )} style={hasActiveChild ? {
                      backgroundColor: 'var(--accent)',
                      color: 'white'
                    } : {}}
                    title={item.name}>
                      <item.icon className="h-4 w-4 flex-shrink-0" />
                      {item.badge && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
                      )}
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

            // In collapsed mode, show only icons
            if (collapsed) {
              return (
                <Link key={item.name} href={item.href}>
                  <div className={cn(
                    "group flex items-center justify-center px-2 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer relative",
                    isActive
                      ? "text-white"
                      : "text-white hover:bg-white hover:bg-opacity-10"
                  )} style={isActive ? {
                    backgroundColor: 'var(--accent)',
                    color: 'white'
                  } : {}}
                  title={item.name}>
                    <item.icon className="h-4 w-4 flex-shrink-0" />
                    {item.badge && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
                        <span className="text-xs text-white">{item.badge}</span>
                      </div>
                    )}
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
              <div className="px-2 mb-2">
                <span className="text-xs text-white text-opacity-70 uppercase tracking-wider font-medium">
                  Administração
                </span>
              </div>
              {adminNavigation
                .filter(item => item.roles.includes(user.role))
                .map((item) => {
                  const isOpen = openMenus[item.name] || false;
                  const hasActiveChild = item.children?.some(child => location === child.href);

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

              <Link key="Aparência" href="/layouts">
                <div className={cn(
                  "group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer",
                  location === "/layouts"
                    ? "text-white"
                    : "text-white hover:bg-white hover:bg-opacity-10"
                )} style={location === "/layouts" ? {
                  backgroundColor: 'var(--accent)',
                  color: 'white'
                } : {}}>
                  <Palette className="mr-3 h-4 w-4 flex-shrink-0" />
                  Aparência
                </div>
              </Link>

            {secondaryNavigation.map((item) => {
              const isActive = location === item.href;
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
                  </div>
                </Link>
              );
            })}
          </div>
        </nav>


      </div>
    </div>
  );
}