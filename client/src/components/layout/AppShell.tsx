import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { useSidebar } from "@/contexts/SidebarContext";
import { SidebarMenuItem } from "./SidebarMenuItem";
import { SidebarMenuButton } from "./SidebarMenuButton";
import { Link } from "react-router-dom";
import { Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const { sidebarCollapsed, toggleSidebar, sidebarHidden, headerHidden } = useSidebar();
  // Assume userRole and unreadCount are available from context or props
  // For demonstration, let's define them here. In a real app, these would come from authentication context or similar.
  const userRole = 'saas_admin'; // Example role
  const unreadCount = 5; // Example unread count

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {!sidebarHidden && (
        <Sidebar 
          collapsed={sidebarCollapsed} 
          onToggleCollapse={toggleSidebar} 
        >
          {/* Sidebar content */}
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link to="/">
                {/* Add an icon here if needed */}
                <span>Dashboard</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          {(userRole === 'saas_admin' || userRole === 'tenant_admin') && (
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link to="/notifications">
                    <Bell className="h-4 w-4" />
                    <span>Gestão de Notificações</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link to="/my-notifications">
                  <Bell className="h-4 w-4" />
                  <span>Minhas Notificações</span>
                  {unreadCount > 0 && (
                    <Badge variant="destructive" className="ml-auto">
                      {unreadCount}
                    </Badge>
                  )}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          {/* Other sidebar items */}
        </Sidebar>
      )}
      <div className="flex flex-col flex-1 overflow-hidden">
        {!headerHidden && <Header />}
        <main className="flex-1 relative overflow-y-auto focus:outline-none ml-[10px] mr-[10px]">
          {children}
        </main>
      </div>
    </div>
  );
}