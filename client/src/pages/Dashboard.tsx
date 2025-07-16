import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { AppShell } from "@/components/layout/AppShell";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { TicketChart } from "@/components/dashboard/TicketChart";
import { UrgentTickets } from "@/components/dashboard/UrgentTickets";
import { TeamPerformance } from "@/components/dashboard/TeamPerformance";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Ticket, Clock, Smile, Users } from "lucide-react";
import type { DashboardStats } from "@/types";

export default function Dashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: stats, isLoading: statsLoading, error } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
    retry: false,
  });

  // Handle unauthorized errors
  useEffect(() => {
    if (error && isUnauthorizedError(error as Error)) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [error, toast]);

  if (isLoading || !isAuthenticated) {
    return null;
  }

  return (
    <AppShell>
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Page Header */}
          <Card className="gradient-card mb-6">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Dashboard
                  </h1>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    Welcome back! Here's what's happening with your support today.
                  </p>
                </div>
                <div className="mt-4 sm:mt-0">
                  <Select defaultValue="7days">
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7days">Last 7 days</SelectItem>
                      <SelectItem value="30days">Last 30 days</SelectItem>
                      <SelectItem value="90days">Last 90 days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <MetricCard
              title="Active Tickets"
              value={statsLoading ? "..." : stats?.activeTickets || 0}
              change={{ value: 12, type: "decrease" }}
              icon={<Ticket className="w-4 h-4 text-white" />}
              gradientClass="gradient-primary"
            />
            <MetricCard
              title="Avg Resolution Time"
              value={statsLoading ? "..." : `${stats?.avgResolutionTime || 0}h`}
              change={{ value: 8, type: "decrease" }}
              icon={<Clock className="w-4 h-4 text-white" />}
              gradientClass="gradient-success"
            />
            <MetricCard
              title="Satisfaction Score"
              value={statsLoading ? "..." : `${stats?.satisfactionScore || 0}%`}
              change={{ value: 2, type: "increase" }}
              icon={<Smile className="w-4 h-4 text-white" />}
              gradientClass="gradient-warning"
            />
            <MetricCard
              title="Online Agents"
              value={statsLoading ? "..." : `${stats?.onlineAgents || 0}/${stats?.totalAgents || 0}`}
              icon={<Users className="w-4 h-4 text-white" />}
              gradientClass="gradient-secondary"
            />
          </div>

          {/* Charts and Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <TicketChart />
            <ActivityFeed />
          </div>

          {/* Urgent Tickets and Team Performance */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <UrgentTickets />
            <TeamPerformance />
          </div>

          {/* Quick Actions */}
          <QuickActions />
        </div>
      </div>
    </AppShell>
  );
}
