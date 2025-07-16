import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  Shield
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/", icon: BarChart3, current: true },
  { name: "Tickets", href: "/tickets", icon: Ticket, badge: "12" },
  { name: "Customers", href: "/customers", icon: Users },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Roadmap", href: "/roadmap", icon: Map },
  { name: "Compliance", href: "/compliance", icon: Shield },
  { name: "Automation", href: "/automation", icon: Bot },
  { name: "Knowledge Base", href: "/knowledge", icon: BookOpen },
  { name: "Integrations", href: "/integrations", icon: Plug },
];

const secondaryNavigation = [
  { name: "Settings", href: "/settings", icon: Settings },
  { name: "Help & Support", href: "/help", icon: HelpCircle },
];

export function Sidebar() {
  const [location] = useLocation();

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
                <a className={cn(
                  "group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors",
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
                </a>
              </Link>
            );
          })}
          
          <div className="pt-4 mt-4 border-t border-white border-opacity-20">
            {secondaryNavigation.map((item) => {
              const isActive = location === item.href;
              return (
                <Link key={item.name} href={item.href}>
                  <a className={cn(
                    "group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors",
                    isActive
                      ? "bg-white bg-opacity-20 text-white"
                      : "text-white hover:bg-white hover:bg-opacity-10"
                  )}>
                    <item.icon className="mr-3 h-4 w-4 flex-shrink-0" />
                    {item.name}
                  </a>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* User Profile */}
        <div className="flex-shrink-0 px-4 pb-4">
          <div className="flex items-center bg-white bg-opacity-10 rounded-lg p-3">
            <div className="w-8 h-8 gradient-secondary rounded-full flex items-center justify-center mr-3">
              <span className="text-white text-sm font-semibold">JD</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">John Doe</p>
              <p className="text-xs text-white text-opacity-80 truncate">Admin</p>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-white hover:text-opacity-80 p-1"
              onClick={() => window.location.href = "/api/logout"}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
