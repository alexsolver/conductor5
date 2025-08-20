import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Ticket, Clock, Users, TrendingUp } from "lucide-react";
import { useLocalization } from "@/hooks/useLocalization";

export default function Dashboard() {
  const { t } = useTranslation();
  const { formatDate, formatNumber } = useLocalization();
  
  const { data: statsResponse, isLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
    retry: false,
  });

  const { data: activityResponse } = useQuery({
    queryKey: ["/api/dashboard/activity"],
    retry: false,
  });

  // Extract data from standardResponse format with proper type checking
  const stats = (statsResponse as any)?.data || {};
  const activity = (activityResponse as any)?.data || [];

  if (isLoading) {
    return (
      <div className="p-4 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <div className="h-8 bg-gray-200 rounded w-48 animate-pulse mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-64 animate-pulse"></div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-gray-200 rounded w-24"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-16"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const metrics = [
    {
      title: t('dashboard.stats.active_tickets'),
      value: formatNumber(stats?.activeTickets || 0),
      icon: Ticket,
      trend: "+12%",
    },
    {
      title: t('dashboard.stats.resolved_today'),
      value: formatNumber(stats?.resolvedToday || 0),
      icon: Clock,
      trend: "+8%",
    },
    {
      title: t('dashboard.stats.avg_resolution_time'),
      value: `${stats?.avgResolutionTime || 0}h`,
      icon: TrendingUp,
      trend: "-15%",
    },
    {
      title: t('dashboard.stats.online_agents'),
      value: `${stats?.onlineAgents || 0}/${stats?.totalAgents || 0}`,
      icon: Users,
      trend: "100%",
    },
  ];

  return (
    <div className="p-4 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">t('dashboard.title')</h1>
          <p className="text-gray-600 dark:text-gray-400">t('dashboard.welcome')</p>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric) => (
          <Card key={metric.title} className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {metric.title}
              </CardTitle>
              <metric.icon className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{metric.value}</div>
              <p className="text-xs text-green-600 font-medium">{metric.trend} from last week</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activity?.slice(0, 5).map((item: any, index: number) => (
                <div key={index} className="flex items-center space-x-3 text-sm">
                  <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                  <div className="flex-1">
                    <span className="font-medium">{item.action}</span>
                    <span className="text-gray-600 dark:text-gray-400"> by {item.user?.firstName || 'User'}</span>
                  </div>
                  <span className="text-gray-500 text-xs">
                    {new Date(item.createdAt).toLocaleTimeString()}
                  </span>
                </div>
              )) || (
                <div className="text-center text-gray-500 py-8">
                  No recent activity
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <button className="w-full text-left p-3 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <div className="font-medium">Create New Ticket</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Start a new support ticket</div>
              </button>
              <button className="w-full text-left p-3 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <div className="font-medium">Add Customer</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Register a new customer</div>
              </button>
              <button className="w-full text-left p-3 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <div className="font-medium">View Reports</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Check detailed analytics</div>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}