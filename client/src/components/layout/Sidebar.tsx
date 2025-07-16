import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
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
  Zap,
  Map,
  Shield,
  LogOut
} from "lucide-react";

// Base navigation without dynamic badges
const baseNavigation = [
  { name: "Dashboard", href: "/", icon: BarChart3, current: true },
  { name: "Tickets", href: "/tickets", icon: Ticket },
  { name: "Customers", href: "/customers", icon: Users },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Knowledge Base", href: "/knowledge-base", icon: BookOpen },
  { name: "Roadmap", href: "/roadmap", icon: Map },
  { name: "Compliance", href: "/compliance", icon: Shield },
];

// Admin navigation (conditional based on role)
const adminNavigation = [
  { name: "SaaS Admin", href: "/saas-admin", icon: Shield, roles: ['saas_admin'] },
  { name: "Tenant Admin", href: "/tenant-admin", icon: Settings, roles: ['saas_admin', 'tenant_admin'] },
  { name: "Auto-Provisioning", href: "/tenant-provisioning", icon: Plug, roles: ['saas_admin'] },
];

const secondaryNavigation = [
  { name: "Settings", href: "/settings", icon: Settings },
  { name: "Help & Support", href: "/help", icon: HelpCircle },
];

export function Sidebar() {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();

  // Fetch tickets count for badge
  const { data: ticketsData } = useQuery({
    queryKey: ["/api/tickets"], // Simple query key for consistent caching
    enabled: !!user,
    staleTime: 30000, // Cache for 30 seconds
  });

  const activeTicketsCount = ticketsData?.tickets?.length || 0;

  // Create navigation with dynamic badges
  const navigation = baseNavigation.map(item => {
    if (item.name === "Tickets" && activeTicketsCount > 0) {
      return { ...item, badge: activeTicketsCount.toString() };
    }
    return item;
  });

  return (
    <div className="hidden lg:flex lg:w-64 lg:flex-col">
      <div className="gradient-sidebar flex flex-col flex-grow pt-5 pb-4 overflow-y-auto">
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
          <div className="bg-white bg-opacity-10 rounded-lg p-3 border border-white border-opacity-20">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center mr-2">
                  <span className="text-xs font-semibold text-purple-600">AC</span>
                </div>
                <span className="text-sm font-medium text-white">Acme Corp</span>
              </div>
              <ChevronDown className="w-4 h-4 text-white" />
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="mt-6 flex-1 px-2 space-y-1">
          {navigation.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.name} href={item.href}>
                <div className={cn(
                  "group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer",
                  isActive
                    ? "bg-white bg-opacity-20 text-white"
                    : "text-white hover:bg-white hover:bg-opacity-10"
                )}>
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

          {/* Admin Navigation - Role-based */}
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
                  const isActive = location === item.href;
                  return (
                    <Link key={item.name} href={item.href}>
                      <div className={cn(
                        "group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer",
                        isActive
                          ? "bg-white bg-opacity-20 text-white"
                          : "text-white hover:bg-white hover:bg-opacity-10"
                      )}>
                        <item.icon className="mr-3 h-4 w-4 flex-shrink-0" />
                        {item.name}
                      </div>
                    </Link>
                  );
                })}
            </div>
          )}
          
          <div className="pt-4 mt-4 border-t border-white border-opacity-20">
            {secondaryNavigation.map((item) => {
              const isActive = location === item.href;
              return (
                <Link key={item.name} href={item.href}>
                  <div className={cn(
                    "group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer",
                    isActive
                      ? "bg-white bg-opacity-20 text-white"
                      : "text-white hover:bg-white hover:bg-opacity-10"
                  )}>
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
          <div className="flex items-center bg-white bg-opacity-10 rounded-lg p-3">
            <div className="w-8 h-8 gradient-secondary rounded-full flex items-center justify-center mr-3">
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
