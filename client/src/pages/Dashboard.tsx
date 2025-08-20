import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Ticket, Clock, Users, TrendingUp } from "lucide-react";
// import useLocalization from "@/hooks/useLocalization";

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
      <div className=""
        <div className=""
          <div>
            <div className="h-8 bg-gray-200 rounded w-48 animate-pulse mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-64 animate-pulse"></div>
          </div>
        </div>
        <div className=""
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className=""
              <CardHeader className=""
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
      value: "h`,
      icon: TrendingUp,
      trend: "-15%",
    },
    {
      title: t('dashboard.stats.online_agents'),
      value: stats?.onlineAgents || 0 + "/" + stats?.totalAgents || 0,
      icon: Users,
      trend: "100%",
    },
  ];

  return (
    <div className=""
      <div className=""
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">'[TRANSLATION_NEEDED]'</h1>
          <p className="text-gray-600 dark:text-gray-400">'[TRANSLATION_NEEDED]'</p>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className=""
        {metrics.map((metric) => (
          <Card key={metric.title} className=""
            <CardHeader className=""
              <CardTitle className=""
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
      <div className=""
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className=""
              {activity?.slice(0, 5).map((item: any, index: number) => (
                <div key={index} className=""
                  <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                  <div className=""
                    <span className="font-medium">{item.action}</span>
                    <span className="text-gray-600 dark:text-gray-400"> by {item.user?.firstName || 'User'}</span>
                  </div>
                  <span className=""
                    {new Date(item.createdAt).toLocaleTimeString()}
                  </span>
                </div>
              )) || (
                <div className=""
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
            <div className=""
              <button className=""
                <div className="font-medium">Create New Ticket</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Start a new support ticket</div>
              </button>
              <button className=""
                <div className="font-medium">Add Customer</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Register a new customer</div>
              </button>
              <button className=""
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