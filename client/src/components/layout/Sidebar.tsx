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
  Folder
} from "lucide-react";

// Base navigation without dynamic badges
const baseNavigation = [
  { name: "Dashboard", href: "/", icon: BarChart3, current: true },
  { name: "Tickets", href: "/tickets", icon: Ticket },
  { 
    name: "Projetos", 
    icon: Folder,
    children: [
      { name: "Gestão de Projetos", href: "/projects", icon: FolderOpen },
      { name: "Ações de Projeto", href: "/project-actions", icon: Activity },
      { name: "Roadmap", href: "/roadmap", icon: Map },
    ]
  },
  { name: "Solicitantes", href: "/solicitantes", icon: Users },
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
    ]
  },
  { 
    name: "Workspace Admin", 
    icon: Settings, 
    roles: ['saas_admin', 'tenant_admin'],
    children: [
      { name: "Dashboard", href: "/tenant-admin", icon: BarChart3 },
      { name: "Gestão da Equipe", href: "/tenant-admin/team", icon: UserCog },
      { name: "Habilidades Técnicas", href: "/technical-skills", icon: Award },
      { name: "Workflows", href: "/tenant-admin/workflows", icon: Workflow },
      { name: "SLAs", href: "/tenant-admin/slas", icon: Target },
      { name: "Integrações", href: "/tenant-admin/integrations", icon: Plug },
      { name: "Configurações de Tickets", href: "/ticket-configuration", icon: Settings },
      { name: "Templates de Abertura", href: "/ticket-templates", icon: FileText },
      { name: "Gestão de Solicitantes", href: "/tenant-admin/solicitantes", icon: Users },
      { name: "Gestão de Favorecidos", href: "/tenant-admin/favorecidos", icon: UserCheck },
      { name: "Formulários Internos", href: "/internal-forms", icon: FileText },

      { name: "Empresas Clientes", href: "/customer-companies", icon: Building2 },
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

export function Sidebar() {
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

  const activeTicketsCount = ticketsData?.tickets?.length || 0;

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
    <div className="hidden lg:flex lg:w-64 lg:flex-col">
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
            <h1 className="text-xl font-bold text-white">Conductor</h1>
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
                <span className="text-sm font-medium text-white">
                  {tenantData?.name || 'Carregando...'}
                </span>
              </div>
              <ChevronDown className="w-4 h-4 text-white" />
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

        {/* User Profile */}
        <div className="flex-shrink-0 px-4 pb-4">
          <div className="flex items-center rounded-lg p-3" style={{
            backgroundColor: 'rgba(255, 255, 255, 0.1)'
          }}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center mr-3" style={{
              background: 'linear-gradient(135deg, var(--secondary), var(--accent))'
            }}>
              <span className="text-white text-sm font-semibold">
                {user?.firstName ? user.firstName.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user?.email}
              </p>
              <p className="text-xs text-white text-opacity-80 truncate capitalize">{user?.role}</p>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-white hover:text-opacity-80 p-1"
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Ticket,
  Users,
  Building2,
  MapPin,
  Settings,
  ChevronDown,
  ChevronRight,
  UserCheck,
  Shield,
  FileText,
  BookOpen,
  BarChart3,
  Zap,
  MessageSquare,
  Briefcase,
  Globe,
  Tools,
  UserCog,
  Workflow,
  Palette,
  Target,
  Users2,
  Database,
  Activity,
  Wrench,
  CheckSquare,
  MessageCircle
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const Sidebar = () => {
  const location = useLocation();
  const { user } = useAuth();
  const [expandedSections, setExpandedSections] = React.useState<Record<string, boolean>>({
    workspace: true,
    system: false
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const isActive = (path: string) => location.pathname === path;

  const navigationItems = [
    {
      label: 'Dashboard',
      path: '/dashboard',
      icon: LayoutDashboard,
      roles: ['customer', 'agent', 'admin', 'tenant_admin', 'saas_admin']
    },
    {
      label: 'Tickets',
      path: '/tickets',
      icon: Ticket,
      roles: ['customer', 'agent', 'admin', 'tenant_admin', 'saas_admin']
    },
    {
      label: 'Solicitantes',
      path: '/customers',
      icon: Users,
      roles: ['agent', 'admin', 'tenant_admin', 'saas_admin']
    },
    {
      label: 'Empresas',
      path: '/customer-companies',
      icon: Building2,
      roles: ['agent', 'admin', 'tenant_admin', 'saas_admin']
    },
    {
      label: 'Localizações',
      path: '/locations',
      icon: MapPin,
      roles: ['agent', 'admin', 'tenant_admin', 'saas_admin']
    },
    {
      label: 'Projetos',
      path: '/projects',
      icon: Briefcase,
      roles: ['agent', 'admin', 'tenant_admin', 'saas_admin']
    },
    {
      label: 'Base de Conhecimento',
      path: '/knowledge-base',
      icon: BookOpen,
      roles: ['agent', 'admin', 'tenant_admin', 'saas_admin']
    },
    {
      label: 'Analytics',
      path: '/analytics',
      icon: BarChart3,
      roles: ['admin', 'tenant_admin', 'saas_admin']
    }
  ];

  const workspaceAdminItems = [
    {
      label: 'Gestão de Usuários',
      path: '/user-management',
      icon: UserCog,
      roles: ['tenant_admin', 'saas_admin']
    },
    {
      label: 'Equipe',
      path: '/tenant-admin/team',
      icon: Users2,
      roles: ['tenant_admin', 'saas_admin']
    },
    {
      label: 'Integrações',
      path: '/tenant-admin/integrations',
      icon: Zap,
      roles: ['tenant_admin', 'saas_admin']
    },
    {
      label: 'OmniBridge',
      path: '/omni-bridge',
      icon: MessageCircle,
      roles: ['tenant_admin', 'saas_admin']
    },
    {
      label: 'Workflows',
      path: '/tenant-admin/workflows',
      icon: Workflow,
      roles: ['tenant_admin', 'saas_admin']
    },
    {
      label: 'SLAs',
      path: '/tenant-admin/slas',
      icon: Target,
      roles: ['tenant_admin', 'saas_admin']
    },
    {
      label: 'Branding',
      path: '/tenant-admin/branding',
      icon: Palette,
      roles: ['tenant_admin', 'saas_admin']
    },
    {
      label: 'Templates de Tickets',
      path: '/ticket-templates',
      icon: FileText,
      roles: ['tenant_admin', 'saas_admin']
    },
    {
      label: 'Configuração de Tickets',
      path: '/ticket-configuration',
      icon: Settings,
      roles: ['tenant_admin', 'saas_admin']
    },
    {
      label: 'Formulários Internos',
      path: '/internal-forms',
      icon: CheckSquare,
      roles: ['tenant_admin', 'saas_admin']
    },
    {
      label: 'Habilidades Técnicas',
      path: '/technical-skills',
      icon: Tools,
      roles: ['tenant_admin', 'saas_admin']
    }
  ];

  const systemAdminItems = [
    {
      label: 'SaaS Admin',
      path: '/saas-admin',
      icon: Shield,
      roles: ['saas_admin']
    },
    {
      label: 'Provisionamento',
      path: '/tenant-provisioning',
      icon: Database,
      roles: ['saas_admin']
    },
    {
      label: 'Integridade do Sistema',
      path: '/module-integrity-control',
      icon: Activity,
      roles: ['saas_admin']
    },
    {
      label: 'Configurações',
      path: '/settings',
      icon: Settings,
      roles: ['admin', 'tenant_admin', 'saas_admin']
    },
    {
      label: 'Segurança',
      path: '/security-settings',
      icon: Shield,
      roles: ['admin', 'tenant_admin', 'saas_admin']
    },
    {
      label: 'Conformidade',
      path: '/compliance',
      icon: UserCheck,
      roles: ['admin', 'tenant_admin', 'saas_admin']
    },
    {
      label: 'Traduções',
      path: '/translation-manager',
      icon: Globe,
      roles: ['saas_admin']
    },
    {
      label: 'Roadmap',
      path: '/roadmap',
      icon: Wrench,
      roles: ['saas_admin']
    }
  ];

  const hasRole = (requiredRoles: string[]) => {
    return user?.role && requiredRoles.includes(user.role);
  };

  const filteredNavItems = navigationItems.filter(item => hasRole(item.roles));
  const filteredWorkspaceItems = workspaceAdminItems.filter(item => hasRole(item.roles));
  const filteredSystemItems = systemAdminItems.filter(item => hasRole(item.roles));

  return (
    <div className="w-64 bg-white border-r border-gray-200 h-full overflow-y-auto">
      <div className="p-4">
        <h2 className="text-xl font-bold text-gray-800">Conductor</h2>
      </div>
      
      <nav className="mt-4">
        {/* Main Navigation */}
        <div className="px-4">
          <ul className="space-y-2">
            {filteredNavItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={cn(
                    'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                    isActive(item.path)
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  )}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Workspace Admin Section */}
        {filteredWorkspaceItems.length > 0 && (
          <div className="mt-6">
            <button
              onClick={() => toggleSection('workspace')}
              className="flex items-center justify-between w-full px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              <span>Workspace Admin</span>
              {expandedSections.workspace ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
            
            {expandedSections.workspace && (
              <div className="px-4 mt-2">
                <ul className="space-y-2">
                  {filteredWorkspaceItems.map((item) => (
                    <li key={item.path}>
                      <Link
                        to={item.path}
                        className={cn(
                          'flex items-center px-3 py-2 text-sm rounded-md transition-colors',
                          isActive(item.path)
                            ? 'bg-blue-50 text-blue-700'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        )}
                      >
                        <item.icon className="mr-3 h-4 w-4" />
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* System Admin Section */}
        {filteredSystemItems.length > 0 && (
          <div className="mt-6">
            <button
              onClick={() => toggleSection('system')}
              className="flex items-center justify-between w-full px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              <span>System Admin</span>
              {expandedSections.system ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
            
            {expandedSections.system && (
              <div className="px-4 mt-2">
                <ul className="space-y-2">
                  {filteredSystemItems.map((item) => (
                    <li key={item.path}>
                      <Link
                        to={item.path}
                        className={cn(
                          'flex items-center px-3 py-2 text-sm rounded-md transition-colors',
                          isActive(item.path)
                            ? 'bg-blue-50 text-blue-700'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        )}
                      >
                        <item.icon className="mr-3 h-4 w-4" />
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </nav>
    </div>
  );
};

export default Sidebar;
