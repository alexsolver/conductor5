import { Link, useLocation } from "wouter";
import { useTranslation } from 'react-i18next';
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
  CheckCircle,
  MessageCircle, // Import MessageCircle for OmniBridge
  MessageSquare, // Import MessageSquare for OmniBridge
  UserX // Import UserX for Absence Management
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
  { name: "customers", href: "/customers", icon: Users },
  { name: "tickets", href: "/tickets", icon: Ticket },
  { name: "knowledgeBase", href: "/knowledge-base", icon: BookOpen },
  {
    name: "timecardControl",
    icon: Clock,
    children: [
      { name: "timecardRegistry", href: "/timecard", icon: Clock },
      { name: "workSchedules", href: "/work-schedules", icon: Calendar },
      { name: "hourBank", href: "/hour-bank", icon: CreditCard },
      { name: "holidayCalendar", href: "/holiday-calendar", icon: Calendar },
      { name: "timecardReports", href: "/timecard-reports", icon: FileText },
      { name: "cltCompliance", href: "/clt-compliance", icon: Shield },
      { name: "timecardApprovals", href: "/timecard-approvals", icon: CheckCircle },
      { name: "approvalConfiguration", href: "/timecard-approval-settings", icon: Settings },
      { name: "absenceManagement", href: "/absence-management", icon: Calendar },
      { name: "scheduleTemplates", href: "/schedule-templates", icon: Settings },
    ]
  },
  { name: "locations", href: "/locations", icon: MapPin },
  { name: "interactiveMap", href: "/interactive-map", icon: Map },

  {
    name: "materialsAndServices",
    icon: Package,
    children: [

      { name: "itemCatalog", href: "/item-catalog", icon: Package },
      { name: "stockManagement", href: "/stock-management", icon: Warehouse },
      { name: "supplierManagement", href: "/supplier-management", icon: Building2 },
      { name: "assetControl", href: "/asset-management", icon: HardDrive },
      { name: "lpuPriceList", href: "/lpu-management", icon: DollarSign },
      { name: "complianceManagement", href: "/compliance-management", icon: Shield },
    ]
  },
  { name: "analytics", href: "/analytics", icon: BarChart3 },
  { name: "notifications", href: "/notifications", icon: Bell },
  { name: "gdprCompliance", href: "/gdpr-compliance", icon: Shield },
  {
    name: "reports",
    icon: PieChart,
    children: [
      { name: "productivityReports", href: "/productivity-reports", icon: PieChart },
      { name: "teamPerformance", href: "/team-performance", icon: TrendingUp },
      { name: "systemAnalytics", href: "/system-analytics", icon: BarChart3 },
    ]
  },

];

// Admin navigation with hierarchical structure
const adminNavigation = [
  {
    name: "saasAdmin",
    icon: Shield,
    roles: ['saas_admin'],
    children: [
      { name: "dashboard.title", href: "/saas-admin", icon: BarChart3 },
      { name: "tenantManagement", href: "/saas-admin/tenants", icon: Database },
      { name: "performanceHealth", href: "/saas-admin/performance", icon: TrendingUp },
      { name: "securitySettings", href: "/saas-admin/security", icon: Shield },
      { name: "billingUsage", href: "/saas-admin/billing", icon: CreditCard },
      { name: "disasterRecovery", href: "/saas-admin/disaster-recovery", icon: HardDrive },
      { name: "autoProvisioning", href: "/saas-admin/tenant-provisioning", icon: Plug },
      { name: "translationManagement", href: "/saas-admin/translation-manager", icon: Languages },
      { name: "userManagementPage", href: "/saas-admin/user-management", icon: UserCog },
      // Removed: Multi-Tenant management - functionality eliminated from system
      { name: "integrations", href: "/saas-admin/integrations", icon: Plug },
      { name: "moduleIntegrity", href: "/saas-admin/module-integrity", icon: Shield },
      { name: "multilocationSettings", href: "/tenant-admin/multilocation", icon: Globe2 },
    ]
  },
  {
    name: "workspaceAdmin",
    icon: Settings,
    roles: ['saas_admin', 'tenant_admin'],
    children: [
      { name: "general", href: "/tenant-admin/geral", icon: BarChart3 },
      { name: "teamManagementPage", href: "/team-management", icon: Users },
      { name: "contractManagement", href: "/contract-management", icon: FileText },
      { name: "expenseManagement", href: "/expense-management", icon: CreditCard },
      { name: "workflows", href: "/tenant-admin/workflows", icon: Workflow },
      { name: "slas", href: "/slas", icon: Target },
      { name: "approvals", href: "/approvals", icon: CheckCircle },
      { name: "activityPlanner", href: "/activity-planner", icon: Calendar },
      { name: "integracoes", href: "/tenant-admin/integrations", icon: Plug },
      { name: "ticketConfiguration", href: "/ticket-configuration", icon: Settings },
      { name: "ticketTemplates", href: "/ticket-templates", icon: FileText },
      { name: "customFields", href: "/custom-fields-admin", icon: Wrench },
      { name: "clientes", href: "/customers", icon: Users },
      { name: "beneficiaries", href: "/tenant-admin/beneficiaries", icon: UserCheck },
      { name: "internalForms", href: "/internal-forms", icon: FileText },
      { name: "omniBridge", href: "/omnibridge", icon: MessageSquare },
      { name: "conversationLogs", href: "/omnibridge/conversation-logs", icon: MessageCircle },
      { name: "conversationAnalytics", href: "/omnibridge/conversation-analytics", icon: BarChart3 },
      { name: "companies", href: "/companies", icon: Building2 },
      { name: "branding", href: "/tenant-admin/branding", icon: Palette },
      { name: "reportsAndDashboards", href: "/reports", icon: BarChart3 },
      { name: "interactiveDashboards", href: "/dashboards", icon: Activity },
    ]
  },
];

const secondaryNavigation = [
  { name: "settings", href: "/settings", icon: Settings },
  { name: "security", href: "/security", icon: Shield },
  { name: "helpAndSupport", href: "/help", icon: HelpCircle },
];

export function Sidebar({ collapsed, onToggleCollapse }: SidebarProps) {
  const { t } = useTranslation();

  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const { terminology, employmentType } = useEmploymentDetection();
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});

  // Helper function to capitalize first letter
  const capitalizeFirstLetter = (str: string): string => {
    if (!str) return str;
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  // Helper function to translate menu items
  const translateName = (name: string): string => {
    try {
      let translated: any = '';

      // Check if it's already a full translation key (contains namespace)
      if (name.includes('.')) {
        translated = t(name);

        // If translation still returns the key, try without namespace
        if (translated === name) {
          const shortName = name.split('.').pop() || name;
          translated = t(`navigation.${shortName}`);

          // Final fallback to just the short name
          if (translated === `navigation.${shortName}`) {
            translated = t(shortName);
          }
        }
      } else {
        // Try navigation namespace first
        const navKey = `navigation.${name}`;
        translated = t(navKey);

        // If translation returns the key itself (meaning not found), try without namespace
        if (translated === navKey) {
          translated = t(name);

          // If still not found, try common namespace
          if (translated === name) {
            const commonKey = `common.${name}`;
            translated = t(commonKey);

            // If still not found, return the original name
            if (translated === commonKey) {
              translated = name;
            }
          }
        }
      }

      // Force conversion to string and handle any edge cases
      let translatedString: string;
      if (typeof translated === 'string') {
        translatedString = translated;
      } else if (translated && typeof translated === 'object') {
        // If it's an object, try to extract a string value or fallback to name
        translatedString = translated.toString ? translated.toString() : name;
      } else {
        translatedString = name;
      }

      // Capitalize first letter and return the translation
      return capitalizeFirstLetter(translatedString);
    } catch (error) {
      console.warn(`Translation error for key "${name}":`, error);
      return capitalizeFirstLetter(name);
    }
  };

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
    if (item.name === 'tickets' && activeTicketsCount > 0) {
      return { ...item, badge: activeTicketsCount.toString() };
    }

    // Update timecard section based on employment type
    if (item.name === "timecardControl") {
      const timecardRoute = employmentType === 'autonomo' ? '/timecard-autonomous' : '/timecard';
      return {
        ...item,
        children: [
          {
            name: "timecardRegistry",
            href: timecardRoute,
            icon: Clock
          },
          { name: "workSchedules", href: "/work-schedules", icon: Calendar },
          {
            name: "hourBank",
            href: "/hour-bank",
            icon: CreditCard
          },
          { name: "holidayCalendar", href: "/holiday-calendar", icon: Calendar },
          {
            name: "timecardReports",
            href: "/timecard-reports",
            icon: FileText
          },
          { name: "cltCompliance", href: "/clt-compliance", icon: Shield },
          {
            name: "timecardApprovals",
            href: "/timecard-approvals",
            icon: CheckCircle
          },
          { name: "approvalConfiguration", href: "/timecard-approval-settings", icon: Settings },
          { name: "absenceManagement", href: "/absence-management", icon: Calendar },
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
        <div className={`flex items-center flex-shrink-0 transition-all duration-300 ${
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
                {t('common.appName', 'Conductor')}
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
              title={t('common.collapseSidebar', 'Retrair sidebar')}
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
              title={t('common.expandSidebar', 'Expandir sidebar')}
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
                  <div className="text-white">
                    <p className="text-sm font-medium truncate max-w-32">
                      {tenantData?.workspaceName || tenantData?.name || 'Carregando...'}
                    </p>
                    <p className="text-xs opacity-75 truncate max-w-32">
                      Workspace
                    </p>
                  </div>
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
                      "group flex items-center justify-start py-3 px-2 text-sm font-medium rounded-md transition-all duration-300 cursor-pointer relative hover:scale-105",
                      hasActiveChild
                        ? "text-white shadow-lg"
                        : "text-white hover:bg-white hover:bg-opacity-20"
                    )} style={hasActiveChild ? {
                      backgroundColor: 'var(--accent)',
                      color: 'white'
                    } : {}}
                    title={translateName(item.name)}>
                      <item.icon className="h-6 w-6 flex-shrink-0" />
                      {item.badge && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                          <span className="text-xs font-bold text-white">{item.badge}</span>
                        </div>
                      )}
                      {/* Tooltip for collapsed state */}
                      <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                        {translateName(item.name)}
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <Collapsible key={item.name} open={isOpen} onOpenChange={() => toggleMenu(item.name)}>
                  <CollapsibleTrigger className="w-full">
                    <div className={cn(
                      "group flex items-center justify-start px-2 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer",
                      hasActiveChild
                        ? "text-white"
                        : "text-white hover:bg-white hover:bg-opacity-10"
                    )} style={hasActiveChild ? {
                      backgroundColor: 'var(--accent)',
                      color: 'white'
                    } : {}}>
                      <item.icon className="mr-3 h-4 w-4 flex-shrink-0" />
                      {translateName(item.name)}
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
                            {translateName(child.name)}
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
                    "group flex items-center justify-start py-3 px-2 text-sm font-medium rounded-md transition-all duration-300 cursor-pointer relative hover:scale-105",
                    isActive
                      ? "text-white shadow-lg"
                      : "text-white hover:bg-white hover:bg-opacity-20"
                  )} style={isActive ? {
                    backgroundColor: 'var(--accent)',
                    color: 'white'
                  } : {}}
                  title={translateName(item.name)}>
                    <item.icon className="h-6 w-6 flex-shrink-0" />
                    {item.badge && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                        <span className="text-xs font-bold text-white">{item.badge}</span>
                      </div>
                    )}
                    {/* Tooltip for collapsed state */}
                    <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                      {translateName(item.name)}
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
                  {translateName(item.name)}
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
                    {translateName("administration")}
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
                          "group flex items-center justify-start py-3 px-2 text-sm font-medium rounded-md transition-all duration-300 cursor-pointer relative hover:scale-105",
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
                            {translateName(item.name)}
                          </div>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <Collapsible key={item.name} open={isOpen} onOpenChange={() => toggleMenu(item.name)}>
                      <CollapsibleTrigger className="w-full">
                        <div className={cn(
                          "group flex items-center justify-start px-2 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer",
                          hasActiveChild
                            ? "text-white"
                            : "text-white hover:bg-white hover:bg-opacity-10"
                        )} style={hasActiveChild ? {
                          backgroundColor: 'var(--accent)',
                          color: 'white'
                        } : {}}>
                          <item.icon className="mr-3 h-4 w-4 flex-shrink-0" />
                          {translateName(item.name)}
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
                                {translateName(child.name)}
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
                collapsed ? "justify-start py-3 px-2 hover:scale-105" : "px-2 py-2",
                location === "/layouts"
                  ? "text-white shadow-lg"
                  : "text-white hover:bg-white hover:bg-opacity-10"
              )} style={location === "/layouts" ? {
                backgroundColor: 'var(--accent)',
                color: 'white'
              } : {}}>
                <Palette className={collapsed ? "h-6 w-6 flex-shrink-0" : "mr-3 h-4 w-4 flex-shrink-0"} />
                {!collapsed && translateName("appearance")}
                {/* Tooltip for collapsed state */}
                {collapsed && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                    {translateName("appearance")}
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
                    collapsed ? "justify-start py-3 px-2 hover:scale-105" : "px-2 py-2",
                    isActive
                      ? "text-white shadow-lg"
                      : "text-white hover:bg-white hover:bg-opacity-10"
                  )} style={isActive ? {
                    backgroundColor: 'var(--accent)',
                    color: 'white'
                  } : {}}>
                    <item.icon className={collapsed ? "h-6 w-6 flex-shrink-0" : "mr-3 h-4 w-4 flex-shrink-0"} />
                    {!collapsed && translateName(item.name)}
                    {/* Tooltip for collapsed state */}
                    {collapsed && (
                      <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                        {translateName(item.name)}
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Footer - Logout only */}
        <div className="flex-shrink-0 flex border-t border-white border-opacity-20">
          <div className="w-full">
            <div className="flex items-center justify-center p-3 transition-all duration-300">
              <div className="relative group">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => logoutMutation.mutate()}
                  className="h-10 w-10 p-0 text-white hover:bg-white hover:bg-opacity-20 bg-white bg-opacity-10 rounded-lg transition-all duration-300"
                  title={translateName("logout")}
                >
                  <LogOut className="h-5 w-5" />
                </Button>
                {/* Tooltip */}
                <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                  {translateName("logout")}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}